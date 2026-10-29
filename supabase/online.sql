-- Dragon Ball: Survivors — online (v115): nicknames, scores, leaderboards, weekly challenge
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run. Running it again is safe.

-- nicknames: one per account, shown in the leaderboards instead of the e-mail address
create table if not exists public.profiles (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  nick       text not null check (nick ~ '^[A-Za-z0-9_ .-]{3,16}$' and nick = btrim(nick)),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_nick_lower on public.profiles (lower(nick));
-- v117: the title shown next to the nickname (a short code the game turns into words, e.g. m:goku or w:kame:2)
alter table public.profiles add column if not exists title text check (title is null or title ~ '^[a-z0-9_:]{1,40}$');
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
drop function if exists public.leaderboard(int, text, text, text, int);   -- v117: it returns the title too
create or replace function public.leaderboard(p_stage int, p_diff text, p_metric text, p_week text default null, p_limit int default 50)
returns table (rank bigint, nick text, title text, ch text, t real, kills integer, dmg bigint, lvl smallint, win boolean, pacts smallint, build jsonb, created_at timestamptz, me boolean)
language sql stable security definer set search_path = public as $$
  with best as (
    select distinct on (s.user_id) s.*, p.nick, p.title,
      case p_metric when 'kills' then s.kills::float8 when 'dmg' then s.dmg::float8 else s.t::float8 * 1e7 + s.kills end as score
    from public.scores s join public.profiles p on p.user_id = s.user_id
    where s.stage = p_stage and s.diff = p_diff and s.week is not distinct from p_week
    order by s.user_id, score desc, s.created_at
  )
  select row_number() over (order by score desc, created_at), nick, title, ch, t, kills, dmg, lvl, win, pacts, build, created_at,
         coalesce(user_id = auth.uid(), false)
  from best order by score desc, created_at limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;
revoke all on function public.leaderboard(int, text, text, text, int) from public;
grant execute on function public.leaderboard(int, text, text, text, int) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- v116: community events, the weekly ghost, "overtaken" notices. Safe to run again (it also re-runs everything above).
-- ---------------------------------------------------------------------------
-- per-run counters for the community events (kills, bosses, a few enemy / boss ids of the week)
alter table public.scores add column if not exists ev jsonb;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'scores_ev_small') then
    alter table public.scores add constraint scores_ev_small check (ev is null or (jsonb_typeof(ev) = 'object' and pg_column_size(ev) < 2000));
  end if;
end $$;

-- the community total of every counter between two moments (the client asks for the current ISO week)
create or replace function public.community(p_from timestamptz, p_to timestamptz)
returns table (k text, v bigint)
language sql stable security definer set search_path = public as $$
  select e.key, sum(least(greatest(coalesce((e.value)::numeric, 0), 0), 3000000))::bigint
  from public.scores s, jsonb_each_text(s.ev) e
  where s.ev is not null and s.created_at >= p_from and s.created_at < p_to and e.value ~ '^[0-9]{1,8}$'
  group by e.key;
$$;
revoke all on function public.community(timestamptz, timestamptz) from public;
grant execute on function public.community(timestamptz, timestamptz) to anon, authenticated;

-- the weekly ghost: each player's best weekly run path (one point per second), the top one is replayed by everybody
create table if not exists public.ghosts (
  week       text not null check (week ~ '^[0-9]{4}-W[0-9]{2}$'),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  score      double precision not null check (score >= 0),
  ch         text not null check (ch ~ '^[a-z0-9_]{1,24}$'),
  path       jsonb not null check (jsonb_typeof(path) = 'array' and pg_column_size(path) < 60000),
  updated_at timestamptz not null default now(),
  primary key (week, user_id)
);
alter table public.ghosts enable row level security;
revoke all on public.ghosts from anon, authenticated;

create or replace function public.ghost_submit(p_week text, p_score double precision, p_ch text, p_path jsonb) returns void
  language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sign in'; end if;
  if not exists (select 1 from public.profiles where user_id = auth.uid()) then raise exception 'nickname required'; end if;
  insert into public.ghosts (week, user_id, score, ch, path) values (p_week, auth.uid(), p_score, p_ch, p_path)
  on conflict (week, user_id) do update set score = excluded.score, ch = excluded.ch, path = excluded.path, updated_at = now()
    where public.ghosts.score < excluded.score;
end $$;
revoke all on function public.ghost_submit(text, double precision, text, jsonb) from public;
grant execute on function public.ghost_submit(text, double precision, text, jsonb) to authenticated;

create or replace function public.weekly_ghost(p_week text)
returns table (nick text, ch text, score double precision, path jsonb)
language sql stable security definer set search_path = public as $$
  select p.nick, g.ch, g.score, g.path from public.ghosts g join public.profiles p on p.user_id = g.user_id
  where g.week = p_week order by g.score desc, g.updated_at limit 1;
$$;
revoke all on function public.weekly_ghost(text) from public;
grant execute on function public.weekly_ghost(text) to anon, authenticated;

-- "X overtook you": boards where somebody posted, after p_since, a run better than your best, having been below you before
create or replace function public.overtaken(p_since timestamptz)
returns table (stage smallint, diff text, week text, nick text)
language sql stable security definer set search_path = public as $$
  with mine as (
    select s.stage, s.diff, s.week, max(s.t::float8 * 1e7 + s.kills) as sc from public.scores s where s.user_id = auth.uid() group by 1, 2, 3
  ), theirs as (
    select s.stage, s.diff, s.week, s.user_id, max(s.t::float8 * 1e7 + s.kills) as sc from public.scores s
    where s.user_id <> auth.uid() and s.created_at > p_since group by 1, 2, 3, 4
  )
  select t.stage, t.diff, t.week, p.nick from theirs t
  join mine m on m.stage = t.stage and m.diff = t.diff and m.week is not distinct from t.week
  join public.profiles p on p.user_id = t.user_id
  where t.sc > m.sc and not exists (
    select 1 from public.scores o where o.user_id = t.user_id and o.stage = t.stage and o.diff = t.diff and o.week is not distinct from t.week
      and o.created_at <= p_since and o.t::float8 * 1e7 + o.kills > m.sc)
  limit 20;
$$;
revoke all on function public.overtaken(timestamptz) from public;
grant execute on function public.overtaken(timestamptz) to authenticated;
