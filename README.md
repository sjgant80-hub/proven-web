# THE PROVEN WEB

**LIVE: https://sjgant80-hub.github.io/proven-web/**

A registry where software **re-proves itself**. Every badge is derived from a mutation-gate run,
signed by the registry's Ed25519 key, and **expires** — a badge that cannot fail is not a badge.
A tier is never accepted from a repo's own claim; it is computed from the kill counts.

- `verdict.mjs` — the verdict law (derive, canonicalise, expire, badge). Witness 25/25 CLEAN.
- `signer.mjs` — Ed25519 issue/verify; the private key never ships, the public key is `registry-pub.json`.
- `registry/*.json` — signed verdicts, each naming source, sha, checker and expiry.
- `registry/observed.json` — ladder-observed repos awaiting their first registry-witnessed re-sit.

Verify anything yourself: rebuild the canonical string (schema-ordered fields joined with `|`),
verify the signature against the public key, check `expiresAt`.

Konomi Architecture — created by Thomas Frumkin · konomi-systems.com · built by AI-Native Solutions.
