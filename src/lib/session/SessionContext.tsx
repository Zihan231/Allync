"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Mode = "player" | "organizer";
export type GameId = "efootball" | "pubg" | "freefire" | "valorant";
export type KycStatus = "unverified" | "pending" | "verified";
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
  name: string;
  email: string;
  initials: string;
  mode: Mode;
  activeGame: GameId;
  kycStatus: KycStatus;
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

function defaultUser(): MockUser {
  return {
    id: "demo-user",
    name: "Rakib Hasan",
    email: "rakib@example.com",
    initials: "RH",
    mode: "player",
    activeGame: "efootball",
    kycStatus: "unverified",
    wallet: { balanceBdt: 4200 },
    club: { id: "red-falcons", name: "Red Falcons", role: "Captain" },
    community: { id: "dhaka-elite", name: "Dhaka Elite Community", role: "Member" },
    // To demo the Organizer "Community Management" page, flip role above to "President".
  };
}

type SessionContextValue = {
  user: MockUser;
  setMode: (mode: Mode) => void;
  setActiveGame: (game: GameId) => void;
  setKycStatus: (status: KycStatus) => void;
  updateProfile: (input: { name?: string; email?: string }) => void;
  login: (input: { email: string; name?: string }) => void;
  signup: (input: { name: string; email: string; joinAs: Mode }) => void;
  logout: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const STORAGE_KEY = "allync-session";

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

  const signup: SessionContextValue["signup"] = ({ name, email, joinAs }) => {
    const base = defaultUser();
    persist({
      ...base,
      name,
      email,
      initials: initialsFromName(name),
      mode: joinAs,
    });
  };

  const logout = () => persist(defaultUser());

  const value = useMemo(
    () => ({ user, setMode, setActiveGame, setKycStatus, updateProfile, login, signup, logout }),
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
