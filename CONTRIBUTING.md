# Contributing to HBStats

Thanks for helping. HBStats is used live, during matches, by coaches on tablets: speed, clarity and reliability
come before everything else. Puedes escribir issues y pull requests en español.

## Before you start

- **Ideas and bugs:** open an issue first (templates under *New issue*), so we agree on the approach before code.
- **Licence:** contributions are accepted under the [Contributor License Agreement](CLA.md). In short: you keep
  your copyright, and the project can ship your contribution in the AGPL edition and in a future commercial edition.
  You accept it by ticking the box in the pull request template.
- **Conduct:** see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Set-up

Requirements: Python 3.10+ and a Chrome/Chromium (the scripts find it through `CHROME`, a Playwright-installed
browser, or `google-chrome`/`chromium` on the PATH). There are no packages to install.

```sh
python3 tools/run_tests.py    # test suite (must pass)
python3 tools/build_site.py   # regenerate docs/ (commit it together with your change)
```

To try the app, serve the built site and open a club, e.g. `python3 -m http.server -d docs 8080` and
<http://localhost:8080/> (the service worker needs `http://localhost` or HTTPS, not `file://`).

## Where things are

- `src/app.html` — the whole app. Event-sourced: every statistic derives from `state.events`; undoable operations
  are `{added, removed, phase?}`. Keep it a single file with no build step and no runtime dependencies beyond
  Google Fonts, supabase-js (accounts, only when the build sets a project) and jsPDF (loaded only for reports).
- `tests/inject.js` — tests run inside the app's scope; add one for every behaviour you add or change, including
  edge cases and failure paths.
- `supabase/` — database schema and account setup (see `supabase/README.md`).
- `docs/` — generated; never edit by hand.

## Code guidelines

- Read the surrounding code first and reuse what exists (helpers, constants, colour tokens) instead of duplicating.
- Small, focused changes; no unrelated refactors in the same pull request.
- Named constants instead of magic numbers or strings; colours always through CSS tokens (light and dark themes).
- Code, comments and commit messages in English; the user interface in Spanish.
- Touch-first: targets of at least 44 px, no hover-only features, no dialogs that block the match.
- Everything must still fit one landscape screen without scrolling (checked at 1280×720 and 1024×640).
- No new dependencies without discussing them in an issue first.

## Commits and pull requests

Commit messages follow `<type>(<scope>): <subject>` (types: feat, fix, docs, style, refactor, test, chore, perf),
imperative mood, subject of 50 characters or fewer, no trailing period.

A pull request should: describe the change and why, link its issue, pass CI (tests and an up-to-date `docs/`), and
include screenshots for visual changes.
