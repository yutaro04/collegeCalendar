-- ============================================================
-- 暇ステータス (availability) と誘い (availability_invites)
-- Supabase SQL Editor で実行してください。
-- ============================================================

-- ---------- availability ----------
create table if not exists public.availability (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  message text not null default '',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists availability_expires_idx on public.availability (expires_at);

alter table public.availability enable row level security;

drop policy if exists "availability readable" on public.availability;
create policy "availability readable"
  on public.availability for select
  to authenticated
  using (true);

drop policy if exists "users upsert own availability insert" on public.availability;
create policy "users upsert own availability insert"
  on public.availability for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users upsert own availability update" on public.availability;
create policy "users upsert own availability update"
  on public.availability for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users delete own availability" on public.availability;
create policy "users delete own availability"
  on public.availability for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------- availability_invites ----------
create table if not exists public.availability_invites (
  id uuid primary key default gen_random_uuid(),
  availability_user_id uuid not null references public.profiles(id) on delete cascade,
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  message text not null default '',
  created_at timestamptz not null default now(),
  check (availability_user_id <> inviter_id)
);

create index if not exists availability_invites_user_idx
  on public.availability_invites (availability_user_id, created_at desc);
create index if not exists availability_invites_inviter_idx
  on public.availability_invites (inviter_id, created_at desc);

alter table public.availability_invites enable row level security;

-- 受信者 or 送信者だけが読める
drop policy if exists "invites readable by parties" on public.availability_invites;
create policy "invites readable by parties"
  on public.availability_invites for select
  to authenticated
  using (auth.uid() = availability_user_id or auth.uid() = inviter_id);

-- 自分を inviter としてのみ送信可能、かつ相手が現在アクティブな availability を持っている場合のみ
drop policy if exists "users can invite" on public.availability_invites;
create policy "users can invite"
  on public.availability_invites for insert
  to authenticated
  with check (
    auth.uid() = inviter_id
    and availability_user_id <> inviter_id
    and exists (
      select 1 from public.availability a
      where a.user_id = availability_user_id and a.expires_at > now()
    )
  );

-- Realtime publication に追加（通知用）
alter publication supabase_realtime add table public.availability_invites;

notify pgrst, 'reload schema';
