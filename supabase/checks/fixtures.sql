-- HBStats — Copyright (C) 2026 Antonio Bueno Antón. SPDX-License-Identifier: AGPL-3.0-or-later
-- Checks for public.fixtures and its row level security. Run it after schema.sql (SQL editor or execute_sql).
-- It builds its own throwaway users, teams and matches inside one transaction and rolls everything back, so it
-- leaves no trace. Every check raises an exception when it fails and a NOTICE «PASS …» when it holds.

begin;

-- Setup (as the migration owner): two teams, a member of each, and one match per team.
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'fixtures-check-member@example.invalid'),
  ('00000000-0000-4000-8000-0000000000a2', 'fixtures-check-outsider@example.invalid');
insert into public.teams (id, club, name) values
  ('00000000-0000-4000-8000-0000000000b1', 'Check club A', 'CheckA'),
  ('00000000-0000-4000-8000-0000000000b2', 'Check club B', 'CheckB');
insert into public.team_members (team_id, user_id, role) values
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000a1', 'owner'),
  ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000a2', 'owner');
insert into public.matches (id, team_id, status, state) values
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000b1', 'finished', '{}'),
  ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-0000000000b2', 'finished', '{}');
insert into public.fixtures (team_id, season, competition, round, weekend, home, opponent)
select '00000000-0000-4000-8000-0000000000b1', '2026/2027', 'Check league', r, date '2026-10-18' + 7 * r, r % 2 = 0, 'Rival ' || r
from generate_series(1, 14) as r;

-- 1. A member reads the 14 rows of the team.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.fixtures where team_id = '00000000-0000-4000-8000-0000000000b1';
  if n <> 14 then raise exception 'FAIL member reads % fixtures, expected 14', n; end if;
  raise notice 'PASS member reads 14 fixtures';
end $$;

-- 2. A member writes: a new round, a kickoff update (touch trigger), a link to a match of the same team.
do $$
declare stamp timestamptz;
begin
  insert into public.fixtures (team_id, season, competition, round, weekend, home, opponent)
    values ('00000000-0000-4000-8000-0000000000b1', '2026/2027', 'Check league', 15, '2027-03-07', true, 'Rival 15');
  update public.fixtures set kickoff = '2026-10-25 12:30+02', venue = 'Pabellón', match_id = '00000000-0000-4000-8000-0000000000c1'
    where team_id = '00000000-0000-4000-8000-0000000000b1' and round = 1;
  select updated_at into stamp from public.fixtures where team_id = '00000000-0000-4000-8000-0000000000b1' and round = 1;
  if stamp is null then raise exception 'FAIL member update did not stick'; end if;
  if not exists (select 1 from public.fixtures where round = 1 and updated_by = '00000000-0000-4000-8000-0000000000a1') then
    raise exception 'FAIL touch_updated_at did not set updated_by';
  end if;
  raise notice 'PASS member inserts, updates and links a match of the same team';
end $$;

-- 3. The unique key refuses a repeated round.
do $$
begin
  begin
    insert into public.fixtures (team_id, season, competition, round, weekend, home, opponent)
      values ('00000000-0000-4000-8000-0000000000b1', '2026/2027', 'Check league', 1, '2026-10-18', true, 'Dup');
    raise exception 'FAIL a repeated round was accepted';
  exception when unique_violation then
    raise notice 'PASS a repeated round is refused';
  end;
end $$;

-- 4. Linking a match of another team is refused (insert and update).
do $$
begin
  begin
    update public.fixtures set match_id = '00000000-0000-4000-8000-0000000000c2'
      where team_id = '00000000-0000-4000-8000-0000000000b1' and round = 2;
    raise exception 'FAIL linking a match of another team was accepted by update';
  exception when insufficient_privilege or check_violation or foreign_key_violation then
    raise notice 'PASS update linking a match of another team is refused';
  end;
  begin
    insert into public.fixtures (team_id, season, competition, round, weekend, home, opponent, match_id)
      values ('00000000-0000-4000-8000-0000000000b1', '2026/2027', 'Check league', 16, '2027-03-14', true, 'Rival 16',
              '00000000-0000-4000-8000-0000000000c2');
    raise exception 'FAIL linking a match of another team was accepted by insert';
  exception when insufficient_privilege or check_violation or foreign_key_violation then
    raise notice 'PASS insert linking a match of another team is refused';
  end;
end $$;

-- 5. The column checks refuse bad values.
do $$
begin
  begin
    insert into public.fixtures (team_id, season, competition, round, weekend, home, opponent)
      values ('00000000-0000-4000-8000-0000000000b1', '2026/2027', 'Check league', 61, '2027-03-21', true, 'Round 61');
    raise exception 'FAIL round 61 was accepted';
  exception when check_violation then
    raise notice 'PASS round outside 1-60 is refused';
  end;
  begin
    insert into public.fixtures (team_id, season, competition, round, weekend, home, opponent)
      values ('00000000-0000-4000-8000-0000000000b1', '2026/2027', 'Check league', 17, '2027-03-21', true, '');
    raise exception 'FAIL an empty opponent was accepted';
  exception when check_violation then
    raise notice 'PASS empty opponent is refused';
  end;
end $$;

-- 6. A non-member reads 0 rows and cannot write into the team.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.fixtures where team_id = '00000000-0000-4000-8000-0000000000b1';
  if n <> 0 then raise exception 'FAIL non-member reads % fixtures, expected 0', n; end if;
  raise notice 'PASS non-member reads 0 fixtures';
  begin
    insert into public.fixtures (team_id, season, competition, round, weekend, home, opponent)
      values ('00000000-0000-4000-8000-0000000000b1', '2026/2027', 'Check league', 20, '2027-04-04', true, 'Intruder');
    raise exception 'FAIL non-member inserted a fixture';
  exception when insufficient_privilege then
    raise notice 'PASS non-member insert is refused';
  end;
end $$;

-- 7. Anon has no access at all.
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
begin
  begin
    perform count(*) from public.fixtures;
    raise exception 'FAIL anon could read fixtures';
  exception when insufficient_privilege then
    raise notice 'PASS anon read is refused';
  end;
end $$;

reset role;
rollback;
