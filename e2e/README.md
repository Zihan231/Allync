# Allynq end-to-end tests (Playwright)

Browser + API tests for the Next.js app (`../`) and the NestJS backend (`../../Allync_Backend`), run against the **dev database** with throwaway users.

## Run

```bash
cd e2e
npm install
npx playwright install chromium
npm test              # everything: setup → api → ui → ui-mobile → teardown
npm run test:api      # API suites only
npm run test:ui       # browser suites only
npm run report        # open the HTML report (traces, screenshots, videos of failures)
```

The servers are started automatically (backend `npm run start:dev` on 3001, frontend `npm run dev` on 3000), or reused if already running. From the app root, `npm run test:e2e` does the same; from the backend, `npm run test:e2e:pw`.

## Test data

- `setup` signs up a fresh cast each run: every club role (President, GS, Captain, Vice-Captain, Academy Captain, Manager, Player), every community role, free agents, a console player, an organizer, match official, and staff (Moderator, Admin, Super Admin, with real 2FA codes).
- Every account is `e2e+<runId>-<role>@allynq.test` with a generated password; clubs and tournaments are named `E2E <runId> …`. Money comes from the demo top-up only.
- `teardown` cancels open deals, deletes the run's tournaments, clubs and community, deactivates test store items, and soft-deletes the run's users.
- The only direct SQL (`lib/db.ts`) gives e2e users a staff role and soft-deletes e2e users; both refuse any non-`e2e+…@allynq.test` email.

Keep the data for debugging: `E2E_KEEP=1 npm test`, then `npm run teardown` (or `npx tsx lib/cleanup.ts --all` for every leftover e2e user).

## Suites

| File | Covers |
|---|---|
| `tests/api/permissions.spec.ts` | action × role matrix (club, community, staff tiers, rank rule, guests) |
| `tests/api/rules.spec.ts` | business rules on two fresh clubs: one club per player, buyout-only for contracted players, contract lock and fee, leaders can't move or leave, locked players can't leave, offer expiry, moves wait for a running tournament (and complete by themselves), cup-tied loans, roster limit |
| `tests/api/privacy.spec.ts` | no public endpoint exposes another user's email, phone, address, ID document or account fields |
| `tests/api/transfers-loans.spec.ts` | offers, counters, buyout, holds/refunds, loans, limits, staff end |
| `tests/api/tournaments.spec.ts` | general tournaments: prize hold, fees, leave refund, fixtures payout, cancel refunds; club/community hosting; console rule |
| `tests/api/store-admin.spec.ts` | store items by staff, buy/equip, price change, deactivate, gift/revoke |
| `tests/api/accounts.spec.ts` | sign-up rules, login, staff 2FA, profile requirements, moderation, reports, notifications |
| `tests/ui/smoke.spec.ts` | every page per role renders without crashes or API 5xx (desktop + phone) |
| `tests/ui/auth.spec.ts` | signup / login / logout / staff 2FA forms |
| `tests/ui/permissions.spec.ts` | what each role sees: club & community settings, staff menu, organizer mode |
| `tests/ui/loans.spec.ts` | request-loan button + info, borrow form, squad Borrowed / Lent out filters |
| `tests/ui/store.spec.ts` | store filters, Try preview, Back to store, checkout |
| `tests/ui/organizer.spec.ts` | create a general tournament with a prize, listings |

Not covered end to end: playing matches to a champion (match times are hours ahead): the prize payout is covered by backend unit tests. The scheduled-move test waits for the transfer job, which runs every minute.
