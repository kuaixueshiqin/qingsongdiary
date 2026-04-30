-- Pinecone transactions
CREATE TABLE public.pinecone_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  source text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pinecone_tx_user_idx ON public.pinecone_transactions(user_id, created_at DESC);
ALTER TABLE public.pinecone_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own pinecone tx" ON public.pinecone_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own pinecone tx" ON public.pinecone_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Check ins
CREATE TABLE public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  check_date date NOT NULL,
  reward integer NOT NULL,
  streak integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, check_date)
);
CREATE INDEX check_ins_user_idx ON public.check_ins(user_id, check_date DESC);
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own check_ins" ON public.check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own check_ins" ON public.check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- award_pinecones: atomic add + log
CREATE OR REPLACE FUNCTION public.award_pinecones(_amount integer, _source text, _note text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _new_balance integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  UPDATE public.profiles SET pinecones = pinecones + _amount, updated_at = now()
    WHERE id = _uid RETURNING pinecones INTO _new_balance;
  INSERT INTO public.pinecone_transactions(user_id, amount, source, note)
    VALUES (_uid, _amount, _source, _note);
  RETURN _new_balance;
END;
$$;

-- claim_daily_checkin: returns json {claimed, reward, streak, balance, already}
CREATE OR REPLACE FUNCTION public.claim_daily_checkin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() AT TIME ZONE 'Asia/Shanghai')::date;
  _last_date date;
  _last_streak integer;
  _new_streak integer;
  _reward integer;
  _balance integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- already checked in today?
  IF EXISTS (SELECT 1 FROM public.check_ins WHERE user_id = _uid AND check_date = _today) THEN
    SELECT pinecones INTO _balance FROM public.profiles WHERE id = _uid;
    SELECT streak INTO _last_streak FROM public.check_ins WHERE user_id = _uid AND check_date = _today;
    RETURN jsonb_build_object('claimed', false, 'already', true, 'streak', _last_streak, 'balance', _balance);
  END IF;

  SELECT check_date, streak INTO _last_date, _last_streak
    FROM public.check_ins WHERE user_id = _uid ORDER BY check_date DESC LIMIT 1;

  IF _last_date IS NOT NULL AND _last_date = _today - 1 THEN
    _new_streak := _last_streak + 1;
  ELSE
    _new_streak := 1;
  END IF;

  -- Reward = streak day count (so day 1=1, day 3=3, day 7=7).
  _reward := _new_streak;

  INSERT INTO public.check_ins(user_id, check_date, reward, streak)
    VALUES (_uid, _today, _reward, _new_streak);

  UPDATE public.profiles SET pinecones = pinecones + _reward, updated_at = now()
    WHERE id = _uid RETURNING pinecones INTO _balance;
  INSERT INTO public.pinecone_transactions(user_id, amount, source, note)
    VALUES (_uid, _reward, 'checkin', 'Day ' || _new_streak);

  RETURN jsonb_build_object('claimed', true, 'already', false, 'reward', _reward, 'streak', _new_streak, 'balance', _balance);
END;
$$;