"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { addPerson, getPerson, getClub, getCommunity } from "@/lib/mock/communityStore";
import type { VerificationLevel } from "@/lib/mock/types";

export type Mode = "player" | "organizer";
export type GameId = "efootball" | "pubg" | "freefire" | "valorant";
export type KycStatus = "unverified" | "pending" | "verified";
export type VerificationStatus = "unverified" | "pending" | "verified";
export type ClubRole = "President" | "Manager" | "Captain" | "Player";
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

function defaultUser(): MockUser {
  return {
    id: "demo-user",
    personId: "person-rakib-hasan",
    name: "Rakib Hasan",
    email: "rakib@example.com",
    initials: "RH",
    dpUrl: null,
    mode: "player",
    activeGame: "efootball",
    kycStatus: "unverified",
    verificationStatus: "verified",
    verificationLevel: 3,
    wallet: { balanceBdt: 4200 },
    club: { id: "red-falcons", name: "Red Falcons", role: "Captain" },
    community: { id: "dhaka-elite", name: "Dhaka Elite Community", role: "Member" },
    // To demo the Organizer "Community Management" page, flip role above to "President",
    // or use the Demo Persona switcher in the topbar user menu instead.
  };
}

type SessionContextValue = {
  user: MockUser;
  setMode: (mode: Mode) => void;
  setActiveGame: (game: GameId) => void;
  setKycStatus: (status: KycStatus) => void;
  setVerificationStatus: (status: VerificationStatus) => void;
  setVerificationLevel: (level: VerificationLevel) => void;
  setDpUrl: (dpUrl: string | null) => void;
  setClub: (club: MockUser["club"]) => void;
  setCommunity: (community: MockUser["community"]) => void;
  updateProfile: (input: { name?: string; email?: string }) => void;
  login: (input: { email: string; name?: string }) => void;
  signup: (input: { name: string; email: string }) => void;
  switchPersona: (personId: string) => void;
  logout: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const STORAGE_KEY = "ALLYNQ-session";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser>(defaultUser);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored) as MockUser);
      } catch {
        // fall back to the seeded default
      }
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser()));
    }
  }, []);

  const persist = (next: MockUser) => {
    setUser(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const setMode = (mode: Mode) => persist({ ...user, mode });
  const setActiveGame = (activeGame: GameId) => persist({ ...user, activeGame });
  const setKycStatus = (kycStatus: KycStatus) => persist({ ...user, kycStatus });
  const setVerificationStatus = (verificationStatus: VerificationStatus) =>
    persist({ ...user, verificationStatus });
  const setVerificationLevel = (verificationLevel: VerificationLevel) =>
    persist({ ...user, verificationLevel });
  const setDpUrl = (dpUrl: string | null) => persist({ ...user, dpUrl });
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

  const login: SessionContextValue["login"] = ({ email, name }) => {
    const base = defaultUser();
    const nextName = name ?? base.name;
    persist({
      ...base,
      email,
      name: nextName,
      initials: initialsFromName(nextName),
    });
  };

  const signup: SessionContextValue["signup"] = ({ name, email }) => {
    const id = `${slugify(name) || "player"}-${Date.now()}`;
    const personId = `person-${id}`;
    addPerson({
      id: personId,
      name,
      dpUrl: null,
      coverUrl: null,
      clubId: null,
      clubRole: null,
      communityId: null,
      communityRole: null,
      points: 0,
    });
    persist({
      id,
      personId,
      name,
      email,
      initials: initialsFromName(name),
      dpUrl: null,
      mode: "player",
      activeGame: "efootball",
      kycStatus: "unverified",
      verificationStatus: "unverified",
      verificationLevel: 0,
      wallet: { balanceBdt: 0 },
      club: null,
      community: null,
    });
  };

  const switchPersona = (personId: string) => {
    const person = getPerson(personId);
    if (!person) return;
    persist({
      id: personId,
      personId,
      name: person.name,
      email: `${slugify(person.name)}@example.com`,
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
    });
  };

  const logout = () => persist(defaultUser());

  const value = useMemo(
    () => ({
      user,
      setMode,
      setActiveGame,
      setKycStatus,
      setVerificationStatus,
      setVerificationLevel,
      setDpUrl,
      setClub,
      setCommunity,
      updateProfile,
      login,
      signup,
      switchPersona,
      logout,
    }),
    [user]
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
