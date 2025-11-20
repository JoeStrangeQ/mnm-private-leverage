import { Infer, v } from "convex/values";
import { vPositionType, vTokenAmount } from "./positions";

export const vActivityType = v.union(v.literal("create_position"), v.literal("transfer"));

export const vTransactionId = v.object({
  description: v.string(),
  id: v.string(),
});

///////  **Details** /////////
export const vTransferActivityDetails = v.object({
  tokenMint: v.string(),
  amount: v.number(),
  tokenPrice: v.number(),
  recipient: v.string(),
});

export const vCreatePositionActivityDetails = v.object({
  positionType: vPositionType,
  tokenX: vTokenAmount,
  tokenY: vTokenAmount,
  poolAddress: v.string(),
  collateral: vTokenAmount,
  range: v.string(),
  jitoTipLamports: v.number(),
});

// Helper for union variants
function createActivityInputVariant<D extends ReturnType<typeof v.object>>(details: D) {
  return v.object({
    details,
    relatedPositionPubkey: v.optional(v.string()),
    transactionIds: v.optional(v.array(vTransactionId)),
  });
}

// --- INPUT union: what the client sends to "createActivity" mutation ---
// (no userId here, we get it from auth)
export const vActivityInput = v.union(
  v.object({
    type: v.literal("create_position"),
    ...createActivityInputVariant(vCreatePositionActivityDetails).fields,
  }),
  v.object({
    type: v.literal("transfer"),
    ...createActivityInputVariant(vTransferActivityDetails).fields,
  })
);

function createActivityVariant<T extends ActivityType, D extends ReturnType<typeof v.object>>(type: T, details: D) {
  return v.object({
    type: v.literal(type),
    userId: v.id("users"),
    transactionIds: v.optional(v.array(vTransactionId)),
    relatedPositionPubkey: v.optional(v.string()),
    details,
  });
}

export const vActivity = v.union(
  createActivityVariant("create_position", vCreatePositionActivityDetails),
  createActivityVariant("transfer", vTransferActivityDetails)
);

///////   **type exports** /////////
export type TransferActivityDetails = Infer<typeof vTransferActivityDetails>;
export type CreatePositionActivityDetails = Infer<typeof vCreatePositionActivityDetails>;

export type ActivityType = Infer<typeof vActivityType>;
export type ActivityTransactionId = Infer<typeof vTransactionId>;

export type ActivityInput = Infer<typeof vActivityInput>;
export type Activity = Infer<typeof vActivity>;
