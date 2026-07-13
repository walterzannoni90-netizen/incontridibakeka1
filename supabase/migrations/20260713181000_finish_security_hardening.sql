-- Remove the remaining externally-facing security warnings without exposing
-- private profile columns or breaking conversation display names.

DROP VIEW IF EXISTS public.public_profiles;

CREATE OR REPLACE FUNCTION public.get_public_profiles(p_ids UUID[])
RETURNS TABLE (id UUID, name TEXT, avatar_url TEXT, is_verified BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non autenticato' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
    SELECT profile.id, profile.name, profile.avatar_url, profile.is_verified
    FROM public.profiles AS profile
    WHERE profile.id = ANY(COALESCE(p_ids, ARRAY[]::UUID[]));
END;
$$;
REVOKE ALL ON FUNCTION public.get_public_profiles(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(UUID[]) TO authenticated;

ALTER VIEW public.active_boosts_v SET (security_invoker = TRUE);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS subscription_plans_public_read ON public.subscription_plans;
CREATE POLICY subscription_plans_public_read ON public.subscription_plans FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Support messages insert" ON public.support_messages;
DROP POLICY IF EXISTS "Support messages select admin" ON public.support_messages;
CREATE POLICY support_messages_insert_own ON public.support_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND char_length(message) BETWEEN 3 AND 2000
    AND COALESCE(is_read, FALSE) = FALSE
  );
CREATE POLICY support_messages_select_admin ON public.support_messages
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY support_messages_update_admin ON public.support_messages
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Public buckets serve object URLs without a broad object-listing policy.
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS ads_storage_read ON storage.objects;

ALTER FUNCTION public.get_stats() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.check_active_boosts() SET search_path = public, pg_temp;
