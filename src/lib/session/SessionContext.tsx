"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api/client";
import { addPerson, getPerson, getClub, getCommunity, syncFromBackend } from "@/lib/mock/communityStore";
import type { VerificationLevel } from "@/lib/mock/types";

export type Mode = "player" | "organizer";
export type GameId = "efootball" | "pubg" | "freefire" | "valorant";
export type KycStatus = "unverified" | "pending" | "verified";
export type VerificationStatus = "unverified" | "pending" | "verified";
export type ClubRole =
  | "President"
  | "General Secretary"
  | "Captain"
  | "Vice-Captain"
  | "Academy Captain"
  | "Manager"
  | "Player";
export type CommunityRole =
  | "President"
  | "Vice President"
  | "Team Manager"
  | "Head of Discipline"
  | "Scout"
  | "Member";

export type MockUser = {
  id: string;
  personId: string;
  name: string;
  email: string;
  initials: string;
  dpUrl: string | null;
  mode: Mode;
  activeGame: GameId;
  kycStatus: KycStatus;
  verificationStatus: VerificationStatus;
  verificationLevel: VerificationLevel;
  wallet: { balanceBdt: number };
  club: { id: string; name: string; role: ClubRole } | null;
  community: { id: string; name: string; role: CommunityRole } | null;
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function emptyUser(): MockUser {
  return {
    id: "",
    personId: "",
    name: "Player",
    email: "",
    initials: "PL",
    dpUrl: null,
    mode: "player",
    activeGame: "efootball",
    kycStatus: "unverified",
    verificationStatus: "unverified",
    verificationLevel: 0,
    wallet: { balanceBdt: 0 },
    club: null,
    community: null,
  };
}

function backendUserToMockUser(u: any): MockUser {
  const ef = u.efootballProfile;
  const name = u.name || "Player";
  const initials = initialsFromName(name);
  return {
    id: u.id,
    personId: "person-" + u.id,
    name,
    email: u.email || "",
    initials,
    dpUrl: u.dpUrl || null,
    mode: "player",
    activeGame: "efootball",
    kycStatus: u.verificationLevel > 0 ? "verified" : "unverified",
    verificationStatus: u.verificationLevel > 0 ? "verified" : "unverified",
    verificationLevel: (u.verificationLevel ?? 0) as VerificationLevel,
    wallet: { balanceBdt: ef?.points ? Math.round(ef.points * 3.5) : 3500 },
    club: ef?.club
      ? {
          id: ef.club.id,
          name: ef.club.name,
          role: (ef.clubRole as ClubRole) || "Player",
        }
      : null,
    community: ef?.community
      ? {
          id: ef.community.id,
          name: ef.community.name,
          role: (ef.communityRole as CommunityRole) || "Member",
        }
      : null,
  };
}

type SessionContextValue = {
  user: MockUser;
  isAuthenticated: boolean;
  isLoading: boolean;
  setMode: (mode: Mode) => void;
  setActiveGame: (game: GameId) => void;
  setKycStatus: (status: KycStatus) => void;
  setVerificationStatus: (status: VerificationStatus) => void;
  setVerificationLevel: (level: VerificationLevel) => void;
  setDpUrl: (dpUrl: string | null) => void;
  spendBdt: (amountBdt: number) => boolean;
  setClub: (club: MockUser["club"]) => void;
  setCommunity: (community: MockUser["community"]) => void;
  updateProfile: (input: { name?: string; email?: string }) => void;
  login: (input: { email: string; name?: string; password?: string }) => Promise<void>;
  signup: (input: { name: string; email: string; password?: string }) => Promise<void>;
  switchPersona: (personId: string) => void;
  logout: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const STORAGE_KEY = "ALLYNQ-session";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser>(emptyUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("ALLYNQ_TOKEN") : null;
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (token && stored) {
        const parsed = JSON.parse(stored) as MockUser;
        if (parsed && parsed.id) {
          setUser(parsed);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persist = (next: MockUser) => {
    setUser(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  };

  const setMode = (mode: Mode) => persist({ ...user, mode });
  const setActiveGame = (activeGame: GameId) => persist({ ...user, activeGame });
  const setKycStatus = (kycStatus: KycStatus) => persist({ ...user, kycStatus });
  const setVerificationStatus = (verificationStatus: VerificationStatus) =>
    persist({ ...user, verificationStatus });
  const setVerificationLevel = (verificationLevel: VerificationLevel) =>
    persist({ ...user, verificationLevel });
  const setDpUrl = (dpUrl: string | null) => persist({ ...user, dpUrl });
  const spendBdt = (amountBdt: number): boolean => {
    if (amountBdt <= 0 || user.wallet.balanceBdt < amountBdt) return false;
    persist({ ...user, wallet: { balanceBdt: user.wallet.balanceBdt - amountBdt } });
    return true;
  };
  const setClub = (club: MockUser["club"]) => persist({ ...user, club });
  const setCommunity = (community: MockUser["community"]) => persist({ ...user, community });

  const updateProfile: SessionContextValue["updateProfile"] = ({ name, email }) => {
    const nextName = name ?? user.name;
    persist({
      ...user,
      name: nextName,
      email: email ?? user.email,
      initials: initialsFromName(nextName),
    });
  };

  const login: SessionContextValue["login"] = async ({ email, password }) => {
    if (!password) {
      throw new Error("Please enter your password");
    }

    const res = await apiFetch<{ accessToken: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password }),
    });

    if (!res || !res.accessToken) {
      throw new Error("Failed to authenticate with server");
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem("ALLYNQ_TOKEN", res.accessToken);
    }

    const mock = backendUserToMockUser(res.user);
    persist(mock);
    setIsAuthenticated(true);

    syncFromBackend().catch(() => {});
  };

  const signup: SessionContextValue["signup"] = async ({ name, email, password }) => {
    if (!password) {
      throw new Error("Please enter a password");
    }

    const res = await apiFetch<{ accessToken: string; user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
    });

    if (!res || !res.accessToken) {
      throw new Error("Failed to register account");
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem("ALLYNQ_TOKEN", res.accessToken);
    }

    const mock = backendUserToMockUser(res.user);
    persist(mock);
    setIsAuthenticated(true);

    syncFromBackend().catch(() => {});
  };

  const switchPersona = (personId: string) => {
    const person = getPerson(personId);
    if (!person) return;
    const personaUser: MockUser = {
      id: personId,
      personId,
      name: person.name,
      email: slugify(person.name) + "@example.com",
      initials: initialsFromName(person.name),
      dpUrl: person.dpUrl,
      mode: "player",
      activeGame: "efootball",
      kycStatus: "verified",
      verificationStatus: "verified",
      verificationLevel: 3,
      wallet: { balanceBdt: 4200 },
      club:
        person.clubId && person.clubRole
          ? { id: person.clubId, name: getClub(person.clubId)?.name ?? person.clubId, role: person.clubRole }
          : null,
      community:
        person.communityId && person.communityRole
          ? {
              id: person.communityId,
              name: getCommunity(person.communityId)?.name ?? person.communityId,
              role: person.communityRole,
            }
          : null,
    };
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ALLYNQ_TOKEN", "demo-token-" + personId);
    }
    persist(personaUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("ALLYNQ_TOKEN");
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setUser(emptyUser());
    setIsAuthenticated(false);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      setMode,
      setActiveGame,
      setKycStatus,
      setVerificationStatus,
      setVerificationLevel,
      setDpUrl,
      spendBdt,
      setClub,
      setCommunity,
      updateProfile,
      login,
      signup,
      switchPersona,
      logout,
    }),
    [user, isAuthenticated, isLoading]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}
