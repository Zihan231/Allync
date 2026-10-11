import { expect } from "@playwright/test";
import type { Api } from "./api";

export type Balance = { balanceTk: number; heldTk: number };

/** A wallet read that can be compared before/after a step. */
export async function snapshot(api: Api, clubId?: string): Promise<Balance> {
  const w = clubId ? await api.clubWallet(clubId) : await api.myWallet();
  return { balanceTk: w.balanceTk, heldTk: w.heldTk };
}

/** Asserts a wallet moved by exactly these amounts. */
export async function expectMoved(api: Api, before: Balance, delta: Partial<Balance>, clubId?: string, label = "wallet") {
  const after = await snapshot(api, clubId);
  expect({ balance: after.balanceTk - before.balanceTk, held: after.heldTk - before.heldTk }, label).toEqual({
    balance: delta.balanceTk ?? 0,
    held: delta.heldTk ?? 0,
  });
  return after;
}
