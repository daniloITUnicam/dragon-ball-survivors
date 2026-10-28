-- Dragon Ball: Survivors — online (v115): nicknames, scores, leaderboards, weekly challenge
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run. Running it again is safe.

-- nicknames: one per account, shown in the leaderboards instead of the e-mail address
create table if not exists public.profiles (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  nick       text not null check (nick ~ '^[A-Za-z0-9_ .-]{3,16}$' and nick = btrim(nick)),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_nick_lower on public.profiles (lower(nick));
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

-- one row per finished run (the leaderboards keep the best one of each player)
create table if not exists public.scores (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  stage      smallint not null check (stage between 0 and 40),
  diff       text not null check (diff in ('easy','normal','hard','extreme')),
  ch         text not null check (ch ~ '^[a-z0-9_]{1,24}$'),
  x2         boolean not null default false,
  win        boolean not null default false,
  t          real not null check (t >= 0 and t <= 36000),
  kills      integer not null check (kills between 0 and 3000000),
  dmg        bigint not null check (dmg between 0 and 1000000000000),
  lvl        smallint not null check (lvl between 1 and 3000),
  pacts      smallint not null default 0 check (pacts between 0 and 7),
  week       text check (week ~ '^[0-9]{4}-W[0-9]{2}$'),
  build      jsonb check (build is null or (jsonb_typeof(build) = 'object' and pg_column_size(build) < 4000)),
  created_at timestamptz not null default now()
);
create index if not exists scores_board on public.scores (stage, diff, week);
create index if not exists scores_user on public.scores (user_id, created_at desc);
alter table public.scores enable row level security;
drop policy if exists "scores_insert_own" on public.scores;
drop policy if exists "scores_select_own" on public.scores;
create policy "scores_insert_own" on public.scores for insert to authenticated with check (auth.uid() = user_id);
create policy "scores_select_own" on public.scores for select to authenticated using (auth.uid() = user_id);
revoke all on public.scores from anon;
grant select, insert on public.scores to authenticated;

-- at most one score every 20 seconds per account (a run is never shorter), and a nickname is needed
create or replace function public.scores_guard() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where user_id = new.user_id) then raise exception 'nickname required'; end if;
  if exists (select 1 from public.scores where user_id = new.user_id and created_at > now() - interval '20 seconds') then raise exception 'too many scores'; end if;
  new.created_at := now();
  return new;
end $$;
drop trigger if exists scores_guard on public.scores;
create trigger scores_guard before insert on public.scores for each row execute function public.scores_guard();

-- the leaderboard: best run of each player for a stage + difficulty (+ week for the weekly challenge), by time, kills or damage
create or replace function public.leaderboard(p_stage int, p_diff text, p_metric text, p_week text default null, p_limit int default 50)
returns table (rank bigint, nick text, ch text, t real, kills integer, dmg bigint, lvl smallint, win boolean, pacts smallint, build jsonb, created_at timestamptz, me boolean)
language sql stable security definer set search_path = public as $$
  with best as (
    select distinct on (s.user_id) s.*, p.nick,
      case p_metric when 'kills' then s.kills::float8 when 'dmg' then s.dmg::float8 else s.t::float8 * 1e7 + s.kills end as score
    from public.scores s join public.profiles p on p.user_id = s.user_id
    where s.stage = p_stage and s.diff = p_diff and s.week is not distinct from p_week
    order by s.user_id, score desc, s.created_at
  )
  select row_number() over (order by score desc, created_at), nick, ch, t, kills, dmg, lvl, win, pacts, build, created_at,
         coalesce(user_id = auth.uid(), false)
  from best order by score desc, created_at limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;
revoke all on function public.leaderboard(int, text, text, text, int) from public;
grant execute on function public.leaderboard(int, text, text, text, int) to anon, authenticated;
