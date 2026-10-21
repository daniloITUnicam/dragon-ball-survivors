-- Dragon Ball: Survivors — cloud saves
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

create table if not exists public.saves (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  -- a save is a few KB; this stops anybody from storing arbitrary big blobs
  constraint saves_size check (pg_column_size(data) < 200000)
);

-- a save is always a JSON object (never a number, a string or a list); added separately so that running this file again on an existing table also adds it
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'saves_is_object') then
    alter table public.saves add constraint saves_is_object check (jsonb_typeof(data) = 'object');
  end if;
end $$;

alter table public.saves enable row level security;

-- every account can read and write ONLY its own row
drop policy if exists "saves_select_own" on public.saves;
drop policy if exists "saves_insert_own" on public.saves;
drop policy if exists "saves_update_own" on public.saves;
drop policy if exists "saves_delete_own" on public.saves;

create policy "saves_select_own" on public.saves for select to authenticated using (auth.uid() = user_id);
create policy "saves_insert_own" on public.saves for insert to authenticated with check (auth.uid() = user_id);
create policy "saves_update_own" on public.saves for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "saves_delete_own" on public.saves for delete to authenticated using (auth.uid() = user_id);

-- the anonymous (not logged in) role gets nothing
revoke all on public.saves from anon;
grant select, insert, update, delete on public.saves to authenticated;

-- ---------------------------------------------------------------------------
-- Test mode whitelist (optional). Players here can switch on Test mode in Settings; the owner edits the list from the game
-- (Settings > General > Test mode > "Allowed players"). The owner is the row with owner = true: add it BY HAND in the SQL Editor,
-- it is deliberately not in this file (insert into public.testers (email, owner) values ('your-address@example.com', true);).
-- ---------------------------------------------------------------------------
create table if not exists public.testers (
  email      text primary key check (email = lower(email) and length(email) <= 200),
  owner      boolean     not null default false,
  created_at timestamptz not null default now()
);
alter table public.testers enable row level security;

create or replace function public.is_tester_owner() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.testers where owner and email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

drop policy if exists "testers_select" on public.testers;
drop policy if exists "testers_insert" on public.testers;
drop policy if exists "testers_delete" on public.testers;
-- an account sees its own row (that is how the game knows it is allowed); the owner sees all of them
create policy "testers_select" on public.testers for select to authenticated using (email = lower(coalesce(auth.jwt() ->> 'email', '')) or public.is_tester_owner());
create policy "testers_insert" on public.testers for insert to authenticated with check (public.is_tester_owner() and owner = false);
create policy "testers_delete" on public.testers for delete to authenticated using (public.is_tester_owner() and owner = false);

revoke all on public.testers from anon;
grant select, insert, delete on public.testers to authenticated;
