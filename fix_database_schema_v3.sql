-- FIX DATABASE SCHEMA V3: Resolve "Profile" vs "profiles" Conflict & Type Mismatch

-- 1. Migrate data from "Profile" to "profiles" if "Profile" exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Profile') THEN
    
    -- Insert users from Profile that don't exist in profiles
    -- CRITICAL FIX: Cast user_id (uuid) to text because Prisma 'profiles' expects text
    INSERT INTO public.profiles (id, user_id, name, role, created_at, updated_at)
    SELECT 
        id::text, -- Cast ID to text just in case
        user_id::text, -- Cast UUID to Text to match Prisma Schema
        name, 
        'PATIENT'::"UserRole", -- Force Safe Default
        created_at, 
        updated_at
    FROM public."Profile"
    WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.user_id = public."Profile".user_id::text -- Explicit Cast for comparison
    );

    -- Drop the incorrect table
    DROP TABLE public."Profile";
  END IF;
END $$;

-- 2. Update the Trigger Function to use "profiles"
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, user_id, name, role, created_at, updated_at)
  values (
    gen_random_uuid()::text, -- Prisma expects String ID
    new.id::text,            -- Prisma expects String userId
    new.raw_user_meta_data ->> 'full_name',
    'PATIENT',
    now(),
    now()
  );
  return new;
end;
$$;

-- 3. Re-create the trigger to ensure it uses the updated function
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Ensure RLS on "profiles"
alter table public.profiles enable row level security;

-- Re-apply policies using text casting if needed for auth.uid()
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using ( auth.uid()::text = user_id );

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid()::text = user_id );

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check ( auth.uid()::text = user_id );
