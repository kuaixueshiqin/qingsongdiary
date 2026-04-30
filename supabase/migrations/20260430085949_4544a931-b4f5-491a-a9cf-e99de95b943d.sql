-- Extend diary_entries with missing fields
ALTER TABLE public.diary_entries
  ADD COLUMN IF NOT EXISTS mood_score INTEGER,
  ADD COLUMN IF NOT EXISTS mood_label TEXT,
  ADD COLUMN IF NOT EXISTS entry_time TEXT,
  ADD COLUMN IF NOT EXISTS display_date TEXT,
  ADD COLUMN IF NOT EXISTS billing_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS billing_category TEXT,
  ADD COLUMN IF NOT EXISTS billing_verified BOOLEAN DEFAULT false;

-- Trigger for diary_entries updated_at
DROP TRIGGER IF EXISTS update_diary_entries_updated_at ON public.diary_entries;
CREATE TRIGGER update_diary_entries_updated_at
  BEFORE UPDATE ON public.diary_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= diary_comments =============
CREATE TABLE IF NOT EXISTS public.diary_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  diary_id UUID NOT NULL REFERENCES public.diary_entries(id) ON DELETE CASCADE,
  companion_id TEXT NOT NULL,
  text TEXT NOT NULL,
  line_index INTEGER NOT NULL DEFAULT 0,
  highlight_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.diary_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own diary comments" ON public.diary_comments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own diary comments" ON public.diary_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own diary comments" ON public.diary_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own diary comments" ON public.diary_comments FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_diary_comments_diary_id ON public.diary_comments(diary_id);

-- ============= comment_replies =============
CREATE TABLE IF NOT EXISTS public.comment_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  comment_id UUID NOT NULL REFERENCES public.diary_comments(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  companion_id TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comment_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own replies" ON public.comment_replies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own replies" ON public.comment_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own replies" ON public.comment_replies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own replies" ON public.comment_replies FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_comment_replies_comment_id ON public.comment_replies(comment_id);

-- ============= mail_conversations =============
CREATE TABLE IF NOT EXISTS public.mail_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  companion_id TEXT NOT NULL,
  unread_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, companion_id)
);
ALTER TABLE public.mail_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own conversations" ON public.mail_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own conversations" ON public.mail_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own conversations" ON public.mail_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own conversations" ON public.mail_conversations FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_mail_conversations_updated_at
  BEFORE UPDATE ON public.mail_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= mail_messages =============
CREATE TABLE IF NOT EXISTS public.mail_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL REFERENCES public.mail_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mail_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own messages" ON public.mail_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own messages" ON public.mail_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own messages" ON public.mail_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own messages" ON public.mail_messages FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_mail_messages_conv_id ON public.mail_messages(conversation_id);

-- ============= custom_companions =============
CREATE TABLE IF NOT EXISTS public.custom_companions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  role TEXT,
  bio TEXT,
  color_class TEXT,
  text_color_class TEXT,
  intimacy INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_companions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own companions" ON public.custom_companions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own companions" ON public.custom_companions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own companions" ON public.custom_companions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own companions" ON public.custom_companions FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_custom_companions_updated_at
  BEFORE UPDATE ON public.custom_companions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= custom_boards =============
CREATE TABLE IF NOT EXISTS public.custom_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own boards" ON public.custom_boards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own boards" ON public.custom_boards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own boards" ON public.custom_boards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own boards" ON public.custom_boards FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_custom_boards_updated_at
  BEFORE UPDATE ON public.custom_boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= Trigger to auto-create handle_new_user (already exists) just ensure it fires =============
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();