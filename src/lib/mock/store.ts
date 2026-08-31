"use client";

import { useSyncExternalStore } from "react";
import type { Match, Tournament, TransferOffer } from "./types";
import { mockMatches } from "./matches";
import { mockTournaments } from "./tournaments";
import { mockTransferOffers } from "./transfers";

// Tiny in-memory store (no external state library) so mock data can be
// mutated and shared across dashboard pages within a session. This is
// demo-only state — nothing is persisted, and it resets on a full reload.

let matches: Match[] = [...mockMatches];
let tournaments: Tournament[] = [...mockTournaments];
let transferOffers: TransferOffer[] = [...mockTransferOffers];

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useMockMatches() {
  return useSyncExternalStore(subscribe, () => matches, () => mockMatches);
}
export function useMockTournaments() {
  return useSyncExternalStore(subscribe, () => tournaments, () => mockTournaments);
}
export function useMockTransferOffers() {
  return useSyncExternalStore(subscribe, () => transferOffers, () => mockTransferOffers);
}

export function updateMatch(id: string, patch: Partial<Match>) {
  matches = matches.map((m) => (m.id === id ? { ...m, ...patch } : m));
  emit();
}

export function addTournament(tournament: Tournament) {
  tournaments = [tournament, ...tournaments];
  emit();
}

export function updateTournament(id: string, patch: Partial<Tournament>) {
  tournaments = tournaments.map((t) => (t.id === id ? { ...t, ...patch } : t));
  emit();
}

export function updateTransferOffer(id: string, patch: Partial<TransferOffer>) {
  transferOffers = transferOffers.map((o) => (o.id === id ? { ...o, ...patch } : o));
  emit();
}
