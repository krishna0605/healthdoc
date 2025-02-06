-- FORCE CREATE TABLE (Since it's missing)
create table if not exists public."Profile" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid(),
  name text,
  email text,
  role text default 'PATIENT',
  status text default 'OFFLINE',
  avatar_color text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public."Profile" (id, user_id, name, email, role, status, created_at, updated_at)
  values (
    gen_random_uuid(),
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    'PATIENT',
    'OFFLINE',
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

-- Enable RLS
alter table public."Profile" enable row level security;

-- Policies
drop policy if exists "Users can view own profile" on public."Profile";
create policy "Users can view own profile"
  on public."Profile" for select
  using ( auth.uid() = user_id );

drop policy if exists "Users can update own profile" on public."Profile";
create policy "Users can update own profile"
  on public."Profile" for update
  using ( auth.uid() = user_id );

drop policy if exists "Users can insert own profile" on public."Profile";
create policy "Users can insert own profile"
  on public."Profile" for insert
  with check ( auth.uid() = user_id );
