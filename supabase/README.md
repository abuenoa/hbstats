# Accounts with Supabase

Zona6 signs coaches in and keeps teams, rosters and matches in a [Supabase](https://supabase.com) project.
The app stays a static site on GitHub Pages: it talks to Supabase from the browser with the project's public
*anon* key, and row level security (in `schema.sql`) limits every coach to the teams they belong to.

Without `config/cloud.json` the build has no accounts: each device keeps its own teams and matches (this is
also how the tests and previews run).

## Set up a project (once)

1. Create a project at [supabase.com](https://supabase.com) (a region close to the clubs, for example Frankfurt).
2. **SQL Editor** → paste `supabase/schema.sql` → *Run*. Run it again after any change to the file; it is idempotent.
3. **Authentication → Sign In / Providers**: keep *Email* on and turn **off** *Allow new users to sign up*
   (access is by invitation only).
4. **Authentication → URL Configuration**: *Site URL* `https://abuenoa.github.io/hbstats/`, and add the same
   address to *Redirect URLs* (invitation and password-reset links come back there).
5. **Project Settings → API**: copy the *Project URL* and the *anon public* key into `config/cloud.json`:

   ```json
   { "url": "https://<project-ref>.supabase.co", "anonKey": "<anon public key>" }
   ```

   The anon key is public by design (it ships inside the web page). **Never** put the `service_role` key in this
   repository or in the app; the build refuses it.
6. `python3 tools/build_site.py`, commit `config/` and `docs/`, push.

## Invite a coach

**Authentication → Users → Invite user** with the coach's email. The email link opens Zona6, which asks the
coach to choose a password, then to create their team (name, colours, crest) and its roster.

To add a second coach to an existing team, invite them, then in the **SQL Editor**:

```sql
insert into public.team_members (team_id, user_id, role)
select t.id, u.id, 'coach'
from public.teams t, auth.users u
where t.name = 'Triana' and u.email = 'second.coach@example.com';
```

A coach can create more teams with *+ Equipo* and switches between them from the home screen. Only a team's
owner (whoever created it) can delete it, which also deletes its roster and matches.

## Invitation e-mail

The staff invite players from «Editar equipo» through the `invite-player` edge function. A player's invite carries
the team's message, already filled in with his name and the team's, as user metadata. In **Authentication → Emails →
Invite user**, print it above the button:

```html
{{ if .Data.message }}<p>{{ .Data.message }}</p>{{ end }}
```

(`{{ .Data.player_name }}` and `{{ .Data.team_name }}` are there too.) The app shows an invite unused for longer than
`INVITE_TTL_MS` (24 h, Supabase's default) as «Caducada»: if the project's e-mail link validity is changed, change
that constant to match.

## Players' match reports by e-mail

At the final whistle the app sends the whole report (the match PDF and every player's page) to the owner and the
coaches whose e-mail is confirmed and to the coaching staff with an e-mail on their profile (staff-only `staff_contacts`),
one e-mail each, through the Edge Function `send-staff-report`, and each player with an e-mail
(staff-only `player_contacts`) his own text and PDF page through `send-player-reports`. Both mail through an SMTP account kept in its secrets
(**Edge Functions → Secrets**, shared through `functions/_shared/mail.ts`): `SMTP_HOST` (for Gmail `smtp.gmail.com`), `SMTP_PORT` (`465`), `SMTP_USER`,
`SMTP_PASS` (a Gmail app password, never the account password) and optionally `SMTP_FROM`. Without them the app says
the e-mail is not set up and nothing is sent; WhatsApp and «Compartir» work regardless.

### Download links to the PDFs

A WhatsApp message cannot carry files, so when the final screen opens the app uploads the match PDF, the all-players
PDF and each player's page to the private Storage bucket `match-reports` (path `<team id>/<match id>/<file>.pdf`) and
puts signed download links in every text: each player's (WhatsApp and e-mail) has his own page, the staff's have both
PDFs. The e-mails keep their attachments too. The links open for 90 days (`REPORT_LINK_SECONDS` in the app) and are
made again when the match changes. The bucket and its policies (the team's owner and coaches read and write their
team's folder; nobody else) come with the «report links» migration in `schema.sql`. Without them the app says the links
could not be made and sends the texts without them.

The PDFs go to the private `match-reports` bucket and the messages carry short links,
`/functions/v1/report-pdf?k=<key>` (`report_links`, keys of letters and digits; a long signed URL broke in WhatsApp). The
`report-pdf` function is deployed **without JWT verification** (`--no-verify-jwt`): it is meant to be opened by anyone with
the link, and it signs a one-minute download of that one PDF on each visit.

## Data

| Table | What it holds |
|---|---|
| `teams` | Club and scoreboard names, brand colours (the app wears the first two; an optional third is one more kit), crest (a small image as a data URL), coaching staff (name, job and photo, up to 6), the invitation message (`{nombre}` and `{equipo}` filled in per player; null is the app's default). |
| `team_members` | Which users belong to which team (`owner` creates it, `coach` is added, `player` and `viewer` read only), and when and how (`email` or `link`) the last invite went out. |
| `player_contacts` | Staff only: each roster player's e-mail and phone (`+` and the country code), kept before and after an invite. Players and guests never read them. |
| `players` | The team roster. Players who leave are kept as inactive so past matches still make sense. |
| `matches` | One row per match: listing columns (date, rival, venue, status, score) and the whole match state as JSON. |
| `fixtures` | The season calendar: one row per round (reference Sunday, home or away, opponent, kickoff, venue) and the match played in it. Load a calendar file with `python3 tools/calendar_sql.py FILE TEAM_ID`. |
| `attendance_sessions` | One row per team, day and kind (training or match day): the absences, justified absences and injuries of the roster. |

`supabase/checks/*.sql` test the row level security of these tables; each runs in a transaction that is rolled back.

The app keeps a copy of every match it opens on the device and uploads changes a couple of seconds after each
one (and when the connection comes back), so a match goes on in a sports hall without coverage. Signing out waits
until every match is uploaded, then clears the team's data from the device.
