// verdict.test.mjs — the verdict law, falsifiable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verdictOf, signable, validVerdict, badgeSVG } from './verdict.mjs';

const NOW = 1_800_000_000_000;
const GOOD = { repo: 'sjgant80-hub/witness', sha: 'a'.repeat(40), killed: 30, survived: 0, baselined: 2, checker: 'witness@v0.6' };

test('VERDICT — derived, never claimed: tier comes from the kill counts, a tier field is ignored', () => {
  const r = verdictOf({ ...GOOD, tier: 'proven-forever' }, NOW, 30);
  assert.equal(r.ok, true);
  assert.equal(r.verdict.tier, 'proven', 'computed from survived===0, not read from input');
  assert.equal(r.verdict.score, 1);
  const red = verdictOf({ ...GOOD, killed: 29, survived: 1 }, NOW, 30);
  assert.equal(red.verdict.tier, 'refused', 'one survivor refuses the whole verdict');
  assert.equal(red.verdict.score, 0.967);
  assert.equal(r.verdict.expiresAt, NOW + 30 * 86400000, 'expiry is exact');
});

test('VERDICT REFUSES — every missing leg is named', () => {
  assert.match(verdictOf(null, NOW).why, /must be an object/);
  assert.match(verdictOf({ ...GOOD, repo: 'not-a-slug' }, NOW).why, /owner\/name/);
  assert.match(verdictOf({ ...GOOD, sha: 'xyz' }, NOW).why, /sha/, 'a verdict without a sha floats free');
  assert.match(verdictOf({ ...GOOD, killed: 0, survived: 0 }, NOW).why, /zero mutants is not a gate/);
  assert.match(verdictOf({ ...GOOD, checker: '' }, NOW).why, /pinned tool/);
  assert.match(verdictOf({ ...GOOD, killed: -1 }, NOW).why, /non-negative/);
  assert.match(verdictOf(GOOD, NaN).why, /clock/);
  assert.match(verdictOf(GOOD, NOW, 0).why, /positive integer/);
});

test('SIGNABLE — canonical, complete, stable', () => {
  const { verdict } = verdictOf(GOOD, NOW, 30);
  const s = signable(verdict);
  assert.equal(s.ok, true);
  assert.match(s.text, /^v=1\|repo=sjgant80-hub\/witness\|sha=a+\|tier=proven\|score=1\|killed=30\|survived=0\|baselined=2\|checker=witness@v0\.6\|at=1800000000000\|expiresAt=/);
  const partial = { ...verdict }; delete partial.sha;
  assert.match(signable(partial).why, /refuse to sign a partial/);
  assert.equal(signable(null).ok, false);
});

test('VALIDITY — a verdict expires to the exact millisecond; expiry is the feature', () => {
  const { verdict } = verdictOf(GOOD, NOW, 30);
  assert.equal(validVerdict(verdict, NOW).ok, true);
  assert.equal(validVerdict(verdict, verdict.expiresAt - 1).ok, true, 'one ms before expiry still holds');
  const dead = validVerdict(verdict, verdict.expiresAt);
  assert.equal(dead.ok, false, 'AT expiry it is dead — a verdict is not a tattoo');
  assert.match(dead.why, /EXPIRED/);
  assert.equal(validVerdict({ ...verdict, tier: 'legend' }, NOW).ok, false);
  assert.equal(validVerdict(null, NOW).ok, false);
  assert.equal(validVerdict(verdict, NaN).ok, false);
});

test('BADGE — it can fail, so it means something: proven green, refused red, expired says re-sit', () => {
  const { verdict } = verdictOf(GOOD, NOW, 30);
  assert.match(badgeSVG(verdict, NOW), /proven 100%/);
  assert.match(badgeSVG(verdict, NOW), /#2da44e/);
  assert.match(badgeSVG(verdict, verdict.expiresAt + 1), /expired — re-sit/);
  assert.match(badgeSVG(verdict, verdict.expiresAt + 1), /#9a6700/);
  const red = verdictOf({ ...GOOD, survived: 3, killed: 27 }, NOW, 30).verdict;
  assert.match(badgeSVG(red, NOW), /refused/);
  assert.match(badgeSVG(red, NOW), /#d1242f/);
  assert.match(badgeSVG(null, NOW), /unknown/);
});

test('GUARDS EXACT — the refusal names the actual failure, arrays and strings are not evidence', () => {
  assert.equal(verdictOf([], NOW).why, 'evidence must be an object', 'an array is refused AS an array, not as a bad repo');
  assert.equal(verdictOf('x', NOW).why, 'evidence must be an object');
  assert.match(verdictOf({ ...GOOD, survived: -1 }, NOW).why, /non-negative/);
  assert.match(verdictOf({ ...GOOD, baselined: -1 }, NOW).why, /non-negative/);
  assert.match(verdictOf({ ...GOOD, checker: ['witness'] }, NOW).why, /pinned tool/, 'an array checker is not a checker');
});

test('BADGE BOUNDARIES — expired AT the exact millisecond; a tierless corpse reads unknown, never expired', () => {
  const { verdict } = verdictOf(GOOD, NOW, 30);
  assert.match(badgeSVG(verdict, verdict.expiresAt), /expired — re-sit/, 'the exact expiry instant is already expired');
  const tierless = { ...verdict }; delete tierless.tier;
  assert.match(badgeSVG(tierless, verdict.expiresAt + 5), /unknown/, 'no tier = unknown, even when stale');
});
