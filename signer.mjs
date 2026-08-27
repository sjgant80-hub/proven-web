// proven-web · signer.mjs — the registry's hand. Thin crypto shell over the gated verdict law:
// the LAW (what gets signed, what counts as valid) lives in verdict.mjs, witness-clean; this file
// only carries webcrypto wiring. The private key lives OUTSIDE the repo (~/.proven-web-key.json);
// only the public key ships.
import { webcrypto } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { signable } from './verdict.mjs';

const subtle = webcrypto.subtle;
const enc = new TextEncoder();
const KEY_F = join(homedir(), '.proven-web-key.json');

export async function loadOrCreateKey() {
  if (existsSync(KEY_F)) {
    const j = JSON.parse(readFileSync(KEY_F, 'utf8'));
    return {
      priv: await subtle.importKey('pkcs8', Buffer.from(j.privPkcs8B64, 'base64'), { name: 'Ed25519' }, false, ['sign']),
      pubB64: j.pubB64,
    };
  }
  const kp = await subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const pubB64 = Buffer.from(await subtle.exportKey('raw', kp.publicKey)).toString('base64');
  const privPkcs8B64 = Buffer.from(await subtle.exportKey('pkcs8', kp.privateKey)).toString('base64');
  writeFileSync(KEY_F, JSON.stringify({ kind: 'proven-web-registry-key', note: 'PRIVATE — never ships. The public half lives in the repo.', pubB64, privPkcs8B64 }));
  return { priv: await subtle.importKey('pkcs8', Buffer.from(privPkcs8B64, 'base64'), { name: 'Ed25519' }, false, ['sign']), pubB64 };
}

export async function signVerdict(verdict, priv) {
  const s = signable(verdict);
  if (!s.ok) return { ok: false, why: s.why };
  const sig = await subtle.sign({ name: 'Ed25519' }, priv, enc.encode(s.text));
  return { ok: true, signed: { ...verdict, sig: Buffer.from(sig).toString('base64') } };
}

export async function verifySigned(signed, pubB64) {
  const w = signed && typeof signed === 'object' ? signed : null;
  if (!w || typeof w.sig !== 'string') return { ok: false, why: 'no signature' };
  const { sig, ...verdict } = w;
  const s = signable(verdict);
  if (!s.ok) return { ok: false, why: s.why };
  try {
    const key = await subtle.importKey('raw', Buffer.from(pubB64, 'base64'), { name: 'Ed25519' }, false, ['verify']);
    const good = await subtle.verify({ name: 'Ed25519' }, key, Buffer.from(sig, 'base64'), enc.encode(s.text));
    return good ? { ok: true } : { ok: false, why: 'signature does not verify — this verdict was not issued by the registry' };
  } catch { return { ok: false, why: 'malformed key or signature' }; }
}
