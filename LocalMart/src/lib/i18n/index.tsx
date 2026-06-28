"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import te from "./locales/te.json";
import ta from "./locales/ta.json";
import kn from "./locales/kn.json";
import mr from "./locales/mr.json";
import bn from "./locales/bn.json";
import pa from "./locales/pa.json";

export type LangCode = "en" | "hi" | "te" | "ta" | "kn" | "mr" | "bn" | "pa";

const DICTS: Record<LangCode, typeof en> = { en, hi, te, ta, kn, mr, bn, pa };

export const LANGUAGES: { code: LangCode; label: string; native: string; flag: string }[] = [
  { code: "en", label: "English",  native: "English",  flag: "🇬🇧" },
  { code: "hi", label: "Hindi",    native: "हिन्दी",  flag: "🇮🇳" },
  { code: "te", label: "Telugu",   native: "తెలుగు",  flag: "🇮🇳" },
  { code: "ta", label: "Tamil",    native: "தமிழ்",   flag: "🇮🇳" },
  { code: "kn", label: "Kannada",  native: "ಕನ್ನಡ",  flag: "🇮🇳" },
  { code: "mr", label: "Marathi",  native: "मराठी",   flag: "🇮🇳" },
  { code: "bn", label: "Bengali",  native: "বাংলা",   flag: "🇮🇳" },
  { code: "pa", label: "Punjabi",  native: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
];

interface I18nContextType {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

function lookup(obj: Record<string, unknown>, keys: string[]): string {
  let cur: unknown = obj;
  for (const k of keys) {
    if (!cur || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[k];
  }
  return typeof cur === "string" ? cur : "";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("lm_lang") as LangCode | null;
    if (stored && DICTS[stored]) setLangState(stored);
  }, []);

  function setLang(l: LangCode) {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lm_lang", l);
  }

  function t(key: string, vars?: Record<string, string | number>): string {
    const keys = key.split(".");
    let str = lookup(DICTS[lang] as Record<string, unknown>, keys);
    if (!str) str = lookup(DICTS.en as Record<string, unknown>, keys);
    if (!str) return key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replaceAll(`{{${k}}}`, String(v));
      }
    }
    return str;
  }

  // Suppress hydration mismatch by not rendering children until mounted
  if (!mounted) {
    return (
      <I18nContext.Provider value={{ lang: "en", setLang, t }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
