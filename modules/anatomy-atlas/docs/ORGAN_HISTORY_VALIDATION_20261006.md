# Organ history validation repair — 6 October 2026

Validation-only repair on Atlas `3954cf5`. No viewer, teaching, geometry, asset,
clinical approval or independent access policy changes. The website's existing
Atlas runtime remains byte-identical; no runtime rebuild or deployment is claimed.

## Faults and minimal repair

The original organ pins belong to `76e0d191`; later respiratory Anatomy belongs
to `12570b52` and is already present in the preceding `3ebfae0` baseline. The
direct `pin-thoracoabdominal-organ-imaging.mjs --check` compared these distinct
epochs. The existing organ-history chain correctly projects its upstream eras
and was not changed. Its initially suspected failure was disproved by execution.

The direct check now uses the existing frozen respiratory replay with a supplied
catalog. That checks all eight authored topic fingerprints, display/source
identities, helper and rendered content. A separate current-epoch condition
rejects an already-restored prior API. Generation remains limited to the original
commit and refuses an existing pin file. Original fixtures are not refreshed.

The broad validator also selected two arrow functions after teaching became lazy:
the real notes callback and its outer wrapper. `body-note-render-callback.mjs`
selects one immediate `content = bodyContent(selected, value)` declaration by
TypeScript syntax. Missing, duplicate, indirect, malformed and wrongly bound
renderers still fail. The selected application callback body is not rewritten.

## Canonical checks passed

| Check | Evidence scope |
| --- | --- |
| Original pin `--check` | 15 selections, 42 original placements, six source bundles |
| Structural selector | Seven tests; nested lazy wrapper, syntax variation, missing/duplicate/bad binding and actual source |
| Epoch regression | 42 original imaging topics restored; 9,876 other normalized-base topics exact; 11 focused negative cases |
| Full organ validator | Exact original Git transition; 42 note renders; 798 altered-source/topic refusals; citation budgets, cloned lessons, geometry and approval checks |

The full validator's 1,101 schema records are its **normalized historical-source
view**, not a revised count of the current 1,104 root representations. Its 45
current organ-imaging placements include the separately recorded bronchial and
oesophageal ultrasound additions. Broader historical, device, authentication,
clinical and release acceptance are not inferred from these checks.

From `outputs`, reproduce serially:

```powershell
node scripts/pin-thoracoabdominal-organ-imaging.mjs --check
node scripts/test-body-note-render-callback.mjs
node scripts/test-organ-imaging-pin-epochs.mjs
node scripts/validate-thoracoabdominal-organ-imaging.mjs
```

## Recovery and independent review

E staging `20261006-organ-history-integration` retains the original canonical
pin failure, the independent AST failure, final phase logs/input hashes and
baseline hashes for all 392 immutable pin/transition files and 50 unrelated
website paths. The initial selector negative fixture accidentally contained a
double `const`; its failed log is retained before correcting the fixture.

`20261006-organ-history-epoch-proposal` retains the five exact Git epochs,
authored whole-snapshot fingerprints, focused proposal results and disproved
hypotheses. Its rejected broad-history draft is not admitted.
`20261006-organ-history-integration-review` independently pins all six final
script files and confirms unchanged pin generation, original history and
runtime/content/model paths. The reviewer ran no tests; main's canonical phase
logs provide execution evidence. Recovery evidence does not constitute approval.
