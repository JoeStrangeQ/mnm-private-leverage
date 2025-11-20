"use node";
import { v } from "convex/values";
import { action } from "../../_generated/server";
import { authenticateUser } from "../../privy";
import { api } from "../../_generated/api";
import { getDlmmPoolConn } from "../../services/meteora";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { SOL_MINT, toAddress, toVersioned } from "../../utils/solana";
import { simulateAndGetTokensBalance } from "../../helpers/simulateAndGetTokensBalance";
import { safeBigIntToNumber } from "../../utils/amounts";
import { getSingleSwapQuote } from "../../services/mnmServer";
import { buildTitanSwapTransaction } from "../../helpers/buildTitanSwapTransaction";
import { connection } from "../../convexEnv";
import { buildTipTx, sendAndConfirmJitoBundle } from "../../helpers/jito";

export const removeLiquidity = action({
  args: {
    positionPubkey: v.string(),
    percentageToWithdraw: v.number(),
    fromBinId: v.optional(v.number()),
    toBinId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userWallet } = await authenticateUser({ ctx });
    const { positionPubkey, percentageToWithdraw } = args;

    //TODO: fetch user settings to know what slippage he is willing to take .
    const position = await ctx.runQuery(api.tables.positions.get.getPositionByPubkey, { positionPubkey });
    if (!position) throw new Error(`Position ${positionPubkey} not found`);

    const userAddress = toAddress(userWallet.address);
    const xMint = toAddress(position.tokenX.mint);
    const yMint = toAddress(position.tokenY.mint);
    const depositedMint = toAddress(position.collateral.mint);

    const dlmmPoolConn = await getDlmmPoolConn(position.poolAddress);

    //note: multiple tx when more then 69 bins.
    const [removeTx] = await dlmmPoolConn.removeLiquidity({
      user: new PublicKey(userWallet.address),
      position: new PublicKey(positionPubkey),
      fromBinId: args.fromBinId ?? position.details.lowerBin.id,
      toBinId: args.toBinId ?? position.details.upperBin.id,
      bps: new BN(Math.round(percentageToWithdraw * 100)),
      shouldClaimAndClose: percentageToWithdraw === 100,
    });

    const removeLiquidityTx = toVersioned(removeTx);

    const { tokenBalancesChange } = await simulateAndGetTokensBalance({
      userAddress,
      transaction: removeLiquidityTx,
    });

    const xChange = adjustSolRent(xMint, tokenBalancesChange[xMint]?.rawAmount ?? 0);
    const yChange = adjustSolRent(yMint, tokenBalancesChange[yMint]?.rawAmount ?? 0);

    const swapSpecs = [
      { mint: xMint, amount: xChange },
      { mint: yMint, amount: yChange },
    ];

    const swapQuotePromises = swapSpecs
      .filter(({ mint, amount }) => amount !== 0n && mint !== depositedMint)
      .map(({ mint, amount }) =>
        getSingleSwapQuote({
          userAddress,
          inputMint: mint,
          outputMint: depositedMint,
          rawAmount: safeBigIntToNumber(amount, `swap ${mint}`),
          slippageBps: 500,
        })
      );

    const swapQuotes = await Promise.all(swapQuotePromises);

    const { blockhash } = await connection.getLatestBlockhash();
    const { tipTx, cuPriceMicroLamports, cuLimit } = await buildTipTx({
      speed: "extraFast",
      payerAddress: userWallet.address,
      recentBlockhash: blockhash,
    });

    const swapsTxs = await Promise.all(
      swapQuotes.map((q) => {
        const quote = Object.values(q.quotes)[0];
        if (!quote) {
          throw new Error("We couldn’t find a valid swap route to the pool’s pair assets.");
        }
        const { instructions, addressLookupTables } = quote;
        return buildTitanSwapTransaction({
          userAddress,
          instructions,
          lookupTables: addressLookupTables,
          options: {
            cuLimit,
            cuPriceMicroLamports,
            recentBlockhash: blockhash,
          },
        });
      })
    );

    await sendAndConfirmJitoBundle({
      userWallet,
      transactions: [removeLiquidityTx, ...swapsTxs, tipTx],
    });

    // close position db wise .
    // change is active in position table + closedAt
    // add activity of withdrawLiquidity if partially withdrawn and closePositionActivity if fully withdrawn.
  },
});

function adjustSolRent(mint: string, amount: bigint): bigint {
  const rent = BigInt(57_000_000);
  const res = mint === SOL_MINT ? amount - rent : amount;
  return res > 0n ? res : 0n;
}
