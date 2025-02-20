-- FIX DATABASE SCHEMA: "Profile" -> "profiles"

-- 1. Rename the table if it exists as "Profile" (PascalCase) due to previous script
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Profile') THEN
    ALTER TABLE public."Profile" RENAME TO profiles;
  END IF;
END $$;

-- 2. Update the Trigger Function to use the correct table name "profiles"
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, user_id, name, email, role, created_at, updated_at)
  values (
    gen_random_uuid(),
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    'PATIENT', -- Default role
    now(),
    now()
  );
  return new;
end;
$$;

-- 3. Re-create the trigger (just to be safe)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Fix RLS Policies (Update them to refer to "profiles" instead of "Profile")
alter table public.profiles enable row level security;

-- Drop old policies on "Profile" (if any remain) or "profiles"
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

-- Create new policies
create policy "Users can view own profile"
  on public.profiles for select
  using ( auth.uid()::text = user_id );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid()::text = user_id );

create policy "Users can insert own profile"
  on public.profiles for insert
  with check ( auth.uid()::text = user_id );
