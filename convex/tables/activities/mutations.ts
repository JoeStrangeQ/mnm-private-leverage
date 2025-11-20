import { Id } from "../../_generated/dataModel";
import { mutation } from "../../_generated/server";
import { authenticateUser } from "../../privy";
import { Activity, ActivityInput, vActivityInput } from "../../schema/activities";

export const createActivity = mutation({
  args: { input: vActivityInput },
  handler: async (ctx, args) => {
    const { user } = await authenticateUser({ ctx });
    if (!user) throw new Error("Couldn't find user");

    const activity = makeActivity(user._id, args.input);

    return await ctx.db.insert("activities", activity);
  },
});

export function makeActivity(userId: Id<"users">, input: ActivityInput): Activity {
  const base = {
    userId,
    relatedPositionPubkey: input.relatedPositionPubkey,
    transactionIds: input.transactionIds ?? [],
  };

  switch (input.type) {
    case "create_position":
      return {
        ...base,
        type: "create_position",
        details: input.details,
      };

    case "transfer":
      return {
        ...base,
        type: "transfer",
        details: input.details,
      };
    default:
      throw new Error("Unknown activity type");
  }
}
