-- ============================================================
-- profiles, recruits, recruit_participants + RLS
-- Supabase ダッシュボードの SQL Editor で実行してください。
-- 事前に Authentication > Providers で Google を有効化してください。
-- ============================================================

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are readable by authenticated" on public.profiles;
create policy "profiles are readable by authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- サインアップ時に自動で profiles 行を作成
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- recruits ----------
create table if not exists public.recruits (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  deadline timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists recruits_created_at_idx on public.recruits (created_at desc);

alter table public.recruits enable row level security;

drop policy if exists "recruits are readable by authenticated" on public.recruits;
create policy "recruits are readable by authenticated"
  on public.recruits for select
  to authenticated
  using (true);

drop policy if exists "users can insert own recruits" on public.recruits;
create policy "users can insert own recruits"
  on public.recruits for insert
  to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "authors can delete own recruits" on public.recruits;
create policy "authors can delete own recruits"
  on public.recruits for delete
  to authenticated
  using (auth.uid() = author_id);

-- ---------- recruit_participants ----------
create table if not exists public.recruit_participants (
  recruit_id uuid not null references public.recruits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (recruit_id, user_id)
);

create index if not exists recruit_participants_user_idx on public.recruit_participants (user_id);

alter table public.recruit_participants enable row level security;

drop policy if exists "participants are readable by authenticated" on public.recruit_participants;
create policy "participants are readable by authenticated"
  on public.recruit_participants for select
  to authenticated
  using (true);

drop policy if exists "users can join recruits" on public.recruit_participants;
create policy "users can join recruits"
  on public.recruit_participants for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users can leave own participation" on public.recruit_participants;
create policy "users can leave own participation"
  on public.recruit_participants for delete
  to authenticated
  using (auth.uid() = user_id);

-- Realtime 用 publication に追加（通知購読のため）
alter publication supabase_realtime add table public.recruit_participants;
