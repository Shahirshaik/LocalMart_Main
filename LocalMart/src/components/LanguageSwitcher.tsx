"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { useI18n, LANGUAGES, type LangCode } from "@/lib/i18n";

interface LanguageSwitcherProps {
  /** Renders as a compact icon button (for navbar embedding) vs full width list */
  compact?: boolean;
  /** Called after language changes */
  onClose?: () => void;
}

export default function LanguageSwitcher({ compact = false, onClose }: LanguageSwitcherProps) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function choose(code: LangCode) {
    setLang(code);
    setOpen(false);
    onClose?.();
  }

  if (!compact) {
    // Inline list mode — used inside profile dropdown
    return (
      <div>
        <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {t("nav.language")}
        </p>
        <div className="grid grid-cols-2 gap-1 px-2 pb-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => choose(l.code)}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                lang === l.code
                  ? "bg-purple-50 text-purple-700 font-semibold"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span className="truncate">{l.native}</span>
              {lang === l.code && <Check className="h-3 w-3 ml-auto shrink-0 text-purple-600" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Compact globe-icon dropdown mode
  const current = LANGUAGES.find((l) => l.code === lang)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={t("nav.language")}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{current.native}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2 overflow-hidden">
          <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {t("nav.language")}
          </p>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => choose(l.code)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                lang === l.code
                  ? "bg-purple-50 text-purple-700 font-semibold"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <span className="text-base shrink-0">{l.flag}</span>
              <span className="flex-1 text-left">{l.native}</span>
              <span className="text-xs text-gray-400">{l.label}</span>
              {lang === l.code && <Check className="h-3 w-3 text-purple-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
