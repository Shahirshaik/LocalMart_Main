-- ============================================================
-- 004_messages.sql  — conversations, messages, notifications
-- ============================================================

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id       UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  buyer_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_message     TEXT,
  last_message_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ai_proxy_active  BOOLEAN NOT NULL DEFAULT FALSE,
  buyer_unread     INT NOT NULL DEFAULT 0,
  seller_unread    INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_id, buyer_id, seller_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content          TEXT NOT NULL,
  is_ai            BOOLEAN NOT NULL DEFAULT FALSE,
  is_read          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,          -- ad_waiting | ad_approved | ad_live | ad_expired | new_message | price_offer | ai_optimized | ai_negotiating
  title       TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  meta        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS conversations_buyer_idx   ON public.conversations(buyer_id);
CREATE INDEX IF NOT EXISTS conversations_seller_idx  ON public.conversations(seller_id);
CREATE INDEX IF NOT EXISTS messages_conv_idx         ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS notifications_user_idx    ON public.notifications(user_id, created_at DESC);

-- RLS policies
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Conversations: visible to buyer and seller
CREATE POLICY conversations_own ON public.conversations
  FOR ALL USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Messages: visible to participants of the conversation
CREATE POLICY messages_own ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- Notifications: users see only their own
CREATE POLICY notifications_own ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
