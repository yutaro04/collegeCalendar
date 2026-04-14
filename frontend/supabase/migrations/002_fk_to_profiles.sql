-- PostgREST が recruits / recruit_participants と profiles の関連を
-- 自動検出できるよう、profiles への FK を追加する。
-- Supabase SQL Editor で実行してください。

-- 既存ユーザーに profiles 行が無い場合のバックフィル（念のため）
insert into public.profiles (id, display_name, avatar_url)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), ''),
  u.raw_user_meta_data->>'avatar_url'
from auth.users u
on conflict (id) do nothing;

-- recruits.author_id → profiles.id
alter table public.recruits
  drop constraint if exists recruits_author_profile_fkey;
alter table public.recruits
  add constraint recruits_author_profile_fkey
  foreign key (author_id) references public.profiles(id) on delete cascade;

-- recruit_participants.user_id → profiles.id
alter table public.recruit_participants
  drop constraint if exists recruit_participants_user_profile_fkey;
alter table public.recruit_participants
  add constraint recruit_participants_user_profile_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- PostgREST のスキーマキャッシュをリロード
notify pgrst, 'reload schema';
