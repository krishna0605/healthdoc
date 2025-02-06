-- Attempt 3: Try LOWERCASE table name "profile"
-- Prisma sometimes maps models to lowercase tables if not specified otherwise in @map

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Using lowercase "profile" here
  insert into public.profile (id, user_id, name, email, role, created_at, updated_at)
  values (
    gen_random_uuid(),
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    'PATIENT',
    now(),
    now()
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Using lowercase "profile" here
alter table public.profile enable row level security;

create policy "Users can view own profile"
  on public.profile for select
  using ( auth.uid()::text = user_id );

create policy "Users can update own profile"
  on public.profile for update
  using ( auth.uid()::text = user_id );

create policy "Users can insert own profile"
  on public.profile for insert
  with check ( auth.uid()::text = user_id );
