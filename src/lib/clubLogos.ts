// A small pool of real football club crest images already bundled in
// /public, used as deterministic "club DP" art for fictional clubs in this
// mock dataset (the same way CoverPhoto/stockCoverUrl reuses a handful of
// stock photos for entities with no uploaded cover). Purely decorative flavor
// — the fictional club names (e.g. "Nexus", "Hala Madrid") are not meant to
// literally be these real clubs.
const CLUB_LOGO_POOL = [
  "/arsenal/arsenal-logo-transparent.png",
  "/atleteco di madrid/atletico-logo-transparent.png",
  "/barca/barca-logo-transparent.png",
  "/bayern/bayern-logo-transparent.png",
  "/chelsea/chelsea-logo-transparent.png",
  "/man city/mancity-logo-transparent.png",
  "/manu/manu-logo-transparent.png",
  "/real madrid/real-madrid-logo-preview.png",
];

export function getClubLogo(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return CLUB_LOGO_POOL[Math.abs(hash) % CLUB_LOGO_POOL.length];
}
