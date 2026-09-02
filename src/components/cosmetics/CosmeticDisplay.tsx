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

  // Interactive View Mode Switch: Responsive Toggle between Theme Stage and Cover Photo
  const viewToggle = (
    <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-6 z-20 flex items-center rounded-full border border-white/20 bg-bg/90 p-0.5 sm:p-1 shadow-2xl backdrop-blur-md">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setViewMode("theme");
        }}
        className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-mono font-bold transition-all ${
          viewMode === "theme"
            ? "bg-accent text-bg shadow-md"
            : "text-ink-soft hover:text-ink"
        }`}
      >
        <span>✨</span>
        <span className="hidden sm:inline">Theme Stage</span>
        <span className="sm:hidden">Stage</span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setViewMode("photo");
        }}
        className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-mono font-bold transition-all ${
          viewMode === "photo"
            ? "bg-accent text-bg shadow-md"
            : "text-ink-soft hover:text-ink"
        }`}
      >
        <span>📷</span>
        <span className="hidden sm:inline">Cover Photo</span>
        <span className="sm:hidden">Cover</span>
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

  // ==========================================================================
  // --- 1. REAL MADRID CF (Los Blancos · 15x European Champions) ---
  // ==========================================================================
  if (theme.id === "theme-real-madrid") {
    return (
      <div
        className={`relative w-full overflow-hidden select-none ${className}`}
        style={{ background: "linear-gradient(135deg, #070914 0%, #0d1326 45%, #05070e 100%)" }}
      >
        {/* Santiago Bernabéu Stadium Backdrop Image (/real.jpg) */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/real.jpg"
            alt="Estadio Santiago Bernabéu"
            className="h-full w-full object-cover opacity-50 mix-blend-luminosity scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070914] via-[#070914]/75 to-[#070914]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070914] via-transparent to-[#070914]/90" />
        </div>

        {/* Subtle Top Floodlights (No center blowout) */}
        <div
          className="pointer-events-none absolute -top-16 left-1/4 h-64 w-80 rounded-full blur-[70px] opacity-35"
          style={{ background: "radial-gradient(circle, rgba(254,190,16,0.6) 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -top-16 right-1/4 h-64 w-80 rounded-full blur-[70px] opacity-30"
          style={{ background: "radial-gradient(circle, rgba(121,59,156,0.6) 0%, transparent 70%)" }}
        />

        {/* Santiago Bernabéu Facade Ribs & 15 UCL Stars */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-55 z-10" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0,220 Q 250,140 500,220 Q 750,140 1000,220" fill="none" stroke="#febe10" strokeWidth="1" strokeDasharray="8 6" opacity="0.35" />
          <path d="M 0,260 Q 250,180 500,260 Q 750,180 1000,260" fill="none" stroke="#ffffff" strokeWidth="0.75" opacity="0.25" />

          {/* 15 UCL Stars Constellation */}
          <g fill="#febe10" opacity="0.85">
            <text x="32%" y="30%" fontSize="12">★</text>
            <text x="35%" y="22%" fontSize="14">★</text>
            <text x="39%" y="18%" fontSize="16">★</text>
            <text x="43%" y="16%" fontSize="18">★ 15x UCL</text>
            <text x="54%" y="18%" fontSize="16">★</text>
            <text x="58%" y="22%" fontSize="14">★</text>
            <text x="61%" y="30%" fontSize="12">★</text>
          </g>
        </svg>

        {/* Official Real Madrid Crest Showcase Badge on Lower Right */}
        <div className="pointer-events-none absolute bottom-4 right-4 sm:bottom-5 sm:right-8 z-20 flex flex-col items-center gap-1.5 opacity-95">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl p-2 bg-gradient-to-b from-white/15 to-black/70 backdrop-blur-md border border-amber-400/40 shadow-[0_0_24px_rgba(254,190,16,0.35)]">
            <img
              src="/real madrid/real-madrid-logo-preview.png"
              alt="Real Madrid CF Crest"
              className="h-full w-full object-contain filter drop-shadow-[0_0_8px_rgba(254,190,16,0.7)]"
            />
          </div>
          <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-amber-300 drop-shadow">
            15★ REYES DE EUROPA
          </span>
        </div>

        {/* Subtle Watermark in Bottom-Center */}
        <div className="pointer-events-none absolute bottom-3 left-32 sm:left-44 z-10 hidden min-[540px]:flex items-center gap-1.5 opacity-35">
          <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-200">
            👑 ¡HALA MADRID Y NADA MÁS!
          </span>
        </div>

        {/* Floating Golden Crystals */}
        <div className="pointer-events-none absolute top-16 left-[30%] h-3 w-3 rotate-45 border border-amber-300 bg-amber-100 shadow-[0_0_10px_#ffd700] animate-pulse z-10" />
        <div className="pointer-events-none absolute bottom-14 left-[42%] h-2.5 w-2.5 rotate-45 border border-amber-300 bg-white shadow-[0_0_8px_#ffffff] animate-pulse z-10" />

        {/* Interactive View Toggle */}
        {viewToggle}

        {/* Bottom Horizon Glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/60 to-transparent z-10" />
      </div>
    );
  }

  // ==========================================================================
  // --- 2. FC BARCELONA (Blaugrana · Més que un club) ---
  // ==========================================================================
  if (theme.id === "theme-fc-barcelona") {
    return (
      <div
        className={`relative w-full overflow-hidden select-none ${className}`}
        style={{ background: "linear-gradient(135deg, #010614 0%, #12031a 50%, #030a1c 100%)" }}
      >
        {/* Camp Nou Backdrop Image (/barca.jpg) */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/barca.jpg"
            alt="Spotify Camp Nou"
            className="h-full w-full object-cover opacity-45 mix-blend-luminosity scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#010614] via-[#010614]/75 to-[#010614]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#010614] via-transparent to-[#010614]/90" />
        </div>

        {/* Blaugrana Deep Blue & Garnet Spotlight Waves */}
        <div
          className="pointer-events-none absolute -top-10 left-1/4 h-64 w-80 rounded-full blur-[75px] opacity-45"
          style={{ background: "radial-gradient(circle, rgba(0,77,152,0.7) 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -top-10 right-1/4 h-64 w-80 rounded-full blur-[75px] opacity-45"
          style={{ background: "radial-gradient(circle, rgba(165,0,68,0.7) 0%, transparent 70%)" }}
        />

        {/* Spotify Camp Nou & FC Barcelona Official Vector Crest */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-55 z-10" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0,280 Q 500,100 1000,280" fill="none" stroke="#edbb00" strokeWidth="1.5" opacity="0.4" />
          <path d="M 0,300 Q 500,120 1000,300" fill="none" stroke="#004d98" strokeWidth="1" strokeDasharray="10 6" opacity="0.3" />
        </svg>

        {/* Official FC Barcelona Crest Showcase Badge on Lower Right */}
        <div className="pointer-events-none absolute bottom-4 right-4 sm:bottom-5 sm:right-8 z-20 flex flex-col items-center gap-1.5 opacity-95">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl overflow-hidden p-1.5 bg-gradient-to-b from-white/15 to-black/80 backdrop-blur-md border border-amber-400/40 shadow-[0_0_24px_rgba(165,0,68,0.35)]">
            <img
              src="/barca/barca-logo-transparent.png"
              alt="FC Barcelona Crest"
              className="h-full w-full object-contain filter drop-shadow-[0_0_8px_rgba(237,187,0,0.7)]"
            />
          </div>
          <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-amber-300 drop-shadow">
            MÉS QUE UN CLUB
          </span>
        </div>

        {/* Subtle Watermark in Bottom-Center */}
        <div className="pointer-events-none absolute bottom-3 left-32 sm:left-44 z-10 hidden min-[540px]:flex items-center gap-1.5 opacity-35">
          <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-rose-300">
            🔴🔵 SPOTIFY CAMP NOU
          </span>
        </div>

        {/* Floating Senyera Sparkles */}
        <div className="pointer-events-none absolute top-16 left-[25%] h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_10px_#edbb00] animate-pulse z-10" />

        {/* Interactive View Toggle */}
        {viewToggle}

        {/* Bottom Horizon Glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/60 to-transparent z-10" />
      </div>
    );
  }

  // ==========================================================================
  // --- 3. BANGLADESH NATIONAL TEAM (Bengal Tigers · লাল-সবুজ) ---
  // ==========================================================================
  if (theme.id === "theme-bangladesh-tigers") {
    return (
      <div
        className={`relative w-full overflow-hidden select-none ${className}`}
        style={{ background: "linear-gradient(135deg, #01140e 0%, #032b1d 45%, #020f0a 100%)" }}
      >
        {/* Lush Bengal Pitch Green & Solar Red Disc Ambient */}
        <div
          className="pointer-events-none absolute -top-10 left-1/3 h-64 w-80 rounded-full blur-[75px] opacity-45"
          style={{ background: "radial-gradient(circle, rgba(244,42,65,0.6) 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -top-10 right-1/3 h-64 w-80 rounded-full blur-[75px] opacity-40"
          style={{ background: "radial-gradient(circle, rgba(0,106,78,0.7) 0%, transparent 70%)" }}
        />

        {/* Official Bangladesh Solar Red Disc Vector & Claw Stripes */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-55 z-10" xmlns="http://www.w3.org/2000/svg">
          <circle cx="38%" cy="45%" r="100" fill="#f42a41" opacity="0.35" />
          <circle cx="38%" cy="45%" r="120" fill="none" stroke="#f9a825" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.4" />
          <path d="M 0,240 Q 300,160 600,240 Q 800,180 1000,240" fill="none" stroke="#00ff87" strokeWidth="1" opacity="0.35" />
        </svg>

        {/* Official Bengal Tigers Crest Showcase Badge on Lower Right */}
        <div className="pointer-events-none absolute bottom-4 right-4 sm:bottom-5 sm:right-8 z-20 flex flex-col items-center gap-1.5 opacity-95">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl overflow-hidden p-1.5 bg-gradient-to-b from-white/15 to-black/80 backdrop-blur-md border border-emerald-400/40 shadow-[0_0_24px_rgba(0,106,78,0.4)]">
            <img
              src="/Bangladesh/bangladesh-football-federation-seeklogo.png"
              alt="Bangladesh Football Federation Crest"
              className="h-full w-full object-contain filter drop-shadow-[0_0_8px_rgba(244,42,65,0.7)]"
            />
          </div>
          <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-emerald-300 drop-shadow">
            BENGAL TIGERS · লাল-সবুজ
          </span>
        </div>

        {/* Subtle Watermark in Bottom-Center */}
        <div className="pointer-events-none absolute bottom-3 left-32 sm:left-44 z-10 hidden min-[540px]:flex items-center gap-1.5 opacity-35">
          <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-emerald-200">
            🐯 BANGABANDHU STADIUM
          </span>
        </div>

        {/* Floating Bengal Fire Embers */}
        <div className="pointer-events-none absolute top-16 left-[30%] h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_10px_#00ff87] animate-bounce z-10" />

        {/* Interactive View Toggle */}
        {viewToggle}

        {/* Bottom Horizon Glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/60 to-transparent z-10" />
      </div>
    );
  }

  // ==========================================================================
  // --- 4. ARSENAL FC (The Gunners · Victoria Concordia Crescit) ---
  // ==========================================================================
  if (theme.id === "theme-arsenal-fc") {
    return (
      <div
        className={`relative w-full overflow-hidden select-none ${className}`}
        style={{ background: "linear-gradient(135deg, #100204 0%, #280408 45%, #080103 100%)" }}
      >
        {/* Emirates Stadium / Arsenal Wallpaper Backdrop */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/arsenal/Arsenal HD Wallpaper For Desktop iPhone iPad And Android.jpg"
            alt="Emirates Stadium"
            className="h-full w-full object-cover opacity-45 mix-blend-luminosity scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#100204] via-[#100204]/75 to-[#100204]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#100204] via-transparent to-[#100204]/90" />
        </div>

        {/* Highbury / Emirates Crimson & Navy Floodlights */}
        <div
          className="pointer-events-none absolute -top-10 left-1/4 h-64 w-80 rounded-full blur-[75px] opacity-50"
          style={{ background: "radial-gradient(circle, rgba(219,0,7,0.75) 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -top-10 right-1/4 h-64 w-80 rounded-full blur-[75px] opacity-40"
          style={{ background: "radial-gradient(circle, rgba(2,52,116,0.8) 0%, transparent 70%)" }}
        />

        {/* Emirates Stadium Arch & Gold Cannon Laser Ribs */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-55 z-10" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0,260 Q 500,120 1000,260" fill="none" stroke="#db0007" strokeWidth="2" opacity="0.45" />
          <path d="M 0,285 Q 500,145 1000,285" fill="none" stroke="#9c824a" strokeWidth="1" strokeDasharray="10 6" opacity="0.35" />
        </svg>

        {/* Official Arsenal Cannon Crest Showcase Badge on Lower Right */}
        <div className="pointer-events-none absolute bottom-4 right-4 sm:bottom-5 sm:right-8 z-20 flex flex-col items-center gap-1.5 opacity-95">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl overflow-hidden p-1.5 bg-gradient-to-b from-white/20 to-black/80 backdrop-blur-md border border-red-500/40 shadow-[0_0_24px_rgba(219,0,7,0.4)]">
            <img
              src="/arsenal/arsenal-logo-transparent.png"
              alt="Arsenal FC Crest"
              className="h-full w-full object-contain filter drop-shadow-[0_0_8px_rgba(219,0,7,0.7)]"
            />
          </div>
          <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-amber-300 drop-shadow">
            THE GUNNERS · INVINCIBLES
          </span>
        </div>

        {/* Subtle Watermark in Bottom-Center */}
        <div className="pointer-events-none absolute bottom-3 left-32 sm:left-44 z-10 hidden min-[540px]:flex items-center gap-1.5 opacity-35">
          <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-red-200">
            🔴⚪ EMIRATES STADIUM
          </span>
        </div>

        {/* Floating Gunpowder Spark */}
        <div className="pointer-events-none absolute top-16 left-[32%] h-3 w-3 rounded-full bg-red-400 shadow-[0_0_10px_#db0007] animate-bounce z-10" />

        {/* Interactive View Toggle */}
        {viewToggle}

        {/* Bottom Horizon Glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/60 to-transparent z-10" />
      </div>
    );
  }

  // ==========================================================================
  // --- 5. MANCHESTER UNITED FC (Red Devils · Theatre of Dreams) ---
  // ==========================================================================
  if (theme.id === "theme-man-united") {
    return (
      <div
        className={`relative w-full overflow-hidden select-none ${className}`}
        style={{ background: "linear-gradient(135deg, #100304 0%, #260508 45%, #080203 100%)" }}
      >
        {/* Old Trafford Backdrop Image (/Manu.jpg) */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/Manu.jpg"
            alt="Old Trafford"
            className="h-full w-full object-cover opacity-45 mix-blend-luminosity scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#100304] via-[#100304]/75 to-[#100304]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#100304] via-transparent to-[#100304]/90" />
        </div>

        {/* Old Trafford Fiery Red & Amber Spotlight */}
        <div
          className="pointer-events-none absolute -top-10 left-1/3 h-64 w-80 rounded-full blur-[75px] opacity-45 animate-flame-flicker"
          style={{ background: "radial-gradient(circle, rgba(218,41,28,0.7) 0%, transparent 70%)" }}
        />

        {/* Steel Lattice Architecture Vector */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-55 z-10" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="180" x2="1000" y2="180" stroke="#da291c" strokeWidth="2" opacity="0.35" />
          <line x1="0" y1="220" x2="1000" y2="220" stroke="#ffe500" strokeWidth="1" strokeDasharray="12 6" opacity="0.25" />
        </svg>

        {/* Official Red Devil Crest Showcase Badge on Lower Right */}
        <div className="pointer-events-none absolute bottom-4 right-4 sm:bottom-5 sm:right-8 z-20 flex flex-col items-center gap-1.5 opacity-95">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl overflow-hidden p-1.5 bg-gradient-to-b from-white/15 to-black/80 backdrop-blur-md border border-amber-400/40 shadow-[0_0_24px_rgba(218,41,28,0.4)]">
            <img
              src="/manu/manu-logo-transparent.png"
              alt="Manchester United Crest"
              className="h-full w-full object-contain filter drop-shadow-[0_0_8px_rgba(255,229,0,0.7)]"
            />
          </div>
          <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-amber-300 drop-shadow">
            THEATRE OF DREAMS
          </span>
        </div>

        {/* Subtle Watermark in Bottom-Center */}
        <div className="pointer-events-none absolute bottom-3 left-32 sm:left-44 z-10 hidden min-[540px]:flex items-center gap-1.5 opacity-35">
          <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-red-300">
            👹 OLD TRAFFORD
          </span>
        </div>

        {/* Rising Spark Embers */}
        <div className="pointer-events-none absolute bottom-12 left-[30%] h-3 w-3 rounded-full bg-red-500 shadow-[0_0_10px_#da291c] animate-bounce z-10" />

        {/* Interactive View Toggle */}
        {viewToggle}

        {/* Bottom Horizon Glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/60 to-transparent z-10" />
      </div>
    );
  }

  // ==========================================================================
  // --- 6. CHELSEA FC (The Blues · Pride of London) ---
  // ==========================================================================
  if (theme.id === "theme-chelsea-fc") {
    return (
      <div
        className={`relative w-full overflow-hidden select-none ${className}`}
        style={{ background: "linear-gradient(135deg, #010c22 0%, #032152 45%, #010714 100%)" }}
      >
        {/* Stamford Bridge / Chelsea Wallpaper Backdrop */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/chelsea/Chelsea Fc Wallpaper By Shangeeth Sugumar Shangeeths On.jpg"
            alt="Stamford Bridge"
            className="h-full w-full object-cover opacity-45 mix-blend-luminosity scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#010c22] via-[#010c22]/75 to-[#010c22]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#010c22] via-transparent to-[#010c22]/90" />
        </div>

        {/* Royal Chelsea Blue Spotlight */}
        <div
          className="pointer-events-none absolute -top-10 left-1/3 h-64 w-80 rounded-full blur-[75px] opacity-45"
          style={{ background: "radial-gradient(circle, rgba(3,70,148,0.8) 0%, transparent 70%)" }}
        />

        {/* Stamford Bridge Wave Arc */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-55 z-10" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0,260 Q 500,130 1000,260" fill="none" stroke="#034694" strokeWidth="2" opacity="0.5" />
          <path d="M 0,280 Q 500,150 1000,280" fill="none" stroke="#dba111" strokeWidth="1" strokeDasharray="8 6" opacity="0.3" />
        </svg>

        {/* Official Chelsea Lion Crest Showcase Badge on Lower Right */}
        <div className="pointer-events-none absolute bottom-4 right-4 sm:bottom-5 sm:right-8 z-20 flex flex-col items-center gap-1.5 opacity-95">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl overflow-hidden p-1.5 bg-gradient-to-b from-white/15 to-black/80 backdrop-blur-md border border-blue-400/40 shadow-[0_0_24px_rgba(3,70,148,0.4)]">
            <img
              src="/chelsea/chelsea-logo-transparent.png"
              alt="Chelsea FC Crest"
              className="h-full w-full object-contain filter drop-shadow-[0_0_8px_rgba(219,161,17,0.7)]"
            />
          </div>
          <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-amber-300 drop-shadow">
            PRIDE OF LONDON
          </span>
        </div>

        {/* Subtle Watermark in Bottom-Center */}
        <div className="pointer-events-none absolute bottom-3 left-32 sm:left-44 z-10 hidden min-[540px]:flex items-center gap-1.5 opacity-35">
          <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-blue-200">
            🦁 STAMFORD BRIDGE
          </span>
        </div>

        {/* Floating Gold Stars */}
        <div className="pointer-events-none absolute top-16 left-[30%] h-3 w-3 rotate-45 border border-amber-300 bg-amber-200 shadow-[0_0_8px_#dba111] animate-pulse z-10" />

        {/* Interactive View Toggle */}
        {viewToggle}

        {/* Bottom Horizon Glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/60 to-transparent z-10" />
      </div>
    );
  }

  // ==========================================================================
  // --- 7. MANCHESTER CITY FC (Cityzens · Treble Winners) ---
  // ==========================================================================
  if (theme.id === "theme-man-city") {
    return (
      <div
        className={`relative w-full overflow-hidden select-none ${className}`}
        style={{ background: "linear-gradient(135deg, #020b18 0%, #071f3d 45%, #01060f 100%)" }}
      >
        {/* Etihad / Manchester City Celebration Backdrop */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/man city/Manchester City Vs United Full Time Win Derby.jpg"
            alt="Etihad Stadium"
            className="h-full w-full object-cover opacity-45 mix-blend-luminosity scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020b18] via-[#020b18]/75 to-[#020b18]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020b18] via-transparent to-[#020b18]/90" />
        </div>

        {/* Etihad Electric Sky Blue Ambient */}
        <div
          className="pointer-events-none absolute -top-10 left-1/3 h-64 w-80 rounded-full blur-[75px] opacity-45"
          style={{ background: "radial-gradient(circle, rgba(108,171,221,0.7) 0%, transparent 70%)" }}
        />

        {/* Etihad Modern Wave & Sine Curves */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-55 z-10" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0,220 Q 250,150 500,220 T 1000,220" fill="none" stroke="#6cabdd" strokeWidth="1.5" opacity="0.4" />
          <path d="M 0,250 Q 250,180 500,250 T 1000,250" fill="none" stroke="#ffffff" strokeWidth="0.75" strokeDasharray="8 6" opacity="0.25" />
        </svg>

        {/* Official Man City Crest Showcase Badge on Lower Right */}
        <div className="pointer-events-none absolute bottom-4 right-4 sm:bottom-5 sm:right-8 z-20 flex flex-col items-center gap-1.5 opacity-95">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl overflow-hidden p-1.5 bg-gradient-to-b from-white/15 to-black/80 backdrop-blur-md border border-sky-400/40 shadow-[0_0_24px_rgba(108,171,221,0.4)]">
            <img
              src="/man city/mancity-logo-transparent.png"
              alt="Manchester City Crest"
              className="h-full w-full object-contain filter drop-shadow-[0_0_8px_rgba(108,171,221,0.7)]"
            />
          </div>
          <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-sky-200 drop-shadow">
            TREBLE WINNERS
          </span>
        </div>

        {/* Subtle Watermark in Bottom-Center */}
        <div className="pointer-events-none absolute bottom-3 left-32 sm:left-44 z-10 hidden min-[540px]:flex items-center gap-1.5 opacity-35">
          <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-sky-200">
            🌊 ETIHAD STADIUM
          </span>
        </div>

        {/* Shimmering Sky Blue Sparkles */}
        <div className="pointer-events-none absolute top-16 left-[35%] h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_10px_#6cabdd] animate-pulse z-10" />

        {/* Interactive View Toggle */}
        {viewToggle}

        {/* Bottom Horizon Glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/60 to-transparent z-10" />
      </div>
    );
  }

  // ==========================================================================
  // --- 8. ATLÉTICO DE MADRID (Colchoneros · Coraje y Corazón) ---
  // ==========================================================================
  if (theme.id === "theme-atletico-madrid") {
    return (
      <div
        className={`relative w-full overflow-hidden select-none ${className}`}
        style={{ background: "linear-gradient(135deg, #100305 0%, #26070a 45%, #080203 100%)" }}
      >
        {/* Cívitas Metropolitano Stadium / Atletico Wallpaper Backdrop */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/atleteco di madrid/wallpaperflare.com_wallpaper.jpg"
            alt="Cívitas Metropolitano"
            className="h-full w-full object-cover opacity-45 mix-blend-luminosity scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#100305] via-[#100305]/75 to-[#100305]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#100305] via-transparent to-[#100305]/90" />
        </div>

        {/* Rojiblanco Crimson Spotlight */}
        <div
          className="pointer-events-none absolute -top-10 left-1/3 h-64 w-80 rounded-full blur-[75px] opacity-45"
          style={{ background: "radial-gradient(circle, rgba(203,53,36,0.7) 0%, transparent 70%)" }}
        />

        {/* Rojiblanco Stripes & 7 Stars */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-55 z-10" xmlns="http://www.w3.org/2000/svg">
          <line x1="200" y1="0" x2="350" y2="400" stroke="#cb3524" strokeWidth="24" opacity="0.25" />
          <line x1="280" y1="0" x2="430" y2="400" stroke="#ffffff" strokeWidth="24" opacity="0.15" />
        </svg>

        {/* Official Atletico Crest Showcase Badge on Lower Right */}
        <div className="pointer-events-none absolute bottom-4 right-4 sm:bottom-5 sm:right-8 z-20 flex flex-col items-center gap-1.5 opacity-95">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl overflow-hidden p-1.5 bg-gradient-to-b from-white/15 to-black/80 backdrop-blur-md border border-rose-400/40 shadow-[0_0_24px_rgba(203,53,36,0.4)]">
            <img
              src="/atleteco di madrid/atletico-logo-transparent.png"
              alt="Atlético de Madrid Crest"
              className="h-full w-full object-contain filter drop-shadow-[0_0_8px_rgba(203,53,36,0.7)]"
            />
          </div>
          <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-rose-200 drop-shadow">
            CORAJE Y CORAZÓN
          </span>
        </div>

        {/* Subtle Watermark in Bottom-Center */}
        <div className="pointer-events-none absolute bottom-3 left-32 sm:left-44 z-10 hidden min-[540px]:flex items-center gap-1.5 opacity-35">
          <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-rose-200">
            🐻 CÍVITAS METROPOLITANO
          </span>
        </div>

        {/* Interactive View Toggle */}
        {viewToggle}

        {/* Bottom Horizon Glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/60 to-transparent z-10" />
      </div>
    );
  }

  // ==========================================================================
  // --- 9. PARIS SAINT-GERMAIN (PSG · Ici c'est Paris) ---
  // ==========================================================================
  if (theme.id === "theme-psg") {
    return (
      <div
        className={`relative w-full overflow-hidden select-none ${className}`}
        style={{ background: "linear-gradient(135deg, #010814 0%, #051630 45%, #01040a 100%)" }}
      >
        {/* Parisian Midnight Navy & Rouge Glow */}
        <div
          className="pointer-events-none absolute -top-10 left-1/3 h-64 w-80 rounded-full blur-[75px] opacity-45"
          style={{ background: "radial-gradient(circle, rgba(0,65,112,0.8) 0%, transparent 70%)" }}
        />

        {/* Center Parisian Rouge Stripe Vector */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-55 z-10" xmlns="http://www.w3.org/2000/svg">
          <rect x="48%" y="0" width="40" height="100%" fill="#da291c" opacity="0.25" />
          <rect x="47%" y="0" width="5" height="100%" fill="#ffffff" opacity="0.25" />
          <rect x="52%" y="0" width="5" height="100%" fill="#ffffff" opacity="0.25" />
        </svg>

        {/* Official PSG Crest Showcase Badge on Lower Right */}
        <div className="pointer-events-none absolute bottom-4 right-4 sm:bottom-5 sm:right-8 z-20 flex flex-col items-center gap-1.5 opacity-95">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl p-2 bg-gradient-to-b from-white/15 to-black/70 backdrop-blur-md border border-blue-400/40 shadow-[0_0_24px_rgba(0,65,112,0.4)]">
            <svg viewBox="0 0 120 140" className="h-full w-full drop-shadow-[0_0_8px_rgba(218,41,28,0.7)]">
              <circle cx="60" cy="70" r="52" fill="#020d20" stroke="#004170" strokeWidth="5" />
              <circle cx="60" cy="70" r="45" fill="none" stroke="#da291c" strokeWidth="2" />
              <polygon points="56,35 64,35 68,85 52,85" fill="#da291c" />
              <line x1="50" y1="65" x2="70" y2="65" stroke="#ffffff" strokeWidth="2" />
              <polygon points="60,88 65,96 55,96" fill="#d4af37" />
              <text x="60" y="24" fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">PARIS</text>
              <text x="60" y="118" fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">SAINT-GERMAIN</text>
            </svg>
          </div>
          <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-sky-200 drop-shadow">
            ICI C'EST PARIS
          </span>
        </div>

        {/* Subtle Watermark in Bottom-Center */}
        <div className="pointer-events-none absolute bottom-3 left-32 sm:left-44 z-10 hidden min-[540px]:flex items-center gap-1.5 opacity-35">
          <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-sky-200">
            🗼 PARC DES PRINCES
          </span>
        </div>

        {/* Floating Parisian Gold Stars */}
        <div className="pointer-events-none absolute top-16 left-[30%] h-3 w-3 rotate-45 border border-amber-300 bg-amber-200 shadow-[0_0_8px_#d4af37] animate-pulse z-10" />

        {/* Interactive View Toggle */}
        {viewToggle}

        {/* Bottom Horizon Glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/60 to-transparent z-10" />
      </div>
    );
  }

  // ==========================================================================
  // --- 10. FC BAYERN MÜNCHEN (Mia San Mia · 5-Star Meister) ---
  // ==========================================================================
  if (theme.id === "theme-bayern-munchen") {
    return (
      <div
        className={`relative w-full overflow-hidden select-none ${className}`}
        style={{ background: "linear-gradient(135deg, #150005 0%, #30020a 45%, #080002 100%)" }}
      >
        {/* Bavarian Crimson & Blue Spotlight */}
        <div
          className="pointer-events-none absolute -top-10 left-1/3 h-64 w-80 rounded-full blur-[75px] opacity-45"
          style={{ background: "radial-gradient(circle, rgba(220,5,45,0.75) 0%, transparent 70%)" }}
        />

        {/* Allianz Arena Elliptical Facade */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-55 z-10" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="50%" cy="40%" rx="350" ry="120" fill="none" stroke="#dc052d" strokeWidth="2" opacity="0.35" />
          <ellipse cx="50%" cy="40%" rx="280" ry="90" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="8 6" opacity="0.25" />
        </svg>

        {/* Official Bayern Crest Showcase Badge on Lower Right */}
        <div className="pointer-events-none absolute bottom-4 right-4 sm:bottom-5 sm:right-8 z-20 flex flex-col items-center gap-1.5 opacity-95">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl overflow-hidden p-1.5 bg-gradient-to-b from-white/15 to-black/80 backdrop-blur-md border border-red-400/40 shadow-[0_0_24px_rgba(220,5,45,0.4)]">
            <img
              src="/bayern/bayern-logo-transparent.png"
              alt="FC Bayern München Crest"
              className="h-full w-full object-contain filter drop-shadow-[0_0_8px_rgba(255,215,0,0.7)]"
            />
          </div>
          <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-red-300 drop-shadow">
            MIA SAN MIA · 5★
          </span>
        </div>

        {/* Subtle Watermark in Bottom-Center */}
        <div className="pointer-events-none absolute bottom-3 left-32 sm:left-44 z-10 hidden min-[540px]:flex items-center gap-1.5 opacity-35">
          <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-red-300">
            🔴💎 ALLIANZ ARENA
          </span>
        </div>

        {/* Floating Crimson Diamonds */}
        <div className="pointer-events-none absolute top-16 left-[30%] h-3 w-3 rotate-45 border border-red-300 bg-red-500 shadow-[0_0_8px_#dc052d] animate-pulse z-10" />

        {/* Interactive View Toggle */}
        {viewToggle}

        {/* Bottom Horizon Glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/60 to-transparent z-10" />
      </div>
    );
  }

  // ==========================================================================
  // --- ESPORTS CONCEPT THEMES ---
  // ==========================================================================

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
      <div className="inline-flex w-fit shrink-0 items-center justify-center rounded-full border-4 border-bg bg-surface shadow-md">
        <Avatar dpUrl={dpUrl} name={name} size={size} mode={mode} />
      </div>
    );
  }

  // Calculate scale factor for orbit particles so they scale with avatar size
  const orbitScale =
    size === "sm"
      ? "scale-[0.32]"
      : size === "md"
      ? "scale-[0.5]"
      : size === "lg"
      ? "scale-[0.72]"
      : "scale-[0.85] sm:scale-100";

  const paddingClass =
    size === "sm" ? "p-1.5" : size === "md" ? "p-2.5" : "p-3 sm:p-4";

  // --- 1. MYTHIC FRAME (Celestial Void Singularity - High-Speed Dual Vortex + 4 Orbiting Satellites) ---
  if (frame.id === "frame-void-singularity" || frame.rarity === "mythic") {
    return (
      <div className={`relative inline-flex w-fit shrink-0 items-center justify-center ${paddingClass} group`}>
        {/* Outer Expanding Supernova Shockwave */}
        <div className="pointer-events-none absolute -inset-2 sm:-inset-4 rounded-full border-2 border-rose-400/90 animate-shockwave" />

        {/* High-Speed Outer Clockwise Vortex Ring (3.5s) */}
        <div
          className="pointer-events-none absolute -inset-1.5 sm:-inset-3 rounded-full animate-vortex-spin-fast opacity-100 blur-[1px]"
          style={{
            background:
              "conic-gradient(from 0deg, #ff007f 0%, #00f5ff 25%, #ffd700 50%, #a855f7 75%, #ff007f 100%)",
          }}
        />

        {/* High-Speed Inner Counter-Clockwise Vortex Ring (2.8s) */}
        <div
          className="pointer-events-none absolute -inset-1 sm:-inset-1.5 rounded-full animate-vortex-spin-reverse-fast opacity-95"
          style={{
            background:
              "conic-gradient(from 180deg, #00f5ff 0%, transparent 35%, #ff007f 65%, transparent 100%)",
          }}
        />

        {/* 4 DYNAMIC ORBITING SATELLITE PARTICLES (Continuous Circular Motion) */}
        <div className={`pointer-events-none absolute inset-0 flex items-center justify-center ${orbitScale} origin-center`}>
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
      <div className={`relative inline-flex w-fit shrink-0 items-center justify-center ${paddingClass} group`}>
        {/* Outer Solar Flare Shockwave */}
        <div className="pointer-events-none absolute -inset-2 sm:-inset-4 rounded-full border-2 border-amber-400/90 animate-shockwave" />

        {/* High-Heat Flaming Core */}
        <div
          className="pointer-events-none absolute -inset-1.5 sm:-inset-3 rounded-full animate-inferno-flames opacity-100 blur-[2px]"
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
        <div className={`pointer-events-none absolute inset-0 flex items-center justify-center ${orbitScale} origin-center`}>
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
      <div className={`relative inline-flex w-fit shrink-0 items-center justify-center ${paddingClass} group`}>
        {/* Expanding Gold Shockwave Ring */}
        <div className="pointer-events-none absolute -inset-2 sm:-inset-4 rounded-full border-2 border-amber-300/90 animate-shockwave" />

        {/* Radiant 24K Gold Sunburst Halo */}
        <div
          className="pointer-events-none absolute -inset-1.5 sm:-inset-3 rounded-full animate-gold-radiance opacity-100 blur-[2px]"
          style={{
            background:
              "radial-gradient(circle, rgba(255,215,0,0.95) 0%, rgba(217,165,68,0.5) 65%, transparent 100%)",
          }}
        />

        {/* High-Speed Rotating 24K Gilded Dashed Ring */}
        <div
          className="pointer-events-none absolute -inset-1 sm:-inset-1.5 rounded-full border-2 border-amber-300 shadow-[0_0_26px_rgba(255,215,0,1)] animate-vortex-spin-fast"
          style={{ borderStyle: "dashed" }}
        />

        {/* Orbiting Diamond Jewels */}
        <div className={`pointer-events-none absolute inset-0 flex items-center justify-center ${orbitScale} origin-center`}>
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
      <div className={`relative inline-flex w-fit shrink-0 items-center justify-center ${paddingClass} group`}>
        <div
          className="pointer-events-none absolute -inset-1.5 sm:-inset-2.5 rounded-full animate-cyber-flash opacity-100"
          style={{
            background:
              "radial-gradient(circle, rgba(168,85,247,0.85) 0%, rgba(0,245,255,0.6) 60%, transparent 85%)",
          }}
        />
        {/* High-Speed Cyan Scanner Radar */}
        <div className="pointer-events-none absolute -inset-0.5 sm:-inset-1 rounded-full border-2 border-purple-400 shadow-[0_0_22px_rgba(168,85,247,1)] animate-vortex-spin-fast" />

        {/* Orbiting Cyber Data Bits */}
        <div className={`pointer-events-none absolute inset-0 flex items-center justify-center ${orbitScale} origin-center`}>
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
      <div className={`relative inline-flex w-fit shrink-0 items-center justify-center ${paddingClass} group`}>
        <div
          className="pointer-events-none absolute -inset-1.5 sm:-inset-2.5 rounded-full animate-inferno-flames opacity-100 blur-[2px]"
          style={{
            background:
              "radial-gradient(circle, rgba(255,84,112,1) 0%, rgba(255,107,74,0.7) 60%, transparent 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute -inset-0.5 sm:-inset-1 rounded-full border-2 border-rose-400 shadow-[0_0_26px_rgba(255,84,112,1)] animate-vortex-spin-fast"
          style={{ borderStyle: "dashed" }}
        />
        <div className="pointer-events-none absolute -top-2 h-3 sm:h-4 w-3 sm:w-4 rounded-full bg-rose-400 shadow-[0_0_16px_#ff5470] animate-bounce" />
        <div className="pointer-events-none absolute -bottom-2 h-2.5 sm:h-3.5 w-2.5 sm:w-3.5 rounded-full bg-orange-400 shadow-[0_0_14px_#ff6b4a] animate-pulse" />

        <div className="relative rounded-full border-2 border-rose-500 bg-bg p-0.5 shadow-[0_0_24px_rgba(255,84,112,0.95)] transition-transform duration-300 group-hover:scale-105">
          <Avatar dpUrl={dpUrl} name={name} size={size} mode={mode} />
        </div>
      </div>
    );
  }

  // --- 6. RARE FRAME (Emerald Overdrive - Pitch Floodlight & Radar Sweep) ---
  if (frame.id === "frame-emerald-edge" || frame.rarity === "rare") {
    return (
      <div className={`relative inline-flex w-fit shrink-0 items-center justify-center ${paddingClass} group`}>
        <div
          className="pointer-events-none absolute -inset-1.5 sm:-inset-2 rounded-full animate-stadium-floodlight opacity-100"
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
    <div className={`relative inline-flex w-fit shrink-0 items-center justify-center ${paddingClass} group`}>
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
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden select-none max-w-[100vw]">
        <div className="glow-gold pointer-events-none absolute left-1/2 top-0 h-[450px] w-[450px] -translate-x-1/2 blur-3xl opacity-50" />
        <div className="glow-blue pointer-events-none absolute right-0 top-32 h-[350px] w-[350px] blur-3xl opacity-40" />
      </div>
    );
  }

  // --- Official Team 1: Real Madrid CF ---
  if (theme.id === "theme-real-madrid") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden select-none max-w-[100vw]">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 blur-[120px] animate-gold-radiance opacity-95"
          style={{
            background:
              "radial-gradient(circle, rgba(254,190,16,0.65) 0%, rgba(255,255,255,0.3) 40%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-20 h-[500px] w-[500px] blur-[110px] opacity-75"
          style={{ background: "radial-gradient(circle, rgba(82,41,107,0.7) 0%, transparent 70%)" }}
        />
      </div>
    );
  }

  // --- Official Team 2: FC Barcelona ---
  if (theme.id === "theme-fc-barcelona") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden select-none max-w-[100vw]">
        <div
          className="pointer-events-none absolute left-1/3 top-0 h-[650px] w-[650px] -translate-x-1/2 blur-[110px] opacity-90"
          style={{
            background:
              "radial-gradient(circle, rgba(0,77,152,0.75) 0%, rgba(165,0,68,0.55) 50%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-24 h-[500px] w-[500px] blur-[100px] opacity-85"
          style={{
            background:
              "radial-gradient(circle, rgba(165,0,68,0.7) 0%, rgba(237,187,0,0.3) 50%, transparent 70%)",
          }}
        />
      </div>
    );
  }

  // --- Official Team 3: Bangladesh National Team ---
  if (theme.id === "theme-bangladesh-tigers") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden select-none max-w-[100vw]">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[680px] w-[680px] -translate-x-1/2 blur-[115px] opacity-95"
          style={{
            background:
              "radial-gradient(circle, rgba(244,42,65,0.75) 0%, rgba(0,106,78,0.65) 50%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-24 h-[450px] w-[450px] blur-[100px] opacity-80"
          style={{
            background:
              "radial-gradient(circle, rgba(249,168,37,0.5) 0%, rgba(0,106,78,0.4) 50%, transparent 70%)",
          }}
        />
      </div>
    );
  }

  // --- Official Team 4: Arsenal FC ---
  if (theme.id === "theme-arsenal-fc") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden select-none max-w-[100vw]">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[650px] w-[650px] -translate-x-1/2 blur-[110px] animate-flame-flicker opacity-95"
          style={{
            background:
              "radial-gradient(circle, rgba(219,0,7,0.75) 0%, rgba(156,130,74,0.35) 50%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-24 h-[450px] w-[450px] blur-[100px] opacity-85"
          style={{
            background:
              "radial-gradient(circle, rgba(2,52,116,0.55) 0%, transparent 70%)",
          }}
        />
      </div>
    );
  }

  // --- Official Team 4: Manchester United ---
  if (theme.id === "theme-man-united") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden select-none max-w-[100vw]">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[650px] w-[650px] -translate-x-1/2 blur-[110px] animate-flame-flicker opacity-95"
          style={{
            background:
              "radial-gradient(circle, rgba(218,41,28,0.75) 0%, rgba(255,229,0,0.35) 50%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-24 h-[450px] w-[450px] blur-[100px] opacity-85"
          style={{
            background:
              "radial-gradient(circle, rgba(218,41,28,0.55) 0%, transparent 70%)",
          }}
        />
      </div>
    );
  }

  // --- Official Team 5: Chelsea FC ---
  if (theme.id === "theme-chelsea-fc") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden select-none max-w-[100vw]">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[650px] w-[650px] -translate-x-1/2 blur-[110px] opacity-95"
          style={{
            background:
              "radial-gradient(circle, rgba(3,70,148,0.8) 0%, rgba(219,161,17,0.35) 50%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-24 h-[450px] w-[450px] blur-[100px] opacity-85"
          style={{
            background:
              "radial-gradient(circle, rgba(219,161,17,0.45) 0%, transparent 70%)",
          }}
        />
      </div>
    );
  }

  // --- Official Team 6: Manchester City ---
  if (theme.id === "theme-man-city") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden select-none max-w-[100vw]">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[650px] w-[650px] -translate-x-1/2 blur-[110px] opacity-95"
          style={{
            background:
              "radial-gradient(circle, rgba(108,171,221,0.75) 0%, rgba(28,44,91,0.45) 50%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-24 h-[450px] w-[450px] blur-[100px] opacity-85"
          style={{
            background:
              "radial-gradient(circle, rgba(108,171,221,0.55) 0%, transparent 70%)",
          }}
        />
      </div>
    );
  }

  // --- Official Team 7: Atlético de Madrid ---
  if (theme.id === "theme-atletico-madrid") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden select-none max-w-[100vw]">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[650px] w-[650px] -translate-x-1/2 blur-[110px] opacity-95"
          style={{
            background:
              "radial-gradient(circle, rgba(203,53,36,0.75) 0%, rgba(255,255,255,0.25) 45%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-24 h-[450px] w-[450px] blur-[100px] opacity-85"
          style={{
            background:
              "radial-gradient(circle, rgba(25,34,49,0.7) 0%, transparent 70%)",
          }}
        />
      </div>
    );
  }

  // --- Official Team 8: Paris Saint-Germain ---
  if (theme.id === "theme-psg") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden select-none max-w-[100vw]">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[650px] w-[650px] -translate-x-1/2 blur-[110px] opacity-95"
          style={{
            background:
              "radial-gradient(circle, rgba(0,65,112,0.8) 0%, rgba(218,41,28,0.5) 50%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-24 h-[450px] w-[450px] blur-[100px] opacity-85"
          style={{
            background:
              "radial-gradient(circle, rgba(212,175,55,0.45) 0%, transparent 70%)",
          }}
        />
      </div>
    );
  }

  // --- Official Team 9: FC Bayern München ---
  if (theme.id === "theme-bayern-munchen") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden select-none max-w-[100vw]">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[650px] w-[650px] -translate-x-1/2 blur-[110px] opacity-95"
          style={{
            background:
              "radial-gradient(circle, rgba(220,5,45,0.8) 0%, rgba(0,102,178,0.4) 50%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-24 h-[450px] w-[450px] blur-[100px] opacity-85"
          style={{
            background:
              "radial-gradient(circle, rgba(220,5,45,0.5) 0%, transparent 70%)",
          }}
        />
      </div>
    );
  }

  // 1. Cosmic Hyper-Nebula (Mythic)
  if (theme.id === "theme-celestial-nebula" || theme.rarity === "mythic") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden select-none max-w-[100vw]">
        <div className="bg-stars-pattern pointer-events-none absolute inset-0 opacity-85 animate-cosmic-stars" />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 blur-[120px] animate-cosmic-drift opacity-95"
          style={{
            background:
              "radial-gradient(circle, rgba(139,127,224,0.65) 0%, rgba(255,0,128,0.45) 45%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-16 h-[500px] w-[500px] blur-[110px] opacity-90"
          style={{
            background:
              "radial-gradient(circle, rgba(0,245,255,0.5) 0%, rgba(139,127,224,0.3) 50%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute left-0 top-64 h-[450px] w-[450px] blur-[100px] opacity-80"
          style={{
            background:
              "radial-gradient(circle, rgba(255,84,112,0.45) 0%, transparent 65%)",
          }}
        />
      </div>
    );
  }

  // 2. Cyberpunk 2077 Night City (Legendary)
  if (theme.id === "theme-cyberpunk-night") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden select-none max-w-[100vw]">
        <div className="bg-cyber-grid pointer-events-none absolute inset-0 opacity-75" />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[650px] w-[650px] -translate-x-1/2 blur-[110px] opacity-95"
          style={{
            background:
              "radial-gradient(circle, rgba(255,0,128,0.6) 0%, rgba(0,245,255,0.4) 50%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-24 h-[450px] w-[450px] blur-[100px] opacity-85"
          style={{
            background:
              "radial-gradient(circle, rgba(0,245,255,0.55) 0%, transparent 70%)",
          }}
        />
      </div>
    );
  }

  // 3. 24K Sovereign Solar Gold (Legendary)
  if (theme.id === "theme-allynq-gold" || theme.rarity === "legendary") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden select-none max-w-[100vw]">
        <div className="bg-honeycomb pointer-events-none absolute inset-0 opacity-90" />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[650px] w-[650px] -translate-x-1/2 blur-[110px] animate-gold-radiance opacity-95"
          style={{
            background:
              "radial-gradient(circle, rgba(255,215,0,0.55) 0%, rgba(217,165,68,0.4) 50%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-24 h-[450px] w-[450px] blur-[100px] opacity-85"
          style={{
            background:
              "radial-gradient(circle, rgba(255,183,3,0.5) 0%, rgba(217,165,68,0.2) 60%, transparent 70%)",
          }}
        />
      </div>
    );
  }

  // 4. Glacial Cryo-Frost (Epic)
  if (theme.id === "theme-frostbite") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden select-none max-w-[100vw]">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[650px] w-[650px] -translate-x-1/2 blur-[110px] animate-pulse-glow opacity-90"
          style={{
            background:
              "radial-gradient(circle, rgba(0,245,255,0.6) 0%, rgba(255,255,255,0.25) 45%, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-28 h-[450px] w-[450px] blur-[90px] opacity-80"
          style={{
            background: "radial-gradient(circle, rgba(0,245,255,0.45) 0%, transparent 70%)",
          }}
        />
      </div>
    );
  }

  // 5. Crimson Blood Moon (Epic)
  if (theme.id === "theme-crimson" || theme.rarity === "epic") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden select-none max-w-[100vw]">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[650px] w-[650px] -translate-x-1/2 blur-[110px] animate-flame-flicker opacity-95"
          style={{
            background:
              "radial-gradient(circle, rgba(255,84,112,0.6) 0%, rgba(255,107,74,0.3) 50%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-28 h-[450px] w-[450px] blur-[100px] opacity-85"
          style={{
            background:
              "radial-gradient(circle, rgba(255,84,112,0.45) 0%, transparent 65%)",
          }}
        />
      </div>
    );
  }

  // Rare / Common themes
  return (
    <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden select-none max-w-[100vw]">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[580px] w-[580px] -translate-x-1/2 blur-3xl opacity-90"
        style={{
          background: `radial-gradient(circle, ${theme.color}60 0%, ${theme.secondaryColor ?? theme.color}25 50%, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute right-0 top-28 h-[400px] w-[400px] blur-3xl opacity-80"
        style={{
          background: `radial-gradient(circle, ${theme.secondaryColor ?? theme.color}50 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}

// ============================================================================
// 5.5 OFFICIAL TEAM ATTACHMENT BADGE (Club Crest, Stadium, & Historical Motto)
// ============================================================================
export function ThemeTeamAttachmentBadge({ theme }: { theme?: CosmeticItem | null }) {
  if (!theme?.teamDetails) return null;
  const d = theme.teamDetails;
  return (
    <div className="relative mt-3 inline-flex flex-wrap items-center gap-2.5 rounded-2xl border border-white/20 bg-surface-deep/85 px-3.5 py-2 backdrop-blur-xl shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-white/40">
      {/* Team Crest Icon */}
      {d.logoUrl ? (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-white/10 p-0.5 shadow-inner">
          <img
            src={d.logoUrl}
            alt={d.clubName}
            className="h-full w-full object-contain filter drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
          />
        </div>
      ) : (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-surface-line text-base shadow-inner">
          {d.badgeSymbol}
        </span>
      )}
      {/* Club Name & Motto */}
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-2">
          <span className="font-heading text-xs sm:text-sm font-black tracking-wide text-white">
            {d.clubName}
          </span>
          <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[9px] font-mono font-bold text-accent-ink">
            EST. {d.founded}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-ink-soft">
          <span className="italic font-medium text-ink">"{d.motto}"</span>
          {d.championshipCount ? (
            <>
              <span className="text-white/30">•</span>
              <span className="font-semibold text-amber-300">🏆 {d.championshipCount}</span>
            </>
          ) : null}
        </div>
      </div>
      {/* Stadium Tag */}
      <div className="ml-auto hidden min-[480px]:flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1 font-mono text-[10px] text-ink-soft">
        <span>🏟️</span>
        <span className="truncate max-w-[160px] font-semibold text-white">{d.stadium}</span>
      </div>
    </div>
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
    : theme.id === "theme-real-madrid"
    ? "theme-card-legendary"
    : theme.id === "theme-fc-barcelona"
    ? "theme-card-cyber"
    : theme.id === "theme-bangladesh-tigers"
    ? "theme-card-rare-emerald"
    : theme.id === "theme-arsenal-fc"
    ? "theme-card-epic-fire"
    : theme.id === "theme-man-united"
    ? "theme-card-epic-fire"
    : theme.id === "theme-chelsea-fc"
    ? "theme-card-rare-ocean"
    : theme.id === "theme-man-city"
    ? "theme-card-epic-frost"
    : theme.id === "theme-atletico-madrid"
    ? "theme-card-epic-fire"
    : theme.id === "theme-psg"
    ? "theme-card-rare-ocean"
    : theme.id === "theme-bayern-munchen"
    ? "theme-card-epic-fire"
    : theme.rarity === "mythic"
    ? "theme-card-mythic"
    : theme.id === "theme-cyberpunk-night"
    ? "theme-card-cyber"
    : theme.rarity === "legendary"
    ? "theme-card-legendary"
    : theme.id === "theme-frostbite"
    ? "theme-card-frost"
    : theme.rarity === "epic"
    ? "theme-card-crimson"
    : theme.id === "theme-emerald"
    ? "theme-card-emerald"
    : "theme-card-ocean";

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border transition-all duration-300 ${cardClass}`}
    >
      {/* Top Border Laser Runner */}
      {theme ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[2px] opacity-90 animate-holographic-sweep"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${theme.color} 50%, transparent 100%)`,
          }}
        />
      ) : null}

      {/* Cyber Corner Markers */}
      {theme ? (
        <>
          <div
            className="pointer-events-none absolute top-0 left-0 z-20 h-3 sm:h-5 w-3 sm:w-5 border-t-2 border-l-2"
            style={{ borderColor: theme.color }}
          />
          <div
            className="pointer-events-none absolute top-0 right-0 z-20 h-3 sm:h-5 w-3 sm:w-5 border-t-2 border-r-2"
            style={{ borderColor: theme.color }}
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 z-20 h-3 sm:h-5 w-3 sm:w-5 border-b-2 border-l-2"
            style={{ borderColor: theme.color }}
          />
          <div
            className="pointer-events-none absolute bottom-0 right-0 z-20 h-3 sm:h-5 w-3 sm:w-5 border-b-2 border-r-2"
            style={{ borderColor: theme.color }}
          />
        </>
      ) : null}

      {children}
    </div>
  );
}

// ============================================================================
// 7. THEMED CARD WRAPPER (For Profile Sections & Containers)
// ============================================================================
export function ThemedCard({
  theme,
  children,
  className = "",
}: {
  theme: CosmeticItem | null | undefined;
  children: ReactNode;
  className?: string;
}) {
  const tokens = getThemeTokens(theme);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300 ${tokens.cardClass} ${className}`}
      style={{
        boxShadow: theme ? tokens.glowShadow : undefined,
      }}
    >
      {/* Theme art watermark */}
      <ThemeSectionArt theme={theme} />

      {/* Top Holographic Laser Line */}
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
    <div className="relative inline-flex w-fit shrink-0 items-center justify-center group self-start">
      {/* 5-Star Gold Crest on Top of Avatar with Staggered Twinkles */}
      <div className="absolute -top-3 sm:-top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-0.5 rounded-full border border-amber-300/90 bg-bg/95 px-2 py-0.2 sm:px-2.5 sm:py-0.5 text-[8px] sm:text-[9px] font-black text-amber-300 shadow-[0_0_16px_rgba(255,215,0,0.85)] backdrop-blur animate-gold-radiance whitespace-nowrap">
        <span className="animate-jewel-sparkle">★</span>
        <span className="animate-jewel-sparkle" style={{ animationDelay: "0.2s" }}>★</span>
        <span className="text-[9px] sm:text-[10px] text-amber-100 animate-jewel-sparkle" style={{ animationDelay: "0.4s" }}>★</span>
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
        className="absolute -bottom-2 sm:-bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 sm:gap-1.5 rounded-full border px-2 py-0.2 sm:px-2.5 sm:py-0.5 shadow-2xl backdrop-blur transition-transform group-hover:scale-110 whitespace-nowrap"
        style={{
          borderColor: `${accentColor}80`,
          backgroundColor: "rgba(10, 8, 20, 0.95)",
          boxShadow: `0 0 14px ${accentColor}50`,
        }}
      >
        <span
          className="font-mono text-[8px] sm:text-[9px] font-black uppercase px-1 sm:px-1.5 py-0.2 rounded shadow-sm"
          style={{
            backgroundColor: accentColor,
            color: "#000000",
          }}
        >
          {position}
        </span>
        <span className="font-mono text-[9px] sm:text-[10px] font-black text-white">
          {rating}
        </span>
        <span className="h-1 sm:h-1.5 w-1 sm:w-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
      </div>

      {/* Spinning Golden Soccer Ball Particle at Bottom Right */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 z-30 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full border border-amber-300 bg-bg/90 shadow-[0_0_10px_#ffd700] backdrop-blur animate-football-spin"
      >
        <span className="text-[9px] sm:text-[11px]">⚽</span>
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
    <div className="pointer-events-none absolute top-3 left-3 sm:top-5 sm:left-6 z-10 max-w-[85%] sm:max-w-[70%]">
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Division & Rating Badge */}
        <div className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-white/20 bg-bg/85 px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[11px] font-mono font-bold text-ink backdrop-blur-md shadow-lg">
          <span className="text-amber-400 text-[10px] sm:text-xs">🏆</span>
          <span>DIV {rank <= 3 ? "1 PRO" : rank <= 10 ? "2 ELITE" : "3"}</span>
          <span className="text-ink-faint">|</span>
          <span className="text-accent-ink font-mono">{points.toLocaleString()} PTS</span>
        </div>

        {/* Live Form / Win Rate Indicator */}
        <div className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/80 px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[11px] font-mono font-bold text-emerald-300 backdrop-blur-md shadow-lg">
          <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-400 animate-ping" />
          <span>FORM: EXCELLENT</span>
          <span className="text-emerald-500">|</span>
          <span>{winRate}% WIN</span>
        </div>

        {/* Career Recorded Wins */}
        <div className="hidden min-[480px]:flex items-center gap-1.5 rounded-full border border-white/15 bg-bg/75 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] font-mono font-bold text-ink-soft backdrop-blur-md shadow-md">
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
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-3.5 sm:p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${tokens.cardClass}`}
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
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span
          className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate"
          style={{ color: tokens.mutedText }}
        >
          {label}
        </span>
        <div
          className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border shadow-md transition-transform group-hover:scale-110"
          style={{
            borderColor: tokens.innerBorder,
            backgroundColor: tokens.innerBg,
            color: tokens.accentText,
            boxShadow: theme ? `0 0 12px ${tokens.primary}40` : undefined,
          }}
        >
          <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
        </div>
      </div>

      {/* Value Counter & Football Rating Badge */}
      <div className="relative z-10 mt-3 sm:mt-4 flex flex-wrap items-baseline justify-between gap-1.5">
        <span
          className="font-display text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md transition-colors"
          style={{
            color: tokens.headingText,
            filter: theme ? `drop-shadow(0 0 8px ${tokens.primary}40)` : undefined,
          }}
        >
          {value}
        </span>
        <div
          className="flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[8px] sm:text-[9px] font-black uppercase shadow-md backdrop-blur shrink-0"
          style={{
            borderColor: tokens.highlightBorder,
            backgroundColor: tokens.highlightBg,
            color: tokens.highlightText,
          }}
        >
          <span className="text-[9px]">▲</span>
          <span>PRO</span>
        </div>
      </div>
    </div>
  );
}

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
    // --- Official Team 1: Real Madrid CF ---
    case "theme-real-madrid":
      return {
        id: theme.id,
        name: theme.name,
        rarity: "mythic",
        primary: "#febe10",
        secondary: "#ffffff",
        accentText: "#febe10",
        headingText: "#ffffff",
        bodyText: "#f8fafc",
        mutedText: "#cbd5e1",
        cardClass: "theme-card-legendary",
        innerBg: "rgba(254, 190, 16, 0.12)",
        innerBorder: "rgba(254, 190, 16, 0.38)",
        innerHoverBorder: "rgba(255, 255, 255, 0.7)",
        highlightBg: "rgba(254, 190, 16, 0.2)",
        highlightBorder: "rgba(254, 190, 16, 0.6)",
        highlightText: "#febe10",
        glowShadow: "0 0 25px rgba(254, 190, 16, 0.4)",
      };

    // --- Official Team 2: FC Barcelona ---
    case "theme-fc-barcelona":
      return {
        id: theme.id,
        name: theme.name,
        rarity: "legendary",
        primary: "#a50044",
        secondary: "#004d98",
        accentText: "#edbb00",
        headingText: "#ffffff",
        bodyText: "#f8fafc",
        mutedText: "#93c5fd",
        cardClass: "theme-card-cyber",
        innerBg: "rgba(0, 77, 152, 0.15)",
        innerBorder: "rgba(165, 0, 68, 0.45)",
        innerHoverBorder: "rgba(237, 187, 0, 0.7)",
        highlightBg: "rgba(165, 0, 68, 0.25)",
        highlightBorder: "rgba(237, 187, 0, 0.6)",
        highlightText: "#edbb00",
        glowShadow: "0 0 25px rgba(165, 0, 68, 0.4)",
      };

    // --- Official Team 3: Bangladesh National Team ---
    case "theme-bangladesh-tigers":
      return {
        id: theme.id,
        name: theme.name,
        rarity: "mythic",
        primary: "#006a4e",
        secondary: "#f42a41",
        accentText: "#f9a825",
        headingText: "#ffffff",
        bodyText: "#f0fdf4",
        mutedText: "#86efac",
        cardClass: "theme-card-rare-emerald",
        innerBg: "rgba(0, 106, 78, 0.16)",
        innerBorder: "rgba(0, 106, 78, 0.45)",
        innerHoverBorder: "rgba(244, 42, 65, 0.7)",
        highlightBg: "rgba(244, 42, 65, 0.2)",
        highlightBorder: "rgba(249, 168, 37, 0.6)",
        highlightText: "#f9a825",
        glowShadow: "0 0 25px rgba(0, 106, 78, 0.45)",
      };

    // --- Official Team 4: Arsenal FC ---
    case "theme-arsenal-fc":
      return {
        id: theme.id,
        name: theme.name,
        rarity: "legendary",
        primary: "#db0007",
        secondary: "#023474",
        accentText: "#9c824a",
        headingText: "#ffffff",
        bodyText: "#fff1f2",
        mutedText: "#fca5a5",
        cardClass: "theme-card-epic-fire",
        innerBg: "rgba(219, 0, 7, 0.14)",
        innerBorder: "rgba(219, 0, 7, 0.4)",
        innerHoverBorder: "rgba(156, 130, 74, 0.7)",
        highlightBg: "rgba(219, 0, 7, 0.25)",
        highlightBorder: "rgba(156, 130, 74, 0.6)",
        highlightText: "#9c824a",
        glowShadow: "0 0 25px rgba(219, 0, 7, 0.4)",
      };

    // --- Official Team 5: Manchester United ---
    case "theme-man-united":
      return {
        id: theme.id,
        name: theme.name,
        rarity: "legendary",
        primary: "#da291c",
        secondary: "#ffe500",
        accentText: "#ffe500",
        headingText: "#ffffff",
        bodyText: "#ffe4e6",
        mutedText: "#fca5a5",
        cardClass: "theme-card-epic-fire",
        innerBg: "rgba(218, 41, 28, 0.14)",
        innerBorder: "rgba(218, 41, 28, 0.4)",
        innerHoverBorder: "rgba(255, 229, 0, 0.7)",
        highlightBg: "rgba(218, 41, 28, 0.25)",
        highlightBorder: "rgba(255, 229, 0, 0.6)",
        highlightText: "#ffe500",
        glowShadow: "0 0 25px rgba(218, 41, 28, 0.4)",
      };

    // --- Official Team 5: Chelsea FC ---
    case "theme-chelsea-fc":
      return {
        id: theme.id,
        name: theme.name,
        rarity: "epic",
        primary: "#034694",
        secondary: "#dba111",
        accentText: "#dba111",
        headingText: "#ffffff",
        bodyText: "#f0f9ff",
        mutedText: "#7dd3fc",
        cardClass: "theme-card-rare-ocean",
        innerBg: "rgba(3, 70, 148, 0.14)",
        innerBorder: "rgba(3, 70, 148, 0.4)",
        innerHoverBorder: "rgba(219, 161, 17, 0.7)",
        highlightBg: "rgba(3, 70, 148, 0.25)",
        highlightBorder: "rgba(219, 161, 17, 0.6)",
        highlightText: "#dba111",
        glowShadow: "0 0 25px rgba(3, 70, 148, 0.4)",
      };

    // --- Official Team 6: Manchester City ---
    case "theme-man-city":
      return {
        id: theme.id,
        name: theme.name,
        rarity: "legendary",
        primary: "#6cabdd",
        secondary: "#1c2c5b",
        accentText: "#6cabdd",
        headingText: "#ffffff",
        bodyText: "#f0f9ff",
        mutedText: "#bae6fd",
        cardClass: "theme-card-epic-frost",
        innerBg: "rgba(108, 171, 221, 0.14)",
        innerBorder: "rgba(108, 171, 221, 0.4)",
        innerHoverBorder: "rgba(255, 255, 255, 0.7)",
        highlightBg: "rgba(108, 171, 221, 0.2)",
        highlightBorder: "rgba(108, 171, 221, 0.6)",
        highlightText: "#6cabdd",
        glowShadow: "0 0 25px rgba(108, 171, 221, 0.4)",
      };

    // --- Official Team 7: Atlético de Madrid ---
    case "theme-atletico-madrid":
      return {
        id: theme.id,
        name: theme.name,
        rarity: "epic",
        primary: "#cb3524",
        secondary: "#ffffff",
        accentText: "#cb3524",
        headingText: "#ffffff",
        bodyText: "#fff1f2",
        mutedText: "#fecdd3",
        cardClass: "theme-card-epic-fire",
        innerBg: "rgba(203, 53, 36, 0.14)",
        innerBorder: "rgba(203, 53, 36, 0.4)",
        innerHoverBorder: "rgba(255, 255, 255, 0.7)",
        highlightBg: "rgba(203, 53, 36, 0.2)",
        highlightBorder: "rgba(203, 53, 36, 0.6)",
        highlightText: "#ffffff",
        glowShadow: "0 0 25px rgba(203, 53, 36, 0.4)",
      };

    // --- Official Team 8: Paris Saint-Germain ---
    case "theme-psg":
      return {
        id: theme.id,
        name: theme.name,
        rarity: "epic",
        primary: "#004170",
        secondary: "#da291c",
        accentText: "#d4af37",
        headingText: "#ffffff",
        bodyText: "#f8fafc",
        mutedText: "#94a3b8",
        cardClass: "theme-card-rare-ocean",
        innerBg: "rgba(0, 65, 112, 0.15)",
        innerBorder: "rgba(0, 65, 112, 0.45)",
        innerHoverBorder: "rgba(212, 175, 55, 0.7)",
        highlightBg: "rgba(218, 41, 28, 0.2)",
        highlightBorder: "rgba(212, 175, 55, 0.6)",
        highlightText: "#d4af37",
        glowShadow: "0 0 25px rgba(0, 65, 112, 0.4)",
      };

    // --- Official Team 9: FC Bayern München ---
    case "theme-bayern-munchen":
      return {
        id: theme.id,
        name: theme.name,
        rarity: "legendary",
        primary: "#dc052d",
        secondary: "#0066b2",
        accentText: "#ffd700",
        headingText: "#ffffff",
        bodyText: "#fff1f2",
        mutedText: "#fecdd3",
        cardClass: "theme-card-epic-fire",
        innerBg: "rgba(220, 5, 45, 0.14)",
        innerBorder: "rgba(220, 5, 45, 0.45)",
        innerHoverBorder: "rgba(255, 215, 0, 0.7)",
        highlightBg: "rgba(220, 5, 45, 0.22)",
        highlightBorder: "rgba(255, 215, 0, 0.6)",
        highlightText: "#ffd700",
        glowShadow: "0 0 25px rgba(220, 5, 45, 0.4)",
      };

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
    // --- Official Team 1: Real Madrid CF ---
    case "theme-real-madrid":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl animate-gold-corona" />
          {/* Official Real Madrid Logo Crest Watermark */}
          <div className="absolute -right-4 -bottom-4 h-44 w-44 opacity-20">
            <img
              src="/real madrid/real-madrid-logo-preview.png"
              alt=""
              className="h-full w-full object-contain filter drop-shadow-[0_0_15px_rgba(254,190,16,0.6)]"
            />
          </div>
          <svg className="absolute inset-0 h-full w-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="madrid-crown-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 12 36 L 24 16 L 36 36 Z" fill="none" stroke="#febe10" strokeWidth="0.8" opacity="0.35" />
                <circle cx="24" cy="14" r="2" fill="#ffffff" opacity="0.6" />
                <circle cx="12" cy="36" r="1.5" fill="#febe10" opacity="0.5" />
                <circle cx="36" cy="36" r="1.5" fill="#febe10" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#madrid-crown-grid)" />
          </svg>
        </div>
      );

    // --- Official Team 2: FC Barcelona ---
    case "theme-fc-barcelona":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-red-600/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute -right-4 -bottom-4 h-44 w-44 opacity-20">
            <img
              src="/barca/vecteezy_fc-barcelona-logo-on-transparent-background_14414712.jpg"
              alt=""
              className="h-full w-full object-contain filter drop-shadow-[0_0_15px_rgba(237,187,0,0.6)]"
            />
          </div>
          <svg className="absolute inset-0 h-full w-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="fcb-stripes" width="36" height="36" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="18" height="36" fill="#004d98" opacity="0.15" />
                <rect x="18" y="0" width="18" height="36" fill="#a50044" opacity="0.15" />
                <circle cx="18" cy="18" r="2" fill="#edbb00" opacity="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#fcb-stripes)" />
          </svg>
        </div>
      );

    // --- Official Team 3: Bangladesh National Team ---
    case "theme-bangladesh-tigers":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-red-600/25 blur-3xl" />
          <div className="absolute -right-4 -bottom-4 h-44 w-44 opacity-25">
            <img
              src="/Bangladesh/bangladesh-football-federation-seeklogo.png"
              alt=""
              className="h-full w-full object-contain filter drop-shadow-[0_0_15px_rgba(244,42,65,0.6)]"
            />
          </div>
          <svg className="absolute inset-0 h-full w-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="bd-tiger-grid" width="44" height="44" patternUnits="userSpaceOnUse">
                <circle cx="22" cy="22" r="10" fill="none" stroke="#f42a41" strokeWidth="0.8" opacity="0.35" />
                <path d="M 12 22 L 32 22 M 22 12 L 22 32" stroke="#006a4e" strokeWidth="0.6" opacity="0.3" />
                <circle cx="22" cy="22" r="2" fill="#f9a825" opacity="0.7" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bd-tiger-grid)" />
          </svg>
        </div>
      );

    // --- Official Team 4: Arsenal FC ---
    case "theme-arsenal-fc":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-red-600/25 blur-3xl" />
          <div className="absolute -right-4 -bottom-4 h-44 w-44 opacity-25">
            <img
              src="/arsenal/vecteezy_arsenal-logo-on-transparent-background_15863617.jpg"
              alt=""
              className="h-full w-full object-contain filter drop-shadow-[0_0_15px_rgba(219,0,7,0.6)]"
            />
          </div>
          <svg className="absolute inset-0 h-full w-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="arsenal-cannon-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <line x1="10" y1="20" x2="30" y2="20" stroke="#db0007" strokeWidth="1.2" opacity="0.4" />
                <circle cx="20" cy="20" r="2.5" fill="#9c824a" opacity="0.7" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#arsenal-cannon-grid)" />
          </svg>
        </div>
      );

    // --- Official Team 5: Manchester United ---
    case "theme-man-united":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-red-600/30 blur-3xl animate-flame-flicker" />
          <div className="absolute -right-4 -bottom-4 h-44 w-44 opacity-20">
            <img
              src="/manu/manu-logo-transparent.png"
              alt=""
              className="h-full w-full object-contain filter drop-shadow-[0_0_15px_rgba(255,229,0,0.6)]"
            />
          </div>
          <svg className="absolute inset-0 h-full w-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="manu-trident" width="40" height="40" patternUnits="userSpaceOnUse">
                <line x1="20" y1="8" x2="20" y2="32" stroke="#da291c" strokeWidth="1" opacity="0.4" />
                <polygon points="16,14 20,8 24,14" fill="#ffe500" opacity="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#manu-trident)" />
          </svg>
        </div>
      );

    // --- Official Team 6: Chelsea FC ---
    case "theme-chelsea-fc":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -top-10 right-0 h-64 w-64 rounded-full bg-blue-700/25 blur-3xl" />
          <div className="absolute -right-4 -bottom-4 h-44 w-44 opacity-20">
            <img
              src="/chelsea/chelsea-logo-transparent.png"
              alt=""
              className="h-full w-full object-contain filter drop-shadow-[0_0_15px_rgba(3,70,148,0.6)]"
            />
          </div>
          <svg className="absolute inset-0 h-full w-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="chelsea-lion-grid" width="42" height="42" patternUnits="userSpaceOnUse">
                <circle cx="21" cy="21" r="14" fill="none" stroke="#034694" strokeWidth="0.8" opacity="0.4" />
                <circle cx="21" cy="21" r="3" fill="#dba111" opacity="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#chelsea-lion-grid)" />
          </svg>
        </div>
      );

    // --- Official Team 7: Manchester City ---
    case "theme-man-city":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-sky-500/25 blur-3xl" />
          <div className="absolute -right-4 -bottom-4 h-44 w-44 opacity-20">
            <img
              src="/man city/mancity-logo-transparent.png"
              alt=""
              className="h-full w-full object-contain filter drop-shadow-[0_0_15px_rgba(108,171,221,0.6)]"
            />
          </div>
          <svg className="absolute inset-0 h-full w-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="mancity-wave" width="36" height="36" patternUnits="userSpaceOnUse">
                <path d="M 0 18 Q 9 9 18 18 T 36 18" fill="none" stroke="#6cabdd" strokeWidth="0.8" opacity="0.4" />
                <circle cx="18" cy="18" r="1.5" fill="#ffffff" opacity="0.7" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mancity-wave)" />
          </svg>
        </div>
      );

    // --- Official Team 8: Atlético de Madrid ---
    case "theme-atletico-madrid":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -bottom-10 left-0 h-64 w-64 rounded-full bg-red-600/25 blur-3xl" />
          <div className="absolute -right-4 -bottom-4 h-44 w-44 opacity-20">
            <img
              src="/atleteco di madrid/atletico-logo-transparent.png"
              alt=""
              className="h-full w-full object-contain filter drop-shadow-[0_0_15px_rgba(203,53,36,0.6)]"
            />
          </div>
          <svg className="absolute inset-0 h-full w-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="atleti-stars" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1.5" fill="#ffffff" opacity="0.7" />
                <circle cx="20" cy="15" r="1.5" fill="#cb3524" opacity="0.7" />
                <circle cx="30" cy="10" r="1.5" fill="#ffffff" opacity="0.7" />
                <line x1="0" y1="40" x2="40" y2="0" stroke="#cb3524" strokeWidth="0.6" opacity="0.25" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#atleti-stars)" />
          </svg>
        </div>
      );

    // --- Official Team 9: Paris Saint-Germain ---
    case "theme-psg":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-blue-800/30 blur-3xl" />
          <svg className="absolute inset-0 h-full w-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="psg-eiffel" width="44" height="44" patternUnits="userSpaceOnUse">
                <path d="M 22 6 L 16 38 L 28 38 Z" fill="none" stroke="#da291c" strokeWidth="0.8" opacity="0.35" />
                <circle cx="22" cy="6" r="2" fill="#d4af37" opacity="0.7" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#psg-eiffel)" />
          </svg>
        </div>
      );

    // --- Official Team 10: FC Bayern München ---
    case "theme-bayern-munchen":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-red-600/30 blur-3xl" />
          <div className="absolute -right-4 -bottom-4 h-44 w-44 opacity-20">
            <img
              src="/bayern/vecteezy_fc-bayern-munchen-logo-on-transparent-background_14414704.jpg"
              alt=""
              className="h-full w-full object-contain filter drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]"
            />
          </div>
          <svg className="absolute inset-0 h-full w-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="bayern-diamond" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 16 0 L 32 16 L 16 32 L 0 16 Z" fill="none" stroke="#dc052d" strokeWidth="0.8" opacity="0.35" />
                <circle cx="16" cy="16" r="1.5" fill="#0066b2" opacity="0.7" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bayern-diamond)" />
          </svg>
        </div>
      );

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



