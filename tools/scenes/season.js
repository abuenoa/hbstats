// A team with a roster and four finished matches, saved through the local backend (no sign-in, no network).
// Spliced into the app's scope by tools/screenshots.py, so it uses the app's own functions and constants.
// Face avatars drawn on a canvas (head and shoulders in distinct skin and hair tones), as small as the app's own photos.
const SEASON_FACES = [
  { skin: '#f1c7a3', hair: '#2b1d14', shirt: '#3a6ea5', backdrop: '#cfe3f2' },
  { skin: '#8d5a3b', hair: '#151010', shirt: '#b5482f', backdrop: '#f2dcc9' },
  { skin: '#e8b48a', hair: '#8a5a2b', shirt: '#2f7d5b', backdrop: '#d6efe0' },
  { skin: '#c68a62', hair: '#3b2a1e', shirt: '#6b4fa3', backdrop: '#e4dcf3' },
  { skin: '#f5d6bd', hair: '#d9a441', shirt: '#2b2f3a', backdrop: '#e7e9ee' },
  { skin: '#6f4529', hair: '#0e0b0a', shirt: '#c9a227', backdrop: '#f6ecc4' }
];
const SEASON_PHOTOLESS_NUMS = [3, 77, 13];
const SEASON_FACE_QUALITY = 0.85;
function seasonFace(face) {
  const size = CONFIG.photoSizePx, canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const c = canvas.getContext('2d');
  const blob = (colour, x, y, rx, ry) => { c.fillStyle = colour; c.beginPath(); c.ellipse(size * x, size * y, size * rx, size * ry, 0, 0, Math.PI * 2); c.fill(); };
  c.fillStyle = face.backdrop;
  c.fillRect(0, 0, size, size);
  blob(face.shirt, 0.5, 1.02, 0.42, 0.3);
  blob(face.skin, 0.5, 0.66, 0.08, 0.1);
  blob(face.hair, 0.5, 0.38, 0.215, 0.215);
  blob(face.skin, 0.5, 0.45, 0.18, 0.22);
  blob(face.hair, 0.5, 0.27, 0.19, 0.11);
  return canvas.toDataURL('image/jpeg', SEASON_FACE_QUALITY);
}
const SEASON_TEAM = { club: 'Triana BM Vivero', name: 'Triana' };
// The twelve sample players who appear in the sample events: two goalkeepers, ten in the field.
const SEASON_SQUAD_IDS = ['p1', 'p12', 'p22', 'p17', 'p3', 'p8', 'p18', 'p5', 'p77', 'p19', 'p10', 'p13'];
const SEASON_MVP_SAMPLE_ID = 'p8';
const SEASON_DROP_EVERY = 3;
const SEASON_FULL_TIME_MS = 60 * 60 * 1000;
const SEASON_CONCEDED_RESULT = { PARADA: 'GOL' };
const SEASON_MISSED_RESULT = { FUERA: 'GOL' };
// Each match is the sample match with its events changed, so scores and figures differ from match to match.
const SEASON_MATCHES = [
  { date: '2026-09-12', them: 'BM Alcalá', venue: 'Pabellón Vivero', events: (list) => list },
  { date: '2026-09-26', them: 'CD Nervión', venue: 'Polideportivo Nervión', events: (list) => list.filter((e, i) => i % SEASON_DROP_EVERY !== 0) },
  { date: '2026-10-03', them: 'BM Dos Hermanas', venue: 'Pabellón Vivero',
    events: (list) => list.map((e) => (e.kind === 'RIVAL_SHOT' && SEASON_CONCEDED_RESULT[e.result] ? { ...e, result: SEASON_CONCEDED_RESULT[e.result] } : e)) },
  { date: '2026-10-17', them: 'Atlético Bormujos', venue: 'Pabellón Bormujos',
    events: (list) => list.map((e) => (e.kind === 'SHOT' && SEASON_MISSED_RESULT[e.result] ? { ...e, result: SEASON_MISSED_RESULT[e.result] } : e)) }
];

// The sample state with the squad's ids swapped for the saved players' ids, so every figure lands on a roster player.
function seasonMatchState(spec, roster, sampleIds, mvp) {
  const base = sampleState();
  const fieldIds = roster.filter((p) => p.pos !== 'POR').map((p) => p.id);
  const idOf = new Map(sampleIds.map((sampleId, i) => [sampleId, roster[i].id]));
  let orphans = 0;
  const swapIds = (json) => json.replace(/"(p\d+)"/g, (whole, id) => `"${idOf.get(id) || fieldIds[orphans++ % fieldIds.length]}"`);
  const { players, ...rest } = base;
  const events = spec.events(rest.events);
  const swapped = JSON.parse(swapIds(JSON.stringify({ ...rest, events, history: events.map((e) => ({ added: [e], removed: [] })) })));
  return {
    ...swapped, sample: false, finished: true, us: SEASON_TEAM.name, them: spec.them, venue: spec.venue, date: spec.date,
    players: roster.map(({ id, num, name, pos }) => ({ id, num, name, pos })), mvpId: mvp ? idOf.get(SEASON_MVP_SAMPLE_ID) : null,
    clock: { period: 2, elapsedMs: SEASON_FULL_TIME_MS, runningSince: null }
  };
}

async function seedSeason() {
  backend = localBackend();
  const created = await backend.createTeam({ ...DEFAULT_TEAM, ...SEASON_TEAM, id: undefined });
  applyTeam(created);
  const sample = sampleState().players;
  const roster = [];
  for (const sampleId of SEASON_SQUAD_IDS) {
    const { num, name, pos } = sample.find((p) => p.id === sampleId);
    roster.push(await backend.savePlayer(created.id, { num, name, pos, photo: SEASON_PHOTOLESS_NUMS.includes(num) ? null : seasonFace(SEASON_FACES[roster.length % SEASON_FACES.length]) }));
  }
  for (const [i, spec] of SEASON_MATCHES.entries()) {
    const id = newUuid();
    const matchState = seasonMatchState(spec, roster, SEASON_SQUAD_IDS, i === SEASON_MATCHES.length - 1);
    storeLocalMatch(id, matchState, false);
    await backend.saveMatch(created.id, id, matchState);
  }
  home.teams = await backend.listTeams();
  await selectTeam(created);
  return new Map(SEASON_SQUAD_IDS.map((sampleId, i) => [sampleId, roster[i].id]));
}
