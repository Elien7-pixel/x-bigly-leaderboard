import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
if (!CONVEX_URL) {
  throw new Error("VITE_CONVEX_URL is not set. Check your .env.local file.");
}

const client = new ConvexClient(CONVEX_URL);

/**
 * Subscribe to a Convex query. Returns an unsubscribe function.
 */
export function subscribe(queryName, callback) {
  const queryRef = api.queries[queryName];
  return client.onUpdate(queryRef, {}, callback);
}

/**
 * Mutation wrappers
 */
export function addSquares(tribeId, count) {
  return client.mutation(api.mutations.addSquares, { tribeId, count });
}

export function addPrize(name, color) {
  return client.mutation(api.mutations.addPrize, { name, color });
}

export function removePrize(id) {
  return client.mutation(api.mutations.removePrize, { id });
}

export function logSpin(prize, color) {
  return client.mutation(api.mutations.logSpin, { prize, color });
}

export function resetTribes() {
  return client.mutation(api.mutations.resetTribes, {});
}

export function setDemoData() {
  return client.mutation(api.mutations.setDemoData, {});
}

export function seed() {
  return client.mutation(api.mutations.seed, {});
}
