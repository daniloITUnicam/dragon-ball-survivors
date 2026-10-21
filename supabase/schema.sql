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
