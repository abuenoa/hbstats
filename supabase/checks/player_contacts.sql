-- Zona6 — Copyright (C) 2026 Antonio Bueno Antón. All rights reserved.
-- Checks for public.player_contacts and its row level security, and for the invite columns of the visual invitations.
-- Run it after schema.sql (SQL editor or execute_sql). It builds its own throwaway users, teams and players inside one
-- transaction and rolls everything back, so it leaves no trace. Every check raises an exception when it fails and a
-- NOTICE «PASS …» when it holds.

begin;

-- Setup (as the migration owner): team A with its owner, a coach, a player with an account and a guest; team B with
-- its owner. Two players in A, one in B.
insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-4000-8000-0000000000a1', 'contacts-check-owner@example.invalid', now()),
  ('00000000-0000-4000-8000-0000000000a2', 'contacts-check-coach@example.invalid', now()),
  ('00000000-0000-4000-8000-0000000000a3', 'contacts-check-player@example.invalid', now()),
  ('00000000-0000-4000-8000-0000000000a4', 'contacts-check-guest@example.invalid', now()),
  ('00000000-0000-4000-8000-0000000000a5', 'contacts-check-outsider@example.invalid', now());
insert into public.teams (id, club, name) values
  ('00000000-0000-4000-8000-0000000000b1', 'Check club A', 'CheckA'),
  ('00000000-0000-4000-8000-0000000000b2', 'Check club B', 'CheckB');
insert into public.players (id, team_id, num, name, pos) values
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000b1', 8, 'Manu', 'LAT'),
  ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-0000000000b1', 9, 'Nacho', 'PIV'),
  ('00000000-0000-4000-8000-0000000000c3', '00000000-0000-4000-8000-0000000000b2', 7, 'Otro', 'EXT');
insert into public.team_members (team_id, user_id, role, player_id) values
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000a1', 'owner', null),
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000a2', 'coach', null),
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000a3', 'player', '00000000-0000-4000-8000-0000000000c1'),
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000a4', 'viewer', null),
  ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000a5', 'owner', null);

-- 1. The owner saves a player's e-mail, then his phone: one row, the second write keeps the e-mail.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$
declare stored public.player_contacts;
begin
  insert into public.player_contacts (player_id, team_id, email)
    values ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000b1', 'manu@example.invalid');
  insert into public.player_contacts (player_id, team_id, phone)
    values ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000b1', '+34600111222')
    on conflict (player_id) do update set phone = excluded.phone;
  select * into stored from public.player_contacts where player_id = '00000000-0000-4000-8000-0000000000c1';
  if stored.email is distinct from 'manu@example.invalid' or stored.phone is distinct from '+34600111222' then
    raise exception 'FAIL the owner''s contact reads %', row_to_json(stored);
  end if;
  raise notice 'PASS the owner saves a player''s e-mail and phone';
end $$;

-- 2. A coach of the team reads and writes the contacts too.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
do $$
declare n int;
begin
  insert into public.player_contacts (player_id, team_id, email)
    values ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-0000000000b1', 'nacho@example.invalid');
  select count(*) into n from public.player_contacts where team_id = '00000000-0000-4000-8000-0000000000b1';
  if n <> 2 then raise exception 'FAIL the coach reads % contacts, expected 2', n; end if;
  raise notice 'PASS a coach reads and writes the contacts';
end $$;

-- 3. A player with an account reads none, his own included, and changes none.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a3","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.player_contacts;
  if n <> 0 then raise exception 'FAIL a player reads % contacts, expected 0', n; end if;
  raise notice 'PASS a player reads no contacts';
  update public.player_contacts set phone = '+34699999999' where player_id = '00000000-0000-4000-8000-0000000000c2';
  begin
    insert into public.player_contacts (player_id, team_id, email)
      values ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000b1', 'other@example.invalid')
      on conflict (player_id) do update set email = excluded.email;
    raise exception 'FAIL a player wrote a contact';
  exception when insufficient_privilege then
    raise notice 'PASS a player''s write is refused';
  end;
end $$;

-- 4. A guest reads none either.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a4","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.player_contacts;
  if n <> 0 then raise exception 'FAIL a guest reads % contacts, expected 0', n; end if;
  raise notice 'PASS a guest reads no contacts';
end $$;

-- 5. Another team's owner reads none and cannot file a contact of team A's player under his own team.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a5","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.player_contacts;
  if n <> 0 then raise exception 'FAIL an outsider reads % contacts, expected 0', n; end if;
  raise notice 'PASS an outsider reads no contacts';
  begin
    insert into public.player_contacts (player_id, team_id, email)
      values ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-0000000000b2', 'stolen@example.invalid');
    raise exception 'FAIL a contact of another team''s player was filed';
  exception when insufficient_privilege then
    raise notice 'PASS a contact of another team''s player is refused';
  end;
end $$;

-- 6. The player's phone is still the owner's: nothing above changed it.
reset role;
do $$
begin
  if exists (select 1 from public.player_contacts where player_id = '00000000-0000-4000-8000-0000000000c2' and phone is not null) then
    raise exception 'FAIL a player changed a team-mate''s phone';
  end if;
  raise notice 'PASS the denied update changed nothing';
end $$;

-- 7. The phone and e-mail checks: a number without its «+» country code, too short or with letters, and an address
--    without a domain are refused.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$
declare bad text;
begin
  foreach bad in array array['600111222', '+3460011', '+34 600 111 222', '+34600abc222', '+0034600111222'] loop
    begin
      update public.player_contacts set phone = bad where player_id = '00000000-0000-4000-8000-0000000000c1';
      raise exception 'FAIL phone % was accepted', bad;
    exception when check_violation then null;
    end;
  end loop;
  raise notice 'PASS malformed phones are refused';
  begin
    update public.player_contacts set email = 'manu@sin-dominio' where player_id = '00000000-0000-4000-8000-0000000000c1';
    raise exception 'FAIL an e-mail without a domain was accepted';
  exception when check_violation then
    raise notice 'PASS a malformed e-mail is refused';
  end;
end $$;

-- 8. The invite columns: the channel is e-mail or link, the message at most 600 characters, and team_accounts returns
--    the date and channel of the last invite.
reset role;
update public.team_members set invited_at = '2026-11-12T10:00:00Z', invited_via = 'link'
  where user_id = '00000000-0000-4000-8000-0000000000a3';
do $$
begin
  begin
    update public.team_members set invited_via = 'sms' where user_id = '00000000-0000-4000-8000-0000000000a3';
    raise exception 'FAIL an unknown invite channel was accepted';
  exception when check_violation then
    raise notice 'PASS an unknown invite channel is refused';
  end;
  begin
    update public.teams set invite_message = repeat('m', 601) where id = '00000000-0000-4000-8000-0000000000b1';
    raise exception 'FAIL a message over 600 characters was accepted';
  exception when check_violation then
    raise notice 'PASS a long invite message is refused';
  end;
end $$;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$
declare got record;
begin
  select * into got from public.team_accounts('00000000-0000-4000-8000-0000000000b1') where player_id = '00000000-0000-4000-8000-0000000000c1';
  if got.invited_at is distinct from '2026-11-12T10:00:00Z'::timestamptz or got.invited_via is distinct from 'link' then
    raise exception 'FAIL team_accounts returns % %', got.invited_at, got.invited_via;
  end if;
  raise notice 'PASS team_accounts returns the date and channel of the invite';
end $$;

-- 9. A player taken off the roster for good takes his contact with him.
reset role;
delete from public.team_members where player_id = '00000000-0000-4000-8000-0000000000c1';
delete from public.players where id = '00000000-0000-4000-8000-0000000000c1';
do $$
begin
  if exists (select 1 from public.player_contacts where player_id = '00000000-0000-4000-8000-0000000000c1') then
    raise exception 'FAIL the contact outlived its player';
  end if;
  raise notice 'PASS a deleted player''s contact goes with him';
end $$;

-- 10. Anon has no access at all.
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
begin
  begin
    perform count(*) from public.player_contacts;
    raise exception 'FAIL anon could read player_contacts';
  exception when insufficient_privilege then
    raise notice 'PASS anon read is refused';
  end;
end $$;

reset role;
rollback;
