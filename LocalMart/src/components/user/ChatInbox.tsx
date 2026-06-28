"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Search, Bot, Circle, ArrowLeft, ShoppingBag, Sparkles } from "lucide-react";
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
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeId);

  // Load conversations
  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from("conversations")
      .select(`
        id, listing_id, buyer_id, seller_id, last_message,
        last_message_at, ai_proxy_active, buyer_unread, seller_unread
      `)
      .or(`buyer_id.eq.${currentUserId},seller_id.eq.${currentUserId}`)
      .order("last_message_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    // Enrich with listing title & other user name
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
          other_id: otherId,
          other_name: userRow?.full_name ?? "Unknown",
          listing_title: listingRow?.title ?? undefined,
        };
      })
    );

    setConversations(enriched);
    setLoading(false);
  }, [currentUserId, supabase]);

  // Load messages for active conversation
  const loadMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, is_ai, created_at")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages(data ?? []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [supabase]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);

    // Supabase Realtime subscription for new messages
    const channel = supabase
      .channel(`messages:${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Message];
          });
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeId, loadMessages, supabase]);

  async function sendMessage() {
    if (!draft.trim() || !activeId || sending) return;
    setSending(true);
    const text = draft.trim();
    setDraft("");

    const { error } = await supabase.from("messages").insert({
      conversation_id: activeId,
      sender_id: currentUserId,
      content: text,
      is_ai: false,
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
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { day: "numeric", month: "short" });
  }

  return (
    <div className="flex h-full rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm"
      style={{ minHeight: "calc(100vh - 200px)" }}>

      {/* ── Conversation list (left pane) ── */}
      <div className={`${showMobileThread ? "hidden" : "flex"} md:flex w-full md:w-80 lg:w-96 flex-col border-r border-gray-100 bg-gray-50 shrink-0`}>
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-base font-bold text-gray-900 mb-3">{t("chat.title")}</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("chat.search")}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-100 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">{t("common.loading")}</div>
          ) : filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
              <div className="h-14 w-14 rounded-full bg-purple-50 flex items-center justify-center mb-3">
                <ShoppingBag className="h-7 w-7 text-purple-300" />
              </div>
              <p className="font-semibold text-gray-600 text-sm">{t("chat.no_conversations")}</p>
              <p className="text-xs text-gray-400 mt-1">{t("chat.start_chat")}</p>
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const isMe = conv.last_message && conv.last_message.length > 0;
              const unread = conv.buyer_id === currentUserId ? conv.buyer_unread : conv.seller_unread;
              return (
                <button
                  key={conv.id}
                  onClick={() => selectConv(conv.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 text-left border-b border-gray-100 transition-colors ${
                    activeId === conv.id ? "bg-purple-50" : "hover:bg-white"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: "linear-gradient(135deg,#3B0764,#7C3AED)" }}>
                      {(conv.other_name?.[0] ?? "?").toUpperCase()}
                    </div>
                    {conv.ai_proxy_active && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-purple-600 border-2 border-white flex items-center justify-center">
                        <Bot className="h-2 w-2 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Text */}
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
                      {conv.ai_proxy_active ? (
                        <span className="text-purple-500 flex items-center gap-1">
                          <Bot className="h-3 w-3" />{t("chat.ai_negotiating")}
                        </span>
                      ) : conv.last_message ?? "…"}
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

      {/* ── Message thread (right pane) ── */}
      <div className={`${showMobileThread ? "flex" : "hidden"} md:flex flex-col flex-1 min-w-0`}>
        {!activeId ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="h-20 w-20 rounded-full bg-purple-50 flex items-center justify-center mb-4">
              <Sparkles className="h-10 w-10 text-purple-200" />
            </div>
            <p className="text-gray-500 font-medium">{t("chat.no_conversations")}</p>
            <p className="text-sm text-gray-400 mt-1">{t("chat.start_chat")}</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
              <button
                onClick={() => setShowMobileThread(false)}
                className="md:hidden p-1.5 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 text-gray-600" />
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
              {activeConv?.ai_proxy_active && (
                <AIBrokerBadge animated />
              )}
            </div>

            {/* AI takeover banner */}
            {activeConv?.ai_proxy_active && (
              <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-purple-700 bg-purple-50 border-b border-purple-100">
                <Bot className="h-3.5 w-3.5" />
                {t("chat.ai_took_over")}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg) => {
                const isOwn = msg.sender_id === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    {msg.is_ai && (
                      <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center mr-2 shrink-0 self-end">
                        <Bot className="h-3.5 w-3.5 text-purple-600" />
                      </div>
                    )}
                    <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm shadow-sm ${
                      isOwn
                        ? "text-white rounded-br-md"
                        : msg.is_ai
                        ? "bg-purple-50 text-purple-900 border border-purple-100 rounded-bl-md"
                        : "bg-gray-100 text-gray-800 rounded-bl-md"
                    }`}
                    style={isOwn ? { background: "linear-gradient(135deg,#3B0764,#7C3AED)" } : {}}>
                      {msg.is_ai && (
                        <p className="text-[10px] font-bold text-purple-500 mb-0.5 flex items-center gap-1">
                          <Bot className="h-3 w-3" /> AI Broker
                        </p>
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

            {/* Input bar */}
            <div className="flex items-end gap-2 px-4 py-3 border-t border-gray-100 bg-white">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t("chat.type_message")}
                rows={1}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none max-h-28"
                style={{ lineHeight: "1.4" }}
              />
              <button
                onClick={sendMessage}
                disabled={!draft.trim() || sending}
                className="h-10 w-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 shrink-0"
                style={{ background: "linear-gradient(135deg,#3B0764,#7C3AED)" }}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
