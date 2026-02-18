import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tribes: defineTable({
    tribeId: v.number(),
    name: v.string(),
    squares: v.number(),
    color: v.string(),
  }).index("by_tribeId", ["tribeId"]),

  activities: defineTable({
    tribeName: v.string(),
    count: v.number(),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),

  prizes: defineTable({
    name: v.string(),
    color: v.string(),
    order: v.number(),
  }).index("by_order", ["order"]),

  spinHistory: defineTable({
    prize: v.string(),
    color: v.string(),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),
});
