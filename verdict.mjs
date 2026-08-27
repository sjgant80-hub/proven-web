// proven-web · verdict.mjs — THE VERDICT LAW.
//
// Every badge on the internet is a self-claim: shields.io renders whatever you tell it. This is
// the other kind — a verdict is DERIVED from mutation-gate evidence, carries its own expiry, and
// is signed by the registry key so anyone can check it wasn't invented. Three laws, all pure:
//
//   verdictOf(evidence, nowMs, ttlDays) — evidence in, verdict out (or a named refusal)
//   signable(verdict)                   — the canonical byte-string the signature covers
//   validVerdict(verdict, nowMs)        — shape + expiry (a verdict that cannot expire is a claim)
//   badgeSVG(verdict, nowMs)            — the badge SAYS expired/refused; it can fail, so it means something
//
// A tier is never accepted from the input — it is COMPUTED from the kill counts. A `tier` field on
// evidence is a self-claim and is ignored (the ladder's own rule).

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v)) ? v : null;
const nonneg = (n) => Number.isInteger(n) && n >= 0;
const DAY = 86400000;

export function verdictOf(evidence, nowMs, ttlDays = 30) {
  const e = obj(evidence);
  if (!e) return { ok: false, why: 'evidence must be an object' };
  if (!Number.isFinite(nowMs)) return { ok: false, why: 'nowMs must be a finite timestamp — the law does not own a clock' };
  if (!Number.isInteger(ttlDays) || ttlDays <= 0) return { ok: false, why: 'ttlDays must be a positive integer' };
  const repo = typeof e.repo === 'string' && /^[\w.-]+\/[\w.-]+$/.test(e.repo) ? e.repo : null;
  if (!repo) return { ok: false, why: 'repo must be owner/name' };
  const sha = typeof e.sha === 'string' && /^[0-9a-f]{7,40}$/.test(e.sha) ? e.sha : null;
  if (!sha) return { ok: false, why: 'sha must be the commit the gate ran against — a verdict without a sha floats free of the code' };
  if (!nonneg(e.killed) || !nonneg(e.survived) || !nonneg(e.baselined)) return { ok: false, why: 'killed/survived/baselined must be non-negative integers' };
  if (e.killed + e.survived === 0) return { ok: false, why: 'zero mutants is not a gate — nothing was attacked' };
  const checker = typeof e.checker === 'string' ? e.checker : null;  // '' falls to the !checker refusal below
  if (!checker) return { ok: false, why: 'checker must name the pinned tool (e.g. witness@v0.6) — an unpinned gate is a gate somebody else can change' };
  const tier = e.survived === 0 ? 'proven' : 'refused';
  const score = Math.round((e.killed / (e.killed + e.survived)) * 1000) / 1000;
  return {
    ok: true,
    verdict: {
      v: 1, repo, sha, tier, score,
      killed: e.killed, survived: e.survived, baselined: e.baselined,
      checker, at: nowMs, expiresAt: nowMs + ttlDays * DAY,
    },
  };
}

// canonical signing string: fixed key order, no whitespace games — the signature covers exactly this
export function signable(verdict) {
  const w = obj(verdict);
  if (!w) return { ok: false, why: 'not a verdict' };
  const keys = ['v', 'repo', 'sha', 'tier', 'score', 'killed', 'survived', 'baselined', 'checker', 'at', 'expiresAt'];
  if (keys.some((k) => !(k in w))) return { ok: false, why: 'verdict is missing fields — refuse to sign a partial' };
  return { ok: true, text: keys.map((k) => k + '=' + String(w[k])).join('|') };
}

export function validVerdict(verdict, nowMs) {
  const w = obj(verdict);
  if (!w || w.v !== 1) return { ok: false, why: 'not a v1 verdict' };
  if (!Number.isFinite(nowMs)) return { ok: false, why: 'nowMs required' };
  const s = signable(w);
  if (!s.ok) return { ok: false, why: s.why };
  if (w.tier !== 'proven' && w.tier !== 'refused') return { ok: false, why: 'unknown tier' };
  if (nowMs >= w.expiresAt) return { ok: false, why: 'EXPIRED — the proof must be re-sat, a verdict is not a tattoo' };
  return { ok: true };
}

export function badgeSVG(verdict, nowMs) {
  const w = obj(verdict);
  const state = !w ? 'unknown'
    : !validVerdict(w, nowMs).ok ? (w.tier && nowMs >= w.expiresAt ? 'expired' : 'unknown')
    : w.tier;
  const COLOR = { proven: '#2da44e', refused: '#d1242f', expired: '#9a6700', unknown: '#6e7781' };
  const LABEL = { proven: 'proven ' + (w ? Math.round(w.score * 100) + '%' : ''), refused: 'refused', expired: 'expired — re-sit', unknown: 'unknown' };
  const label = (LABEL[state] || 'unknown').trim();
  const wpx = 78 + label.length * 7;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${wpx}" height="20" role="img" aria-label="proven-web: ${label}">` +
    `<rect width="70" height="20" fill="#24292f"/><rect x="70" width="${wpx - 70}" height="20" fill="${COLOR[state]}"/>` +
    `<g fill="#fff" font-family="Verdana,sans-serif" font-size="11"><text x="6" y="14">mutation</text>` +
    `<text x="76" y="14">${label}</text></g></svg>`;
}
