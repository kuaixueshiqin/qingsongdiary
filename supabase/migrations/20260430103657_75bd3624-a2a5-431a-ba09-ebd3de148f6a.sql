REVOKE EXECUTE ON FUNCTION public.award_pinecones(integer, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.claim_daily_checkin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_pinecones(integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_daily_checkin() TO authenticated;