-- ============================================================
-- 1) 暇ステータスを取り下げたら誘いも一緒に削除する
-- 2) 既存の孤児誘い（availability を持たない相手宛）を掃除
-- Supabase SQL Editor で実行してください。
-- ============================================================

-- 既存の孤児レコードを削除（FK 差し替え前に必要）
delete from public.availability_invites inv
where not exists (
  select 1 from public.availability a where a.user_id = inv.availability_user_id
);

-- FK を profiles → availability に差し替え、CASCADE を有効化
alter table public.availability_invites
  drop constraint if exists availability_invites_availability_user_id_fkey;
alter table public.availability_invites
  add constraint availability_invites_availability_user_id_fkey
  foreign key (availability_user_id) references public.availability(user_id) on delete cascade;

notify pgrst, 'reload schema';
