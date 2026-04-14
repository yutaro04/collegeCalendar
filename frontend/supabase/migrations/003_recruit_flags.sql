-- ============================================================
-- コヒチャ / 定員 / 参加者非公開 機能
-- Supabase SQL Editor で実行してください。
-- ============================================================

-- ---------- カラム追加 ----------
alter table public.recruits
  add column if not exists is_kohicha boolean not null default false,
  add column if not exists max_participants int,
  add column if not exists hide_participants boolean not null default false,
  add column if not exists participants_count int not null default 0;

-- コヒチャは max_participants = 1 を強制
alter table public.recruits
  drop constraint if exists recruits_kohicha_cap_chk;
alter table public.recruits
  add constraint recruits_kohicha_cap_chk
  check (not is_kohicha or max_participants = 1);

-- max_participants は 1 以上
alter table public.recruits
  drop constraint if exists recruits_max_participants_chk;
alter table public.recruits
  add constraint recruits_max_participants_chk
  check (max_participants is null or max_participants >= 1);

-- ---------- participants_count トリガ ----------
create or replace function public.recruit_participants_count_trg()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.recruits
      set participants_count = participants_count + 1
      where id = new.recruit_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.recruits
      set participants_count = greatest(participants_count - 1, 0)
      where id = old.recruit_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists recruit_participants_count_ins on public.recruit_participants;
create trigger recruit_participants_count_ins
  after insert on public.recruit_participants
  for each row execute function public.recruit_participants_count_trg();

drop trigger if exists recruit_participants_count_del on public.recruit_participants;
create trigger recruit_participants_count_del
  after delete on public.recruit_participants
  for each row execute function public.recruit_participants_count_trg();

-- 既存行のカウントを初期化
update public.recruits r
set participants_count = sub.c
from (
  select recruit_id, count(*) as c
  from public.recruit_participants
  group by recruit_id
) sub
where r.id = sub.recruit_id;

-- ---------- 定員チェック トリガ ----------
create or replace function public.recruit_capacity_check_trg()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cap int;
  cur int;
begin
  select max_participants, participants_count
    into cap, cur
    from public.recruits
    where id = new.recruit_id
    for update;

  if cap is not null and cur >= cap then
    raise exception 'RECRUIT_FULL' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists recruit_capacity_check on public.recruit_participants;
create trigger recruit_capacity_check
  before insert on public.recruit_participants
  for each row execute function public.recruit_capacity_check_trg();

-- ---------- RLS 更新: 参加者非公開 ----------
-- 既存の読み取りポリシを差し替え。
-- hide_participants=false: 全員閲覧可。
-- hide_participants=true : 投稿者 + 本人のみ。
drop policy if exists "participants are readable by authenticated" on public.recruit_participants;
drop policy if exists "participants are readable" on public.recruit_participants;
create policy "participants are readable"
  on public.recruit_participants for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.recruits r
      where r.id = recruit_id
        and (not r.hide_participants or r.author_id = auth.uid())
    )
  );

notify pgrst, 'reload schema';
