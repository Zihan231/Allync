"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { isApiError } from "@/lib/api/axios";
import { useMe } from "@/lib/api/hooks/useUsers";
import { useLoginMutation, useRegisterMutation, useLogoutMutation } from "@/lib/api/hooks/useAuth";
import { getPerson, getClub, getCommunity, syncFromBackend } from "@/lib/mock/communityStore";
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
  coverUrl?: string | null;
  bio?: string | null;
  phoneNumber?: string | null;
  permanentAddress?: string | null;
  mode: Mode;
  activeGame: GameId;
  kycStatus: KycStatus;
  verificationStatus: VerificationStatus;
  verificationLevel: VerificationLevel;
  wallet: { balanceBdt: number };
  club: { id: string; name: string; role: ClubRole } | null;
  community: { id: string; name: string; role: CommunityRole } | null;
  raw?: any;
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
    coverUrl: null,
    bio: null,
    phoneNumber: null,
    permanentAddress: null,
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

export function backendUserToMockUser(u: any): MockUser {
  const ef = u?.efootballProfile;
  const name = u?.name || "Player";
  const initials = initialsFromName(name);
  return {
    id: u?.id || "",
    personId: u?.id || "",
    name,
    email: u?.email || "",
    initials,
    dpUrl: u?.dpUrl || null,
    coverUrl: u?.coverUrl || null,
    bio: u?.bio || null,
    phoneNumber: u?.phoneNumber || null,
    permanentAddress: u?.permanentAddress || null,
    mode: "player",
    activeGame: "efootball",
    kycStatus: (u?.verificationLevel ?? 0) > 0 ? "verified" : "unverified",
    verificationStatus: (u?.verificationLevel ?? 0) > 0 ? "verified" : "unverified",
    verificationLevel: (u?.verificationLevel ?? 0) as VerificationLevel,
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
    raw: u,
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
  refreshSession: () => Promise<MockUser | null>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const STORAGE_KEY = "ALLYNQ-session";
// Auth itself lives in the httpOnly "allync_token" cookie the backend sets,
// which JS can't read. This flag is just a non-sensitive UX hint so we know
// whether to bother calling /users/me on load instead of always trying.
const SESSION_FLAG = "ALLYNQ_HAS_SESSION";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser>(emptyUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);
  const [hasSessionFlag, setHasSessionFlag] = useState(false);

  const persist = (next: MockUser) => {
    setUser(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  };

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();
  // Only enabled once we know (from localStorage) that a real backend session
  // might exist — avoids a wasted /users/me round trip for anonymous
  // visitors and demo personas (which never touch the backend at all).
  const meQuery = useMe(mounted && hasSessionFlag);

  // Hydrate from localStorage on mount and decide whether to enable the
  // /users/me query. Runs once, client-side only (avoids SSR/hydration
  // mismatches from touching localStorage during render).
  useEffect(() => {
    function hydrate() {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as MockUser;
          if (parsed && parsed.id) {
            setUser(parsed);
            setIsAuthenticated(true);
          }
        } catch {
          // ignore malformed cache
        }
      }
      const flag = window.localStorage.getItem(SESSION_FLAG) === "1";
      setHasSessionFlag(flag);
      setMounted(true);
      if (!flag) {
        setIsLoading(false);
      }
    }
    hydrate();
  }, []);

  // React to the /users/me query settling (initial load, or a background
  // refetch on window focus).
  useEffect(() => {
    function syncFromQuery() {
      if (!mounted || !hasSessionFlag) return;

      if (meQuery.isSuccess) {
        if (meQuery.data && meQuery.data.id) {
          persist(backendUserToMockUser(meQuery.data));
          setIsAuthenticated(true);
        }
        setIsLoading(false);
      } else if (meQuery.isError) {
        // Only a real 401 means the cookie is actually gone/expired — clear
        // the session then. Anything else (network hiccup, a free-tier
        // backend still cold-starting, a 5xx) should leave the
        // optimistically-restored cached user alone; otherwise every
        // transient failure on refresh would look like a logout.
        const isUnauthorized = isApiError(meQuery.error) && meQuery.error.status === 401;
        if (isUnauthorized) {
          window.localStorage.removeItem(SESSION_FLAG);
          window.localStorage.removeItem(STORAGE_KEY);
          setUser(emptyUser());
          setIsAuthenticated(false);
          setHasSessionFlag(false);
        } else {
          console.warn("Failed to refresh session from backend:", meQuery.error);
        }
        setIsLoading(false);
      }
    }
    syncFromQuery();
  }, [mounted, hasSessionFlag, meQuery.isSuccess, meQuery.isError, meQuery.data, meQuery.error]);

  const refreshSession = async (): Promise<MockUser | null> => {
    const result = await meQuery.refetch();
    if (result.data && result.data.id) {
      const mock = backendUserToMockUser(result.data);
      persist(mock);
      setIsAuthenticated(true);
      syncFromBackend(true).catch(() => {});
      return mock;
    }
    if (result.error) {
      console.warn("Failed to refresh session from backend:", result.error);
    }
    return null;
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

    const res = await loginMutation.mutateAsync({ email: email.trim(), password });

    if (!res || !res.user) {
      throw new Error("Failed to authenticate with server");
    }

    // The backend also sets the httpOnly auth cookie on this response; we
    // just remember locally that a real session exists so init() knows to
    // check it on reload.
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSION_FLAG, "1");
    }
    setHasSessionFlag(true);

    const mock = backendUserToMockUser(res.user);
    persist(mock);
    setIsAuthenticated(true);

    syncFromBackend(true).catch(() => {});
  };

  const signup: SessionContextValue["signup"] = async ({ name, email, password }) => {
    if (!password) {
      throw new Error("Please enter a password");
    }

    const res = await registerMutation.mutateAsync({ name: name.trim(), email: email.trim(), password });

    if (!res || !res.user) {
      throw new Error("Failed to register account");
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSION_FLAG, "1");
    }
    setHasSessionFlag(true);

    const mock = backendUserToMockUser(res.user);
    persist(mock);
    setIsAuthenticated(true);

    syncFromBackend(true).catch(() => {});
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
      coverUrl: person.coverUrl,
      bio: person.bio || null,
      phoneNumber: person.phoneNumber || null,
      permanentAddress: person.permanentAddress || null,
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
    // Demo personas are local-only and never touch the backend, so we
    // deliberately don't set SESSION_FLAG here — that would make the
    // /users/me query run on reload, get a 401, and wipe the persona.
    persist(personaUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Fire-and-forget: clears the httpOnly cookie server-side and the
    // cached /users/me query. Local state is cleared immediately regardless
    // of whether this call succeeds.
    logoutMutation.mutate();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SESSION_FLAG);
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setHasSessionFlag(false);
    setUser(emptyUser());
    setIsAuthenticated(false);
  };

  const value: SessionContextValue = {
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
    refreshSession,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}
