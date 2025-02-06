-- 1. Create a function that runs when a user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public."Profile" (id, user_id, name, email, created_at, updated_at)
  values (
    gen_random_uuid(),
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    now(),
    now()
  );
  return new;
end;
$$;

-- 2. Create the trigger using the function above
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Fix RLS Policies for Profile table
alter table public."Profile" enable row level security;

create policy "Users can view own profile"
  on public."Profile" for select
  using ( auth.uid()::text = user_id );

create policy "Users can update own profile"
  on public."Profile" for update
  using ( auth.uid()::text = user_id );

create policy "Users can insert own profile"
  on public."Profile" for insert
  with check ( auth.uid()::text = user_id );
