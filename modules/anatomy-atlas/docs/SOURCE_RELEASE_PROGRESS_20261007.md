# Source release progress — 7 October 2026

This checkpoint improves source tracing and attribution, not clinical acceptance or permission to publish the raw Atlas checkout. The full existing website/Atlas goal remains active.

## Literal build references

`source-snapshot-literal-urls.mjs` recognizes a deliberately small AST subset: a safe literal relative URL based on `import.meta.url`, or a literal child of an unescaped top-level constant URL base. A target must already be a regular tracked Git blob and pass the existing source-path policy. A root-directory classification admits no descendants. Parsing failure, shadowing, mutation/escape surfaces, dynamic strings, unsafe paths and unsupported constructors remain unresolved. Static references assume normal URL/module semantics; imported-code effects and actual reads are not proven.

At the same immutable source commit `3f9eca270741f8d9a8b02a8c4f14bf663aed1717`, the four classified references are:

| Program | Line | Static reference |
| --- | ---: | --- |
| `scripts/review-revisions.mjs` | 8 | Checkout root, no contents admitted |
| `scripts/review-revisions.mjs` | 11 | Existing shoulder model manifest |
| `scripts/review-revisions.mjs` | 21 | Existing review-revision JSON |
| `scripts/workspace-test-build.mjs` | 9 | Checkout root, no contents admitted |

All 1,280 input byte identities, 25 policy-conflict rows and existing classified reads remain exact. Unresolved sites fall from 54 to 50; URL sites from 23 to 19. Eight filesystem-discovery sites remain. No closure, isolated-build, rights/privacy or source-admission flag becomes true. The prior diagnostic build is still a diagnostic with explicitly held paths, not a sanitized-source build.

## Attribution reconciliation

The v4 full-body catalogue has 1,022 representations in 86 GLBs (96,645,168 canonical bytes): 203 skeletal, 369 muscular, 80 organ, 54 nervous-system, 227 vascular and 89 connective-tissue entries. This is neither the whole-body Review total nor complete or clinically approved anatomy. Source credits and the three licence-register documents now distinguish these current counts from historical milestones. Tests check counts, bundle membership, credit, links and the existing adaptation/validation disclosures; inconsistent records and notice mutations refuse. They do not prove upstream rights or clear privacy.

The official [BodyParts3D licence statement](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) specifies CC BY 4.0 and DBCLS credit. The [CC BY 4.0 terms summary](https://creativecommons.org/licenses/by/4.0/) permits commercial adaptation/distribution subject to attribution, indication of changes and no additional restrictions on the licensed rights. Product subscriptions do not cancel those asset rights. Other permissions and clinical suitability remain separate. This is engineering due diligence, not a legal opinion or a guarantee of free hosting.

The source notice correction has **not** been regenerated into the website or deployed. Website `867fd268759710f9858cfe96e95768124116bbe9` still contains learner/Review source `dccb53c6830f5e5aaf3c8454cd4eec5ae6b6222b`. The renderer/review revision is unchanged; no anatomy, dependency, teaching or private decision is changed.

## Evidence and next release boundaries

Local evidence is under `E:/VisibleMedicine-LocalStaging/20261007-reviewed-source-paths/`: independent before/after audit JSON, final regression log, source-path and model-rights reviews, and conditional official-v4 upstream checks in `upstream/`. The initial URL-helper null-guard failure exists in tool history, not a retained raw log. The first upstream filename-validator failure is retained separately; it rejected a valid letter-suffixed FJ identifier before any request. Neither failure is a source anatomy defect.

All 251 selected raw OBJ hashes match fresh conditional reads from the two official v4 archives. Both complete archives were independently streamed and SHA-256 hashed under the same strong response validators; all 251 selected local headers also agree with their central-directory metadata. The portable [public-source witness](../LICENSES/BODYPARTS3D_V4_SOURCE_REVERIFICATION_20261007.json) binds those archive digests, 251 source hashes and 19 derived GLB identities to the exact catalogue hash. Three further tests pin the dated witness, reread all 19 GLBs and reject changed source/scope or inferred approval. The combined audit/credits suite passes 36 tests. Public bytes used for verification do not become admitted assets, and streamed bytes are not retained source backups.

The 19 recovery-named GLBs are live anatomy representing 159 current catalogue entries; do not delete them as disposable backups. Five source paths also remain held, including a framework bracket route, renderer recovery UI and two distinct candidate-related paths. Purpose classification is not path admission, referenced-asset clearance or output privacy proof. No blanket `recovery`/`candidate`/bracket exception is introduced.

Next: exact provenance/rights/privacy-backed path review and dependency/discovery closure, then verified source-first website delivery including the corrected credits. Prepared small thoracic teaching, native desktop/assistive acceptance, authentic private reviewer authority and revision-bound radiologist sign-off remain on the full roadmap. Cleared cross-modality data/registration is separate; CT-head masks and the clinical desktop PACS remain untouched. E recovery is same-machine, not off-device. Nothing here authorizes scans or uncleared derivatives in GitHub or hosted artifacts.
