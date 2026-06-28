import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SYSTEM_PROMPT = `You are the LocalMart AI Operations Assistant — a specialized agent for LocalMart field agents operating in rural and semi-urban India.

You help agents with:
• Writing optimised listing descriptions for vegetables, property, mechanics, gas, jobs, and all 12 marketplace verticals
• Understanding supply-demand gaps in their territory (PIN codes)
• Drafting buyer-seller connection messages in English and Hindi
• Explaining commission structures and approval workflows
• Answering questions about the LocalMart platform

LocalMart operates in India. Key context:
- PIN codes are 6 digits and map to specific villages/towns
- Verticals: vegetables, food, gas, construction, property, rentals, mechanics, grocery, jobs, vehicles, furniture, mobiles
- Approval chain: Agent submits → Board reviews → CEO approves → Executed
- Commission: typically 5% of deal value for agents
- Language: mix English with Hindi/Telugu phrases to feel local

Be concise, practical, and helpful. Use bullet points for lists. Keep responses under 200 words unless asked for detailed content.`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages } = await req.json() as { messages: { role: string; content: string }[] };

  try {
    const response = await anthropic.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 1024,
      system:     SYSTEM_PROMPT,
      messages:   messages.map(m => ({
        role:    m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ response: text });
  } catch (err) {
    console.error("AI assist error:", err);
    return NextResponse.json({ error: "AI service error" }, { status: 500 });
  }
}
