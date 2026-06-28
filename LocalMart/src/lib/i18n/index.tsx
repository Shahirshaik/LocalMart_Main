"use client";

/**
 * LocalMart i18n — Bulletproof React Context Localization
 *
 * Guarantees:
 *   - NEVER throws, even if a key is missing in the active locale
 *   - Falls back: active locale → English → raw key (never blank)
 *   - localStorage("lm_lang") persistence; SSR-safe (no hydration mismatch)
 *   - {{varName}} interpolation in translation strings
 *   - useTranslation() alias matches react-i18next interface for drop-in compat
 *   - changeLanguage() for programmatic switching (same interface as react-i18next)
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import te from "./locales/te.json";
import ta from "./locales/ta.json";
import kn from "./locales/kn.json";
import mr from "./locales/mr.json";
import bn from "./locales/bn.json";
import pa from "./locales/pa.json";

// ── Types ─────────────────────────────────────────────────────────────────────

export type LangCode = "en" | "hi" | "te" | "ta" | "kn" | "mr" | "bn" | "pa";

export type TranslationVars = Record<string, string | number>;

// Matches react-i18next's TFunction interface
export type TFunction = (key: string, vars?: TranslationVars | { count?: number; [k: string]: unknown }) => string;

interface I18nContextType {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  changeLanguage: (lang: LangCode) => void;  // react-i18next alias
  t: TFunction;
  isReady: boolean;
}

// ── Dictionary registry ────────────────────────────────────────────────────────

// Typed as Record<string, unknown> so partial locale files (missing new keys) don't
// cause TS errors — the lookup() function and English fallback handle any gaps.
const DICTS: Record<LangCode, Record<string, unknown>> = { en, hi, te, ta, kn, mr, bn, pa } as Record<LangCode, Record<string, unknown>>;

export const LANGUAGES: { code: LangCode; label: string; native: string; flag: string }[] = [
  { code: "en", label: "English",  native: "English",    flag: "🇬🇧" },
  { code: "hi", label: "Hindi",    native: "हिन्दी",    flag: "🇮🇳" },
  { code: "te", label: "Telugu",   native: "తెలుగు",    flag: "🇮🇳" },
  { code: "ta", label: "Tamil",    native: "தமிழ்",     flag: "🇮🇳" },
  { code: "kn", label: "Kannada",  native: "ಕನ್ನಡ",    flag: "🇮🇳" },
  { code: "mr", label: "Marathi",  native: "मराठी",     flag: "🇮🇳" },
  { code: "bn", label: "Bengali",  native: "বাংলা",     flag: "🇮🇳" },
  { code: "pa", label: "Punjabi",  native: "ਪੰਜਾਬੀ",  flag: "🇮🇳" },
];

// ── Key resolver — dot.notation traversal with fallback chain ─────────────────

function resolveKey(dict: Record<string, unknown>, keys: string[]): string {
  let node: unknown = dict;
  for (const k of keys) {
    if (node === null || typeof node !== "object") return "";
    node = (node as Record<string, unknown>)[k];
  }
  return typeof node === "string" && node.length > 0 ? node : "";
}

function interpolate(str: string, vars: TranslationVars): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{{${k}}}`
  );
}

/** translate() — safe standalone function, never throws, never returns empty string */
function translate(
  langCode: LangCode,
  key: string,
  vars?: TranslationVars,
): string {
  if (!key || typeof key !== "string") return "";
  const keys = key.split(".");

  // 1. Try active locale
  let result = resolveKey(DICTS[langCode] as Record<string, unknown>, keys);

  // 2. Fall back to English
  if (!result && langCode !== "en") {
    result = resolveKey(DICTS.en as Record<string, unknown>, keys);
  }

  // 3. Fall back to the raw key so the UI always shows something
  if (!result) return key;

  // 4. Variable substitution
  if (vars && Object.keys(vars).length > 0) {
    result = interpolate(result, vars as TranslationVars);
  }

  return result;
}

// ── Context ───────────────────────────────────────────────────────────────────

const I18nContext = createContext<I18nContextType>({
  lang:           "en",
  setLang:        () => {},
  changeLanguage: () => {},
  t:              (key) => key,
  isReady:        false,
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState]   = useState<LangCode>("en");
  const [isReady, setIsReady]  = useState(false);
  const listenerRef            = useRef<Array<(lang: LangCode) => void>>([]);

  useEffect(() => {
    try {
      const stored = (localStorage.getItem("lm_lang") ?? "") as LangCode;
      if (stored && stored in DICTS) setLangState(stored);
    } catch {
      // localStorage may be blocked in private mode — silently ignore
    }
    setIsReady(true);
  }, []);

  const setLang = useCallback((l: LangCode) => {
    if (!(l in DICTS)) return;
    setLangState(l);
    try {
      localStorage.setItem("lm_lang", l);
    } catch {}
    listenerRef.current.forEach(fn => { try { fn(l); } catch {} });
  }, []);

  const t: TFunction = useCallback(
    (key, vars?) => translate(lang, key, vars as TranslationVars | undefined),
    [lang],
  );

  const value = useMemo<I18nContextType>(() => ({
    lang,
    setLang,
    changeLanguage: setLang,
    t,
    isReady,
  }), [lang, setLang, t, isReady]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Primary hook — use this in all client components */
export function useI18n() {
  return useContext(I18nContext);
}

/**
 * useTranslation — react-i18next compatible alias
 *
 * Matches the react-i18next interface so components can be migrated later
 * without touching call sites.
 *
 * Usage:
 *   const { t, i18n } = useTranslation();
 *   t("nav.sell")             // simple lookup
 *   t("feed.days_ago", {n:3}) // with vars
 *   i18n.changeLanguage("hi") // switch language
 */
export function useTranslation() {
  const ctx = useContext(I18nContext);
  return {
    t:    ctx.t,
    i18n: {
      language:       ctx.lang,
      changeLanguage: ctx.setLang,
      isInitialized:  ctx.isReady,
    },
    ready: ctx.isReady,
  };
}

// ── Re-export for convenience ─────────────────────────────────────────────────

export type { I18nContextType };
