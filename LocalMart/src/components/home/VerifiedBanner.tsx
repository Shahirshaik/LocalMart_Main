"use client";

import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";

export function VerifiedBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      className="mx-4 my-3 rounded-xl flex items-center gap-3 p-4 relative"
      style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}
    >
      <span className="text-3xl shrink-0">🛡️</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-gray-900 leading-tight">
          You are eligible for Verified
        </p>
        <p className="text-xs text-gray-500 mt-0.5">Gain instant trust of buyers</p>
      </div>
      <Link
        href="/auth/signup"
        className="shrink-0 px-4 py-2 rounded-lg text-sm font-bold text-white min-h-[44px] flex items-center"
        style={{ background: "#3B0764" }}
      >
        Get Verified
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/50 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5 text-gray-400" />
      </button>
    </div>
  );
}
