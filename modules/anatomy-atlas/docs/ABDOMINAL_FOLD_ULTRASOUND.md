# Abdominal-fold ultrasound teaching

Three original draft Ultrasound entries fill existing pending placements:

| Selection | FMA | Teaching key |
| --- | --- | --- |
| Mesentery of small intestine | FMA14643 | mesentery |
| Transverse mesocolon | FMA14647 | mesocolon |
| Mesoappendix | FMA16549 | mesoappendix |

The resolver requires the exact source identity captured before dispatch changed
at parent `057640ca58032d1e88680ce0d99797e12532836d`. No geometry, scan, mask,
annotation, tour, recipe, other topic or entitlement is intentionally changed.
Ordinary ultrasound and endoscopic ultrasound are explicitly distinguished.
These are semantic teaching aids, not patient-space registration or validated
sonographic boundaries. User radiologist review remains revision-bound and pending.

## Reading references and commercial-use boundary

- Atkinson et al. (2017), *How to perform gastrointestinal ultrasound: Anatomy
  and normal findings*, DOI 10.3748/wjg.v23.i38.6931:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC5658311/ . The article is CC BY-NC 4.0;
  no article text, illustration, screenshot, table or other asset is imported.
- Sharma et al. (2015), *Imaging of peritoneal ligaments by endoscopic ultrasound
  (with videos)*, DOI 10.4103/2303-9027.151317:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4361999/ . Read as a factual reference
  only; no reuse permission is asserted and no source assets are included.
- Walid et al. (2021), *Value of Periappendiceal Fat Sign on Ultrasound in Acute
  Appendicitis*, DOI 10.7759/cureus.16321:
  https://pubmed.ncbi.nlm.nih.gov/34395109/ . The article is CC BY 4.0 but no
  text or images are imported. Its credited third-party illustration is not
  treated as cleared by the article licence.

The authored entries use independently worded factual synthesis and outbound
reading citations. Access to a publication does not grant image reuse rights.
Existing anatomical model licences/notices remain unchanged. No new dependency,
font, model, texture, hosted image, fee or external service is introduced.

## Verification and review

Run `npm run abdominal-fold-ultrasound:test` after regenerating current display
and renderer bindings. The immutable transition fixture is created once with
`node scripts/validate-abdominal-fold-ultrasound.mjs --record`; normal runs compare
against it, not overwrite it. Source bundles, exact identities and historical
lessons must remain bound to the captured parent. Current content-schema and
review-binding checks accompany this focused validation.

Clinical review must assess wording, EUS applicability, limitations of the
appendicitis evidence and the fit of generic meshes to teaching intentions.
No patient images are supplied and no diagnostic performance is claimed.
Website delivery requires its separate generated import and acceptance checks.
