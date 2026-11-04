CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.pengguna (auth_user_id, nama, email, peran, aktif)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nama', 'Pengguna Baru'),
    NEW.email,
    'SALES',
    true
  )
  ON CONFLICT (email) DO UPDATE SET auth_user_id = EXCLUDED.auth_user_id;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
