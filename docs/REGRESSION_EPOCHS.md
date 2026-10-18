# Current delivery and historical regression evidence

Regression tests have two distinct jobs:

- **Current delivery:** exercise the current imported Atlas, learner modules and
  protected Review. Pin the explicitly reviewed source commit and exact input
  hashes. Updating a source pin is not permission to change anatomical identities,
  answer keys, licensing, access checks or approval behavior.
- **Historical transitions:** prove that a particular import changed only its
  intended teaching/renderer evidence and invalidated the right previous review
  decisions. Replay the exact saved website commit, source revision and manifest
  digest. Keep original baseline fixtures, counts and preservation assertions.
  Do not compare those frozen claims with a continuously expanding current catalog.

Historical replay uses local Git objects with replacement objects disabled. It is
source regression evidence under the installed test dependencies, not proof of a
current browser/GPU session, a production deployment or clinical approval. Missing
objects, mismatched hashes or unsupported historical inputs must fail visibly.

Current tour checks cover all 41 regional tours / 240 stops and five shoulder stops,
matching Review and learner teaching across CT, MRI, X-ray and ultrasound (980
step/modality comparisons). The earlier 189-stop checkpoint remains tested separately
at website `d52d75df84118f4a76783d04bfff3541380e7741`; its counts were not rewritten.

For example, the tentorium's original CT/MRI display-pin delta is still preserved.
Its later source-bound neuro-organ quiz legitimately changed the current display
fingerprint. Current checks bind that new fingerprint and reject an altered answer;
they do not carry an old clinical decision forward or imply that it was approved.

Report targeted results and historical failures separately. A passing subset is
never a claim that every test, private browser interaction or clinical requirement
has passed. Keep original failure logs when repairing a fixture.

Four limb-transition fixtures captured a `package.json` SHA-256 beginning `19e8f086`
whose original bytes have not been recovered. Saved Git bytes (including a checked
CRLF representation) do not match it. The cause is unverified. Those tests pin the
unchanged fixture hash, prove exact old/new Git package continuity, and verify the
captured lockfile hash; they do **not** establish package-file equality against
the original working-tree capture. This remains an explicit historical evidence
gap, not a clinical gate or proof of a package change. No baseline was rewritten.
