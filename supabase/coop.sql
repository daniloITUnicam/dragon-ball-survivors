-- Dragon Ball: Survivors — co-op lobby (v119): friends, presence, rooms with a 4-letter code, room chat, invites, "find teammates".
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run (after online.sql). Running it again is safe.
-- Every table is closed (RLS on, no direct grants): the game only talks to the security-definer functions below, which check who is asking.

-- (online.sql makes public.profiles; these two columns are added here too, so the order you run the files in does not matter)
alter table public.profiles add column if not exists title text check (title is null or title ~ '^[a-z0-9_:]{1,40}$');
alter table public.profiles add column if not exists last_seen timestamptz;

-- ---------- friends ----------
create table if not exists public.friend_requests (
  from_user  uuid not null references auth.users(id) on delete cascade,
  to_user    uuid not null references auth.users(id) on delete cascade,
  accepted   boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (from_user, to_user),
  check (from_user <> to_user)
);
alter table public.friend_requests enable row level security;
revoke all on public.friend_requests from anon, authenticated;

-- ---------- rooms ----------
create table if not exists public.rooms (
  code       text primary key check (code ~ '^[A-Z0-9]{4}$'),
  host       uuid not null references auth.users(id) on delete cascade,
  size       smallint not null default 4 check (size between 2 and 4),
  open       boolean not null default true,
  stage      smallint not null default 0 check (stage between 0 and 40),
  mode       text not null default 'classic' check (mode in ('classic','endless')),
  diff       text not null default 'normal' check (diff in ('easy','normal','hard','extreme')),
  status     text not null default 'lobby' check (status in ('lobby','starting','playing')),
  seed       integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.room_members (
  code      text not null references public.rooms(code) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  ch        text not null default 'goku' check (ch ~ '^[a-z0-9_]{1,24}$'),
  ready     boolean not null default false,
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (code, user_id)
);
create unique index if not exists room_members_one on public.room_members (user_id);   -- one room at a time
create table if not exists public.room_messages (
  id         bigint generated always as identity primary key,
  code       text not null references public.rooms(code) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  body       text not null check (length(body) between 1 and 120),
  created_at timestamptz not null default now()
);
create index if not exists room_messages_code on public.room_messages (code, id);
create table if not exists public.room_invites (
  to_user    uuid not null references auth.users(id) on delete cascade,
  from_user  uuid not null references auth.users(id) on delete cascade,
  code       text not null references public.rooms(code) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (to_user, from_user)
);
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_messages enable row level security;
alter table public.room_invites enable row level security;
revoke all on public.rooms, public.room_members, public.room_messages, public.room_invites from anon, authenticated;

-- ---------- helpers ----------
create or replace function public.coop_me() returns uuid language plpgsql stable as $$
begin if auth.uid() is null then raise exception 'sign in'; end if;
  if not exists (select 1 from public.profiles where user_id = auth.uid()) then raise exception 'nickname required'; end if;
  return auth.uid(); end $$;
create or replace function public.coop_uid(p_nick text) returns uuid language sql stable as $$
  select user_id from public.profiles where lower(nick) = lower(btrim(p_nick)) $$;

-- members silent for 40 s leave; empty rooms go; a host who left hands the room to the oldest member
create or replace function public.coop_sweep(p_code text) returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.room_members where code = p_code and last_seen < now() - interval '40 seconds';
  if not exists (select 1 from public.room_members where code = p_code) then delete from public.rooms where code = p_code; return; end if;
  update public.rooms r set host = (select m.user_id from public.room_members m where m.code = p_code order by m.joined_at limit 1), updated_at = now()
    where r.code = p_code and not exists (select 1 from public.room_members m where m.code = p_code and m.user_id = r.host);
end $$;

-- ---------- presence + friends ----------
create or replace function public.coop_touch() returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public.coop_me();
begin update public.profiles set last_seen = now() where user_id = me;
  delete from public.room_invites where created_at < now() - interval '10 minutes'; end $$;

create or replace function public.friend_request(p_nick text) returns text language plpgsql security definer set search_path = public as $$
declare me uuid := public.coop_me(); other uuid := public.coop_uid(p_nick);
begin
  if other is null then return 'not_found'; end if;
  if other = me then return 'self'; end if;
  if exists (select 1 from public.friend_requests where ((from_user = me and to_user = other) or (from_user = other and to_user = me)) and accepted) then return 'already'; end if;
  if exists (select 1 from public.friend_requests where from_user = other and to_user = me) then   -- they asked first: that is a yes
    update public.friend_requests set accepted = true where from_user = other and to_user = me; return 'accepted'; end if;
  if (select count(*) from public.friend_requests where from_user = me and not accepted) >= 30 then return 'too_many'; end if;
  insert into public.friend_requests (from_user, to_user) values (me, other) on conflict do nothing; return 'sent';
end $$;

create or replace function public.friend_respond(p_nick text, p_accept boolean) returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public.coop_me(); other uuid := public.coop_uid(p_nick);
begin if p_accept then update public.friend_requests set accepted = true where from_user = other and to_user = me;
  else delete from public.friend_requests where from_user = other and to_user = me; end if; end $$;

create or replace function public.friend_remove(p_nick text) returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public.coop_me(); other uuid := public.coop_uid(p_nick);
begin delete from public.friend_requests where (from_user = me and to_user = other) or (from_user = other and to_user = me); end $$;

-- status: friend / incoming / outgoing; online = seen in the last 2 minutes; room = the code of the room they are in (friends only)
create or replace function public.friend_list() returns table (nick text, title text, status text, online boolean, room text)
language sql security definer set search_path = public as $$
  with me as (select public.coop_me() as id)
  select p.nick, p.title,
    case when f.accepted then 'friend' when f.to_user = (select id from me) then 'incoming' else 'outgoing' end,
    coalesce(p.last_seen > now() - interval '2 minutes', false),
    case when f.accepted then (select m.code from public.room_members m where m.user_id = p.user_id) end
  from public.friend_requests f
  join public.profiles p on p.user_id = case when f.from_user = (select id from me) then f.to_user else f.from_user end
  where f.from_user = (select id from me) or f.to_user = (select id from me)
  order by 3, 4 desc, p.nick limit 100 $$;

-- ---------- rooms ----------
create or replace function public.room_create(p_size int, p_open boolean) returns text language plpgsql security definer set search_path = public as $$
declare me uuid := public.coop_me(); c text; old text; i int := 0;
begin
  select code into old from public.room_members where user_id = me;
  if old is not null then delete from public.room_members where user_id = me; perform public.coop_sweep(old); end if;
  loop
    c := (select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '') from generate_series(1, 4));
    exit when not exists (select 1 from public.rooms where code = c); i := i + 1; if i > 20 then raise exception 'no code'; end if;
  end loop;
  insert into public.rooms (code, host, size, open) values (c, me, greatest(2, least(4, coalesce(p_size, 4))), coalesce(p_open, true));
  insert into public.room_members (code, user_id) values (c, me);
  return c;
end $$;

create or replace function public.room_join(p_code text) returns text language plpgsql security definer set search_path = public as $$
declare me uuid := public.coop_me(); r public.rooms%rowtype; old text; c text := upper(btrim(p_code));
begin
  perform public.coop_sweep(c);
  select * into r from public.rooms where code = c for update;
  if not found then return 'not_found'; end if;
  if exists (select 1 from public.room_members where code = c and user_id = me) then return 'ok'; end if;
  if r.status <> 'lobby' then return 'started'; end if;
  if (select count(*) from public.room_members where code = c) >= r.size then return 'full'; end if;
  select code into old from public.room_members where user_id = me;
  if old is not null then delete from public.room_members where user_id = me; perform public.coop_sweep(old); end if;
  insert into public.room_members (code, user_id) values (c, me);
  delete from public.room_invites where to_user = me and code = c;
  update public.rooms set updated_at = now() where code = c;
  return 'ok';
end $$;

create or replace function public.room_leave() returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public.coop_me(); c text;
begin select code into c from public.room_members where user_id = me; if c is null then return; end if;
  delete from public.room_members where user_id = me; perform public.coop_sweep(c); end $$;

-- find a match: an open room that fits the wishes (null / 0 = any) with room left and a host seen recently; none: a new open room with them
drop function if exists public.room_find(int);
create or replace function public.room_find(p_size int, p_mode text, p_stage int, p_diff text) returns text language plpgsql security definer set search_path = public as $$
declare me uuid := public.coop_me(); c text;
begin
  select r.code into c from public.rooms r
    where r.open and r.status = 'lobby' and r.updated_at > now() - interval '10 minutes'
      and (coalesce(p_size, 0) = 0 or r.size = p_size) and (p_mode is null or r.mode = p_mode) and (p_stage is null or r.stage = p_stage) and (p_diff is null or r.diff = p_diff)
      and (select count(*) from public.room_members m where m.code = r.code) < r.size
      and exists (select 1 from public.room_members m where m.code = r.code and m.user_id = r.host and m.last_seen > now() - interval '30 seconds')
      and not exists (select 1 from public.room_members m where m.code = r.code and m.user_id = me)
    order by (select count(*) from public.room_members m where m.code = r.code) desc, r.created_at limit 1;
  if c is not null and public.room_join(c) = 'ok' then return c; end if;
  c := public.room_create(case when coalesce(p_size, 0) = 0 then 4 else p_size end, true);
  update public.rooms set mode = coalesce(p_mode, mode), stage = coalesce(p_stage, stage), diff = coalesce(p_diff, diff) where code = c;
  return c;
end $$;

-- trainers in open rooms right now (the number under "Find a match")
create or replace function public.coop_searching() returns int language sql security definer set search_path = public as $$
  select count(*)::int from public.room_members m join public.rooms r on r.code = m.code where r.open and r.status = 'lobby' and m.last_seen > now() - interval '30 seconds' $$;

-- co-op leaderboard: one row per finished team run (phase 2 posts them), the best of each team (same set of nicknames) per board
create table if not exists public.coop_scores (
  id         bigint generated always as identity primary key,
  size       smallint not null check (size between 2 and 4),
  mode       text not null check (mode in ('classic','endless')),
  stage      smallint not null check (stage between 0 and 40),
  diff       text not null check (diff in ('easy','normal','hard','extreme')),
  members    text[] not null check (array_length(members, 1) between 2 and 4),
  chs        text[] not null,
  team_key   text not null,
  kills      integer not null check (kills between 0 and 5000000),
  t          real not null check (t >= 0 and t <= 36000),
  win        boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists coop_scores_board on public.coop_scores (size, mode, stage, diff);
alter table public.coop_scores enable row level security;
revoke all on public.coop_scores from anon, authenticated;

create or replace function public.coop_board(p_size int, p_mode text, p_stage int, p_diff text)
returns table (rank bigint, members text[], chs text[], kills integer, t real, win boolean, me boolean)
language sql stable security definer set search_path = public as $$
  with mine as (select nick from public.profiles where user_id = auth.uid()),
  best as (select distinct on (team_key) * from public.coop_scores
           where size = p_size and mode = p_mode and stage = p_stage and diff = p_diff order by team_key, kills desc, t desc)
  select row_number() over (order by kills desc, t desc), members, chs, kills, t, win, coalesce((select nick from mine) = any(members), false)
  from best order by kills desc, t desc limit 50 $$;

create or replace function public.room_set(p_code text, p_stage int, p_mode text, p_diff text, p_size int, p_open boolean) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := public.coop_me();
begin
  update public.rooms set stage = coalesce(p_stage, stage), mode = coalesce(p_mode, mode), diff = coalesce(p_diff, diff),
    size = greatest(greatest(2, (select count(*) from public.room_members where code = p_code)::int), least(4, coalesce(p_size, size))),
    open = coalesce(p_open, open), updated_at = now()
  where code = p_code and host = me and status = 'lobby';
  -- a new destination: everybody confirms again
  if p_stage is not null or p_mode is not null or p_diff is not null then update public.room_members set ready = false where code = p_code and user_id <> me; end if;
end $$;

create or replace function public.room_me(p_ch text, p_ready boolean) returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public.coop_me();
begin update public.room_members set ch = coalesce(p_ch, ch), ready = coalesce(p_ready, ready), last_seen = now() where user_id = me; end $$;

create or replace function public.room_say(p_text text) returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public.coop_me(); c text; t text := btrim(regexp_replace(coalesce(p_text, ''), '[[:cntrl:]]', '', 'g'));
begin
  select code into c from public.room_members where user_id = me; if c is null or t = '' then return; end if;
  if exists (select 1 from public.room_messages where user_id = me and created_at > now() - interval '700 milliseconds') then raise exception 'slow down'; end if;
  insert into public.room_messages (code, user_id, body) values (c, me, left(t, 120));
  delete from public.room_messages where code = c and id < (select min(id) from (select id from public.room_messages where code = c order by id desc limit 60) x);
end $$;

create or replace function public.room_invite(p_nick text) returns text language plpgsql security definer set search_path = public as $$
declare me uuid := public.coop_me(); other uuid := public.coop_uid(p_nick); c text;
begin
  select code into c from public.room_members where user_id = me; if c is null then return 'no_room'; end if;
  if other is null or not exists (select 1 from public.friend_requests where accepted and ((from_user = me and to_user = other) or (from_user = other and to_user = me))) then return 'not_friend'; end if;
  insert into public.room_invites (to_user, from_user, code) values (other, me, c) on conflict (to_user, from_user) do update set code = excluded.code, created_at = now();
  return 'sent';
end $$;

create or replace function public.invite_list() returns table (nick text, code text, created_at timestamptz) language sql security definer set search_path = public as $$
  select p.nick, i.code, i.created_at from public.room_invites i join public.profiles p on p.user_id = i.from_user
  where i.to_user = public.coop_me() and i.created_at > now() - interval '10 minutes' order by i.created_at desc limit 10 $$;

-- everything the lobby screen shows, in one call (it also says "I am still here")
create or replace function public.room_state(p_code text, p_after bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := public.coop_me(); c text := upper(btrim(p_code)); r public.rooms%rowtype;
begin
  update public.room_members set last_seen = now() where code = c and user_id = me;
  update public.profiles set last_seen = now() where user_id = me;
  perform public.coop_sweep(c);
  select * into r from public.rooms where code = c;
  if not found or not exists (select 1 from public.room_members where code = c and user_id = me) then return jsonb_build_object('gone', true); end if;
  return jsonb_build_object(
    'code', r.code, 'size', r.size, 'open', r.open, 'stage', r.stage, 'mode', r.mode, 'diff', r.diff, 'status', r.status, 'seed', r.seed,
    'host', (select nick from public.profiles where user_id = r.host), 'me_host', r.host = me,
    'members', (select coalesce(jsonb_agg(jsonb_build_object('nick', p.nick, 'title', p.title, 'ch', m.ch, 'ready', m.ready, 'host', m.user_id = r.host, 'me', m.user_id = me) order by m.joined_at), '[]'::jsonb)
                from public.room_members m join public.profiles p on p.user_id = m.user_id where m.code = c),
    'messages', (select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'nick', p.nick, 'text', x.body, 'me', x.user_id = me) order by x.id), '[]'::jsonb)
                 from public.room_messages x join public.profiles p on p.user_id = x.user_id where x.code = c and x.id > coalesce(p_after, 0)));
end $$;

-- the host starts: at least 2 trainers, all ready; the chat is cleared (phase 2 takes it from here)
create or replace function public.room_start(p_code text) returns text language plpgsql security definer set search_path = public as $$
declare me uuid := public.coop_me(); n int;
begin
  if not exists (select 1 from public.rooms where code = p_code and host = me and status = 'lobby') then return 'not_host'; end if;
  select count(*) into n from public.room_members where code = p_code;
  if n < 2 then return 'alone'; end if;
  if exists (select 1 from public.room_members where code = p_code and not ready and user_id <> me) then return 'not_ready'; end if;
  update public.rooms set status = 'starting', seed = 1 + floor(random() * 2147483000)::int, updated_at = now() where code = p_code;
  delete from public.room_messages where code = p_code;
  return 'ok';
end $$;

do $$ declare f text; begin
  foreach f in array array['coop_touch()','friend_request(text)','friend_respond(text,boolean)','friend_remove(text)','friend_list()','room_create(int,boolean)',
    'room_join(text)','room_leave()','room_find(int,text,int,text)','coop_searching()','room_set(text,int,text,text,int,boolean)','room_me(text,boolean)','room_say(text)','room_invite(text)',
    'invite_list()','room_state(text,bigint)','room_start(text)'] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
  revoke all on function public.coop_sweep(text) from public;
  revoke all on function public.coop_me() from public;
  revoke all on function public.coop_uid(text) from public;
  revoke all on function public.coop_board(int,text,int,text) from public;
  grant execute on function public.coop_board(int,text,int,text) to anon, authenticated;
end $$;

-- ---------- v120: signalling for the co-op run (WebRTC offers / answers / ICE candidates between room members) ----------
create table if not exists public.room_signals (
  id         bigint generated always as identity primary key,
  code       text not null references public.rooms(code) on delete cascade,
  from_user  uuid not null references auth.users(id) on delete cascade,
  to_user    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('offer','answer','ice','bye')),
  data       jsonb not null check (pg_column_size(data) < 16000),
  created_at timestamptz not null default now()
);
create index if not exists room_signals_to on public.room_signals (to_user, id);
alter table public.room_signals enable row level security;
revoke all on public.room_signals from anon, authenticated;

create or replace function public.signal_send(p_to text, p_kind text, p_data jsonb) returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public.coop_me(); c text; other uuid := public.coop_uid(p_to);
begin
  select code into c from public.room_members where user_id = me;
  if c is null or other is null or not exists (select 1 from public.room_members where code = c and user_id = other) then raise exception 'not in the room'; end if;
  if (select count(*) from public.room_signals where from_user = me and created_at > now() - interval '10 seconds') > 120 then raise exception 'slow down'; end if;
  insert into public.room_signals (code, from_user, to_user, kind, data) values (c, me, other, p_kind, p_data);
end $$;

-- my signals, oldest first; they are deleted as they are read
create or replace function public.signal_take() returns table (id bigint, nick text, kind text, data jsonb) language plpgsql security definer set search_path = public as $$
declare me uuid := public.coop_me();
begin
  delete from public.room_signals where created_at < now() - interval '2 minutes';
  return query with t as (delete from public.room_signals s where s.to_user = me returning s.id, s.from_user, s.kind, s.data)
    select t.id, p.nick, t.kind, t.data from t join public.profiles p on p.user_id = t.from_user order by t.id;
end $$;

-- the run is on: the room stays "playing" (nobody new can join) until the host closes it
create or replace function public.room_playing(p_code text, p_on boolean) returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public.coop_me();
begin update public.rooms set status = case when p_on then 'playing' else 'lobby' end, updated_at = now() where code = p_code and host = me;
  if not p_on then update public.room_members set ready = false where code = p_code; end if; end $$;

-- a finished co-op run goes on the co-op leaderboard (posted by the host; every name must be in the room)
create or replace function public.coop_post(p_code text, p_kills int, p_t real, p_win boolean, p_chs text[]) returns void language plpgsql security definer set search_path = public as $$
declare me uuid := public.coop_me(); r public.rooms%rowtype; names text[];
begin
  select * into r from public.rooms where code = p_code and host = me;
  if not found or r.status <> 'playing' then raise exception 'not playing'; end if;
  if extract(epoch from now() - r.updated_at) + 10 < p_t * 0.45 then raise exception 'too fast'; end if;
  if p_kills > p_t * 120 + 500 then raise exception 'implausible kills'; end if;
  select array_agg(p.nick order by lower(p.nick)) into names from public.room_members m join public.profiles p on p.user_id = m.user_id where m.code = p_code;
  if array_length(names, 1) < 2 then raise exception 'alone'; end if;
  insert into public.coop_scores (size, mode, stage, diff, members, chs, team_key, kills, t, win)
    values (array_length(names, 1), r.mode, r.stage, r.diff, names, p_chs[1:4], lower(array_to_string(names, '|')), p_kills, p_t, p_win);
end $$;

do $$ declare f text; begin
  foreach f in array array['signal_send(text,text,jsonb)','signal_take()','room_playing(text,boolean)','coop_post(text,int,real,boolean,text[])'] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
