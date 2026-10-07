-- Email-first login: lets the server ask whether an email already has an
-- account (and which sign-in methods it uses) so the login page can show
-- "enter your password" vs "create your password".
--
-- SECURITY DEFINER because auth.users is not readable by API roles.
-- Execution is restricted to service_role: only our server route
-- (app/api/auth/email-status) can call it, never the browser directly.

create or replace function public.auth_email_status(p_email text)
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'exists', true,
        'providers', coalesce(u.raw_app_meta_data -> 'providers', '[]'::jsonb)
      )
      from auth.users u
      where lower(u.email) = lower(p_email)
      limit 1
    ),
    jsonb_build_object('exists', false, 'providers', '[]'::jsonb)
  );
$$;

revoke all on function public.auth_email_status(text) from public, anon, authenticated;
grant execute on function public.auth_email_status(text) to service_role;
