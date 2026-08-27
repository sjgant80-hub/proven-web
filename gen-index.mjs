// gen-index.mjs — the registry page, GENERATED from registry/*.json (one-kernel-rule: a surface
// stating registry facts is derived from the registry, never typed). Refuses to emit if the
// registry is empty — an empty shelf must fail loudly, not ship blank.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const files = readdirSync('registry').filter((f) => f.endsWith('.json') && f !== 'observed.json');
if (files.length === 0) { console.error('REFUSED: no verdicts in registry/ — an empty shelf must not ship'); process.exit(1); }
const verdicts = files.map((f) => JSON.parse(readFileSync('registry/' + f, 'utf8')));
const observed = JSON.parse(readFileSync('registry/observed.json', 'utf8'));
const pub = JSON.parse(readFileSync('registry-pub.json', 'utf8'));
verdicts.sort((a, b) => a.repo.localeCompare(b.repo));

const card = (v) => {
  const name = v.repo.split('/')[1];
  const days = Math.round((v.expiresAt - Date.now()) / 86400000);
  return `<div class="card"><div class="row"><a class="name" href="https://github.com/${v.repo}">${name}</a><img src="badges/${name}.svg" alt="verdict"></div>
<div class="facts">${v.killed} mutants killed · ${v.survived} survived · ${v.baselined} argued equivalents · <code>${v.checker}</code></div>
<div class="facts">sha <code>${v.sha.slice(0, 12)}</code> · expires in ${days}d · <span class="src">${v.source || ''}</span></div>
<details><summary>the signed verdict</summary><pre>${JSON.stringify(v, null, 1).replace(/</g, '&lt;')}</pre></details></div>`;
};

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>THE PROVEN WEB · a registry where software re-proves itself</title>
<style>
:root{--bg:#0d1117;--card:#161b22;--line:#30363d;--ink:#e6edf3;--soft:#8b949e;--green:#2da44e;--gold:#c9a24a}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 -apple-system,"Segoe UI",sans-serif;padding:0 16px 60px}
header{max-width:900px;margin:40px auto 8px}h1{font-size:2rem;margin:0}h1 span{color:var(--gold)}
.sub{color:var(--soft);max-width:900px;margin:6px auto 26px}
.wire{max-width:900px;margin:0 auto 30px;border:1px solid var(--line);border-left:3px solid var(--gold);border-radius:8px;padding:12px 16px;color:var(--soft);font-size:.92rem}
.grid{max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(400px,1fr));gap:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
.row{display:flex;justify-content:space-between;align-items:center;gap:10px}
.name{color:var(--ink);font-weight:700;text-decoration:none;font-size:1.05rem}.name:hover{color:var(--gold)}
.facts{color:var(--soft);font-size:.85rem;margin-top:6px}.src{font-style:italic}
code{background:#21262d;padding:1px 5px;border-radius:4px;font-size:.85em}
details{margin-top:8px}summary{color:var(--gold);cursor:pointer;font-size:.85rem}
pre{overflow-x:auto;background:#0d1117;border:1px solid var(--line);border-radius:6px;padding:10px;font-size:.75rem}
h2{max-width:900px;margin:38px auto 10px;font-size:1.15rem}
.obs{max-width:900px;margin:0 auto;color:var(--soft);font-size:.85rem;line-height:2}
.obs span{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:2px 8px;margin-right:6px;white-space:nowrap}
footer{max-width:900px;margin:44px auto 0;color:var(--soft);font-size:.8rem;border-top:1px solid var(--line);padding-top:14px}
a{color:var(--gold)}
</style></head><body>
<header><h1>THE PROVEN WEB <span>◦</span></h1></header>
<p class="sub"><b>A registry where software re-proves itself.</b> Every badge below is derived from a mutation-gate run — mutants injected into the code, the tests made to kill them — signed by the registry's Ed25519 key, and <b>it expires</b>. A badge that cannot fail is not a badge. A tier is never accepted from a repo's own claim; it is computed from the kill counts.</p>
<div class="wire"><b>The honest wire:</b> ${verdicts.length} signed verdicts below were issued from gate runs the registry witnessed, each naming its source, sha, checker and expiry. The ${observed.repos.length} repos in the observed list are proven on the estate ladder (mutation gate green on GitHub's runners) but hold no signed verdict yet — they await their first registry-witnessed re-sit. Nothing here is self-reported. Verify any verdict yourself: the <a href="registry-pub.json">public key</a> and every <a href="https://github.com/sjgant80-hub/proven-web">signed record</a> are in the open.</div>
<div class="grid">${verdicts.map(card).join('\n')}</div>
<h2>Ladder-observed · verdicts pending first re-sit (${observed.repos.length})</h2>
<div class="obs">${observed.repos.map((r) => `<span>${r}</span>`).join('')}</div>
<footer>Verification: fetch a verdict JSON, rebuild its canonical string (fields in schema order joined with |), verify the Ed25519 signature against <a href="registry-pub.json">registry-pub.json</a>, and check <code>expiresAt</code>. The verdict law itself is mutation-gated (25/25) in this repo. · Konomi Architecture — created by Thomas Frumkin · <a href="https://konomi-systems.com">konomi-systems.com</a> · built by <a href="https://www.ai-nativesolutions.com">AI-Native Solutions</a></footer>
</body></html>`;
writeFileSync('index.html', html);
console.log('index generated: ' + verdicts.length + ' verdict cards + ' + observed.repos.length + ' observed');
