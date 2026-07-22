-- ============================================
-- RLS POLICIES FOR MESSENGER TABLES
-- Защита от прямого доступа через Supabase anon key
-- Наш API работает через service_role (pg pooler), RLS не блокирует
-- ============================================

-- 1. Включаем RLS на всех таблицах
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- 2. Service role (наш API через pooler) — полный доступ
CREATE POLICY "service_role_all_conversations" ON conversations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_members" ON conversation_members
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_messages" ON messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_reactions" ON message_reactions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_typing" ON typing_indicators
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Анонимный доступ — ВСЁ ЗАБЛОКИРОВАНО
CREATE POLICY "anon_no_access_conversations" ON conversations
  FOR ALL TO anon USING (false);

CREATE POLICY "anon_no_access_members" ON conversation_members
  FOR ALL TO anon USING (false);

CREATE POLICY "anon_no_access_messages" ON messages
  FOR ALL TO anon USING (false);

CREATE POLICY "anon_no_access_reactions" ON message_reactions
  FOR ALL TO anon USING (false);

CREATE POLICY "anon_no_access_typing" ON typing_indicators
  FOR ALL TO anon USING (false);

-- 4. Authenticated (Supabase Auth) — тоже блокируем (не используем)
CREATE POLICY "auth_no_access_conversations" ON conversations
  FOR ALL TO authenticated USING (false);

CREATE POLICY "auth_no_access_members" ON conversation_members
  FOR ALL TO authenticated USING (false);

CREATE POLICY "auth_no_access_messages" ON messages
  FOR ALL TO authenticated USING (false);

CREATE POLICY "auth_no_access_reactions" ON message_reactions
  FOR ALL TO authenticated USING (false);

CREATE POLICY "auth_no_access_typing" ON typing_indicators
  FOR ALL TO authenticated USING (false);
