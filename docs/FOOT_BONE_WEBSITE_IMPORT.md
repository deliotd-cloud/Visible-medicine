# Foot bone questions: local website import

The regional learner and protected Clinical Review import Atlas
`e802f0b8b24a6b74caf3e6c40c0454d8cef39914` together. Ten original question
groups cover 38 bilateral metatarsal and toe-phalanx selections; existing tarsal,
sesamoid and major-limb questions are preserved. These remain exact-revision
radiologist-review drafts, not approved anatomy or fracture/image examinations.

The source lesson/pin/binding files are identical in learner input records and
Review. The integration test checks all 38 displayed lessons and protected
worksheet packets; prior lessons, altered answers and altered source identities
are rejected. Existing CT/MRI concept comparisons and Guided learning remain
semantic links, not validated patient-space synchronization.

## Delivery and safety boundaries

The 29 affected integration cases and 35 CT/MRI-to-3D/Guided-learning cases pass,
as do fresh types and the combined Review verifier (1,147 source files).
Learner input records contain 1,114 source paths. The regional manifest hash is
`470344f33a3d0b460f5234c916c24aa6bf81e0374548038941b81876f2607f76`;
Review integration hash is
`25ee380ab71219376b8f68a9ec51baab69093511f97b86ae00214c8407a95f5b`.
Regional and isolated E website builds pass. The local preview passes 46
route/access/Review checks and 19 exact learner-asset readbacks. All 136 regional
models/12 scopes and the full 137-model/144-path inventory records are unchanged.
Preview session 71717 on port 3000 replaces deliberately stopped 21707; historical
3001 remains untouched. Thirty-two obsolete generated chunks have verified E
recovery copies. Only 144 redundant build-output GLBs were removed after checking
their recovery bytes; canonical source models remain unchanged.

- Generate regional learner and Review viewer through their existing exporters;
  do not manually edit bundled assets or the dedicated shoulder module.
- Preserve all 136 regional GLBs, regional scopes and full model-inventory records.
- Preserve independent Atlas/case/lecture access and anonymous Review/model gates.
- Keep approved masks, patient scans, desktop PACS and unrelated fracture-specialist
  work out of this change. No asset, dependency, font, service or fee is added.
- The foreground scan/model tabs are not reloaded. HTTP and source/component tests
  do not establish new signed-in browser, native-image/GPU or clinical acceptance.

Exact verification results, source copies, removed generated-chunk recovery and
incremental Git bundle are recorded at
`E:/VisibleMedicine-LocalStaging/20261009-foot-bone-integration/saved-state.json`.
This is scoped same-machine E recovery, not verified GitHub or off-device backup.
No public deployment occurs. The full website/Atlas roadmap remains active.
