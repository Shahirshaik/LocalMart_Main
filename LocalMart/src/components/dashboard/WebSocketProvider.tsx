"use client";

/**
 * LocalMart — WebSocket Provider
 * ───────────────────────────────
 * • Connects to the Python WS server at NEXT_PUBLIC_WS_URL
 * • Sends Supabase JWT on open (auth handshake)
 * • Parses all incoming events and dispatches them to listeners
 * • Fires browser Notification API for PENDING_BOARD_REVIEW / PENDING_CEO_APPROVAL
 * • Reconnects automatically with exponential back-off (max 30s)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────

export type WSEventType =
  | "auth_ok"
  | "error"
  | "agent.task"
  | "agent.shortage"
  | "agent.complete"
  | "proposal.pending_board_review"
  | "proposal.pending_ceo_approval"
  | "proposal.executed"
  | "proposal.rejected"
  | "alert.board"
  | "alert.ceo"
  | "system.heartbeat";

export interface WSEvent {
  type:       WSEventType;
  timestamp:  number;
  [key: string]: unknown;
}

export type WSListener = (event: WSEvent) => void;

interface WSContextValue {
  connected:   boolean;
  lastEvent:   WSEvent | null;
  subscribe:   (listener: WSListener) => () => void;
}

// ── Context ───────────────────────────────────────────────────

const WSContext = createContext<WSContextValue>({
  connected:  false,
  lastEvent:  null,
  subscribe:  () => () => {},
});

export function useWebSocket() {
  return useContext(WSContext);
}

// ── Provider ──────────────────────────────────────────────────

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "wss://localmart.in/ws/";
const MAX_BACKOFF_MS = 30_000;

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const supabase              = createClient();
  const wsRef                 = useRef<WebSocket | null>(null);
  const listenersRef          = useRef<Set<WSListener>>(new Set());
  const reconnectTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef            = useRef<number>(1000);
  const unmountedRef          = useRef(false);

  const [connected, setConnected]  = useState(false);
  const [lastEvent, setLastEvent]  = useState<WSEvent | null>(null);

  const dispatch = useCallback((event: WSEvent) => {
    setLastEvent(event);
    listenersRef.current.forEach(fn => {
      try { fn(event); } catch {}
    });
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  const fireDesktopNotification = useCallback((event: WSEvent) => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    const NOTIFY_TYPES: Partial<Record<WSEventType, { title: string; body: (e: WSEvent) => string; icon: string }>> = {
      "proposal.pending_board_review": {
        title: "Board Action Required 🗳️",
        body:  e => `"${e.title ?? "A proposal"}" needs your vote.`,
        icon:  "/icon-board.png",
      },
      "proposal.pending_ceo_approval": {
        title: "CEO Sign-off Required 👑",
        body:  e => `"${e.title ?? "A proposal"}" awaits your final approval.`,
        icon:  "/icon-ceo.png",
      },
      "agent.shortage": {
        title: "Supply Alert ⚠️",
        body:  e => `Shortage detected in ${e.district ?? "unknown"} — ${e.vertical ?? ""}.`,
        icon:  "/icon-alert.png",
      },
    };

    const cfg = NOTIFY_TYPES[event.type];
    if (!cfg) return;

    const n = new Notification(cfg.title, {
      body:      cfg.body(event),
      icon:      cfg.icon,
      tag:       `${event.type}-${event.proposal_id ?? event.timestamp}`,
      requireInteraction: true,
    });
    n.onclick = () => {
      window.focus();
      // Route to the correct dashboard section
      if (event.type.startsWith("proposal.")) {
        window.location.href = `/ceo/proposals?id=${event.proposal_id ?? ""}`;
      }
    };
  }, []);

  const connect = useCallback(async () => {
    if (unmountedRef.current) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      // Not logged in — retry in 5s in case auth is slow
      reconnectTimerRef.current = setTimeout(connect, 5000);
      return;
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", token: session.access_token }));
    };

    ws.onmessage = (ev) => {
      try {
        const event: WSEvent = JSON.parse(ev.data);
        if (event.type === "auth_ok") {
          setConnected(true);
          backoffRef.current = 1000;   // reset on successful auth
          requestNotificationPermission();
        } else if (event.type === "error") {
          console.error("[WS] Server error:", event.message);
        } else {
          fireDesktopNotification(event);
          dispatch(event);
        }
      } catch {}
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      if (!unmountedRef.current) {
        const delay = Math.min(backoffRef.current, MAX_BACKOFF_MS);
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
        reconnectTimerRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [supabase, dispatch, fireDesktopNotification, requestNotificationPermission]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();

    // Re-connect when Supabase session is refreshed
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          wsRef.current?.close();
        }
        if (event === "SIGNED_OUT") {
          wsRef.current?.close();
          setConnected(false);
        }
      }
    );

    return () => {
      unmountedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      subscription.unsubscribe();
    };
  }, [connect, supabase]);

  const subscribe = useCallback((listener: WSListener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  return (
    <WSContext.Provider value={{ connected, lastEvent, subscribe }}>
      {children}
    </WSContext.Provider>
  );
}
