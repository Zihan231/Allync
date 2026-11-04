# Testing handoff: Esports Professional roles (coach, creative artist, sponsor, social)

Written so the work can be picked up from git. Nothing here was committed by the assistant; the owner commits and pushes.
Backend counterpart: `Allynq_backend/TESTING-HANDOFF.md`.

## What the feature is
The welcome page ("What suits you best?") now offers Player, Organizer, Sponsor and **Esports professional**.
Esports professional opens Creative artist, Social media expert and Coach (at least one is required). The roles stay in the
user's `roles` array (`esports_professional` + the sub-roles), so the existing coach / creator checks keep working.
Social media expert has no area yet (coming-soon page). Player and organizer were out of scope for these tests.

## Test files added or changed (this repo, `e2e/`)
| File | What it covers |
|---|---|
| `tests/api/coach-flows.spec.ts` | Coach <-> club deals: who is notified (club President + General Secretary only), accept / decline / counter / withdraw / end, money, permissions, directory, follow, deal privacy |
| `tests/api/coach-posts.spec.ts` | Coach posts: staff review, notifications, likes / saves / comments, feed tabs, deletion rights |
| `tests/api/creator-flows.spec.ts` | Creator designs: submit, staff review, price/rarity (admin only), purchase split, changes to live designs, every design kind, the two "being told" notifications |
| `tests/api/sponsor-flows.spec.ts` | Sponsor <-> community: offer, hold, counter, accept (payee gets amount minus cut), end, decline, withdraw, host asks sponsor, calls for sponsors, brand profile, verification, sponsored posts, impressions |
| `tests/ui/roles.spec.ts` | Welcome picker, defaults, landing pages, add-a-role buttons, Bangla, profile role switch |
| `tests/ui/coach-pages.spec.ts` | Every coach page, button by button (profile form, posts + composer, deals, directory, offer + checkout dialogs, public page, feed, find clubs) |
| `tests/ui/creator-pages.spec.ts` | Studio, 3-step wizard, My designs, staff review screen, public pages, store |
| `tests/ui/sponsor-pages.spec.ts` | Hub, brand form, opportunities + offer dialog, deals (both sides), community sponsors section + call, directory, public brand page, sponsored posts, admin verify |
| `lib/cast.ts`, `tests/global.setup.ts` | New actors: `coach2`, `creator`, `social`, `sponsor`, `sponsor2` (sponsors get a brand + funded wallet); more routes warmed up |
| `lib/api.ts` | `notifications()` and `countNotes()` helpers for "who got told" checks |
| `playwright.config.ts` | Frontend dev server is pinned to its own port (the backend `.env` sets `PORT=3001` and leaked into it) |
| `tests/ui/coaching.spec.ts`, `tests/api/coaching.spec.ts` | Updated for the new role structure (coach has `esports_professional`) |

Frontend source changed: `src/components/roles/RolePicker.tsx`, `ProfileModeBar.tsx`, `MyRolesCard.tsx`, `src/lib/roles.ts`,
`src/lib/session/SessionContext.tsx`, `src/lib/api/coaching.ts`, `src/lib/i18n/coaching.ts`, `src/app/welcome/page.tsx`,
`src/app/dashboard/roles/[role]/page.tsx`, `src/components/auth/LoginForm.tsx`, `CoachShell.tsx`, `CreatorShell.tsx`.
`package-lock.json` also changed (`npm install` here; `qrcode` was declared but not installed).

## Last known results
- API: coach-flows 18/18, coach-posts 15/15, creator-flows 21/21, sponsor-flows 18/18 (all pass).
- UI: roles 10/10, coach-pages 19/19.
- UI creator-pages + sponsor-pages: last run 16 passed, 2 failed (both are mistakes in the tests, not the app), 12 not run behind them.
- Backend unit tests: 390/390.

## Still to do (resume here)
1. **creator-pages test 9** ("the creator sends a new image; an admin sets the price..."): it expects the row chip "Change in review".
   By then the design was *rejected* (test 7), and a new image on a rejected design sends it back as a *new* design, so the chip is
   **"In review"**. Change the expectation to "In review" (the admin card then says "New design", which the test already assumes).
2. **sponsor-pages test 21**: after ending, the Past tab holds more than one card for the community (an earlier "Declined" one and the
   "Ended" one), so `sponsorCard(page).filter({ hasText: COMMUNITY })` matches two. Filter on "Ended" (or use `.first()`).
3. Run the 12 tests that did not run (creator tests 10-12, sponsor tests 22-30), fix any more test mistakes.
4. Add the new routes to `tests/ui/smoke.spec.ts` (coach, creator, sponsor pages; both desktop and `ui-mobile`) and run the whole suite once.
5. Clean up test data (see below).

## How to run
From `e2e/` (set the backend folder; the default is `../../Allync_Backend`):
```
export E2E_BACKEND_DIR="c:/XR Interactive/Allynq_backend"      # PowerShell: $env:E2E_BACKEND_DIR = "..."
E2E_KEEP=1 npx playwright test --project=setup                  # builds the test users (~10 min), keeps them
npx playwright test --no-deps --project=ui tests/ui/creator-pages.spec.ts tests/ui/sponsor-pages.spec.ts --reporter=list
```

## Things that cost time (read before running)
- **Always use `--no-deps` for one file.** The `ui` project depends on `api`; without `--no-deps`, asking for one UI file also queues
  every API test (200+ tests, ~30 min).
- **Test users' tokens last about 1 hour.** A kept cast older than that gives `401 Unauthorized` on everything: rebuild with the setup step.
- **Pipe output to a file, not `| tail`**, or you see nothing until the end (`> run.log 2>&1`, then read the file).
- **First visit to a page compiles it** (can exceed the 15 s action wait). The UI specs open their pages once in `beforeAll`; `global.setup.ts`
  also warms them.
- **Remote database blips** happen (`Connection terminated unexpectedly`, DNS errors on the Neon host): a failure with a 500 and that log line is
  infrastructure, rerun.
- Playwright pitfalls found: a disabled `<fieldset>` is not "disabled" (check the inputs inside); Next.js has a hidden `role="alert"` route
  announcer (use `p[role="alert"]`); dev-tool buttons named "Open ..." break `getByRole('button', { name: /^Open/ })` (match "Open ·");
  success toasts disappear when the app navigates away (assert the list/URL instead); labels such as "About" can also match hint text.
- Designs may not contain reserved words (staff, admin, king, pro, top, best ...). Test names avoid them.

## Cleaning up test data
Each run leaves ~35 `e2e+<runId>-...@allynq.test` users, two clubs, a community and some designs in the dev database.
```
npx playwright test --project=teardown          # cleans the newest run through the API (needs its tokens, i.e. < 1 hour old)
npx tsx lib/cleanup.ts --all                    # soft-deletes EVERY e2e user directly in the database (no tokens needed)
```
Runs left un-cleaned at the time of writing: casts `mw23h11grd` (kept for the coach UI run) and `mw25uhym1g` (latest), plus the older ones
from earlier kept runs. Clubs/communities named `E2E <runId> ...` are binned by the orphan sweep in the teardown (needs a fresh admin token).

## Open observations (not blocking, for the owner to decide)
- `revenueTk` on a design is gross sales; the studio shows it as "Revenue" next to the creator's earnings (net).
- `GET /creators/me` has no role check (a non-creator gets an empty studio).
- Staff notifications for a new design go to every staff member (not just moderators).
- Sticker packs are accepted by the API but disabled in the UI.
- There is no UI page for the admin coaching deals ledger (`GET /admin/coaching/deals`).
- `POST /coaching/deals/:id/cancel` lets either side withdraw regardless of who proposed (the code comment says the proposer).
- `GET /sponsorships/target/:type/:id` treats any type other than `community` as a tournament; the impressions endpoint is public.
