-- ═══════════════════════════════════════════════════════════════
-- BADDIE — Moderation backstop (names + disposable emails)
-- Run in the SQL editor. Idempotent — safe to re-run.
--
-- The client validates display names and signup emails for good UX,
-- but anyone can call the API directly. These triggers enforce the
-- same rules in the database:
--   1. profiles.name may not contain hard slurs (leet-normalized).
--   2. auth.users signups from disposable-email domains are rejected.
-- ═══════════════════════════════════════════════════════════════

-- 1. Display-name check ------------------------------------------------
CREATE OR REPLACE FUNCTION public.name_is_clean(raw text)
RETURNS boolean
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  norm text;
  tok  text;
BEGIN
  IF raw IS NULL THEN RETURN true; END IF;
  -- lowercase, map leetspeak, strip non-letters, collapse 3+ repeats to 2
  norm := lower(raw);
  norm := replace(replace(replace(replace(norm,'0','o'),'1','i'),'3','e'),'4','a');
  norm := replace(replace(replace(replace(norm,'5','s'),'7','t'),'9','g'),'@','a');
  norm := replace(replace(replace(norm,'$','s'),'!','i'),'+','t');
  norm := regexp_replace(norm, '[^a-z]', '', 'g');
  norm := regexp_replace(norm, '(.)\1{2,}', '\1\1', 'g');

  -- substring tier: unambiguous slurs
  IF norm ~ '(nigger|nigga|faggot|wetback|beaner|porchmonkey|towelhead|raghead|tranny|darkie)' THEN
    RETURN false;
  END IF;

  -- exact-token tier: blocked only as whole words (so Kikelomo, Cooney pass)
  FOR tok IN SELECT regexp_split_to_table(lower(raw), '[^a-z0-9@$!+]+')
  LOOP
    tok := replace(replace(replace(replace(tok,'0','o'),'1','i'),'3','e'),'4','a');
    tok := replace(replace(replace(replace(tok,'5','s'),'7','t'),'9','g'),'@','a');
    tok := replace(replace(replace(tok,'$','s'),'!','i'),'+','t');
    tok := regexp_replace(tok, '[^a-z]', '', 'g');
    tok := regexp_replace(tok, '(.)\1{2,}', '\1\1', 'g');
    IF tok IN ('kike','spic','coon','chink','gook','cunt','whore','slut','hitler','nazi','fag','homo','retard') THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_clean_name()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.name_is_clean(NEW.name) THEN
    RAISE EXCEPTION 'name_not_allowed' USING HINT = 'This display name is not allowed.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_clean_name ON public.profiles;
CREATE TRIGGER profiles_clean_name
  BEFORE INSERT OR UPDATE OF name ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_clean_name();

-- 2. Disposable-email block at signup ---------------------------------
-- Domains live in a table so you can add more without a migration:
--   INSERT INTO public.blocked_email_domains VALUES ('newburner.com');
CREATE TABLE IF NOT EXISTS public.blocked_email_domains (
  domain text PRIMARY KEY
);
ALTER TABLE public.blocked_email_domains ENABLE ROW LEVEL SECURITY;
-- No client policies: only service role / triggers read it.

INSERT INTO public.blocked_email_domains (domain) VALUES
  ('stayhome.li'),('mailinator.com'),('guerrillamail.com'),('guerrillamail.net'),
  ('guerrillamail.org'),('guerrillamail.de'),('guerrillamail.info'),('sharklasers.com'),
  ('grr.la'),('10minutemail.com'),('10minutemail.net'),('tempmail.com'),('temp-mail.org'),
  ('tempmail.dev'),('throwawaymail.com'),('yopmail.com'),('yopmail.fr'),('getnada.com'),
  ('trashmail.com'),('maildrop.cc'),('dispostable.com'),('fakeinbox.com'),('mintemail.com'),
  ('mohmal.com'),('mailnesia.com'),('mytemp.email'),('burnermail.io'),('emailondeck.com'),
  ('moakt.com'),('tmpmail.net'),('tmpmail.org'),('disposablemail.com'),('33mail.com'),
  ('mailsac.com'),('tempr.email'),('discard.email'),('mailcatch.com'),('harakirimail.com'),
  ('pokemail.net'),('spam4.me'),('1secmail.com'),('1secmail.net'),('1secmail.org'),
  ('inboxkitten.com'),('mail7.io'),('emltmp.com')
ON CONFLICT (domain) DO NOTHING;

CREATE OR REPLACE FUNCTION public.block_disposable_email()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  dom text;
BEGIN
  dom := lower(split_part(NEW.email, '@', 2));
  IF dom = '' THEN RETURN NEW; END IF;
  IF EXISTS (
    SELECT 1 FROM public.blocked_email_domains b
    WHERE dom = b.domain OR dom LIKE '%.' || b.domain
  ) THEN
    RAISE EXCEPTION 'disposable_email_not_allowed'
      USING HINT = 'Temporary email addresses are not allowed.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_block_disposable_email ON auth.users;
CREATE TRIGGER users_block_disposable_email
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.block_disposable_email();
