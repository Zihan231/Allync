"use client";

import { useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import type { CosmeticItem } from "@/lib/mock/cosmetics";
import { Avatar } from "@/components/common/Avatar";
import { CoverPhoto } from "@/components/common/CoverPhoto";
import {
  TrophyIcon,
  ShieldIcon,
  FlameIcon,
  CrosshairIcon,
  BallIcon,
  BracketIcon,
  SwapIcon,
} from "@/components/icons";

type IconComponent = (props: { className?: string; style?: CSSProperties }) => ReactElement;

export const COSMETIC_ICON_MAP: Record<string, IconComponent> = {
  trophy: TrophyIcon,
  shield: ShieldIcon,
  flame: FlameIcon,
  crosshair: CrosshairIcon,
  ball: BallIcon,
  bracket: BracketIcon,
  swap: SwapIcon,
};

// ============================================================================
// 1. GRAND BESPOKE THEMED COVER ARTWORKS (7 Unique Animated AAA Game Stages)
// ============================================================================
export function ThemedCoverArtwork({
  theme,
  coverUrl,
  name,
  className = "h-56 sm:h-72 lg:h-80",
}: {
  theme?: CosmeticItem | null;
  coverUrl?: string | null;
  name: string;
  className?: string;
}) {
  const [viewMode, setViewMode] = useState<"theme" | "photo">("theme");

  // If no theme is equipped, render standard CoverPhoto component
  if (!theme) {
    return <CoverPhoto coverUrl={coverUrl} name={name} className={className} />;
  }

  // Interactive View Mode Switch: Toggle between Theme Stage and Cover Photo
  const viewToggle = (
    <div className="absolute top-4 right-4 z-20 flex items-center rounded-full border border-white/20 bg-bg/90 p-1 shadow-2xl backdrop-blur-md">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setViewMode("theme");
        }}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-mono font-bold transition-all ${
          viewMode === "theme"
            ? "bg-accent text-bg shadow-md"
            : "text-ink-soft hover:text-ink"
        }`}
      >
        <span>✨</span>
        <span>Theme Stage</span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setViewMode("photo");
        }}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-mono font-bold transition-all ${
          viewMode === "photo"
            ? "bg-accent text-bg shadow-md"
            : "text-ink-soft hover:text-ink"
        }`}
      >
        <span>📷</span>
        <span>Cover Photo</span>
      </button>
    </div>
  );

  // If player toggled to Cover Photo view:
  if (viewMode === "photo") {
    return (
      <div className={`relative w-full ${className}`}>
        <CoverPhoto
          coverUrl={coverUrl}
          name={name}
          color={theme.color}
          className="h-full w-full"
        />
        {viewToggle}
      </div>
    );
  }

  // 1. MYTHIC: Cosmic Hyper-Nebula
  if (theme.id === "theme-celestial-nebula" || theme.rarity === "mythic") {
    return (
      <div
        className={`relative w-full overflow-hidden select-none ${className}`}
        style={{ background: "linear-gradient(135deg, #070614 0%, #17082e 50%, #060e24 100%)" }}
      >
        {/* Swirling Nebula Gas Clouds */}
        <div
          className="pointer-events-none absolute -top-1/2 left-1/4 h-[160%] w-[120%] -translate-x-1/2 rounded-full blur-[70px] opacity-75 animate-cosmic-drift"
          style={{
            background:
              "radial-gradient(circle, rgba(255,0,128,0.5) 0%, rgba(139,127,224,0.38) 40%, rgba(0,245,255,0.25) 70%, transparent 85%)",
          }}
        />
        <div
          className="pointer-events-none absolute top-0 right-0 h-full w-2/3 blur-[60px] opacity-65"
          style={{
            background:
              "radial-gradient(circle, rgba(0,245,255,0.45) 0%, rgba(139,127,224,0.28) 50%, transparent 80%)",
          }}
        />

        {/* Celestial Vector Grid & Orbital Rings */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-45" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cosmicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff007f" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#00f5ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffd700" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <ellipse cx="65%" cy="45%" rx="240" ry="70" fill="none" stroke="url(#cosmicGrad)" strokeWidth="1.5" strokeDasharray="6 4" transform="rotate(-18 650 200)" />
          <ellipse cx="65%" cy="45%" rx="290" ry="90" fill="none" stroke="#00f5ff" strokeWidth="0.75" opacity="0.5" transform="rotate(-18 650 200)" />
          <circle cx="65%" cy="45%" r="55" fill="none" stroke="#ff007f" strokeWidth="1.5" opacity="0.6" />
          <circle cx="65%" cy="45%" r="85" fill="none" stroke="#ffd700" strokeWidth="0.5" strokeDasharray="3 6" />
        </svg>

        {/* Constellation Star Motifs */}
        <div className="pointer-events-none absolute inset-0 bg-stars-pattern opacity-95 animate-cosmic-stars" />

        {/* 4-Point Sparkle Stars */}
        <div className="pointer-events-none absolute top-10 left-[20%] h-6 w-6 text-cyan-300 opacity-90 animate-pulse">✦</div>
        <div className="pointer-events-none absolute top-20 right-[25%] h-8 w-8 text-rose-300 opacity-90 animate-pulse">✧</div>
        <div className="pointer-events-none absolute bottom-12 left-[45%] h-5 w-5 text-amber-200 opacity-80 animate-pulse">✦</div>

        {/* Theme Title Watermark */}
        <div className="pointer-events-none absolute top-4 left-6 flex items-center gap-2">
          <span className="font-mono text-[11px] font-black uppercase tracking-[0.25em] bg-gradient-to-r from-rose-300 via-cyan-200 to-amber-200 bg-clip-text text-transparent animate-rainbow-flow drop-shadow-[0_0_12px_rgba(255,0,128,0.8)]">
            ✦ CELESTIAL VOID // MYTHIC STAGE ✦
          </span>
        </div>

        {/* Interactive View Toggle */}
        {viewToggle}

        {/* Bottom Horizon Glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
      </div>
    );
  }

  // 2. LEGENDARY: ALLYNQ Sovereign Solar Gold (24K Gold)
  if (theme.id === "theme-allynq-gold" || (theme.rarity === "legendary" && theme.id !== "theme-cyberpunk-night")) {
    return (
      <div
        className={`relative w-full overflow-hidden select-none ${className}`}
        style={{ background: "linear-gradient(135deg, #0d0b05 0%, #211907 45%, #0a0803 100%)" }}
      >
        {/* Golden Radiant Sunburst Center */}
        <div
          className="pointer-events-none absolute -top-10 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-[80px] opacity-80 animate-gold-radiance"
          style={{
            background:
              "radial-gradient(circle, rgba(255,215,0,0.65) 0%, rgba(217,165,68,0.35) 50%, transparent 75%)",
          }}
        />

        {/* Honeycomb Geometry Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-honeycomb opacity-75" />

        {/* Gilded SVG Sunburst Rays & Laurel Arch */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-50" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="goldBeam" cx="50%" cy="0%" r="90%">
              <stop offset="0%" stopColor="#ffd700" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#d9a544" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#d9a544" stopOpacity="0" />
            </radialGradient>
          </defs>
          <polygon points="500,0 200,400 300,400" fill="url(#goldBeam)" />
          <polygon points="500,0 450,400 550,400" fill="url(#goldBeam)" />
          <polygon points="500,0 700,400 800,400" fill="url(#goldBeam)" />
          <circle cx="50%" cy="40%" r="130" fill="none" stroke="#ffd700" strokeWidth="1" strokeDasharray="8 6" />
          <circle cx="50%" cy="40%" r="160" fill="none" stroke="#d9a544" strokeWidth="0.75" />
          <circle cx="50%" cy="40%" r="190" fill="none" stroke="#ffd700" strokeWidth="0.5" strokeDasharray="3 8" />
        </svg>

        {/* 24K Gold Floating Sparkles */}
        <div className="pointer-events-none absolute top-12 left-[30%] h-4 w-4 rotate-45 border border-amber-300 bg-amber-200/60 shadow-[0_0_10px_#ffd700] animate-pulse" />
        <div className="pointer-events-none absolute top-24 right-[28%] h-3 w-3 rotate-45 border border-amber-300 bg-amber-200/60 shadow-[0_0_8px_#ffd700] animate-pulse" />
        <div className="pointer-events-none absolute bottom-16 right-[40%] h-4 w-4 rotate-45 border border-amber-300 bg-amber-200/60 shadow-[0_0_10px_#ffd700] animate-pulse" />

        {/* Theme Title Watermark */}
        <div className="pointer-events-none absolute top-4 left-6 flex items-center gap-2">
          <span className="font-mono text-[11px] font-black uppercase tracking-[0.25em] bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 bg-clip-text text-transparent animate-gold-radiance drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]">
            ★ ALLYNQ SOVEREIGN GOLD // 24K IMPERIAL EDITION ★
          </span>
        </div>

        {/* Interactive View Toggle */}
        {viewToggle}

        {/* Bottom Horizon Glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
      </div>
    );
  }

  // 3. LEGENDARY: Cyberpunk 2077 Night City
  if (theme.id === "theme-cyberpunk-night") {
    return (
      <div
        className={`relative w-full overflow-hidden select-none ${className}`}
        style={{ background: "linear-gradient(135deg, #090412 0%, #1e072b 45%, #050a18 100%)" }}
      >
        {/* Neon Pink and Cyan Horizon Glows */}
        <div
          className="pointer-events-none absolute top-0 left-1/3 h-[380px] w-[500px] -translate-x-1/2 rounded-full blur-[90px] opacity-80"
          style={{
            background:
              "radial-gradient(circle, rgba(255,0,128,0.6) 0%, rgba(168,85,247,0.35) 50%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute top-0 right-10 h-[340px] w-[420px] rounded-full blur-[80px] opacity-75"
          style={{ background: "radial-gradient(circle, rgba(0,245,255,0.55) 0%, transparent 70%)" }}
        />

        {/* Cyberpunk Perspective Grid */}
        <div className="pointer-events-none absolute inset-0 bg-cyber-grid opacity-80" />

        {/* Futuristic Skyline Vector & Equalizer HUD */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-45" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="65%" x2="100%" y2="65%" stroke="#ff007f" strokeWidth="2" />
          <line x1="0" y1="70%" x2="100%" y2="70%" stroke="#00f5ff" strokeWidth="1" strokeDasharray="12 6" />
          <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#ff007f" strokeWidth="0.5" />
          <rect x="15%" y="30%" width="60" height="150" fill="#ff007f" opacity="0.18" />
          <rect x="22%" y="20%" width="45" height="180" fill="#00f5ff" opacity="0.15" />
          <rect x="70%" y="25%" width="75" height="160" fill="#a855f7" opacity="0.18" />
          <rect x="78%" y="15%" width="50" height="200" fill="#00f5ff" opacity="0.18" />
        </svg>

        {/* HUD Data Telemetry Overlay */}
        <div className="pointer-events-none absolute top-4 left-6 flex items-center gap-2">
          <span className="font-mono text-[11px] font-black uppercase tracking-[0.25em] text-rose-300 drop-shadow-[0_0_10px_#ff007f]">
            ⚡ NIGHT CITY // CYBERPUNK 2077 // OVERDRIVE ⚡
          </span>
        </div>

        {/* Interactive View Toggle */}
        {viewToggle}

        {/* Bottom Horizon Glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
      </div>
    );
  }

  // 4. EPIC: Crimson Blood Moon
  if (theme.id === "theme-crimson" || (theme.rarity === "epic" && theme.id !== "theme-frostbite")) {
    return (
      <div
        className={`relative w-full overflow-hidden select-none ${className}`}
        style={{ background: "linear-gradient(135deg, #120306 0%, #26050b 45%, #0b0204 100%)" }}
      >
        {/* Giant Glowing Blood Moon */}
        <div
          className="pointer-events-none absolute -top-10 left-1/2 h-[380px] w-[380px] -translate-x-1/2 rounded-full blur-[70px] opacity-85 animate-flame-flicker"
          style={{
            background:
              "radial-gradient(circle, rgba(255,84,112,0.7) 0%, rgba(255,107,74,0.4) 50%, transparent 75%)",
          }}
        />

        {/* Blood Moon Eclipse Ring */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-55" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50%" cy="35%" r="90" fill="#120306" stroke="#ff5470" strokeWidth="3" opacity="0.95" />
          <circle cx="50%" cy="35%" r="130" fill="none" stroke="#ff6b4a" strokeWidth="1" strokeDasharray="10 8" />
          <circle cx="50%" cy="35%" r="165" fill="none" stroke="#ff5470" strokeWidth="0.5" />
        </svg>

        {/* Fiery Rising Ember Dots */}
        <div className="pointer-events-none absolute bottom-10 left-[25%] h-3 w-3 rounded-full bg-rose-400 shadow-[0_0_10px_#ff5470] animate-bounce" />
        <div className="pointer-events-none absolute bottom-16 right-[30%] h-2.5 w-2.5 rounded-full bg-orange-400 shadow-[0_0_8px_#ff6b4a] animate-pulse" />
        <div className="pointer-events-none absolute top-16 right-[45%] h-2 w-2 rounded-full bg-yellow-300 shadow-[0_0_8px_#ffd700] animate-pulse" />

        {/* Theme Title Watermark */}
        <div className="pointer-events-none absolute top-4 left-6 flex items-center gap-2">
          <span className="font-mono text-[11px] font-black uppercase tracking-[0.25em] text-rose-300 drop-shadow-[0_0_10px_#ff5470]">
            ◆ BLOOD MOON // INFERNAL CRUCIBLE ◆
          </span>
        </div>

        {/* Interactive View Toggle */}
        {viewToggle}

        {/* Bottom Horizon Glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
      </div>
    );
  }

  // 5. EPIC: Glacial Cryo-Frost
  if (theme.id === "theme-frostbite") {
    return (
      <div
        className={`relative w-full overflow-hidden select-none ${className}`}
        style={{ background: "linear-gradient(135deg, #020b14 0%, #06192b 45%, #01070e 100%)" }}
      >
        {/* Polar Aurora Waves */}
        <div
          className="pointer-events-none absolute top-0 left-1/3 h-[360px] w-[500px] -translate-x-1/2 rounded-full blur-[80px] opacity-80 animate-pulse-glow"
          style={{
            background:
              "radial-gradient(circle, rgba(0,245,255,0.6) 0%, rgba(139,127,224,0.3) 50%, transparent 75%)",
          }}
        />

        {/* Diamond Ice Crystal Geometry */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-50" xmlns="http://www.w3.org/2000/svg">
          <polygon points="200,300 250,150 300,300" fill="none" stroke="#00f5ff" strokeWidth="1.5" />
          <polygon points="500,320 560,120 620,320" fill="none" stroke="#ffffff" strokeWidth="1.5" />
          <polygon points="750,300 800,160 850,300" fill="none" stroke="#00f5ff" strokeWidth="1" />
          <circle cx="560" cy="120" r="40" fill="none" stroke="#00f5ff" strokeWidth="0.5" strokeDasharray="6 4" />
        </svg>

        {/* Shimmering Ice Crystal Motes */}
        <div className="pointer-events-none absolute top-12 left-[40%] h-4 w-4 rotate-45 border border-cyan-200 bg-white/70 shadow-[0_0_12px_#00f5ff] animate-pulse" />
        <div className="pointer-events-none absolute top-20 right-[35%] h-3 w-3 rotate-45 border border-cyan-200 bg-cyan-100/60 shadow-[0_0_8px_#00f5ff] animate-pulse" />

        {/* Theme Title Watermark */}
        <div className="pointer-events-none absolute top-4 left-6 flex items-center gap-2">
          <span className="font-mono text-[11px] font-black uppercase tracking-[0.25em] text-cyan-200 drop-shadow-[0_0_10px_#00f5ff]">
            ◆ GLACIAL CRYO-FROST // SUB-ZERO ◆
          </span>
        </div>

        {/* Interactive View Toggle */}
        {viewToggle}

        {/* Bottom Horizon Glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
      </div>
    );
  }

  // 6. RARE: Emerald Stadium Floodlight
  if (theme.id === "theme-emerald") {
    return (
      <div
        className={`relative w-full overflow-hidden select-none ${className}`}
        style={{ background: "linear-gradient(135deg, #021208 0%, #052613 45%, #010a05 100%)" }}
      >
        {/* Stadium Floodlight Volumetric Beams */}
        <div
          className="pointer-events-none absolute top-0 left-1/4 h-[360px] w-[450px] -translate-x-1/2 rounded-full blur-[80px] opacity-80"
          style={{
            background:
              "radial-gradient(circle, rgba(63,191,127,0.65) 0%, rgba(0,255,135,0.25) 50%, transparent 75%)",
          }}
        />

        {/* Tactical Pitch Lines Vector */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-50" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="50%" cy="75%" rx="350" ry="120" fill="none" stroke="#3fbf7f" strokeWidth="2" />
          <ellipse cx="50%" cy="75%" rx="180" ry="60" fill="none" stroke="#00ff87" strokeWidth="1" strokeDasharray="8 6" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#3fbf7f" strokeWidth="1" opacity="0.6" />
        </svg>

        {/* Theme Title Watermark */}
        <div className="pointer-events-none absolute top-4 left-6 flex items-center gap-2">
          <span className="font-mono text-[11px] font-black uppercase tracking-[0.25em] text-emerald-300 drop-shadow-[0_0_10px_#3fbf7f]">
            ▲ CHAMPIONS ARENA // NIGHT FIXTURE ▲
          </span>
        </div>

        {/* Interactive View Toggle */}
        {viewToggle}

        {/* Bottom Horizon Glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
      </div>
    );
  }

  // 7. RARE / DEFAULT: Deep Cyber Abyss
  return (
    <div
      className={`relative w-full overflow-hidden select-none ${className}`}
      style={{ background: "linear-gradient(135deg, #020817 0%, #061530 45%, #01040f 100%)" }}
    >
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-[360px] w-[500px] -translate-x-1/2 rounded-full blur-[80px] opacity-80"
        style={{
          background:
            "radial-gradient(circle, rgba(76,141,255,0.6) 0%, rgba(0,245,255,0.3) 50%, transparent 75%)",
        }}
      />
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-45" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50%" cy="40%" r="120" fill="none" stroke="#4c8dff" strokeWidth="1.5" strokeDasharray="8 6" />
        <circle cx="50%" cy="40%" r="180" fill="none" stroke="#00f5ff" strokeWidth="0.75" />
      </svg>
      <div className="pointer-events-none absolute top-4 left-6 flex items-center gap-2">
        <span className="font-mono text-[11px] font-black uppercase tracking-[0.25em] text-blue-300 drop-shadow-[0_0_8px_#4c8dff]">
          ▲ DEEP CYBER ABYSS // OCEANIC STAGE ▲
        </span>
      </div>

      {/* Interactive View Toggle */}
      {viewToggle}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
    </div>
  );
}

// ============================================================================
// 2. COSMETIC TITLE DISPLAY (Kinetic Animated Glowing Typography)
// ============================================================================
export function CosmeticTitleText({
  item,
  size = "md",
}: {
  item: CosmeticItem;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses =
    size === "sm"
      ? "text-xs"
      : size === "lg"
      ? "text-base sm:text-lg"
      : "text-sm";

  // MYTHIC: High-Speed Liquid Chromatic Rainbow Lightning Title with Laser Glare
  if (item.rarity === "mythic") {
    return (
      <span className="group relative inline-flex items-center gap-2 transition-transform duration-300 hover:scale-110">
        <span className="inline-block font-mono text-cyan-300 animate-jewel-sparkle text-sm sm:text-base drop-shadow-[0_0_12px_#00f5ff]">
          ⚡
        </span>
        <span
          className={`relative inline-block font-mono font-black uppercase tracking-widest bg-gradient-to-r from-fuchsia-400 via-cyan-300 via-amber-300 via-rose-400 to-fuchsia-400 bg-clip-text text-transparent animate-liquid-chroma animate-neon-text drop-shadow-[0_0_24px_rgba(255,0,128,1)] overflow-hidden ${sizeClasses}`}
        >
          {item.name}
          {/* Rapid laser sweep glare beam */}
          <span className="pointer-events-none absolute inset-0 -skew-x-25 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-laser-glare" />
        </span>
        <span className="inline-block font-mono text-rose-400 animate-jewel-sparkle text-sm sm:text-base drop-shadow-[0_0_12px_#ff007f]">
          ⚡
        </span>
      </span>
    );
  }

  // LEGENDARY: 24K Solar Gold / Blood Ruby Metallic Flow Title
  if (item.rarity === "legendary") {
    const isCrimson = item.tone === "danger" || item.color === "#ff5470";
    const gradient = isCrimson
      ? "from-rose-400 via-amber-200 via-rose-300 to-amber-300"
      : "from-amber-200 via-yellow-100 via-amber-400 to-yellow-200";
    const shadowColor = isCrimson ? "rgba(255,84,112,1)" : "rgba(255,215,0,1)";

    return (
      <span className="group relative inline-flex items-center gap-2 transition-transform duration-300 hover:scale-110">
        <span className="inline-block font-mono text-amber-300 animate-jewel-sparkle text-sm drop-shadow-[0_0_10px_#ffd700]">
          ★
        </span>
        <span
          className={`relative inline-block font-mono font-black uppercase tracking-widest bg-gradient-to-r ${gradient} bg-clip-text text-transparent animate-liquid-chroma drop-shadow-[0_0_22px_${shadowColor}] overflow-hidden ${sizeClasses}`}
        >
          {item.name}
          <span className="pointer-events-none absolute inset-0 -skew-x-25 bg-gradient-to-r from-transparent via-amber-100/60 to-transparent animate-laser-glare" />
        </span>
        <span className="inline-block font-mono text-amber-300 animate-jewel-sparkle text-sm drop-shadow-[0_0_10px_#ffd700]">
          ★
        </span>
      </span>
    );
  }

  // EPIC: Fiery Magma Inferno / Cyber Matrix Glitch Title
  if (item.rarity === "epic") {
    const isFire = item.effect === "fire" || item.tone === "danger";
    const animClass = isFire ? "animate-inferno-flames" : "animate-cyber-flash";

    return (
      <span className="group relative inline-flex items-center gap-1.5 transition-transform duration-300 hover:scale-110">
        <span className={`font-mono text-sm ${isFire ? "animate-bounce" : "animate-pulse"}`}>
          {isFire ? "🔥" : "⚡"}
        </span>
        <span
          className={`relative inline-block font-mono font-black uppercase tracking-wider ${animClass} ${sizeClasses}`}
          style={{
            color: item.color,
            textShadow: `0 0 16px ${item.color}, 0 0 32px ${item.secondaryColor ?? item.color}`,
          }}
        >
          {item.name}
        </span>
        <span className={`font-mono text-sm ${isFire ? "animate-bounce" : "animate-pulse"}`}>
          {isFire ? "🔥" : "⚡"}
        </span>
      </span>
    );
  }

  // RARE: Tactical Stadium Overdrive Title
  if (item.rarity === "rare") {
    return (
      <span className="group relative inline-flex items-center gap-1.5 transition-transform duration-300 hover:scale-110">
        <span className="font-mono text-emerald-300 animate-pulse text-xs">
          ✦
        </span>
        <span
          className={`inline-block font-mono font-bold uppercase tracking-wide animate-title-energy drop-shadow-[0_0_16px_rgba(63,191,127,1)] ${sizeClasses}`}
          style={{
            color: item.color,
            textShadow: `0 0 16px ${item.color}`,
          }}
        >
          {item.name}
        </span>
        <span className="font-mono text-emerald-300 animate-pulse text-xs">
          ✦
        </span>
      </span>
    );
  }

  // COMMON: Clean Cyber Aegis Title
  return (
    <span className="group relative inline-flex items-center gap-1 transition-transform duration-300 hover:scale-105">
      <span
        className={`inline-block font-mono font-semibold uppercase tracking-wide drop-shadow-[0_0_12px_rgba(76,141,255,0.9)] ${sizeClasses}`}
        style={{
          color: item.color,
          textShadow: `0 0 12px ${item.color}`,
        }}
      >
        « {item.name} »
      </span>
    </span>
  );
}

// ============================================================================
// 3. COSMETIC BADGE PILL (Animated 3D Metallic Badges with Laser Sweeps)
// ============================================================================
export function CosmeticBadgePill({
  item,
  isEquipped = false,
  equippedLabel,
}: {
  item: CosmeticItem;
  isEquipped?: boolean;
  equippedLabel?: string;
}) {
  const Icon = COSMETIC_ICON_MAP[item.icon] ?? ShieldIcon;

  // MYTHIC BADGE (Prismatic Rainbow Wave, Outer Shockwave & Laser Glare)
  if (item.rarity === "mythic") {
    return (
      <span
        className={`group relative inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black tracking-wide border-2 border-rose-400 bg-gradient-to-r from-rose-950 via-purple-950 to-cyan-950 text-rose-100 shadow-[0_0_30px_rgba(255,0,128,0.95)] overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-[0_0_40px_rgba(255,0,128,1)] animate-levitate ${
          isEquipped ? "ring-2 ring-rose-400 ring-offset-2 ring-offset-bg shadow-[0_0_35px_rgba(255,0,128,1)]" : ""
        }`}
      >
        {/* Pulsating Outer Shockwave Ring */}
        <span className="pointer-events-none absolute -inset-1 rounded-full border-2 border-rose-400/80 animate-badge-shockwave" />

        {/* Animated fluid rainbow backdrop stream */}
        <span className="absolute inset-0 bg-gradient-to-r from-rose-500/40 via-cyan-500/40 via-amber-400/40 to-rose-500/40 animate-liquid-chroma" />

        {/* Rapid Laser Shimmer Glare Bar */}
        <span className="pointer-events-none absolute inset-0 -skew-x-25 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-laser-glare" />

        <span className="relative z-10 flex items-center gap-1.5">
          <Icon className="h-4 w-4 text-rose-300 animate-jewel-sparkle" />
          <span className="bg-gradient-to-r from-rose-200 via-cyan-200 to-amber-100 bg-clip-text text-transparent font-black tracking-wide">
            {item.name}
          </span>
          <span className="inline-block text-[11px] text-cyan-300 animate-jewel-sparkle">✦</span>
          {isEquipped && equippedLabel ? (
            <span className="ml-1 text-[9px] font-mono font-black uppercase text-amber-300 bg-amber-500/40 px-2 py-0.5 rounded-full border border-amber-300 shadow-[0_0_8px_#ffd700]">
              {equippedLabel}
            </span>
          ) : null}
        </span>
      </span>
    );
  }

  // LEGENDARY BADGE (24K Gold Radiant Foil with Sparkle Twinkles & Shockwaves)
  if (item.rarity === "legendary") {
    const isDanger = item.tone === "danger" || item.color === "#ff5470";
    const borderGrad = isDanger ? "border-rose-400" : "border-amber-400";
    const bgGrad = isDanger
      ? "from-rose-950 via-orange-950 to-rose-950"
      : "from-amber-950 via-yellow-950 to-amber-950";
    const glowColor = isDanger ? "rgba(255,84,112,0.95)" : "rgba(255,215,0,0.95)";

    return (
      <span
        className={`group relative inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black border-2 ${borderGrad} bg-gradient-to-r ${bgGrad} text-amber-100 shadow-[0_0_26px_${glowColor}] overflow-hidden transition-all duration-300 hover:scale-110 animate-levitate ${
          isEquipped ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-bg shadow-[0_0_32px_rgba(255,215,0,1)]" : ""
        }`}
      >
        {/* Shockwave border */}
        <span className="pointer-events-none absolute -inset-1 rounded-full border-2 border-amber-300/80 animate-badge-shockwave" />

        {/* Continuous 24K Gold Laser Sweep */}
        <span className="pointer-events-none absolute inset-0 -skew-x-25 bg-gradient-to-r from-transparent via-amber-200/50 to-transparent animate-laser-glare" />

        <span className="relative z-10 flex items-center gap-1.5">
          <Icon className="h-4 w-4 text-yellow-300 animate-gold-radiance" />
          <span className="bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-300 bg-clip-text text-transparent font-black tracking-wide">
            {item.name}
          </span>
          <span className="inline-block text-[10px] text-amber-300 animate-jewel-sparkle">★</span>
          {isEquipped && equippedLabel ? (
            <span className="ml-1 text-[9px] font-mono font-black uppercase text-bg bg-amber-400 px-2 py-0.5 rounded-full font-black shadow-[0_0_10px_#ffd700]">
              {equippedLabel}
            </span>
          ) : null}
        </span>
      </span>
    );
  }

  // EPIC BADGE (Pulsating Cyber Glitch & Ember Flare)
  if (item.rarity === "epic") {
    const isFire = item.effect === "fire" || item.tone === "danger";

    return (
      <span
        className={`group relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold border-2 border-purple-400 bg-gradient-to-r from-purple-950 to-indigo-950 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.85)] overflow-hidden transition-all duration-300 hover:scale-105 ${
          isEquipped ? "ring-2 ring-purple-400 shadow-[0_0_26px_rgba(168,85,247,1)]" : ""
        }`}
      >
        <span className="pointer-events-none absolute inset-0 -skew-x-20 bg-gradient-to-r from-transparent via-purple-300/40 to-transparent animate-laser-glare" />
        <span className="relative z-10 flex items-center gap-1.5">
          <Icon className={`h-3.5 w-3.5 text-purple-300 ${isFire ? "animate-bounce" : "animate-pulse"}`} />
          <span>{item.name}</span>
          {isEquipped && equippedLabel ? (
            <span className="ml-1 text-[9px] font-mono font-bold uppercase text-purple-200 bg-purple-500/40 px-1.5 py-0.2 rounded-full border border-purple-400/40">
              {equippedLabel}
            </span>
          ) : null}
        </span>
      </span>
    );
  }

  // RARE BADGE (Bioluminescent Pitch Overdrive)
  if (item.rarity === "rare") {
    return (
      <span
        className={`group relative inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border-2 border-emerald-400 bg-gradient-to-r from-emerald-950 to-teal-950 text-emerald-200 shadow-[0_0_18px_rgba(63,191,127,0.75)] overflow-hidden transition-all duration-300 hover:scale-105 ${
          isEquipped ? "ring-2 ring-emerald-400 shadow-[0_0_24px_rgba(63,191,127,0.9)]" : ""
        }`}
      >
        <span className="pointer-events-none absolute inset-0 -skew-x-20 bg-gradient-to-r from-transparent via-emerald-300/35 to-transparent animate-laser-glare" />
        <span className="relative z-10 flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-emerald-300 animate-pulse" />
          <span>{item.name}</span>
          {isEquipped && equippedLabel ? (
            <span className="ml-1 text-[9px] font-mono font-bold uppercase text-emerald-200 bg-emerald-500/40 px-1.5 py-0.2 rounded-full border border-emerald-400/40">
              {equippedLabel}
            </span>
          ) : null}
        </span>
      </span>
    );
  }

  // COMMON BADGE (Cyber Aegis)
  return (
    <span
      className={`group relative inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border border-blue-400 bg-gradient-to-r from-blue-950 to-indigo-950 text-blue-200 shadow-[0_0_14px_rgba(76,141,255,0.6)] overflow-hidden transition-all duration-300 hover:scale-105 ${
        isEquipped ? "ring-2 ring-blue-400 shadow-[0_0_20px_rgba(76,141,255,0.8)]" : ""
      }`}
    >
      <span className="pointer-events-none absolute inset-0 -skew-x-20 bg-gradient-to-r from-transparent via-blue-300/30 to-transparent animate-laser-glare" />
      <span className="relative z-10 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-blue-300" />
        <span>{item.name}</span>
        {isEquipped && equippedLabel ? (
          <span className="ml-1 text-[9px] font-mono font-bold uppercase text-blue-200 bg-blue-500/40 px-1.5 py-0.2 rounded-full border border-blue-400/40">
            {equippedLabel}
          </span>
        ) : null}
      </span>
    </span>
  );
}

// ============================================================================
// 4. COSMETIC AVATAR FRAME (Grand Multi-Layered Rotating Animated Halos)
// ============================================================================
export function CosmeticAvatarFrame({
  frame,
  dpUrl,
  name,
  size = "xl",
  mode = "lightbox",
}: {
  frame: CosmeticItem | null | undefined;
  dpUrl: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  mode?: "static" | "lightbox";
}) {
  if (!frame) {
    return (
      <div className="rounded-full border-4 border-bg bg-surface shadow-md">
        <Avatar dpUrl={dpUrl} name={name} size={size} mode={mode} />
      </div>
    );
  }

  // --- 1. MYTHIC FRAME (Celestial Void Singularity - High-Speed Dual Vortex + 4 Orbiting Satellites) ---
  if (frame.id === "frame-void-singularity" || frame.rarity === "mythic") {
    return (
      <div className="relative flex items-center justify-center p-4 group">
        {/* Outer Expanding Supernova Shockwave */}
        <div className="pointer-events-none absolute -inset-4 rounded-full border-2 border-rose-400/90 animate-shockwave" />

        {/* High-Speed Outer Clockwise Vortex Ring (3.5s) */}
        <div
          className="pointer-events-none absolute -inset-3 rounded-full animate-vortex-spin-fast opacity-100 blur-[1px]"
          style={{
            background:
              "conic-gradient(from 0deg, #ff007f 0%, #00f5ff 25%, #ffd700 50%, #a855f7 75%, #ff007f 100%)",
          }}
        />

        {/* High-Speed Inner Counter-Clockwise Vortex Ring (2.8s) */}
        <div
          className="pointer-events-none absolute -inset-1.5 rounded-full animate-vortex-spin-reverse-fast opacity-95"
          style={{
            background:
              "conic-gradient(from 180deg, #00f5ff 0%, transparent 35%, #ff007f 65%, transparent 100%)",
          }}
        />

        {/* 4 DYNAMIC ORBITING SATELLITE PARTICLES (Continuous Circular Motion) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="absolute h-3.5 w-3.5 rounded-full bg-cyan-300 shadow-[0_0_16px_#00f5ff] animate-orbit-1" />
          <div className="absolute h-3.5 w-3.5 rounded-full bg-rose-400 shadow-[0_0_16px_#ff007f] animate-orbit-2" />
          <div className="absolute h-3.5 w-3.5 rounded-full bg-amber-300 shadow-[0_0_16px_#ffd700] animate-orbit-3" />
          <div className="absolute h-3.5 w-3.5 rounded-full bg-purple-400 shadow-[0_0_16px_#a855f7] animate-orbit-4" />
        </div>

        {/* Center Avatar Container */}
        <div className="relative rounded-full border-2 border-bg bg-bg p-0.5 shadow-[0_0_30px_rgba(255,0,128,0.9)] transition-transform duration-300 group-hover:scale-105">
          <Avatar dpUrl={dpUrl} name={name} size={size} mode={mode} />
        </div>
      </div>
    );
  }

  // --- 2. LEGENDARY FRAME 1 (Solar Phoenix Radiant Halo - Flaming Corona + Orbiting Sparks) ---
  if (frame.id === "frame-solar-phoenix") {
    return (
      <div className="relative flex items-center justify-center p-4 group">
        {/* Outer Solar Flare Shockwave */}
        <div className="pointer-events-none absolute -inset-4 rounded-full border-2 border-amber-400/90 animate-shockwave" />

        {/* High-Heat Flaming Core */}
        <div
          className="pointer-events-none absolute -inset-3 rounded-full animate-inferno-flames opacity-100 blur-[2px]"
          style={{
            background:
              "radial-gradient(circle, rgba(255,107,74,1) 0%, rgba(224,168,60,0.85) 50%, transparent 80%)",
          }}
        />

        {/* High-Speed Rotating Solar Crown */}
        <div
          className="pointer-events-none absolute -inset-1 rounded-full border-2 border-amber-300 shadow-[0_0_28px_rgba(255,183,3,1)] animate-gold-sunburst"
          style={{ borderStyle: "dotted" }}
        />

        {/* Orbiting Solar Sparks */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="absolute h-3.5 w-3.5 rounded-full bg-amber-300 shadow-[0_0_14px_#ffd700] animate-orbit-1" />
          <div className="absolute h-3.5 w-3.5 rounded-full bg-orange-400 shadow-[0_0_14px_#ff6b4a] animate-orbit-3" />
        </div>

        <div className="relative rounded-full border-2 border-amber-400 bg-bg p-0.5 shadow-[0_0_26px_rgba(255,183,3,0.9)] transition-transform duration-300 group-hover:scale-105">
          <Avatar dpUrl={dpUrl} name={name} size={size} mode={mode} />
        </div>
      </div>
    );
  }

  // --- 3. LEGENDARY FRAME 2 (Crown of Kings 24K Gold - Rotating Corona & Cardinal Jewels) ---
  if (frame.id === "frame-royal-gold" || frame.rarity === "legendary") {
    return (
      <div className="relative flex items-center justify-center p-4 group">
        {/* Expanding Gold Shockwave Ring */}
        <div className="pointer-events-none absolute -inset-4 rounded-full border-2 border-amber-300/90 animate-shockwave" />

        {/* Radiant 24K Gold Sunburst Halo */}
        <div
          className="pointer-events-none absolute -inset-3 rounded-full animate-gold-radiance opacity-100 blur-[2px]"
          style={{
            background:
              "radial-gradient(circle, rgba(255,215,0,0.95) 0%, rgba(217,165,68,0.5) 65%, transparent 100%)",
          }}
        />

        {/* High-Speed Rotating 24K Gilded Dashed Ring */}
        <div
          className="pointer-events-none absolute -inset-1.5 rounded-full border-2 border-amber-300 shadow-[0_0_26px_rgba(255,215,0,1)] animate-vortex-spin-fast"
          style={{ borderStyle: "dashed" }}
        />

        {/* Orbiting Diamond Jewels */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="absolute h-3 w-3 rotate-45 bg-amber-200 border border-amber-400 shadow-[0_0_14px_#ffd700] animate-orbit-2" />
          <div className="absolute h-3 w-3 rotate-45 bg-amber-200 border border-amber-400 shadow-[0_0_14px_#ffd700] animate-orbit-4" />
        </div>

        <div className="relative rounded-full border-2 border-amber-400 bg-bg p-0.5 shadow-[0_0_28px_rgba(255,215,0,0.95)] transition-transform duration-300 group-hover:scale-105">
          <Avatar dpUrl={dpUrl} name={name} size={size} mode={mode} />
        </div>
      </div>
    );
  }

  // --- 4. EPIC FRAME 1 (Cyberpunk Matrix Glitch - Matrix Flash & Scanner Radar) ---
  if (frame.id === "frame-cyber-glitch") {
    return (
      <div className="relative flex items-center justify-center p-3.5 group">
        <div
          className="pointer-events-none absolute -inset-2.5 rounded-full animate-cyber-flash opacity-100"
          style={{
            background:
              "radial-gradient(circle, rgba(168,85,247,0.85) 0%, rgba(0,245,255,0.6) 60%, transparent 85%)",
          }}
        />
        {/* High-Speed Cyan Scanner Radar */}
        <div className="pointer-events-none absolute -inset-1 rounded-full border-2 border-purple-400 shadow-[0_0_22px_rgba(168,85,247,1)] animate-vortex-spin-fast" />

        {/* Orbiting Cyber Data Bits */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="absolute h-2.5 w-2.5 bg-cyan-300 shadow-[0_0_12px_#00f5ff] animate-orbit-1" />
          <div className="absolute h-2.5 w-2.5 bg-purple-300 shadow-[0_0_12px_#a855f7] animate-orbit-3" />
        </div>

        <div className="relative rounded-full border-2 border-purple-500 bg-bg p-0.5 shadow-[0_0_22px_rgba(168,85,247,0.9)] transition-transform duration-300 group-hover:scale-105">
          <Avatar dpUrl={dpUrl} name={name} size={size} mode={mode} />
        </div>
      </div>
    );
  }

  // --- 5. EPIC FRAME 2 (Infernal Dragon Blazecore - Roaring Flames & Rising Embers) ---
  if (frame.id === "frame-inferno" || frame.rarity === "epic") {
    return (
      <div className="relative flex items-center justify-center p-3.5 group">
        <div
          className="pointer-events-none absolute -inset-2.5 rounded-full animate-inferno-flames opacity-100 blur-[2px]"
          style={{
            background:
              "radial-gradient(circle, rgba(255,84,112,1) 0%, rgba(255,107,74,0.7) 60%, transparent 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute -inset-1 rounded-full border-2 border-rose-400 shadow-[0_0_26px_rgba(255,84,112,1)] animate-vortex-spin-fast"
          style={{ borderStyle: "dashed" }}
        />
        <div className="pointer-events-none absolute -top-2.5 h-4 w-4 rounded-full bg-rose-400 shadow-[0_0_16px_#ff5470] animate-bounce" />
        <div className="pointer-events-none absolute -bottom-2.5 h-3.5 w-3.5 rounded-full bg-orange-400 shadow-[0_0_14px_#ff6b4a] animate-pulse" />

        <div className="relative rounded-full border-2 border-rose-500 bg-bg p-0.5 shadow-[0_0_24px_rgba(255,84,112,0.95)] transition-transform duration-300 group-hover:scale-105">
          <Avatar dpUrl={dpUrl} name={name} size={size} mode={mode} />
        </div>
      </div>
    );
  }

  // --- 6. RARE FRAME (Emerald Overdrive - Pitch Floodlight & Radar Sweep) ---
  if (frame.id === "frame-emerald-edge" || frame.rarity === "rare") {
    return (
      <div className="relative flex items-center justify-center p-3 group">
        <div
          className="pointer-events-none absolute -inset-2 rounded-full animate-stadium-floodlight opacity-100"
          style={{
            background: "radial-gradient(circle, rgba(63,191,127,0.85) 0%, rgba(0,255,135,0.45) 55%, transparent 75%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-emerald-400 shadow-[0_0_22px_rgba(63,191,127,1)] animate-vortex-spin-fast" />
        <div className="relative rounded-full border-2 border-bg bg-bg p-0.5 shadow-[0_0_18px_rgba(63,191,127,0.85)] transition-transform duration-300 group-hover:scale-105">
          <Avatar dpUrl={dpUrl} name={name} size={size} mode={mode} />
        </div>
      </div>
    );
  }

  // --- 7. COMMON FRAME (Cyber Aegis) ---
  return (
    <div className="relative flex items-center justify-center p-2.5 group">
      <div
        className="pointer-events-none absolute inset-0 rounded-full border-2 shadow-[0_0_18px_rgba(76,141,255,0.85)] animate-halo-expand"
        style={{ borderColor: frame.color }}
      />
      <div className="relative rounded-full border-2 border-bg bg-bg p-0.5 shadow-md transition-transform duration-300 group-hover:scale-105">
        <Avatar dpUrl={dpUrl} name={name} size={size} mode={mode} />
      </div>
    </div>
  );
}

// ============================================================================
// 5. COSMETIC THEME AMBIENT OVERLAYS (Full-Atmosphere Engine)
// ============================================================================
export function CosmeticThemeAmbient({
  theme,
}: {
  theme: CosmeticItem | null | undefined;
}) {
  if (!theme) {
    return (
      <>
        <div className="glow-gold pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 blur-3xl opacity-50" />
        <div className="glow-blue pointer-events-none absolute right-0 top-32 -z-10 h-[380px] w-[380px] blur-3xl opacity-40" />
      </>
    );
  }

  // 1. Cosmic Hyper-Nebula (Mythic)
  if (theme.id === "theme-celestial-nebula" || theme.rarity === "mythic") {
    return (
      <>
        <div className="bg-stars-pattern pointer-events-none fixed inset-0 -z-20 opacity-85 animate-cosmic-stars" />
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[750px] w-[750px] -translate-x-1/2 blur-[120px] animate-cosmic-drift opacity-95"
          style={{
            background:
              "radial-gradient(circle, rgba(139,127,224,0.65) 0%, rgba(255,0,128,0.45) 45%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-16 -z-10 h-[600px] w-[600px] blur-[110px] opacity-90"
          style={{
            background:
              "radial-gradient(circle, rgba(0,245,255,0.5) 0%, rgba(139,127,224,0.3) 50%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute left-0 top-64 -z-10 h-[550px] w-[550px] blur-[100px] opacity-80"
          style={{
            background:
              "radial-gradient(circle, rgba(255,84,112,0.45) 0%, transparent 65%)",
          }}
        />
      </>
    );
  }

  // 2. Cyberpunk 2077 Night City (Legendary)
  if (theme.id === "theme-cyberpunk-night") {
    return (
      <>
        <div className="bg-cyber-grid pointer-events-none fixed inset-0 -z-20 opacity-75" />
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[700px] w-[700px] -translate-x-1/2 blur-[110px] opacity-95"
          style={{
            background:
              "radial-gradient(circle, rgba(255,0,128,0.6) 0%, rgba(0,245,255,0.4) 50%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-24 -z-10 h-[500px] w-[500px] blur-[100px] opacity-85"
          style={{
            background:
              "radial-gradient(circle, rgba(0,245,255,0.55) 0%, transparent 70%)",
          }}
        />
      </>
    );
  }

  // 3. 24K Sovereign Solar Gold (Legendary)
  if (theme.id === "theme-allynq-gold" || theme.rarity === "legendary") {
    return (
      <>
        <div className="bg-honeycomb pointer-events-none fixed inset-0 -z-20 opacity-90" />
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[720px] w-[720px] -translate-x-1/2 blur-[110px] animate-gold-radiance opacity-95"
          style={{
            background:
              "radial-gradient(circle, rgba(255,215,0,0.55) 0%, rgba(217,165,68,0.4) 50%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-24 -z-10 h-[500px] w-[500px] blur-[100px] opacity-85"
          style={{
            background:
              "radial-gradient(circle, rgba(255,183,3,0.5) 0%, rgba(217,165,68,0.2) 60%, transparent 70%)",
          }}
        />
      </>
    );
  }

  // 4. Glacial Cryo-Frost (Epic)
  if (theme.id === "theme-frostbite") {
    return (
      <>
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[680px] w-[680px] -translate-x-1/2 blur-[110px] animate-pulse-glow opacity-90"
          style={{
            background:
              "radial-gradient(circle, rgba(0,245,255,0.6) 0%, rgba(255,255,255,0.25) 45%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-28 -z-10 h-[480px] w-[480px] blur-[90px] opacity-80"
          style={{
            background: "radial-gradient(circle, rgba(0,245,255,0.45) 0%, transparent 70%)",
          }}
        />
      </>
    );
  }

  // 5. Crimson Blood Moon (Epic)
  if (theme.id === "theme-crimson" || theme.rarity === "epic") {
    return (
      <>
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[700px] w-[700px] -translate-x-1/2 blur-[110px] animate-flame-flicker opacity-95"
          style={{
            background:
              "radial-gradient(circle, rgba(255,84,112,0.6) 0%, rgba(255,107,74,0.3) 50%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-28 -z-10 h-[480px] w-[480px] blur-[100px] opacity-85"
          style={{
            background:
              "radial-gradient(circle, rgba(255,84,112,0.45) 0%, transparent 65%)",
          }}
        />
      </>
    );
  }

  // Rare / Common themes
  return (
    <>
      <div
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[620px] w-[620px] -translate-x-1/2 blur-3xl opacity-90"
        style={{
          background: `radial-gradient(circle, ${theme.color}60 0%, ${theme.secondaryColor ?? theme.color}25 50%, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute right-0 top-28 -z-10 h-[440px] w-[440px] blur-3xl opacity-80"
        style={{
          background: `radial-gradient(circle, ${theme.secondaryColor ?? theme.color}50 0%, transparent 70%)`,
        }}
      />
    </>
  );
}

// ============================================================================
// 6. THEMED PROFILE HERO BANNER WRAPPER (Holographic Foil & Light Sweep)
// ============================================================================
export function ThemedProfileHeroBanner({
  theme,
  children,
}: {
  theme: CosmeticItem | null | undefined;
  children: ReactNode;
}) {
  const cardClass = !theme
    ? "border-surface-line shadow-2xl"
    : theme.rarity === "mythic"
    ? "theme-card-mythic"
    : theme.id === "theme-cyberpunk-night"
    ? "theme-card-cyber"
    : theme.rarity === "legendary"
    ? "theme-card-legendary"
    : theme.id === "theme-frostbite"
    ? "theme-card-epic-frost"
    : theme.rarity === "epic"
    ? "theme-card-epic-fire"
    : "theme-card-rare";

  return (
    <div className={`relative overflow-hidden rounded-3xl border transition-all duration-500 shadow-2xl ${cardClass}`}>
      {/* Holographic light sweep ray across banner */}
      <div className="pointer-events-none absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-holographic-sweep" />

      {/* Themed corner laser notches */}
      {theme ? (
        <>
          <div
            className="pointer-events-none absolute top-0 left-0 h-5 w-5 border-t-2 border-l-2"
            style={{ borderColor: theme.color }}
          />
          <div
            className="pointer-events-none absolute top-0 right-0 h-5 w-5 border-t-2 border-r-2"
            style={{ borderColor: theme.color }}
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2"
            style={{ borderColor: theme.color }}
          />
          <div
            className="pointer-events-none absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2"
            style={{ borderColor: theme.color }}
          />
        </>
      ) : null}

      {children}
    </div>
  );
}

// ============================================================================
// 7. THEMED CARD CONTAINER (Applies matching aura to Stat Tiles / Sections)
// ============================================================================
// ============================================================================
// 7. THEMED ART ENGINE & THEMED TOKENS
// ============================================================================
export interface ThemeTokens {
  id: string;
  name: string;
  rarity: "mythic" | "legendary" | "epic" | "rare" | "common";
  primary: string;
  secondary: string;
  accentText: string;
  headingText: string;
  bodyText: string;
  mutedText: string;
  cardClass: string;
  innerBg: string;
  innerBorder: string;
  innerHoverBorder: string;
  highlightBg: string;
  highlightBorder: string;
  highlightText: string;
  glowShadow: string;
}

export function getThemeTokens(theme: CosmeticItem | null | undefined): ThemeTokens {
  if (!theme) {
    return {
      id: "default",
      name: "Default Arena",
      rarity: "common",
      primary: "var(--accent)",
      secondary: "var(--blue)",
      accentText: "var(--accent-ink)",
      headingText: "var(--ink)",
      bodyText: "var(--ink)",
      mutedText: "var(--ink-soft)",
      cardClass: "border-surface-line bg-surface/70 text-ink",
      innerBg: "rgba(255, 255, 255, 0.04)",
      innerBorder: "var(--surface-line)",
      innerHoverBorder: "var(--surface-line-strong)",
      highlightBg: "var(--accent-soft)",
      highlightBorder: "var(--accent)",
      highlightText: "var(--accent-ink)",
      glowShadow: "none",
    };
  }

  switch (theme.id) {
    case "theme-celestial-nebula":
      return {
        id: theme.id,
        name: theme.name,
        rarity: "mythic",
        primary: "#8b7fe0",
        secondary: "#00f5ff",
        accentText: "#00f5ff",
        headingText: "#ffffff",
        bodyText: "#f1f5f9",
        mutedText: "#c4b5fd",
        cardClass: "theme-card-mythic",
        innerBg: "rgba(139, 127, 224, 0.12)",
        innerBorder: "rgba(139, 127, 224, 0.35)",
        innerHoverBorder: "rgba(0, 245, 255, 0.6)",
        highlightBg: "rgba(0, 245, 255, 0.2)",
        highlightBorder: "rgba(0, 245, 255, 0.6)",
        highlightText: "#00f5ff",
        glowShadow: "0 0 25px rgba(139, 127, 224, 0.35)",
      };

    case "theme-allynq-gold":
      return {
        id: theme.id,
        name: theme.name,
        rarity: "legendary",
        primary: "#d9a544",
        secondary: "#ffd700",
        accentText: "#ffd700",
        headingText: "#ffffff",
        bodyText: "#fef9c3",
        mutedText: "#fde047",
        cardClass: "theme-card-legendary",
        innerBg: "rgba(217, 165, 68, 0.12)",
        innerBorder: "rgba(217, 165, 68, 0.35)",
        innerHoverBorder: "rgba(255, 215, 0, 0.6)",
        highlightBg: "rgba(255, 215, 0, 0.2)",
        highlightBorder: "rgba(255, 215, 0, 0.6)",
        highlightText: "#ffd700",
        glowShadow: "0 0 25px rgba(217, 165, 68, 0.35)",
      };

    case "theme-cyberpunk-night":
      return {
        id: theme.id,
        name: theme.name,
        rarity: "legendary",
        primary: "#ff007f",
        secondary: "#00f5ff",
        accentText: "#00f5ff",
        headingText: "#ffffff",
        bodyText: "#f8fafc",
        mutedText: "#f472b6",
        cardClass: "theme-card-cyber",
        innerBg: "rgba(255, 0, 127, 0.12)",
        innerBorder: "rgba(255, 0, 127, 0.35)",
        innerHoverBorder: "rgba(0, 245, 255, 0.6)",
        highlightBg: "rgba(0, 245, 255, 0.2)",
        highlightBorder: "rgba(0, 245, 255, 0.6)",
        highlightText: "#00f5ff",
        glowShadow: "0 0 25px rgba(255, 0, 127, 0.35)",
      };

    case "theme-crimson":
      return {
        id: theme.id,
        name: theme.name,
        rarity: "epic",
        primary: "#ff5470",
        secondary: "#ff6b4a",
        accentText: "#ff6b4a",
        headingText: "#ffffff",
        bodyText: "#ffe4e6",
        mutedText: "#fda4af",
        cardClass: "theme-card-epic-fire",
        innerBg: "rgba(255, 84, 112, 0.12)",
        innerBorder: "rgba(255, 84, 112, 0.35)",
        innerHoverBorder: "rgba(255, 107, 74, 0.6)",
        highlightBg: "rgba(255, 84, 112, 0.2)",
        highlightBorder: "rgba(255, 84, 112, 0.6)",
        highlightText: "#ff5470",
        glowShadow: "0 0 25px rgba(255, 84, 112, 0.35)",
      };

    case "theme-frostbite":
      return {
        id: theme.id,
        name: theme.name,
        rarity: "epic",
        primary: "#00f5ff",
        secondary: "#ffffff",
        accentText: "#00f5ff",
        headingText: "#ffffff",
        bodyText: "#ecfeff",
        mutedText: "#a5f3fc",
        cardClass: "theme-card-epic-frost",
        innerBg: "rgba(0, 245, 255, 0.1)",
        innerBorder: "rgba(0, 245, 255, 0.32)",
        innerHoverBorder: "rgba(255, 255, 255, 0.6)",
        highlightBg: "rgba(0, 245, 255, 0.2)",
        highlightBorder: "rgba(0, 245, 255, 0.6)",
        highlightText: "#00f5ff",
        glowShadow: "0 0 25px rgba(0, 245, 255, 0.35)",
      };

    case "theme-emerald":
      return {
        id: theme.id,
        name: theme.name,
        rarity: "rare",
        primary: "#3fbf7f",
        secondary: "#00ff87",
        accentText: "#00ff87",
        headingText: "#ffffff",
        bodyText: "#f0fdf4",
        mutedText: "#86efac",
        cardClass: "theme-card-rare-emerald",
        innerBg: "rgba(63, 191, 127, 0.12)",
        innerBorder: "rgba(63, 191, 127, 0.35)",
        innerHoverBorder: "rgba(0, 255, 135, 0.6)",
        highlightBg: "rgba(0, 255, 135, 0.2)",
        highlightBorder: "rgba(0, 255, 135, 0.6)",
        highlightText: "#00ff87",
        glowShadow: "0 0 25px rgba(63, 191, 127, 0.35)",
      };

    case "theme-ocean-blue":
    default:
      return {
        id: theme.id,
        name: theme.name,
        rarity: "rare",
        primary: "#4c8dff",
        secondary: "#00f5ff",
        accentText: "#00f5ff",
        headingText: "#ffffff",
        bodyText: "#f0f9ff",
        mutedText: "#7dd3fc",
        cardClass: "theme-card-rare-ocean",
        innerBg: "rgba(76, 141, 255, 0.12)",
        innerBorder: "rgba(76, 141, 255, 0.35)",
        innerHoverBorder: "rgba(0, 245, 255, 0.6)",
        highlightBg: "rgba(76, 141, 255, 0.2)",
        highlightBorder: "rgba(76, 141, 255, 0.6)",
        highlightText: "#4c8dff",
        glowShadow: "0 0 25px rgba(76, 141, 255, 0.35)",
      };
  }
}

export function getThemeCardClass(theme: CosmeticItem | null | undefined): string {
  return getThemeTokens(theme).cardClass;
}

export function ThemeSectionArt({ theme }: { theme?: CosmeticItem | null }) {
  if (!theme) return null;

  switch (theme.id) {
    case "theme-celestial-nebula":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-indigo-600/30 blur-3xl animate-cosmic-drift" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl animate-cosmic-drift" />
          <svg className="absolute inset-0 h-full w-full opacity-40" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="nebula-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="#8b7fe0" opacity="0.6" />
                <path d="M 0 20 L 40 20 M 20 0 L 20 40" stroke="#8b7fe0" strokeWidth="0.5" opacity="0.15" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#nebula-grid)" />
          </svg>
        </div>
      );

    case "theme-allynq-gold":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-amber-400/15 blur-3xl animate-gold-corona" />
          <svg className="absolute inset-0 h-full w-full opacity-30" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="gold-honeycomb" width="28" height="48" patternUnits="userSpaceOnUse">
                <path d="M 14 0 L 28 8 L 28 24 L 14 32 L 0 24 L 0 8 Z" fill="none" stroke="#d9a544" strokeWidth="0.7" opacity="0.25" />
                <path d="M 14 24 L 28 32 L 28 48 L 14 56 L 0 48 L 0 32 Z" fill="none" stroke="#d9a544" strokeWidth="0.7" opacity="0.25" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gold-honeycomb)" />
          </svg>
        </div>
      );

    case "theme-cyberpunk-night":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-35">
          <div className="absolute -top-10 right-0 h-48 w-48 rounded-full bg-pink-500/25 blur-3xl animate-cyber-glitch" />
          <div className="absolute -bottom-10 left-0 h-48 w-48 rounded-full bg-cyan-500/25 blur-3xl animate-cyber-glitch" />
          <svg className="absolute inset-0 h-full w-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cyber-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#ff007f" strokeWidth="0.5" opacity="0.3" />
                <circle cx="0" cy="0" r="1.5" fill="#00f5ff" opacity="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cyber-grid)" />
          </svg>
        </div>
      );

    case "theme-crimson":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-rose-600/30 blur-3xl animate-ember-rise" />
          <svg className="absolute inset-0 h-full w-full opacity-30" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="crimson-flame" width="36" height="36" patternUnits="userSpaceOnUse">
                <path d="M 18 0 L 36 36 L 0 36 Z" fill="none" stroke="#ff5470" strokeWidth="0.5" opacity="0.2" />
                <circle cx="18" cy="18" r="1" fill="#ff6b4a" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#crimson-flame)" />
          </svg>
        </div>
      );

    case "theme-frostbite":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-cyan-400/25 blur-3xl" />
          <svg className="absolute inset-0 h-full w-full opacity-30" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="ice-crystal" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 16 0 L 32 16 L 16 32 L 0 16 Z" fill="none" stroke="#00f5ff" strokeWidth="0.6" opacity="0.25" />
                <circle cx="16" cy="16" r="1" fill="#ffffff" opacity="0.7" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ice-crystal)" />
          </svg>
        </div>
      );

    case "theme-emerald":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-64 w-80 rounded-full bg-emerald-500/20 blur-3xl animate-stadium-floodlight" />
          <svg className="absolute inset-0 h-full w-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="pitch-lines" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 0 20 L 40 20 M 20 0 L 20 40" stroke="#3fbf7f" strokeWidth="0.6" opacity="0.25" />
                <circle cx="20" cy="20" r="6" fill="none" stroke="#00ff87" strokeWidth="0.5" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pitch-lines)" />
          </svg>
        </div>
      );

    case "theme-ocean-blue":
    default:
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -bottom-10 right-0 h-64 w-64 rounded-full bg-blue-600/25 blur-3xl animate-radar-sweep" />
          <svg className="absolute inset-0 h-full w-full opacity-30" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="ocean-sonar" width="36" height="36" patternUnits="userSpaceOnUse">
                <circle cx="18" cy="18" r="12" fill="none" stroke="#4c8dff" strokeWidth="0.5" opacity="0.25" />
                <circle cx="18" cy="18" r="3" fill="#00f5ff" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ocean-sonar)" />
          </svg>
        </div>
      );
  }
}

export function ThemedCard({
  theme,
  children,
  className = "",
}: {
  theme: CosmeticItem | null | undefined;
  children: ReactNode;
  className?: string;
}) {
  const cardClass = getThemeCardClass(theme);

  return (
    <div className={`group relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300 ${cardClass} ${className}`}>
      <ThemeSectionArt theme={theme} />
      {theme ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-80 animate-holographic-sweep"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${theme.color} 50%, transparent 100%)`,
          }}
        />
      ) : null}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ============================================================================
// 8. FOOTBALL PLAYER AVATAR (eFootball Pro Card Crest, Stars & Position)
// ============================================================================
export function FootballPlayerAvatar({
  frame,
  dpUrl,
  name,
  position = "CF",
  rating = 92,
  theme,
}: {
  frame: CosmeticItem | null | undefined;
  dpUrl: string | null;
  name: string;
  position?: string;
  rating?: number;
  theme?: CosmeticItem | null;
}) {
  const accentColor = theme?.color ?? "#ffd700";

  return (
    <div className="relative group">
      {/* 5-Star Gold Crest on Top of Avatar with Staggered Twinkles */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-0.5 rounded-full border border-amber-300/90 bg-bg/95 px-2.5 py-0.5 text-[9px] font-black text-amber-300 shadow-[0_0_16px_rgba(255,215,0,0.85)] backdrop-blur animate-gold-radiance">
        <span className="animate-jewel-sparkle">★</span>
        <span className="animate-jewel-sparkle" style={{ animationDelay: "0.2s" }}>★</span>
        <span className="text-[10px] text-amber-100 animate-jewel-sparkle" style={{ animationDelay: "0.4s" }}>★</span>
        <span className="animate-jewel-sparkle" style={{ animationDelay: "0.6s" }}>★</span>
        <span className="animate-jewel-sparkle" style={{ animationDelay: "0.8s" }}>★</span>
      </div>

      {/* Main Avatar with Animated Frame */}
      <CosmeticAvatarFrame
        frame={frame}
        dpUrl={dpUrl}
        name={name}
        size="xl"
        mode="lightbox"
      />

      {/* Football Tactical Position & OVR Rating Tag at Bottom */}
      <div
        className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 shadow-2xl backdrop-blur transition-transform group-hover:scale-110"
        style={{
          borderColor: `${accentColor}80`,
          backgroundColor: "rgba(10, 8, 20, 0.95)",
          boxShadow: `0 0 14px ${accentColor}50`,
        }}
      >
        <span
          className="font-mono text-[9px] font-black uppercase px-1.5 py-0.2 rounded shadow-sm"
          style={{
            backgroundColor: accentColor,
            color: "#000000",
          }}
        >
          {position}
        </span>
        <span className="font-mono text-[10px] font-black text-white">
          {rating}
        </span>
        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
      </div>

      {/* Spinning Golden Soccer Ball Particle at Bottom Right */}
      <div
        className="pointer-events-none absolute -bottom-1 -right-1 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-amber-300 bg-bg/90 shadow-[0_0_10px_#ffd700] backdrop-blur animate-football-spin"
      >
        <span className="text-[11px]">⚽</span>
      </div>
    </div>
  );
}

// ============================================================================
// 9. BANNER PLAYER STAGE HUD (eFootball Telemetry in Banner Space)
// ============================================================================
export function BannerPlayerStageHUD({
  theme,
  rank,
  points,
  winRate,
  totalWins,
}: {
  theme?: CosmeticItem | null;
  rank: number;
  points: number;
  winRate: number;
  totalWins: number;
}) {
  const accentColor = theme?.color ?? "#d9a544";

  return (
    <div className="pointer-events-none absolute top-12 left-6 sm:top-14 sm:left-6 z-10 max-w-[85%] sm:max-w-[70%]">
      <div className="flex flex-wrap items-center gap-2">
        {/* Division & Rating Badge */}
        <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-bg/85 px-3 py-1 text-[11px] font-mono font-bold text-ink backdrop-blur-md shadow-lg">
          <span className="text-amber-400">🏆</span>
          <span>DIV {rank <= 3 ? "1 PRO" : rank <= 10 ? "2 ELITE" : "3"}</span>
          <span className="text-ink-faint">|</span>
          <span className="text-accent-ink font-mono">{points.toLocaleString()} PTS</span>
        </div>

        {/* Live Form / Win Rate Indicator */}
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/80 px-3 py-1 text-[11px] font-mono font-bold text-emerald-300 backdrop-blur-md shadow-lg">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span>FORM: EXCELLENT</span>
          <span className="text-emerald-500">|</span>
          <span>{winRate}% WIN RATE</span>
        </div>

        {/* Career Recorded Wins */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/15 bg-bg/75 px-3 py-1 text-[10px] font-mono font-bold text-ink-soft backdrop-blur-md shadow-md">
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
          <span>{totalWins} WINS</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 10. THEMED STAT CARD (Pro eFootball Ultimate Stat Card)
// ============================================================================
export function ThemedStatCard({
  label,
  value,
  icon: Icon,
  theme,
}: {
  label: string;
  value: string;
  icon: IconComponent;
  tone?: "blue" | "success" | "accent" | "danger" | "warning";
  theme?: CosmeticItem | null;
}) {
  const tokens = getThemeTokens(theme);

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${tokens.cardClass}`}
      style={{
        boxShadow: theme ? tokens.glowShadow : undefined,
      }}
    >
      {/* Animated Theme Vector Background */}
      <ThemeSectionArt theme={theme} />

      {/* Top Holographic Laser Line */}
      {theme ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-90 animate-holographic-sweep"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${tokens.secondary} 50%, transparent 100%)`,
          }}
        />
      ) : null}

      {/* Cyber Corner Notches */}
      {theme ? (
        <>
          <div className="pointer-events-none absolute top-0 left-0 h-3.5 w-3.5 border-t-2 border-l-2" style={{ borderColor: tokens.secondary }} />
          <div className="pointer-events-none absolute top-0 right-0 h-3.5 w-3.5 border-t-2 border-r-2" style={{ borderColor: tokens.secondary }} />
          <div className="pointer-events-none absolute bottom-0 left-0 h-3.5 w-3.5 border-b-2 border-l-2" style={{ borderColor: tokens.secondary }} />
          <div className="pointer-events-none absolute bottom-0 right-0 h-3.5 w-3.5 border-b-2 border-r-2" style={{ borderColor: tokens.secondary }} />
        </>
      ) : null}

      {/* Header: Label and Tone Icon */}
      <div className="relative z-10 flex items-center justify-between">
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-wider"
          style={{ color: tokens.mutedText }}
        >
          {label}
        </span>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl border shadow-md transition-transform group-hover:scale-110"
          style={{
            borderColor: tokens.innerBorder,
            backgroundColor: tokens.innerBg,
            color: tokens.accentText,
            boxShadow: theme ? `0 0 12px ${tokens.primary}40` : undefined,
          }}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>

      {/* Value Counter & Football Rating Badge */}
      <div className="relative z-10 mt-4 flex items-baseline justify-between">
        <span
          className="font-display text-3xl font-black tracking-tight drop-shadow-md transition-colors"
          style={{
            color: tokens.headingText,
            filter: theme ? `drop-shadow(0 0 8px ${tokens.primary}40)` : undefined,
          }}
        >
          {value}
        </span>
        <div
          className="flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-black uppercase shadow-md backdrop-blur"
          style={{
            borderColor: tokens.highlightBorder,
            backgroundColor: tokens.highlightBg,
            color: tokens.highlightText,
          }}
        >
          <span className="text-[10px]">▲</span>
          <span>PRO ELITE</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 11. PLAYER COSMETICS SHOWCASE (Trophy Locker & Loadout Display)
// ============================================================================
export function PlayerCosmeticsShowcase({
  theme,
  frame,
  title,
  badge,
  ownedBadges = [],
}: {
  theme?: CosmeticItem | null;
  frame?: CosmeticItem | null;
  title?: CosmeticItem | null;
  badge?: CosmeticItem | null;
  ownedBadges?: CosmeticItem[];
}) {
  const tokens = getThemeTokens(theme);

  return (
    <div
      className={`group relative mt-8 overflow-hidden rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl ${tokens.cardClass}`}
      style={{
        boxShadow: theme ? tokens.glowShadow : undefined,
      }}
    >
      <ThemeSectionArt theme={theme} />

      {/* Top Holographic Light Sweep Line */}
      {theme ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-80 animate-holographic-sweep"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${tokens.secondary} 50%, transparent 100%)`,
          }}
        />
      ) : null}

      {/* Cyber Corner Notches */}
      {theme ? (
        <>
          <div className="pointer-events-none absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2" style={{ borderColor: tokens.secondary }} />
          <div className="pointer-events-none absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2" style={{ borderColor: tokens.secondary }} />
          <div className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2" style={{ borderColor: tokens.secondary }} />
          <div className="pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2" style={{ borderColor: tokens.secondary }} />
        </>
      ) : null}

      <div
        className="relative z-10 flex items-center justify-between border-b pb-3"
        style={{ borderColor: tokens.innerBorder }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg border shadow-sm"
            style={{
              borderColor: tokens.innerBorder,
              backgroundColor: tokens.innerBg,
              color: tokens.accentText,
            }}
          >
            <TrophyIcon className="h-4.5 w-4.5 animate-pulse" />
          </div>
          <h2
            className="font-display text-sm font-bold uppercase tracking-wider"
            style={{ color: tokens.headingText }}
          >
            Player Cosmetic Locker & Identity Loadout
          </h2>
        </div>
        <span
          className="font-mono text-[10px] uppercase font-bold px-3 py-0.5 rounded-full border shadow-sm backdrop-blur"
          style={{
            borderColor: tokens.highlightBorder,
            backgroundColor: tokens.highlightBg,
            color: tokens.highlightText,
          }}
        >
          ✦ Active Loadout
        </span>
      </div>

      <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Equipped Theme Tile */}
        <div
          className="flex items-center gap-3 rounded-xl border p-3.5 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          style={{
            borderColor: tokens.innerBorder,
            backgroundColor: tokens.innerBg,
          }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-md animate-pulse"
            style={{
              borderColor: theme?.color ?? tokens.innerBorder,
              backgroundColor: `${theme?.color ?? tokens.primary}25`,
              color: theme?.color ?? tokens.accentText,
            }}
          >
            <ShieldIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span
              className="block font-mono text-[9px] uppercase tracking-wider font-bold"
              style={{ color: tokens.mutedText }}
            >
              Active Stage Theme
            </span>
            <span
              className="block text-xs font-black truncate"
              style={{ color: theme?.color ?? tokens.headingText }}
            >
              {theme?.name ?? "Default Arena"}
            </span>
          </div>
        </div>

        {/* Equipped Avatar Frame Tile with Mini Live Preview */}
        <div
          className="flex items-center gap-3 rounded-xl border p-3.5 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          style={{
            borderColor: tokens.innerBorder,
            backgroundColor: tokens.innerBg,
          }}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center">
            {frame ? (
              <CosmeticAvatarFrame
                frame={frame}
                dpUrl={null}
                name="⚽"
                size="sm"
                mode="static"
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full border shadow-sm"
                style={{
                  borderColor: tokens.innerBorder,
                  backgroundColor: tokens.innerBg,
                  color: tokens.accentText,
                }}
              >
                <CrosshairIcon className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span
              className="block font-mono text-[9px] uppercase tracking-wider font-bold"
              style={{ color: tokens.mutedText }}
            >
              Avatar Halo Frame
            </span>
            <span
              className="block text-xs font-black truncate"
              style={{ color: frame?.color ?? tokens.headingText }}
            >
              {frame?.name ?? "Standard Ring"}
            </span>
          </div>
        </div>

        {/* Equipped Kinetic Title Tile with Live Title Component */}
        <div
          className="flex items-center gap-3 rounded-xl border p-3.5 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          style={{
            borderColor: tokens.innerBorder,
            backgroundColor: tokens.innerBg,
          }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-md animate-inferno-flames"
            style={{
              borderColor: title?.color ?? tokens.innerBorder,
              backgroundColor: `${title?.color ?? tokens.primary}25`,
              color: title?.color ?? tokens.accentText,
            }}
          >
            <FlameIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span
              className="block font-mono text-[9px] uppercase tracking-wider font-bold"
              style={{ color: tokens.mutedText }}
            >
              Kinetic Title
            </span>
            <div className="mt-0.5 truncate">
              {title ? (
                <CosmeticTitleText item={title} size="sm" />
              ) : (
                <span className="text-xs font-bold text-ink-faint">No Title</span>
              )}
            </div>
          </div>
        </div>

        {/* Equipped Badge Pill Tile with Live Badge Component */}
        <div
          className="flex items-center gap-3 rounded-xl border p-3.5 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          style={{
            borderColor: tokens.innerBorder,
            backgroundColor: tokens.innerBg,
          }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-md animate-gold-radiance"
            style={{
              borderColor: badge?.color ?? tokens.innerBorder,
              backgroundColor: `${badge?.color ?? tokens.primary}25`,
              color: badge?.color ?? tokens.accentText,
            }}
          >
            <TrophyIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span
              className="block font-mono text-[9px] uppercase tracking-wider font-bold"
              style={{ color: tokens.mutedText }}
            >
              Prestigious Badge
            </span>
            <div className="mt-0.5 truncate">
              {badge ? (
                <CosmeticBadgePill item={badge} isEquipped={true} />
              ) : (
                <span className="text-xs font-bold text-ink-faint">Rookie Mark</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Owned Badge Showcase Row */}
      {ownedBadges.length > 0 ? (
        <div
          className="relative z-10 mt-5 border-t pt-4"
          style={{ borderColor: tokens.innerBorder }}
        >
          <span
            className="block font-mono text-[10px] uppercase font-bold"
            style={{ color: tokens.mutedText }}
          >
            Unlocked Trophy Vault:
          </span>
          <div className="mt-2.5 flex flex-wrap gap-2.5">
            {ownedBadges.map((b) => (
              <CosmeticBadgePill
                key={b.id}
                item={b}
                isEquipped={badge?.id === b.id}
                equippedLabel="Active"
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}



