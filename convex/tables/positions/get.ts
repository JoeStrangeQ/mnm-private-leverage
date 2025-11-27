import { v } from "convex/values";
import { query } from "../../_generated/server";

export const getPositionByPubkey = query({
  args: { positionPubkey: v.string() },
  handler: async (ctx, { positionPubkey }) => {
    return await ctx.db
      .query("positions")
      .withIndex("by_position_pk", (q) => q.eq("positionPubkey", positionPubkey))
      .unique();
  },
});
