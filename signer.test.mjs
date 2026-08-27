// signer.test.mjs — real keys, real signatures: roundtrip holds, one flipped byte fails.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadOrCreateKey, signVerdict, verifySigned } from './signer.mjs';
import { verdictOf } from './verdict.mjs';

test('SIGN/VERIFY — roundtrip holds; tampering with ANY field kills the signature', async () => {
  const { priv, pubB64 } = await loadOrCreateKey();
  const { verdict } = verdictOf({ repo: 'sjgant80-hub/witness', sha: 'b'.repeat(40), killed: 30, survived: 0, baselined: 2, checker: 'witness@v0.6' }, 1_800_000_000_000, 30);
  const { ok, signed } = await signVerdict(verdict, priv);
  assert.equal(ok, true);
  assert.equal((await verifySigned(signed, pubB64)).ok, true, 'the genuine article verifies');
  assert.equal((await verifySigned({ ...signed, tier: 'refused' }, pubB64)).ok, false, 'a flipped tier dies');
  assert.equal((await verifySigned({ ...signed, score: 0.5 }, pubB64)).ok, false, 'a flipped score dies');
  assert.equal((await verifySigned({ ...signed, expiresAt: signed.expiresAt + 1 }, pubB64)).ok, false, 'a stretched expiry dies');
  assert.equal((await verifySigned({ ...signed, sig: signed.sig.slice(0, -4) + 'AAAA' }, pubB64)).ok, false, 'a mangled signature dies');
  assert.equal((await verifySigned(verdict, pubB64)).ok, false, 'unsigned is unsigned');
});
