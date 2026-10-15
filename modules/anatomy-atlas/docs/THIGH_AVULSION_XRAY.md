# Thigh X-ray attachment landmarks — unsigned draft

Ten existing bilateral thigh selections gain original X-ray teaching: rectus
femoris (FMA38928/38929), iliacus (FMA22322/22323), semimembranosus
(FMA22448/22449), semitendinosus (FMA22358/22359) and long-head biceps femoris
(FMA45888/45889). These are not new acquired images, meshes or clinical approvals.

## Evidence and intended limits

- [Rossi and Dragoni, 2001](https://pubmed.ncbi.nlm.nih.gov/11357449/):
  radiographic pelvic avulsions in a selected adolescent athletic cohort support
  regional AIIS/ischial landmarks, not individual muscle visibility or population
  incidence. Primary abstract inspected; full text not established.
- [Ouellette et al., 2006](https://pubmed.ncbi.nlm.nih.gov/16738911/):
  MRI study of rectus femoris origin injuries distinguishes direct and indirect
  heads. AIIS fragment location does not by itself define the soft-tissue injury.
  Primary abstract inspected; full text not established.
- [Volpi et al., 2021](https://pubmed.ncbi.nlm.nih.gov/34306849/),
  [publisher article](https://www.cureus.com/articles/59106-conservative-treatment-of-avulsion-injuries-of-the-lesser-trochanter-in-adolescent-athletes.pdf):
  adolescent lesser-trochanter avulsions provide attachment-region radiographic
  context, not evidence of isolated iliacus involvement or adult causation.
  Publisher text inspected; treatment/outcome thresholds are not imported.
- [Multiple iliopsoas tendons, 2021](https://pubmed.ncbi.nlm.nih.gov/34347120/):
  cadaveric study documents tendon variation and muscular iliacus insertions.
  The shared insertion region must not be reduced to one invariant tendon.
  Primary abstract inspected.
- [Philippon et al., 2015](https://pubmed.ncbi.nlm.nih.gov/24859732/) and
  [Sato et al., 2012](https://pubmed.ncbi.nlm.nih.gov/22669443/): adult cadaveric
  hamstring origins support nearby attachment relationships but differ in their
  description of the biceps/semitendinosus union. Primary abstracts inspected;
  do not project precise footprints or individual torn tendons onto a radiograph.

The selected adolescent injury studies are not normal-visibility studies. Their
mechanisms/frequencies must not be generalized to adults or all patients.
A normal bony appearance is not proof of tendon integrity. The model cannot
diagnose an injury or substitute for an actual study and clinical context.

## Source and review contract

`content/hip-imaging-pins.json` is reused unchanged. The resolver requires the
complete exact canonical identity, including provenance, bounds, side, bundle
and validation state; a matching name/FMA number alone is insufficient. Only
the ten X-ray placements change from pending to draft. Other topics, models,
dissection and tours remain unchanged. No new source pins or synthetic tendon
boundaries are invented. The source anatomy remains unvalidated.

Run `npm run thigh-avulsion-xray:test` for exact baseline transition, detached
content, identity mutation, stale/forged Review and before-storage refusal checks.
Regenerate normal teaching snapshots, renderer and Review display bindings;
integrate through the existing four-module and protected Review pipelines.
Earlier approvals never approve this new teaching revision.

Radiologist review still needs to assess wording, side/source identity,
landmark relationships, age/cohort qualifications and clinical relevance.
Representative cleared radiographs and reviewed correspondences are separate
future work. These drafts add no acquired-image anchor, patient registration,
flow simulation or access grant. Atlas, case and lecture entitlements remain
independent.

## Commercial use

Only original factual paraphrases and citation URLs are included. No article
prose, images, tables, scans, masks, annotations or question-bank material is
copied. Reading a paper is not permission to reuse its media. No reliance on
unverified publisher reuse rights; no new assets, dependency, font, fee or service.
Existing MIT project terms and BodyParts3D CC BY 4.0 attribution/holds remain.
