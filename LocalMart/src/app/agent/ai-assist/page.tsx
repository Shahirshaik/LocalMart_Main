"use client";

import { useState } from "react";

interface Message { role: "user" | "assistant"; content: string }

const QUICK_PROMPTS = [
  "What are the top shortages in my territory this week?",
  "Suggest a good listing description for a tomato vendor in PIN 508207",
  "Which verticals should I focus on recruiting in Nalgonda district?",
  "Draft a WhatsApp message to a buyer interested in a 2BHK rental",
  "What commission can I earn on a ₹25 lakh property deal?",
  "How do I submit a listing for Board approval?",
];

export default function AgentAIAssistPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your LocalMart AI Operations Assistant. I can help you:\n\n" +
        "• Draft optimised listing descriptions\n" +
        "• Identify supply gaps in your territory\n" +
        "• Generate buyer-seller match messages\n" +
        "• Suggest recruitment strategies\n" +
        "• Answer marketplace questions\n\n" +
        "What would you like help with today?",
    },
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);

  async function send(text?: string) {
    const userText = text ?? input.trim();
    if (!userText || loading) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userText }],
        }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ I'm having trouble connecting to the AI backend. Please check that the agent server is running on port 8000.\n\nMeanwhile, here's what I can tell you: the AI backend is accessible via `python main.py` in the `agent-backend` directory.",
      }]);
    }
    setLoading(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div>
      <div className="dash-topbar">
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI Assist</h1>
          <p className="text-xs text-gray-500 mt-0.5">Powered by Claude · LocalMart Operations Agent</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-gray-500">Operations Agent Active</span>
        </div>
      </div>

      <div className="dash-page flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
        {/* Quick prompts */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 font-semibold mb-2">QUICK PROMPTS</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map(p => (
              <button key={p} onClick={() => send(p)}
                className="text-xs px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50 transition-all">
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 card overflow-y-auto p-4 space-y-4 mb-4 min-h-0">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                  🤖
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-tr-md"
                  : "bg-white border border-gray-100 text-gray-800 rounded-tl-md shadow-sm"
              }`}>
                {m.content.split("\n").map((line, j) => (
                  <span key={j}>{line}{j < m.content.split("\n").length - 1 && <br />}</span>
                ))}
              </div>
              {m.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-gray-200 flex items-center justify-center text-sm shrink-0">
                  👤
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-sm shrink-0">🤖</div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={2}
            placeholder="Ask me anything about your listings, territory, buyers, strategies..."
            className="flex-1 text-sm border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="btn-royal px-5 rounded-2xl text-sm disabled:opacity-40 shrink-0">
            Send ↑
          </button>
        </div>
      </div>
    </div>
  );
}
