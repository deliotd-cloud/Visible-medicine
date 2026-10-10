# Thoracic EUS orientation draft

One Ultrasound topic, bound to the complete existing donor identity:
FMA4838 / FJ3416 / `unspecified` laterality / thorax-vessels-recovery.
The source tag is preserved despite teaching the typical right-sided relation.
No mesh, coordinate, CT/MRI mapping or patient-space registration is added.
Hemiazygos ultrasound remains pending; the references do not establish routine
separate normal hemiazygos visualisation.

## Evidence and limitations

- [Salama et al., Endoscopy 1997](https://pubmed.ncbi.nlm.nih.gov/9427495/):
  original linear-EUS study including controls; supports feasibility, not a
  universal detection rate. Abstract reviewed; no numerical diagnostic threshold
  or disease-management recommendation imported.
- [Sharma et al., 2013](https://doi.org/10.1016/S2212-0971(13)70026-8):
  normal mediastinal EUS demonstration, supporting the oesophageal relation and
  Doppler-assisted orientation. Publisher endpoint denied access in this run;
  the article text was available in its indexed research-paper mirror. No video,
  figures, publisher wording or source assets are reproduced.

New code and original short teaching follow project MIT terms. Reading links
are not asset licences; published materials retain their own rights. Existing
BodyParts3D attribution is unchanged. No dependency, font, model or paid service
added. This is transoesophageal EUS teaching, not a procedural guide or a claim
that routine external chest ultrasound visualises the same segment.

## Review and verification

Radiologist sign-off remains pending and must bind to the exact new teaching
revision. Source review status is unchanged. The focused regression compares
against Atlas `b03ba458907946c1b1c152149ee5867f8d6a62df`, checking one changed
topic, all other lessons and Review packets, full source identity, stale and
forged responses, and unchanged model bytes. Historical transition assertions
are replayed at their immutable source revisions, not rewritten as new fixtures.

Run `npm run thoracic-eus-orientation:test` plus affected historical teaching,
content, Review and revision-binding checks. Passing tests is not clinical,
browser, deployment or patient-space validation.

The first central-pin check exposed a pre-existing unrelated elbow-history
unrolling failure. The repair leaves old fixtures untouched and replays the
original central-vessel commit directly. Live checks still compare all 79
placements, allowing only nine previously hash-bound revisions (aortic Ultrasound
and pulmonary-vein CT/MRI). The celiac display correction retains its exact hash.
The original 9,830 unchanged topics remain an assertion about the historical
transition, not a claim that no later teaching has been added.
