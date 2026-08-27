// seed-registry.mjs — issue the founding verdicts. HONESTY RULE: a signed verdict is issued ONLY
// where the registry witnessed the real kill counts (this week's gate runs, sources noted per
// entry). Everything else proven on the ladder is listed as OBSERVED — verdict pending its first
// registry re-sit. Fifteen real verdicts beat ninety-three invented ones.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { verdictOf, badgeSVG } from './verdict.mjs';
import { loadOrCreateKey, signVerdict } from './signer.mjs';
import { execFileSync } from 'node:child_process';

const sha = (repo) => {
  try { return execFileSync('gh', ['api', `repos/sjgant80-hub/${repo}/commits/HEAD`, '--jq', '.sha'], { encoding: 'utf8', timeout: 30000 }).trim(); }
  catch { return null; }
};

// killed/survived(=0 after baselining)/baselined — each from a gate run this session, checker pinned
const WITNESSED = [
  ['offramp-v2',        126, 0, 6,  'gate-hardening 2026-08-27, CI green'],
  ['fall-remember',      23, 0, 15, 'hardening 2026-08-27, CI green'],
  ['fallsieve',          19, 0, 0,  'FNV pin 2026-08-27, CI green'],
  ['missig',             17, 0, 2,  'FNV pin 2026-08-27, CI green'],
  ['konomify',           32, 0, 1,  'nearly-survey 2026-08-27, CI green'],
  ['konomium-vault',     85, 0, 6,  'ingest hardening 2026-08-27 (primary kernel), CI green'],
  ['niceassos',         113, 0, 1,  'politePeer coercion kill 2026-08-27, CI green'],
  ['attractor',          20, 0, 8,  'nearly-survey 2026-08-27, CI green'],
  ['si-didy-cascade',    76, 0, 4,  'nearly-survey 2026-08-27, CI green'],
  ['airgap',             17, 0, 3,  'codec hardening 2026-08-27 (mesh law), CI green'],
  ['fallbrain',          28, 0, 0,  'deciding law, campaign 2026-08, CI green'],
  ['si-didy-loop',       39, 0, 0,  'twelve-crawl law 2026-08-27, CI green'],
  ['fallgarden',          9, 0, 0,  'konomify-in-place 2026-08-27, CI green'],
  ['groundlevel',         8, 0, 0,  'konomify-in-place 2026-08-27 (statutory clock), CI green'],
];

mkdirSync('registry', { recursive: true });
mkdirSync('badges', { recursive: true });
const { priv, pubB64 } = await loadOrCreateKey();
writeFileSync('registry-pub.json', JSON.stringify({ kind: 'proven-web-registry-public-key', alg: 'Ed25519', pubB64 }, null, 1));
const now = Date.now();
const issued = [];
for (const [name, killed, survived, baselined, source] of WITNESSED) {
  const commit = sha(name);
  if (!commit) { console.log('SKIP', name, '— no sha reachable'); continue; }
  const r = verdictOf({ repo: 'sjgant80-hub/' + name, sha: commit, killed, survived, baselined, checker: 'witness@v0.6' }, now, 30);
  if (!r.ok) { console.log('REFUSED', name, r.why); continue; }
  const s = await signVerdict(r.verdict, priv);
  writeFileSync('registry/' + name + '.json', JSON.stringify({ ...s.signed, source }, null, 1));
  writeFileSync('badges/' + name + '.svg', badgeSVG(r.verdict, now));
  issued.push(name);
}
// the observed list — proven on the ladder, verdict pending first re-sit (generated, never typed)
const crawl = JSON.parse(readFileSync('C:/Users/sjgan/Downloads/si-didy-loop/local-dna/twelve-crawl.json', 'utf8'));
const observed = crawl.sellable.filter((s) => s.tier === 'proven' && !issued.includes(s.name)).map((s) => s.name);
writeFileSync('registry/observed.json', JSON.stringify({ kind: 'ladder-observed', note: 'proven on the estate ladder (mutation gate green on GitHub); a SIGNED verdict is issued only after a registry-witnessed run — these await their first re-sit', repos: observed, at: now }, null, 1));
console.log('issued ' + issued.length + ' signed verdicts · ' + observed.length + ' ladder-observed pending re-sit');
