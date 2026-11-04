DO $$
DECLARE
  r RECORD;
  new_id uuid;
BEGIN
  FOR r IN
    SELECT p.id, p.email FROM public.pengguna p
    WHERE p.auth_user_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.email = p.email)
  LOOP
    new_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change, email_change_token_new, is_sso_user, is_anonymous
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated', r.email,
      crypt('Andara123', gen_salt('bf', 10)),
      now(), '{"provider":"email","providers":["email"]}', '{}',
      now(), now(), '', '', '', '', false, false
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), new_id, jsonb_build_object('sub', new_id::text, 'email', r.email),
      'email', r.email, now(), now()
    );
    UPDATE public.pengguna SET auth_user_id = new_id WHERE id = r.id;
    RAISE NOTICE 'auth user created: %', r.email;
  END LOOP;
END
$$;
