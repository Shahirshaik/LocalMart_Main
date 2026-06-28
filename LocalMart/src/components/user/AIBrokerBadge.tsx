"use client";

import { Bot, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface AIBrokerBadgeProps {
  animated?: boolean;
  /** If true renders a larger card-style badge (for dashboards) */
  card?: boolean;
  negotiating?: boolean;
}

export default function AIBrokerBadge({ animated = true, card = false, negotiating = true }: AIBrokerBadgeProps) {
  const { t } = useI18n();

  if (card) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-purple-200"
        style={{ background: "linear-gradient(135deg,#3B0764 0%,#4C1D95 50%,#6D28D9 100%)" }}>
        {/* Animated shimmer */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)",
              animation: animated ? "shimmer 2s infinite" : "none",
              backgroundSize: "200% 100%",
            }}
          />
        </div>

        <div className="relative p-4 flex items-start gap-3">
          {/* Pulsing bot icon */}
          <div className="relative shrink-0">
            <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            {animated && negotiating && (
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-400 border-2 border-purple-900"
                style={{ animation: "ping-slow 1.5s ease-in-out infinite" }} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-bold text-white">{t("chat.ai_badge")}</p>
              {negotiating && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-green-400/20 text-green-300">
                  <Zap className="h-2.5 w-2.5" />
                  LIVE
                </span>
              )}
            </div>
            <p className="text-xs text-purple-200 leading-snug">{t("chat.ai_negotiating")}</p>
          </div>
        </div>
      </div>
    );
  }

  // Inline badge (for chat thread header)
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold"
      style={{ background: "linear-gradient(135deg,#3B0764,#6D28D9)", color: "white" }}>
      <Bot className="h-3.5 w-3.5" />
      <span>{t("chat.ai_badge")}</span>
      {animated && negotiating && (
        <span className="h-1.5 w-1.5 rounded-full bg-green-400"
          style={{ animation: "ping-slow 1.5s ease-in-out infinite" }} />
      )}
    </div>
  );
}
