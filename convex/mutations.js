import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const addSquares = mutation({
  args: { tribeId: v.number(), count: v.number() },
  handler: async (ctx, { tribeId, count }) => {
    const tribe = await ctx.db
      .query("tribes")
      .withIndex("by_tribeId", (q) => q.eq("tribeId", tribeId))
      .unique();
    if (!tribe) throw new Error(`Tribe ${tribeId} not found`);

    await ctx.db.patch(tribe._id, { squares: tribe.squares + count });

    await ctx.db.insert("activities", {
      tribeName: tribe.name,
      count,
      timestamp: Date.now(),
    });
  },
});

export const addPrize = mutation({
  args: { name: v.string(), color: v.string() },
  handler: async (ctx, { name, color }) => {
    const existing = await ctx.db
      .query("prizes")
      .withIndex("by_order")
      .order("desc")
      .first();
    const nextOrder = existing ? existing.order + 1 : 0;

    await ctx.db.insert("prizes", { name, color, order: nextOrder });
  },
});

export const removePrize = mutation({
  args: { id: v.id("prizes") },
  handler: async (ctx, { id }) => {
    const allPrizes = await ctx.db.query("prizes").collect();
    if (allPrizes.length <= 2) {
      throw new Error("You need at least 2 prizes on the wheel!");
    }
    await ctx.db.delete(id);
  },
});

export const logSpin = mutation({
  args: { prize: v.string(), color: v.string() },
  handler: async (ctx, { prize, color }) => {
    await ctx.db.insert("spinHistory", {
      prize,
      color,
      timestamp: Date.now(),
    });
  },
});

export const resetTribes = mutation({
  args: {},
  handler: async (ctx) => {
    const tribes = await ctx.db.query("tribes").collect();
    for (const tribe of tribes) {
      await ctx.db.patch(tribe._id, { squares: 0 });
    }
    // Clear activities
    const activities = await ctx.db.query("activities").collect();
    for (const a of activities) {
      await ctx.db.delete(a._id);
    }
  },
});

export const setDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const demoSquares = [245, 312, 198, 276, 230, 185, 260, 210, 155, 290];
    for (let i = 0; i < demoSquares.length; i++) {
      const tribe = await ctx.db
        .query("tribes")
        .withIndex("by_tribeId", (q) => q.eq("tribeId", i))
        .unique();
      if (tribe) {
        await ctx.db.patch(tribe._id, { squares: demoSquares[i] });
      }
    }
  },
});

export const fullReset = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all rows from every table
    for (const table of ["tribes", "activities", "prizes", "spinHistory"]) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) {
        await ctx.db.delete(row._id);
      }
    }

    // Re-seed tribes
    const tribes = [
      { tribeId: 0, name: "Integrated Digital Engagement", squares: 0, color: "#6366F1" },
      { tribeId: 1, name: "Integrated Health Enablement", squares: 0, color: "#10B981" },
      { tribeId: 2, name: "Wholesale Excellence", squares: 0, color: "#F59E0B" },
      { tribeId: 3, name: "Enterprise Acceleration", squares: 0, color: "#EC4899" },
      { tribeId: 4, name: "People and Performance", squares: 0, color: "#EF4444" },
      { tribeId: 5, name: "Data, Analytics and AI", squares: 0, color: "#3B82F6" },
      { tribeId: 6, name: "Customer Growth and Engagement", squares: 0, color: "#14B8A6" },
      { tribeId: 7, name: "Commercial Decision Intelligence", squares: 0, color: "#8B5CF6" },
      { tribeId: 8, name: "Strategic Finance", squares: 0, color: "#F97316" },
      { tribeId: 9, name: "Design and Insights", squares: 0, color: "#06B6D4" },
    ];
    for (const tribe of tribes) {
      await ctx.db.insert("tribes", tribe);
    }

    // Re-seed prizes
    const prizes = [
      { name: "Dis-Chem Voucher - R250", color: "#5C2D82", order: 0 },
      { name: "Biogen Voucher - R250", color: "#FFD100", order: 1 },
      { name: "Kauai Voucher - R200", color: "#7B4A9E", order: 2 },
      { name: "Starbucks Coffee Voucher", color: "#00704A", order: 3 },
      { name: "Sorry, better luck next time", color: "#6B7280", order: 4 },
    ];
    for (const prize of prizes) {
      await ctx.db.insert("prizes", prize);
    }
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const tribes = [
      { tribeId: 0, name: "Integrated Digital Engagement", squares: 0, color: "#6366F1" },
      { tribeId: 1, name: "Integrated Health Enablement", squares: 0, color: "#10B981" },
      { tribeId: 2, name: "Wholesale Excellence", squares: 0, color: "#F59E0B" },
      { tribeId: 3, name: "Enterprise Acceleration", squares: 0, color: "#EC4899" },
      { tribeId: 4, name: "People and Performance", squares: 0, color: "#EF4444" },
      { tribeId: 5, name: "Data, Analytics and AI", squares: 0, color: "#3B82F6" },
      { tribeId: 6, name: "Customer Growth and Engagement", squares: 0, color: "#14B8A6" },
      { tribeId: 7, name: "Commercial Decision Intelligence", squares: 0, color: "#8B5CF6" },
      { tribeId: 8, name: "Strategic Finance", squares: 0, color: "#F97316" },
      { tribeId: 9, name: "Design and Insights", squares: 0, color: "#06B6D4" },
    ];
    // Insert any missing tribes
    for (const tribe of tribes) {
      const existing = await ctx.db
        .query("tribes")
        .withIndex("by_tribeId", (q) => q.eq("tribeId", tribe.tribeId))
        .unique();
      if (!existing) {
        await ctx.db.insert("tribes", tribe);
      }
    }

    // Only seed prizes if empty
    const existingPrize = await ctx.db.query("prizes").first();
    if (!existingPrize) {
      const prizes = [
        { name: "Dis-Chem Voucher - R250", color: "#5C2D82", order: 0 },
        { name: "Biogen Voucher - R250", color: "#FFD100", order: 1 },
        { name: "Kauai Voucher - R200", color: "#7B4A9E", order: 2 },
        { name: "Starbucks Coffee Voucher", color: "#00704A", order: 3 },
        { name: "Sorry, better luck next time", color: "#6B7280", order: 4 },
      ];
      for (const prize of prizes) {
        await ctx.db.insert("prizes", prize);
      }
    }
  },
});
