# Accounts with Supabase

HBStats signs coaches in and keeps teams, rosters and matches in a [Supabase](https://supabase.com) project.
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

**Authentication → Users → Invite user** with the coach's email. The email link opens HBStats, which asks the
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

## Data

| Table | What it holds |
|---|---|
| `teams` | Club and scoreboard names, brand colours, crest (a small image as a data URL). |
| `team_members` | Which users belong to which team (`owner` creates it, `coach` is added). |
| `players` | The team roster. Players who leave are kept as inactive so past matches still make sense. |
| `matches` | One row per match: listing columns (date, rival, venue, status, score) and the whole match state as JSON. |

The app keeps a copy of every match it opens on the device and uploads changes a couple of seconds after each
one (and when the connection comes back), so a match goes on in a sports hall without coverage. Signing out waits
until every match is uploaded, then clears the team's data from the device.
