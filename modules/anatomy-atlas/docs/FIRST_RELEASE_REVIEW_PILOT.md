# First clinical review pilot

The standalone Atlas has a [Clinical review home](CLINICAL_REVIEW_HOME.md)
at `/review/overview`. Choose **Starter review (11 selections)** in the existing
Review area filter, or open `/review/overview?scope=pilot`. The sample follows
the batch order below and resolves links against current source bindings, not
the historical JSON snapshot. All four original review scopes remain available.

The unsigned 11-selection index is a review starting point, not a carried-over
sign-off. All 11 imaging tracks remain blocked and `approval` remains false.
Run `node scripts/prepare-first-release-review.mjs --check` before using it and
verify the displayed website candidate separately. The authoritative current
renderer fingerprint is in `content/body-renderer-revision.json` and the
generated review index; a copied historical hash in prose must not substitute
for those checks.

29 September: the website already has its separate private Clinical Review
route at `/workspace/atlas-review`. The starter filter is a new source change;
verify the generated website import before claiming it is available there.
Use the website's current import manifest and the latest delivery checkpoint,
not a historical deployment number in this document. Feedback should include
the URL, structure, side, view and intended correction. Publication does not
submit or approve a worksheet. Selection identities and review scope are unchanged.

This small sample calibrates the first-release review, not the final shipped
anatomy set. It uses existing review workspaces and source/teaching/renderer
fingerprints; no clinical decisions have been created, read or inferred here.

| Batch | Selections | What to inspect |
| --- | --- | --- |
| A: paired anatomy | Right/left scapula, supraspinatus and femur (6) | Identity, side, boundaries, visible relationships, missing tissues, labels after rotation, attachment wording and teaching specificity |
| B: vessel and organs | Celiac artery, heart and brain (3) | Source extent versus completeness claims, vessel relationships, root-organ scope, clinical wording and modality limitations |
| C: internal spaces | Third ventricle and left ventricular cavity (2) | Exact parent/child study, space versus wall, dissection and practice behavior; avoid treating cavity surfaces as tissue or physiological simulation |

These root shoulder selections are a different review scope from the dedicated
shoulder pilot. No approval transfers between them. The generated JSON index
contains exact IDs, entry links, current review contexts, per-topic draft status
and blockers: [review index](first-release-review-pilot.json).

## Your review sequence

1. Start with Batch A; the agent checks the saved index against the running
   candidate first. Review geometry and teaching separately in the existing
   workspace. A page that displays another revision must not reuse this packet.
2. Record specific corrections as **changes required**, including structure,
   affected track, view and why. Approve only what you have personally checked.
3. Fix repeated problems across the candidate, then review B and C. Re-review any
   changed material under its new fingerprints.
4. Only after this pilot, expand to the actual release allowlist. Passing these
   eleven selections does not approve the remaining anatomy or all region behavior.

Review links in this index are paths for the standalone source Atlas. They are
not promises that the hosted website exposes an identical review route or code
revision. Verify hosted integration before directing the radiologist there.

Acquired-image review is currently blocked in these source review contexts.
Modality wording may be discussed, but it cannot approve CT/MRI/US/X-ray data,
segmentation or registration. Those require the cleared case and specialist
handoff. Clinical PACS remains out of scope.

## Reproduction

From the Atlas source checkout:

```sh
node scripts/prepare-first-release-review.mjs --check
```

The command regenerates in memory and fails if any snapshot differs. After a
deliberate source change, use `--write` to refresh the unsigned index, inspect its
diff and obtain any required re-review. This never changes private review records.
