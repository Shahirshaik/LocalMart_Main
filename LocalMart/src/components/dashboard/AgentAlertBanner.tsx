"use client";

/**
 * AgentAlertBanner — Real-time alert strip
 * ──────────────────────────────────────────
 * Sits at the top of CEO/Board dashboards.
 * Subscribes to the WebSocket context and surfaces:
 *   • proposal.pending_board_review
 *   • proposal.pending_ceo_approval
 *   • agent.shortage (critical gap score)
 *
 * Stacks up to 5 unacknowledged alerts.
 * Each alert has an "Act Now" deep-link + dismiss button.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, AlertTriangle, Bell, Zap } from "lucide-react";
import { useWebSocket, WSEvent } from "@/components/dashboard/WebSocketProvider";

// ── Types ─────────────────────────────────────────────────────

interface Alert {
  id:          string;
  type:        string;
  title:       string;
  body:        string;
  href:        string;
  priority:    "critical" | "high" | "info";
  timestamp:   number;
}

// ── Helpers ───────────────────────────────────────────────────

function buildAlert(event: WSEvent): Alert | null {
  const id = `${event.type}-${event.timestamp}`;
  const ts = event.timestamp as number;

  switch (event.type) {
    case "proposal.pending_board_review":
      return {
        id, type: event.type,
        title:    "Board Vote Needed",
        body:     `"${event.title ?? "A proposal"}" awaits your decision.`,
        href:     `/board/proposals?id=${event.proposal_id ?? ""}`,
        priority: (event.priority as string) === "critical" ? "critical" : "high",
        timestamp: ts,
      };
    case "proposal.pending_ceo_approval":
      return {
        id, type: event.type,
        title:    "CEO Approval Required",
        body:     `Board approved "${event.title ?? "a proposal"}". Your final sign-off is needed.`,
        href:     `/ceo/proposals?id=${event.proposal_id ?? ""}`,
        priority: "critical" as const,
        timestamp: ts,
      };
    case "agent.shortage":
      return {
        id, type: event.type,
        title:    `Supply Alert — ${event.district ?? "Unknown District"}`,
        body:     `Gap score ${event.gap_score ?? "??"}/100 in ${event.vertical ?? "a vertical"}. Agent awaiting approval.`,
        href:     `/ceo/ai-agents`,
        priority: (Number(event.gap_score) ?? 0) >= 80 ? "critical" as const : "high" as const,
        timestamp: ts,
      };
    default:
      return null;
  }
}

const PRIORITY_STYLE: Record<Alert["priority"], string> = {
  critical: "bg-red-600   border-red-500   text-white",
  high:     "bg-amber-500 border-amber-400 text-white",
  info:     "bg-indigo-600 border-indigo-500 text-white",
};

const PRIORITY_ICON: Record<Alert["priority"], React.ReactNode> = {
  critical: <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" />,
  high:     <Zap           className="h-4 w-4 shrink-0" />,
  info:     <Bell          className="h-4 w-4 shrink-0" />,
};

// ── Component ─────────────────────────────────────────────────

export default function AgentAlertBanner() {
  const { subscribe, connected } = useWebSocket();
  const [alerts, setAlerts]     = useState<Alert[]>([]);
  const seenIds                 = useRef(new Set<string>());

  useEffect(() => {
    const unsub = subscribe((event: WSEvent) => {
      const alert = buildAlert(event);
      if (!alert || seenIds.current.has(alert.id)) return;
      seenIds.current.add(alert.id);
      setAlerts(prev => [alert, ...prev].slice(0, 5));   // max 5
    });
    return unsub;
  }, [subscribe]);

  const dismiss = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (!connected && alerts.length === 0) return null;

  return (
    <div className="space-y-1.5 mb-4">
      {/* Connection badge */}
      <div className="flex items-center gap-1.5 mb-2">
        <div className={`h-2 w-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
        <span className="text-xs text-gray-500 font-medium">
          {connected ? "Live agent feed connected" : "Connecting to agent feed…"}
        </span>
      </div>

      {/* Alert stack */}
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${PRIORITY_STYLE[alert.priority]} transition-all`}
          role="alert"
        >
          {PRIORITY_ICON[alert.priority]}

          {/* Text */}
          <div className="flex-1 min-w-0">
            <span className="font-bold text-sm mr-2">{alert.title}</span>
            <span className="text-sm opacity-90 line-clamp-1">{alert.body}</span>
          </div>

          {/* CTA */}
          <Link
            href={alert.href}
            className="shrink-0 text-xs font-bold underline underline-offset-2 hover:no-underline whitespace-nowrap"
          >
            Act Now →
          </Link>

          {/* Dismiss */}
          <button
            onClick={() => dismiss(alert.id)}
            className="shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
