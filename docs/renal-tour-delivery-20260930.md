# Renal guided-learning local integration — 30 September 2026

Atlas source `11ba63422686e0f8666bf18769c67485dc518d19`; both generated learner
modules and Clinical Review import that exact revision. The website keeps the
source repository independent. No hand edits to generated viewer files.

## Delivery

Abdomen and Whole body include **Kidneys & renal arteries** in the existing
Guided learning selector: right kidney/right artery/left kidney/left artery.
Both kidney exteriors and renal-artery segments share assembled framing; the
abdominal aorta remains faded context. The coeliac tour is still the default.
The library has20regional tours/109stops, plus the separate shoulder/five.
Existing smooth1,800ms turns, reduced motion, explicit Start/Play, step picker,
reading pause and Finish restoration remain unchanged. No new toolbar/pop-out.

Full tour, five source-bound structures, original model identities and fixed
camera frames are included in revision-bound Clinical Review. The aorta retains
its original coeliac evidence and independently gains this tour. No saved review
decision is migrated or fabricated. Draft status remains; model surfaces do not
establish vessel lumen/patency, collecting-tree detail, variants or scan alignment.
The independently framed HRA kidney specimen is not fused into this tour.

All137original model hashes/bytes and the other runtime modules are preserved.
All earlier source credits/notices are retained, with short factual-reference
notes appended; dependency notices/fonts/assets unchanged. No new paid service,
patient pixels, clinical PACS action or case/lecture entitlement is introduced.

## Verification

- Website full run306tests:303passed and3outdated current-library expectations
  found. Corrected to explicit20tour/456modality counts and the exact additional
  renal source path. Historical reflow delta still pinned to its saved commit;
  original geometry/dependency credits remain identical, and every prior notice
  must remain a prefix. Five affected tests pass, then the one reflow test passes
  after its notice-prefix correction. All306tests covered; not falsely described
  as an initially all-green full run.
- New renal integration test verifies learner/review source identity, all137
  model inventory records, five complete draft packets, fixed frames/transition
  and20omitted/stale/altered review-packet rejections.
- TypeScript, generated Clinical Review build, verify-clinical-review prebuild
  and complete website build pass. Chunk-size and framework classification
  warnings retained, not treated as clinical or release acceptance.
- Actual local website browser:16stops at1280desktop,1280/200%text,375phone and
  Wholebody1280. Model rendering, four modality notes, reading pause, exit
  restoration and current right-kidney Clinical Review tour checked; no page
  errors, no approval submitted. See [browser evidence](renal-tour-browser-20260930.json).
  This uses the existing local Sites sign-in fixture, not a production multi-user
  entitlement test or clinical sign-off. First run had an ambiguous reused
  imaging-note CSS locator; the exact content locator fixed QA, not product code.

Detailed full/affected/type/build logs and old generated-module copies remain
in the main task's local `work/renal-*20260930*` evidence. The pre-existing
fracture master-plan trailing-blank-line warning is not modified; staging only
this new checkpoint excludes that unrelated work.

No publication performed. GitHub remote readback/C aggregate bundle verification
belong in the main checkpoint/recovery receipt. D remains full/pending and is not
accessed. Source/website tests do not approve clinical teaching or real images.
