#!/usr/bin/env python3
# HBStats — Copyright (C) 2026 Antonio Bueno Antón. SPDX-License-Identifier: AGPL-3.0-or-later
"""Print the SQL that loads a calendar file ("hbstats-calendario") into public.fixtures.

Usage: python3 tools/calendar_sql.py FILE TEAM_ID

Prints one `insert ... on conflict (team_id, season, competition, round) do nothing;` statement, so running it
again never overwrites a kickoff, a venue or a match link already set. Exits 2 with a message on a bad file.
"""
import datetime
import json
import sys
import uuid

FORMAT = "hbstats-calendario"
ROUND_RANGE = (1, 60)
SEASON_LENGTH = (4, 9)
COMPETITION_MAX = 120
OPPONENT_LENGTH = (1, 60)
BAD_INPUT = 2


class CalendarError(Exception):
    pass


def sql_text(value):
    return "'" + value.replace("'", "''") + "'"


def text_field(obj, key, what, low, high):
    value = obj.get(key)
    if not isinstance(value, str) or not low <= len(value.strip()) <= high or len(value) > high:
        raise CalendarError(f"{what}: «{key}» must be text of {low} to {high} characters")
    return value.strip()


def parse_fixture(raw, index):
    where = f"fixture {index + 1}"
    if not isinstance(raw, dict):
        raise CalendarError(f"{where}: not an object")
    rnd = raw.get("round")
    if isinstance(rnd, bool) or not isinstance(rnd, int) or not ROUND_RANGE[0] <= rnd <= ROUND_RANGE[1]:
        raise CalendarError(f"{where}: «round» must be an integer from {ROUND_RANGE[0]} to {ROUND_RANGE[1]}")
    where = f"round {rnd}"
    weekend = raw.get("weekend")
    try:
        if not isinstance(weekend, str) or len(weekend) != 10:
            raise ValueError
        datetime.date.fromisoformat(weekend)
    except ValueError:
        raise CalendarError(f"{where}: «weekend» must be a valid date YYYY-MM-DD, got {weekend!r}") from None
    if not isinstance(raw.get("home"), bool):
        raise CalendarError(f"{where}: «home» must be true or false")
    opponent = text_field(raw, "opponent", where, *OPPONENT_LENGTH)
    return {"round": rnd, "weekend": weekend, "home": raw["home"], "opponent": opponent}


def parse_calendar(data):
    if not isinstance(data, dict) or data.get("format") != FORMAT:
        raise CalendarError(f"not a calendar file: «format» must be «{FORMAT}»")
    season = text_field(data, "season", "calendar", *SEASON_LENGTH)
    competition = text_field(data, "competition", "calendar", 0, COMPETITION_MAX)
    raw_fixtures = data.get("fixtures")
    if not isinstance(raw_fixtures, list) or not raw_fixtures:
        raise CalendarError("calendar: «fixtures» must be a non-empty list")
    fixtures = [parse_fixture(raw, i) for i, raw in enumerate(raw_fixtures)]
    rounds = [f["round"] for f in fixtures]
    repeated = sorted({r for r in rounds if rounds.count(r) > 1})
    if repeated:
        raise CalendarError(f"repeated round: {', '.join(map(str, repeated))}")
    return season, competition, fixtures


def build_sql(team_id, season, competition, fixtures):
    rows = ",\n".join(
        f"  ({sql_text(team_id)}, {sql_text(season)}, {sql_text(competition)}, {f['round']}, "
        f"{sql_text(f['weekend'])}, {'true' if f['home'] else 'false'}, {sql_text(f['opponent'])})"
        for f in sorted(fixtures, key=lambda f: f["round"])
    )
    return (
        "insert into public.fixtures (team_id, season, competition, round, weekend, home, opponent) values\n"
        f"{rows}\n"
        "on conflict (team_id, season, competition, round) do nothing;"
    )


def main(argv):
    if len(argv) != 3:
        print("usage: calendar_sql.py FILE TEAM_ID", file=sys.stderr)
        return BAD_INPUT
    path, team_id = argv[1], argv[2]
    try:
        team_id = str(uuid.UUID(team_id))
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
        print(build_sql(team_id, *parse_calendar(data)))
    except (OSError, ValueError, CalendarError) as error:
        print(f"calendar_sql: {path}: {error}", file=sys.stderr)
        return BAD_INPUT
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
