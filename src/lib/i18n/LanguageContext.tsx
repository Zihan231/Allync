"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translations, type Locale, type TranslationDict } from "./translations";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: TranslationDict;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "ALLYNQ-locale";

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always start from the SSR-safe default. Reading localStorage directly in
  // the useState initializer would make the client's very first render
  // (before hydration reconciles) disagree with the server-rendered markup
  // whenever a stored locale differs from "en" — a classic hydration
  // mismatch. Syncing from storage in a mount-only effect instead means the
  // first client render matches the server, then updates right after.
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "bn") {
      setLocaleState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "bn" ? "bn" : "en";
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  const toggleLocale = () => setLocale(locale === "en" ? "bn" : "en");

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale, t: translations[locale] }),
    [locale]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
