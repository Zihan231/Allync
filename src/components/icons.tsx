type IconProps = {
  className?: string;
  style?: React.CSSProperties;
};

export function BallIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 7.2 15.6 9.7 14.3 13.9H9.7L8.4 9.7 12 7.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 3v4.2M12 20.8V16.8M4.6 8.3l4 1.4M15.4 9.7l4-1.4M9.7 13.9l-2.3 3.5M14.3 13.9l2.3 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CrosshairIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function ShieldIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path
        d="M12 3.2 19 5.8v5.4c0 5-3 8.1-7 9.6-4-1.5-7-4.6-7-9.6V5.8L12 3.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="m8.7 12.1 2.2 2.2 4.4-4.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WalletIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <rect x="3" y="6.5" width="18" height="12.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16.5" cy="14.3" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function SwapIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M4 8h13.5M17.5 8 14 4.5M20 16H6.5M6.5 16 10 19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrophyIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M7 4h10v4.2a5 5 0 0 1-10 0V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 5.5H4.2A2.2 2.2 0 0 0 4 9.7c.5.9 1.4 1.4 2.8 1.5M17 5.5h2.8A2.2 2.2 0 0 1 20 9.7c-.5.9-1.4 1.4-2.8 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 13.2V16M8.7 20h6.6M9.8 16.5h4.4l.6 3.5H9.2l.6-3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function UsersIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <circle cx="9" cy="8.2" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 19c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16.2" cy="7.5" r="2.3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15.3 13.7c2.6.2 4.7 2.2 4.7 5.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function BracketIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M4 5h4v3.5H4zM4 15.5h4V19H4zM4 8.5v7M8 6.7h3M8 17.2h3M11 6.7v10.5M11 12h4M15 12v-3M15 12v3M15 9h4v3h-4zM15 12v0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DropZoneIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M12 3 6 9.5V15a6 6 0 0 0 12 0V9.5L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 8v9M9 12.5l3-1.5 3 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="21" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function FlameIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path
        d="M12 3c1 2.4-.6 3.7-1.7 5-1.4 1.6-2.3 3.2-2.3 5a4 4 0 0 0 8 0c0-1.3-.5-2.2-1.2-3 .1 1.6-.6 2.4-1.4 2.8.6-2.2-.4-3.6-1.4-5-.6-1-.1-2.4 0-3.3-1 .3-1.9 1-2.6 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SpikeIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M12 3 19.5 12 12 21 4.5 12 12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 7.5v9M8.2 12h7.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function LockIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="14.8" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function ArrowRightIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M4.5 12h14M13 6.5l6 5.5-6 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
