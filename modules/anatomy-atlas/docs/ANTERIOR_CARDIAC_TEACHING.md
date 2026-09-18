# Anterior cardiac vein: CT and clinical drafts

18 September 2026. This increment adds two original teaching drafts to the
existing source-bound FMA76767/BP8603 selection, not another mesh or a patient
case. Anatomy, Function and Quiz remain unchanged. MRI, ultrasound, X-ray and
Pathology remain explicitly pending; their fallback wording no longer incorrectly
suggests that all imaging and clinical teaching is absent.

## Evidence and limits

- Jongbloed et al. (2005), *Noninvasive visualization of the cardiac venous
  system using multislice computed tomography*,
  [PMID 15734621](https://pubmed.ncbi.nlm.nih.gov/15734621/).
  The primary study's indexed abstract supports cardiac venous visualization and
  anatomical variation, not sensitivity for this particular anterior cardiac
  source group. Publisher full text was inaccessible; the direct PubMed page
  displayed a verification interstitial during this audit. Neither was bypassed.
  The lesson's acquired-slice comparison is an educational orientation prompt,
  not a validated imaging correspondence or acquisition protocol.
- von Lüdinghausen (2003), *The venous drainage of the human myocardium*,
  [PMID 12645157](https://pubmed.ncbi.nlm.nih.gov/12645157/).
  Primary human anatomical investigation supports variable venous routes and
  drainage arrangements. It does not validate the ostia, connected lumen or
  complete territory of our two-component surface group.
- Candilio et al. (2014), *A retrospective analysis of myocardial preservation
  techniques during coronary artery bypass graft surgery: are we protecting
  the heart?*, [DOI 10.1186/s13019-014-0184-7](https://link.springer.com/article/10.1186/s13019-014-0184-7).
  The background discusses non-coronary-sinus right-ventricular drainage as an
  anatomical limitation of sinus-directed delivery. Only that anatomical
  rationale informs this draft. The retrospective study does not provide an
  atlas treatment recommendation; no doses, comparative efficacy conclusions,
  catheter instructions or safe procedural planes are reproduced.

## Commercial reuse boundary

References are links, with concise original factual teaching. No publisher
figures, article text, abstracts, tables, scans, PDFs or datasets are bundled.
The Candilio landing page identifies open access but directs readers elsewhere
for exact reuse terms; this audit does not assume a particular CC licence or
authorize future media reuse. Every future image needs its own explicit licence
and attribution review. Existing BodyParts3D CC BY 4.0 credits are unchanged.
No dependency, model, font, texture, paid service or mandatory fee is introduced.

## Verification and clinical acceptance

`content/anterior-cardiac-teaching-pins.json` pins the pre-edit source revision
and dispatcher baseline. Its transition/test scripts must prove that only six
topic payloads change: two pending-to-draft notes and four pending-copy updates.
All other lessons, source identities, geometry and dissection recipes must
remain unchanged. Source-ID, revision, side and bundle mutation tests must reject
foreign identities. Run `npm run anterior-cardiac-teaching:test` and the existing
`npm run anterior-cardiac-vein:test`; actual results and browser/build evidence
belong in the coordination checkpoint, not inferred from this instruction.

The owner radiologist still needs to accept the precise source/revision and
teaching scope. In particular review the anterior right-ventricular/right-atrial
orientation, distinction from the anterior interventricular vein, and limits of
CT depiction. No patient registration, ostial verification, diagnostic use or
learner-release approval is supplied. Atlas, imaging case and paid lecture
access remain independent, with Didanix Education/light as the imaging viewer.
