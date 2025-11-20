import { Transaction, VersionedTransaction } from "@solana/web3.js";
import { zSimulationResultSchema } from "../types/solanaRpcValidations";
import { toVersioned } from "../utils/solana";
import { RPC_URL } from "../convexEnv";

export async function simulateTransaction(
  transaction: VersionedTransaction | Transaction,
  options?: { replaceRecentBlockhash?: boolean }
) {
  const tx = toVersioned(transaction);
  const serialized = tx.serialize();
  const encodedTx = Buffer.from(serialized).toString("base64");

  const body = {
    jsonrpc: "2.0",
    id: "sim",
    method: "simulateTransaction",
    params: [
      encodedTx,
      {
        encoding: "base64",
        replaceRecentBlockhash: options?.replaceRecentBlockhash ?? true,
      },
    ],
  };

  const res = await fetch(RPC_URL, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

  const json = await res.json();
  const parsedRes = zSimulationResultSchema.parse(json);

  if (parsedRes.result.context.apiVersion !== "3.0.6") {
    console.warn(
      "Urgent simulation warning: RPC api version has changed, please check that simulation schema is still valid"
    );
  }
  return parsedRes.result.value;
}
