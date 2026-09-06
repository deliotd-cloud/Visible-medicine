# Eye-region dissection extension — 6 September 2026

The atlas now contains **1,016 selectable source representations / 84 body bundles / 96,400,704 model bytes**, with 131 stages (47 layer steps and 84 independent windows) and 113 focused views. The study library exposes 197 recipes as 155 cards, combining 42 equivalent window/focus pairs. The dedicated shoulder remains unchanged. These are source/display counts, not anatomical completeness.

## Open and study

Open **Head & neck → Study windows & focuses**, search for `tarsal` or `lacrimal`, and choose a view:

| View | Targets | Context | Both sides / one side |
| --- | --- | --- | --- |
| Eyelid tarsal plates | Four upper/lower plate sources | Eyes and levator palpebrae superioris | 8 / 4 entries |
| Tear-drainage source structures | Paired canaliculus, sac and duct sources | Eyes and lacrimal glands | 10 / 5 entries |
| Nasolacrimal duct & nasal context | Paired duct sources | Sacs, lacrimal bones and inferior nasal conchae | 8 / 4 entries |

Use the shared shoulder-style controls: select/frame a structure, isolate or fade context, remove/restore/Undo, change side, separate and return to assembled coordinates. The guide lists expected members, omitted/added entries and source availability. Focus-only practice tests targets, not contextual structures. These are independent study windows, not a prescribed operative sequence. The new entries are also available in the whole-body explorer, search, local saved views and structure links.

## Exact admission and preservation

`scripts/ocular-selections.mjs` admits the ten exact ISA identities listed in [the preparatory evidence](OCULAR_CANDIDATES.md): FMA59582/59583, FMA59545/59546, FMA59555/59556 and FMA59091/59092/59089/59090. Six tear-drainage entries belong to Organs; four eyelid plates belong to Connective tissue with the explicit `connective-tissue` category. Tarsal plates are not relabelled cartilage or foot bones. Each retains its original single-component source definition and unvalidated status.

The two new `head-neck-*-ocular-detail` GLBs total 152,188 bytes, adding 7,832 triangles and 3,940 exported vertices. All previous 1,006 complete records and 82 bundle hashes remain exact, as do excluded sources and the common source-to-scene transform. No shape thickening, resculpting, invented connection, new texture or commercial asset is included.

The geometry audit checks all 263 preceding head/neck source entries and ten candidates: 2,675 candidate-involving pairs, 2,538 source-bounds exclusions and 137 near-surface comparisons. No pair triggers exact-shared-triangle or sampled near-surface review criteria. A separate same/unspecified-side translation diagnostic finds no extent-compatible pair. Its deterministic sampling is limited to 128 vertices per direction; absence of a flag is **not** proof of no intersection, correct tissue boundaries, complete anatomy or clinical accuracy. The audit does not itself admit anything; admission remains an explicit source selection.

## Evidence and reproducibility

- `content/ocular-baseline.json`: pinned previous full-record hashes, bundle records, transform and exclusions.
- `content/ocular-candidate-audit.json`: immutable pre-admission identity, raw-source and alias evidence.
- `content/ocular-geometry-audit.json`: bounded raw-coordinate comparisons and limitations.
- `npm run ocular:test`: 9,879 checks, including source/bundle preservation, independent geometry fixtures, all three side scopes, dissection/Undo/restoration, practice eligibility, links and imaging-reference identities.
- `npm run ocular:test -- --raw-source`: 33,425 checks, including every corner of all 7,832 triangles against the original OBJ faces within 0.0003 source millimetres of exported Float32 tolerance. Requires the verified raw cache outside the repository.
- `npm run ocular-candidates:test`: reconstructs the exact historical catalogue and inventory from hash-verified unchanged records and current indexes. Both complete historical serialized hashes must agree. This runs without Site Git history; `-- --raw` additionally rechecks original OBJ bytes.
- Regeneration commands `ocular:audit`, `ocular-candidates:audit` and the historical vessel audit intentionally read their pinned Site source commits and require that source history plus the verified raw cache. They must not silently treat current admissions as the earlier baseline.

All current source/geometry, dissection, loading/guidance, practice/study, imaging/link/navigation/library, arrangement/explode and review suites pass. The dependency audit classifies 808 packages with notice obligations; no dependency or lockfile version changed. Numerical checks and server-rendered markup are not actual browser/device acceptance.

## Commercial rights and remaining release gates

The [official BodyParts3D licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) is CC BY 4.0. Retain **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International**, licence links and adaptation notices for models, indexes and derived evidence. The short, original draft teaching notes cite [Texas Tech's eye anatomy teaching resource](https://anatomy.ttuhscep.edu/schemes/eye_ans.html) for facts only; no diagrams, table datasets or textbook prose are redistributed. No paid API or fee-bearing asset was added. Hosting and third-party services are not a promise of perpetual free infrastructure.

Ophthalmic/anatomical reviewers must verify source identity, fine geometry, position, scale, canalicular extent and subdivisions, sac/duct relationships, plate contours and attachments. The representation does not establish complete eyelid layers, puncta, valves, gland ducts, tarsal glands, a patent lumen, tear flow or operative planes. Review fine-structure selection, labels, opacity and separation on actual devices. Patient/scanner registration and acquired US/CT/MRI remain absent; the existing stable-ID and common-coordinate hooks do not imply alignment with a patient.

Next: audit the bounded laryngeal/pharyngeal and regional supporting-tissue queue against existing owners and holds, then add only useful supported dissection views. Preserve all previous exclusions; do not turn a source-count increase into a clinical-release claim. The improvement goal remains active.
