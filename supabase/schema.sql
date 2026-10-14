-- HBStats — Copyright (C) 2026 Antonio Bueno Antón. SPDX-License-Identifier: AGPL-3.0-or-later
-- Database for HBStats accounts. Run it in the Supabase SQL editor; it is safe to run again after changes.
--
-- Each signed-in coach belongs to one or more teams (team_members). A team has its look (names, colours, crest),
-- its roster (players) and its matches, each match stored whole as the app's own state (JSON) plus a few columns
-- for listing. Row level security: a coach only ever sees and changes the teams they belong to.

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  club text not null check (char_length(club) between 1 and 60),
  name text not null check (char_length(name) between 1 and 24),
  brand text not null default '#d4202a' check (brand ~ '^#[0-9a-fA-F]{6}$'),
  brand2 text not null default '#f5c400' check (brand2 ~ '^#[0-9a-fA-F]{6}$'),
  brand_ink text not null default '#ffffff' check (brand_ink ~ '^#[0-9a-fA-F]{6}$'),
  -- Small crest image as a data URL (the app shrinks uploads), so it also works offline from the local copy.
  crest text check (crest is null or (crest like 'data:image/%' and char_length(crest) <= 300000)),
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'coach' check (role in ('owner', 'coach')),
  primary key (team_id, user_id)
);
create index if not exists team_members_user on public.team_members (user_id);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  num int not null check (num between 1 and 99),
  name text not null check (char_length(name) between 1 and 24),
  pos text not null check (pos in ('POR', 'EXT', 'LAT', 'CEN', 'PIV')),
  -- Players leaving the team are kept (inactive) so past matches still make sense.
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists players_team_num_active on public.players (team_id, num) where active;

create table if not exists public.matches (
  id uuid primary key,
  team_id uuid not null references public.teams (id) on delete cascade,
  played_on date,
  rival text not null default 'Rival',
  venue text not null default '',
  status text not null check (status in ('setup', 'live', 'finished')),
  score_us int not null default 0,
  score_them int not null default 0,
  state jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null
);
create index if not exists matches_team_played_on on public.matches (team_id, played_on desc);
create index if not exists matches_updated_by on public.matches (updated_by);

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;
drop trigger if exists matches_touch on public.matches;
create trigger matches_touch before update on public.matches for each row execute function public.touch_updated_at();

-- Membership check used by every policy (security definer: it reads team_members past its own policy). It lives in
-- a schema the API does not expose, so it can only be used by the policies, never called over the network.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
create or replace function private.is_team_member(team uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from team_members where team_id = team and user_id = auth.uid());
$$;
revoke all on function private.is_team_member(uuid) from public, anon;
grant execute on function private.is_team_member(uuid) to authenticated;
-- Only the coach who created a team (its owner) can delete it, with its roster and matches.
create or replace function private.is_team_owner(team uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from team_members where team_id = team and user_id = auth.uid() and role = 'owner');
$$;
revoke all on function private.is_team_owner(uuid) from public, anon;
grant execute on function private.is_team_owner(uuid) to authenticated;

-- A signed-in coach creates a team and becomes its owner in one step.
create or replace function public.create_team(p_club text, p_name text, p_brand text, p_brand2 text, p_brand_ink text, p_crest text)
returns public.teams
language plpgsql security definer set search_path = public as $$
declare
  created teams;
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  insert into teams (club, name, brand, brand2, brand_ink, crest)
    values (p_club, p_name, p_brand, p_brand2, p_brand_ink, p_crest)
    returning * into created;
  insert into team_members (team_id, user_id, role) values (created.id, auth.uid(), 'owner');
  return created;
end $$;
revoke all on function public.create_team(text, text, text, text, text, text) from public, anon;
grant execute on function public.create_team(text, text, text, text, text, text) to authenticated;

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;

drop policy if exists teams_read on public.teams;
create policy teams_read on public.teams for select to authenticated using (private.is_team_member(id));
drop policy if exists teams_update on public.teams;
create policy teams_update on public.teams for update to authenticated
  using (private.is_team_member(id)) with check (private.is_team_member(id));

drop policy if exists teams_delete on public.teams;
create policy teams_delete on public.teams for delete to authenticated using (private.is_team_owner(id));

drop policy if exists members_read on public.team_members;
create policy members_read on public.team_members for select to authenticated
  using (user_id = (select auth.uid()) or private.is_team_member(team_id));

drop policy if exists players_all on public.players;
create policy players_all on public.players for all to authenticated
  using (private.is_team_member(team_id)) with check (private.is_team_member(team_id));

drop policy if exists matches_all on public.matches;
create policy matches_all on public.matches for all to authenticated
  using (private.is_team_member(team_id)) with check (private.is_team_member(team_id));

drop function if exists public.is_team_member(uuid);
