-- HBStats — Copyright (C) 2026 Antonio Bueno Antón. SPDX-License-Identifier: AGPL-3.0-or-later
-- Checks for public.attendance_sessions and its row level security. Run it after schema.sql (SQL editor or
-- execute_sql). It builds its own throwaway users, teams and matches inside one transaction and rolls everything
-- back, so it leaves no trace. Every check raises an exception when it fails and a NOTICE «PASS …» when it holds.

begin;

-- Setup (as the migration owner): two teams, a member of each, and one match per team.
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'attendance-check-member@example.invalid'),
  ('00000000-0000-4000-8000-0000000000a2', 'attendance-check-outsider@example.invalid');
insert into public.teams (id, club, name) values
  ('00000000-0000-4000-8000-0000000000b1', 'Check club A', 'CheckA'),
  ('00000000-0000-4000-8000-0000000000b2', 'Check club B', 'CheckB');
insert into public.team_members (team_id, user_id, role) values
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000a1', 'owner'),
  ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000a2', 'owner');
insert into public.matches (id, team_id, status, state) values
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000b1', 'finished', '{}'),
  ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-0000000000b2', 'finished', '{}');

-- 1. A member upserts twice on one day and kind (two devices, two client ids): one row, the last writer wins.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$
declare n int; stored jsonb;
begin
  insert into public.attendance_sessions (id, team_id, on_date, kind, marks)
    values ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-0000000000b1', '2026-10-20', 'ENTRENO', '{}')
    on conflict (team_id, on_date, kind) do update set marks = excluded.marks, note = excluded.note;
  insert into public.attendance_sessions (id, team_id, on_date, kind, marks, note)
    values ('00000000-0000-4000-8000-0000000000d2', '00000000-0000-4000-8000-0000000000b1', '2026-10-20', 'ENTRENO',
            '{"p1": {"s": "F"}, "p2": {"s": "J", "n": "Médico"}}', 'Lluvia')
    on conflict (team_id, on_date, kind) do update set marks = excluded.marks, note = excluded.note;
  select count(*) into n from public.attendance_sessions
    where team_id = '00000000-0000-4000-8000-0000000000b1' and on_date = '2026-10-20' and kind = 'ENTRENO';
  select marks into stored from public.attendance_sessions
    where team_id = '00000000-0000-4000-8000-0000000000b1' and on_date = '2026-10-20' and kind = 'ENTRENO';
  if n <> 1 then raise exception 'FAIL % rows for one day and kind, expected 1', n; end if;
  if stored -> 'p1' ->> 's' <> 'F' then raise exception 'FAIL the second write did not win: %', stored; end if;
  raise notice 'PASS two upserts on one day and kind leave one row';
end $$;

-- 2. The same day with the other kind is a second row; the touch trigger sets updated_by on update.
do $$
begin
  insert into public.attendance_sessions (id, team_id, on_date, kind, match_id)
    values ('00000000-0000-4000-8000-0000000000d3', '00000000-0000-4000-8000-0000000000b1', '2026-10-20', 'PARTIDO',
            '00000000-0000-4000-8000-0000000000c1');
  update public.attendance_sessions set note = 'Editada' where id = '00000000-0000-4000-8000-0000000000d3';
  if not exists (select 1 from public.attendance_sessions
                 where id = '00000000-0000-4000-8000-0000000000d3' and updated_by = '00000000-0000-4000-8000-0000000000a1') then
    raise exception 'FAIL touch_updated_at did not set updated_by';
  end if;
  raise notice 'PASS a match-day session links a match of the same team and is touched on update';
end $$;

-- 3. The marks check refuses an array, and a value that is not an object.
do $$
begin
  begin
    insert into public.attendance_sessions (id, team_id, on_date, kind, marks)
      values ('00000000-0000-4000-8000-0000000000d4', '00000000-0000-4000-8000-0000000000b1', '2026-10-21', 'ENTRENO', '[]');
    raise exception 'FAIL marks = [] was accepted';
  exception when check_violation then
    raise notice 'PASS marks = [] is refused';
  end;
  begin
    insert into public.attendance_sessions (id, team_id, on_date, kind, marks)
      values ('00000000-0000-4000-8000-0000000000d4', '00000000-0000-4000-8000-0000000000b1', '2026-10-21', 'ENTRENO', '"F"');
    raise exception 'FAIL a string in marks was accepted';
  exception when check_violation then
    raise notice 'PASS a non-object marks is refused';
  end;
  begin
    insert into public.attendance_sessions (id, team_id, on_date, kind, marks)
      values ('00000000-0000-4000-8000-0000000000d4', '00000000-0000-4000-8000-0000000000b1', '2026-10-21', 'ENTRENO',
              jsonb_build_object('p', repeat('x', 30000)));
    raise exception 'FAIL an oversized marks was accepted';
  exception when check_violation then
    raise notice 'PASS an oversized marks is refused';
  end;
end $$;

-- 4. The kind and note checks.
do $$
begin
  begin
    insert into public.attendance_sessions (id, team_id, on_date, kind)
      values ('00000000-0000-4000-8000-0000000000d5', '00000000-0000-4000-8000-0000000000b1', '2026-10-22', 'OTRO');
    raise exception 'FAIL an unknown kind was accepted';
  exception when check_violation then
    raise notice 'PASS an unknown kind is refused';
  end;
  begin
    insert into public.attendance_sessions (id, team_id, on_date, kind, note)
      values ('00000000-0000-4000-8000-0000000000d5', '00000000-0000-4000-8000-0000000000b1', '2026-10-22', 'ENTRENO', repeat('n', 121));
    raise exception 'FAIL a note over 120 characters was accepted';
  exception when check_violation then
    raise notice 'PASS a long note is refused';
  end;
end $$;

-- 5. Linking a match of another team is refused.
do $$
begin
  begin
    insert into public.attendance_sessions (id, team_id, on_date, kind, match_id)
      values ('00000000-0000-4000-8000-0000000000d6', '00000000-0000-4000-8000-0000000000b1', '2026-10-23', 'PARTIDO',
              '00000000-0000-4000-8000-0000000000c2');
    raise exception 'FAIL linking a match of another team was accepted';
  exception when insufficient_privilege or check_violation or foreign_key_violation then
    raise notice 'PASS linking a match of another team is refused';
  end;
end $$;

-- 6. A non-member reads 0 rows and cannot write into the team.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.attendance_sessions where team_id = '00000000-0000-4000-8000-0000000000b1';
  if n <> 0 then raise exception 'FAIL non-member reads % sessions, expected 0', n; end if;
  raise notice 'PASS non-member reads 0 sessions';
  begin
    insert into public.attendance_sessions (id, team_id, on_date, kind)
      values ('00000000-0000-4000-8000-0000000000d7', '00000000-0000-4000-8000-0000000000b1', '2026-10-24', 'ENTRENO');
    raise exception 'FAIL non-member inserted a session';
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
    perform count(*) from public.attendance_sessions;
    raise exception 'FAIL anon could read attendance_sessions';
  exception when insufficient_privilege then
    raise notice 'PASS anon read is refused';
  end;
end $$;

reset role;
rollback;
