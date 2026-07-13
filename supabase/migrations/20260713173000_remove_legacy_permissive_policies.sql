-- Remove legacy permissive policies left active beside the secure policies.
DROP POLICY IF EXISTS "Annunci insert" ON public.ads;
DROP POLICY IF EXISTS "Annunci update" ON public.ads;
DROP POLICY IF EXISTS "Annunci delete" ON public.ads;

DROP POLICY IF EXISTS "Profili insert" ON public.profiles;
DROP POLICY IF EXISTS "Profili update" ON public.profiles;
DROP POLICY IF EXISTS "Profili delete" ON public.profiles;
DROP POLICY IF EXISTS profiles_public_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_public_update ON public.profiles;
DROP POLICY IF EXISTS profiles_public_select ON public.profiles;

DROP POLICY IF EXISTS "Support all" ON public.support_messages;

DROP POLICY IF EXISTS "Categorie pubbliche" ON public.categories;
CREATE POLICY categories_public_read ON public.categories FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Citta pubbliche" ON public.cities;
CREATE POLICY cities_public_read ON public.cities FOR SELECT USING (TRUE);

-- Anonymous uploads to the legacy bucket are not allowed.
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;

-- Trigger-only functions are not public RPC endpoints. Boost purchase remains
-- callable only by authenticated users.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_conversation_from_message() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_profile_ads_count() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_ad_rating() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.purchase_ad_boost(UUID, INTEGER, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purchase_ad_boost(UUID, INTEGER, TEXT, TIMESTAMPTZ) TO authenticated;
