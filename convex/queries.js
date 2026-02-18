import { query } from "./_generated/server";

export const getTribes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tribes")
      .withIndex("by_tribeId")
      .collect();
  },
});

export const getActivities = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_timestamp")
      .order("desc")
      .take(50);
  },
});

export const getPrizes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("prizes")
      .withIndex("by_order")
      .collect();
  },
});

export const getSpinHistory = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("spinHistory")
      .withIndex("by_timestamp")
      .order("desc")
      .take(100);
  },
});
