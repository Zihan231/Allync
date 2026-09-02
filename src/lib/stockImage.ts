// Deterministic placeholder photography for demo entities that haven't
// uploaded a real DP/cover yet. Picsum/Lorem Picsum (Unsplash-sourced
// stock photography) is a standard, freely-licensed stock/placeholder
// image provider built for exactly this purpose, not a substitute for
// any real brand or person.

export function stockAvatarUrl(seed?: string): string {
  void seed;
  return "/user.jpg";
}

const COMMUNITY_COVERS = ["/community 1.jpg", "/community 2.jpg", "/community 3.jpg"];

export function stockCoverUrl(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % COMMUNITY_COVERS.length;
  return COMMUNITY_COVERS[index];
}
