import { mutation } from "../../_generated/server";
import { authenticateUser } from "../../privy";
import { vPosition } from "../../schema/positions";

export const insertPosition = mutation({
  args: vPosition.omit("closedAt", "isActive", "userId"),

  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("positions")
      .withIndex("by_position_pk", (q) => q.eq("positionPubkey", args.positionPubkey))
      .unique();

    if (existing) {
      return {
        id: existing._id,
        positionPubkey: existing.positionPubkey,
        created: false,
      };
    }

    const { user } = await authenticateUser({ ctx });
    if (!user) throw new Error("Couldn't find user");

    return await ctx.db.insert("positions", {
      userId: user._id,
      type: args.type,
      positionPubkey: args.positionPubkey,
      poolAddress: args.poolAddress,

      collateral: args.collateral,
      tokenX: args.tokenX,
      tokenY: args.tokenY,

      details: args.details,
      leverage: args.leverage,

      isActive: true,
      closedAt: undefined,
    });
  },
});
