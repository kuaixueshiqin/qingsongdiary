CREATE OR REPLACE FUNCTION public.spend_pinecones(_amount integer, _source text, _note text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _balance integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  SELECT pinecones INTO _balance FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF _balance IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF _balance < _amount THEN RAISE EXCEPTION 'INSUFFICIENT_FUNDS'; END IF;

  UPDATE public.profiles SET pinecones = pinecones - _amount, updated_at = now()
    WHERE id = _uid RETURNING pinecones INTO _balance;
  INSERT INTO public.pinecone_transactions(user_id, amount, source, note)
    VALUES (_uid, -_amount, _source, _note);
  RETURN _balance;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.spend_pinecones(integer, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.spend_pinecones(integer, text, text) TO authenticated;