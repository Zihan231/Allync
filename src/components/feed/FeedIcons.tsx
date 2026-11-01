/** Small line icons for the feed actions (heart, comment bubble, bookmark, share). */
type P = { className?: string; filled?: boolean };

export function HeartIcon({ className = "h-5 w-5", filled = false }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinejoin="round" d="M12 20.5s-7.5-4.6-9.5-9.3C1.2 8 3.4 4.5 7 4.5c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.6 0 5.8 3.5 4.5 6.7-2 4.7-9.5 9.3-9.5 9.3z" />
    </svg>
  );
}

export function CommentIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinejoin="round" d="M4 5.5h16v10H9l-5 4v-14z" />
    </svg>
  );
}

export function BookmarkIcon({ className = "h-5 w-5", filled = false }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinejoin="round" d="M6 3.5h12v17l-6-4-6 4v-17z" />
    </svg>
  );
}

export function ShareIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 4l6 6-6 6M20 10H10a6 6 0 00-6 6v4" />
    </svg>
  );
}
