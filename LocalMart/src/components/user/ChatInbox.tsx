"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Search, ArrowLeft, ShoppingBag, Sparkles, ShieldCheck, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import AIBrokerBadge from "./AIBrokerBadge";

interface Conversation {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  last_message: string | null;
  last_message_at: string;
  ai_proxy_active: boolean;
  agent_invited: boolean;
  agent_id: string | null;
  buyer_unread: number;
  seller_unread: number;
  listing_title?: string;
  other_name?: string;
  other_id?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_ai: boolean;
  is_agent: boolean;
  created_at: string;
}

interface ChatInboxProps {
  currentUserId: string;
  initialConversationId?: string | null;
}

export default function ChatInbox({ currentUserId, initialConversationId }: ChatInboxProps) {
  const { t } = useI18n();
  const supabase = createClient();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialConversationId ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showMobileThread, setShowMobileThread] = useState(!!initialConversationId);
  const [showAgentConfirm, setShowAgentConfirm] = useState(false);
  const [invitingAgent, setInvitingAgent] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find((c) => c.id === activeId);

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from("conversations")
      .select(`id, listing_id, buyer_id, seller_id, last_message,
        last_message_at, ai_proxy_active, agent_invited, agent_id,
        buyer_unread, seller_unread`)
      .or(`buyer_id.eq.${currentUserId},seller_id.eq.${currentUserId}`)
      .order("last_message_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    const enriched: Conversation[] = await Promise.all(
      data.map(async (conv) => {
        const otherId = conv.buyer_id === currentUserId ? conv.seller_id : conv.buyer_id;
        const [{ data: userRow }, { data: listingRow }] = await Promise.all([
          supabase.from("users").select("full_name").eq("id", otherId).single(),
          conv.listing_id
            ? supabase.from("listings").select("title").eq("id", conv.listing_id).single()
            : Promise.resolve({ data: null }),
        ]);
        return {
          ...conv,
          agent_invited: conv.agent_invited ?? false,
          agent_id: conv.agent_id ?? null,
          other_id: otherId,
          other_name: userRow?.full_name ?? "Unknown",
          listing_title: listingRow?.title ?? undefined,
        };
      })
    );

    setConversations(enriched);
    setLoading(false);
  }, [currentUserId, supabase]);

  const loadMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, is_ai, is_agent, created_at")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages(data ?? []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [supabase]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);

    const channel = supabase
      .channel(`messages:${activeId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Message];
          });
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeId, loadMessages, supabase]);

  async function sendMessage() {
    if (!draft.trim() || !activeId || sending) return;
    setSending(true);
    const text = draft.trim();
    setDraft("");
    inputRef.current?.focus();

    const { error } = await supabase.from("messages").insert({
      conversation_id: activeId,
      sender_id: currentUserId,
      content: text,
      is_ai: false,
      is_agent: false,
    });

    if (!error) {
      await supabase.from("conversations").update({
        last_message: text,
        last_message_at: new Date().toISOString(),
        ...(activeConv?.buyer_id === currentUserId
          ? { seller_unread: (activeConv?.seller_unread ?? 0) + 1 }
          : { buyer_unread: (activeConv?.buyer_unread ?? 0) + 1 }),
      }).eq("id", activeId);
      loadConversations();
    }
    setSending(false);
  }

  async function inviteAreaAgent() {
    if (!activeId || invitingAgent) return;
    setInvitingAgent(true);
    setShowAgentConfirm(false);

    // Mark conversation as agent-invited
    await supabase.from("conversations").update({
      agent_invited: true,
    }).eq("id", activeId);

    // Insert a system message
    await supabase.from("messages").insert({
      conversation_id: activeId,
      sender_id: currentUserId,
      content: "🛡️ Area Agent has been requested for this deal. The local Master Agent for this PIN code will be notified to mediate and verify this transaction. LocalMart charges 0% commission — any fee goes directly to the agent.",
      is_ai: true,
      is_agent: false,
    });

    await loadConversations();
    await loadMessages(activeId);
    setInvitingAgent(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function selectConv(id: string) {
    setActiveId(id);
    setShowMobileThread(true);
  }

  const filteredConvs = conversations.filter((c) =>
    !searchQuery ||
    c.other_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.listing_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString())
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { day: "numeric", month: "short" });
  }

  return (
    <div className="flex bg-white overflow-hidden border border-gray-200 rounded-2xl shadow-sm"
      style={{ height: "calc(100dvh - 120px)", minHeight: 400 }}>

      {/* ── Conversation list ── */}
      <div className={`${showMobileThread ? "hidden" : "flex"} md:flex w-full md:w-[300px] lg:w-[360px] flex-col border-r border-gray-100 bg-gray-50 shrink-0`}>
        <div className="p-4 border-b border-gray-200 bg-white shrink-0">
          <h2 className="text-base font-bold text-gray-900 mb-3">{t("chat.title") || "Messages"}</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("chat.search") || "Search conversations..."}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-100 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Loading…</div>
          ) : filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
              <div className="h-14 w-14 rounded-full bg-purple-50 flex items-center justify-center mb-3">
                <ShoppingBag className="h-7 w-7 text-purple-300" />
              </div>
              <p className="font-semibold text-gray-600 text-sm">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Browse listings to start chatting with sellers</p>
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const unread = conv.buyer_id === currentUserId ? conv.buyer_unread : conv.seller_unread;
              return (
                <button
                  key={conv.id}
                  onClick={() => selectConv(conv.id)}
                  className={`w-full flex items-start gap-3 px-4 py-4 text-left border-b border-gray-100 transition-colors min-h-[72px] ${
                    activeId === conv.id ? "bg-purple-50" : "hover:bg-white"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="h-11 w-11 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: "linear-gradient(135deg,#3B0764,#7C3AED)" }}>
                      {(conv.other_name?.[0] ?? "?").toUpperCase()}
                    </div>
                    {conv.agent_invited && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                        <ShieldCheck className="h-2 w-2 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <p className={`text-sm truncate ${unread > 0 ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                        {conv.other_name}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-1">{formatTime(conv.last_message_at)}</span>
                    </div>
                    {conv.listing_title && (
                      <p className="text-[11px] text-purple-600 truncate font-medium">{conv.listing_title}</p>
                    )}
                    <p className={`text-xs truncate mt-0.5 ${unread > 0 ? "text-gray-800 font-semibold" : "text-gray-400"}`}>
                      {conv.agent_invited
                        ? <span className="text-emerald-600 font-medium">🛡️ Agent mediation active</span>
                        : conv.last_message ?? "…"}
                    </p>
                  </div>
                  {unread > 0 && (
                    <span className="h-5 w-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                      style={{ background: "#7C3AED" }}>
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Message thread ── */}
      <div className={`${showMobileThread ? "flex" : "hidden"} md:flex flex-col flex-1 min-w-0`}>
        {!activeId ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="h-20 w-20 rounded-full bg-purple-50 flex items-center justify-center mb-4">
              <Sparkles className="h-10 w-10 text-purple-200" />
            </div>
            <p className="text-gray-500 font-medium">Select a conversation</p>
            <p className="text-sm text-gray-400 mt-1">Choose from the list to start chatting</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Thread header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
              <button
                onClick={() => setShowMobileThread(false)}
                className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                style={{ minWidth: 44, minHeight: 44 }}
                aria-label="Back to inbox"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ background: "linear-gradient(135deg,#3B0764,#7C3AED)" }}>
                {(activeConv?.other_name?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{activeConv?.other_name}</p>
                {activeConv?.listing_title && (
                  <p className="text-xs text-gray-400 truncate">{activeConv.listing_title}</p>
                )}
              </div>
              {activeConv?.ai_proxy_active && <AIBrokerBadge animated />}
              {/* Request Agent button */}
              {!activeConv?.agent_invited && (
                <button
                  onClick={() => setShowAgentConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors shrink-0 border border-emerald-200"
                  style={{ minHeight: 44 }}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Safe Deal</span>
                </button>
              )}
              {activeConv?.agent_invited && (
                <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5" /> Agent Active
                </span>
              )}
            </div>

            {/* Agent mediation banner */}
            {activeConv?.agent_invited && (
              <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-emerald-800 bg-emerald-50 border-b border-emerald-200 shrink-0">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Area Agent mediation is active — LocalMart charges <strong>0% commission</strong>. Any fee goes directly to your local agent.</span>
              </div>
            )}

            {/* Messages scroll area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg) => {
                const isOwn = msg.sender_id === currentUserId;
                const isSystem = msg.is_ai || msg.is_agent;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    {isSystem && !isOwn && (
                      <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center mr-2 shrink-0 self-end">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                    )}
                    <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm shadow-sm ${
                      isOwn
                        ? "text-white rounded-br-sm"
                        : isSystem
                        ? "bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-bl-sm"
                        : "bg-gray-100 text-gray-800 rounded-bl-sm"
                    }`}
                    style={isOwn ? { background: "linear-gradient(135deg,#3B0764,#7C3AED)" } : {}}>
                      {isSystem && !isOwn && (
                        <p className="text-[10px] font-bold text-emerald-600 mb-0.5">🛡️ System</p>
                      )}
                      {msg.content}
                      <p className={`text-[10px] mt-1 ${isOwn ? "text-purple-200 text-right" : "text-gray-400"}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Pinned input bar — stays above keyboard on mobile */}
            <div className="flex items-end gap-2 px-3 py-3 border-t border-gray-100 bg-white shrink-0"
              style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t("chat.type_message") || "Type a message…"}
                rows={1}
                className="flex-1 px-4 py-3 rounded-2xl bg-gray-100 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
                style={{ maxHeight: 96, lineHeight: "1.4" }}
              />
              <button
                onClick={sendMessage}
                disabled={!draft.trim() || sending}
                className="h-11 w-11 rounded-2xl flex items-center justify-center text-white transition-all disabled:opacity-40 shrink-0 active:scale-95"
                style={{ background: "linear-gradient(135deg,#3B0764,#7C3AED)" }}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Request Agent confirmation modal ── */}
      {showAgentConfirm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Request Safe-Deal Agent</h3>
                <p className="text-xs text-gray-500 mt-0.5">Verify &amp; secure your transaction</p>
              </div>
              <button onClick={() => setShowAgentConfirm(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                <span className="font-semibold text-emerald-800 text-sm">Area Agent Mediation</span>
              </div>
              <ul className="text-xs text-emerald-700 space-y-1.5">
                <li>✓ Your local Master Agent for this PIN code will join the chat</li>
                <li>✓ They verify goods, land papers, or service quality in person</li>
                <li>✓ <strong>LocalMart charges 0% commission</strong> — fee goes 100% to agent</li>
                <li>✓ Completely optional — you can always negotiate directly for free</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAgentConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Continue Directly
              </button>
              <button
                onClick={inviteAreaAgent}
                disabled={invitingAgent}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 active:scale-95"
                style={{ background: "linear-gradient(135deg,#065F46,#10B981)" }}
              >
                {invitingAgent ? "Requesting…" : "Request Agent"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
