-- 1. Check if the table actually exists (Debug Step)
SELECT * FROM information_schema.tables WHERE table_schema = 'public';

-- 2. If the above shows 'Profile' or 'profile', adjust the casing below accordingly.
-- The script below assumes "Profile" (Mixed Case, Quoted) as per Prisma default.

-- Trigger Function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public."Profile" (id, status, role, user_id, email, name, created_at, updated_at)
  values (
    gen_random_uuid(),
    'OFFLINE',  -- Default values required by schema?
    'PATIENT',
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    now(),
    now()
  );
  return new;
end;
$$;

-- Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public."Profile" enable row level security;

-- Policies (Dropping first to avoid conflicts)
drop policy if exists "Users can view own profile" on public."Profile";
create policy "Users can view own profile"
  on public."Profile" for select
  using ( auth.uid()::text = user_id );

drop policy if exists "Users can update own profile" on public."Profile";
create policy "Users can update own profile"
  on public."Profile" for update
  using ( auth.uid()::text = user_id );

drop policy if exists "Users can insert own profile" on public."Profile";
create policy "Users can insert own profile"
  on public."Profile" for insert
  with check ( auth.uid()::text = user_id );
