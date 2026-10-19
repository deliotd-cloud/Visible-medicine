# Four source-bound CT orientation drafts

Baseline: `46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd`. This batch adds original
CT teaching to the existing right/left superior-oblique trochlear cartilage
and stylohyoid ligament selections. No surface, anatomical ID, source hash,
source condition, attachment, boundary, scan, texture or dependency is added.

| Existing selection | FMA | Topic |
| --- | --- | --- |
| Left superior-oblique trochlea | FMA49068 | CT |
| Right superior-oblique trochlea | FMA49067 | CT |
| Left stylohyoid ligament | FMA72311 | CT |
| Right stylohyoid ligament | FMA72309 | CT |

The source binder compares each complete catalogue record. It has no FMA-only,
name-only or side fallback. A changed source, source version, validation field,
anchor, bounds or extra field cannot inherit the draft. Other modalities remain
unchanged, including pending MRI visibility evidence.

The trochlear notes distinguish an incidental acquired-image calcification from
the cartilage, tendon and muscle. They do not diagnose systemic disease or rule
out trauma/foreign material. The stylohyoid notes distinguish ligament, styloid
process and muscle; a mineralised segment is not a complete normal ligament,
patient measurement or proof of Eagle syndrome. Donor-reference limitations are
explicit interpretations of this unvalidated source, not new patient findings.

Reading references support the factual orientation, not image reuse:

- [Buch et al., 2014](https://pubmed.ncbi.nlm.nih.gov/23945224/).
- [Ko and Kim, 2010](https://pubmed.ncbi.nlm.nih.gov/20157406/).
- [Murtagh et al., 2001](https://pubmed.ncbi.nlm.nih.gov/11498437/).

No article prose, figures, patient examples or external meshes are imported.
Publisher/PMC full-page retrieval was restricted during preparation; the primary
abstracts and indexed article extracts, together with existing source anatomy,
support this deliberately qualitative draft. No numerical prevalence, acquisition
instruction, treatment recommendation or routine MRI visibility claim is added.
Existing source attribution and licence notices remain authoritative.

Checks:

```text
node scripts/test-craniofacial-calcification-ct-unit.mjs
node scripts/test-craniofacial-calcification-ct.mjs
node scripts/generate-body-review-display-pins.mjs --check
node scripts/body-renderer-revisions.mjs --check
node scripts/export-content.mjs --scope=body --check
```

The immutable introduction proof compares all 9,936 root placements with the
exact Git baseline: four pending CT notes become drafts and the other 9,932
placements, catalogue, shoulder content, tours and dissection recipes remain.
Only four worksheet display pins change. Packet-forgery and stale-decision
checks retain revision-bound refusal before storage; they do not confer approval.

Regenerating the existing 1,022-record raw-base export also reconciles two
pre-existing plantar-ultrasound drafts already present in the baseline runtime.
The exact baseline API confirms that only their ultrasound fields were stale:
this is not new ultrasound teaching or a readiness/approval change in the live
lesson resolver. Six saved export records change in total: four new CT records
and two exact baseline catch-ups; the other 1,016 export records remain identical.
The 1,104 displayed-root scope is separately verified by the full lesson proof;
the raw-base export is not claimed to contain all source-added representations.

Every new note awaits exact-revision radiologist sign-off. Atlas, imaging-case
and paid-lecture access remain independent. No acquired image or validated
spatial registration is supplied by these notes. Use only Didanix Education/light
for future approved imaging links. Website availability requires its separate,
normal generated-module import and acceptance; source authoring is not deployment.
