# Skull and hyoid teaching

8 September 2026: 46 original Anatomy/Function drafts for 23 existing head/neck-primary skeletal representations, through 15 definitions. These are 22 skull bones and the hyoid; the hyoid is a neck bone, not part of the skull proper. Earlier planning estimated 24 entries; direct catalogue inspection corrects that estimate to 23. No new controls, geometry or dependencies.

## Source identity and limits

The validator independently pins all 23 FMA/file/side records against the cached official BodyParts3D v4 ISA index. There are 24 source components: hyoid FMA52749 groups FJ2772 and FJ3201. Their union and extent are not independently validated, and the two files are not relabelled as body versus horns. The other 22 entries have one source component each. Right/left and midline identities are retained, with exact FMA, system, bone category, primary and secondary head/neck membership, laterality and tab guards.

Scope includes frontal, occipital, sphenoid, ethmoid, paired parietal/temporal bones; paired nasal/lacrimal/maxillary/palatine/zygomatic/inferior-concha entries; mandible, vomer and hyoid. The notes distinguish skull vault/base, jaw joints, orbital walls, nasal framework, hard versus soft palate, and the suspended hyoid. The inferior nasal concha is not part of the ethmoid; lacrimal bone is not the gland or sac; the zygomatic bone alone is not the whole arch.

Named landmarks and internal cavities are teaching context, not added segmentations. No validated diploë/cortex, foraminal clearance, sinus drainage, ossicular chain, labyrinth, facial canal, dental roots, TMJ disc or hyoid developmental model is supplied. Bone support does not establish tear flow, nasal patency or swallowing safety. Explode is not an operative cleavage plane or physiological jaw movement. Geometry, source classifications, coordinates, recipes and existing warnings are unchanged.

## References and commercial rights

Bounded factual sections were read on 8 September 2026:

- [Skull framework](https://www.ncbi.nlm.nih.gov/books/NBK499834/): vault/base and facial-bone relationships.
- [Occipital bone](https://www.ncbi.nlm.nih.gov/books/NBK541093/): posterior enclosure, foramen magnum and condylar articulation.
- [Sphenoid](https://www.ncbi.nlm.nih.gov/books/NBK544308/): body/wings/processes and sellar context.
- [Nasal cavity](https://www.ncbi.nlm.nih.gov/books/NBK544232/): bony roof/floor/septum and concha distinctions.
- [Lacrimal system](https://www.ncbi.nlm.nih.gov/books/NBK531487/): shared lacrimal/maxillary bony fossa, not a bone that produces tears.
- [Maxilla](https://www.ncbi.nlm.nih.gov/books/NBK538527/) and [mandible](https://www.ncbi.nlm.nih.gov/books/NBK532292/): upper/lower jaw framework and bounded mechanical roles.
- [Zygomatic bone](https://www.ncbi.nlm.nih.gov/books/NBK544257/): cheek/orbital contributions and two-bone arch.
- [Hyoid](https://www.ncbi.nlm.nih.gov/books/NBK539726/): body/horns, lack of direct bony articulation and muscle/ligament anchorage.

References were used selectively, not treated as error-free. Incorrect/overgeneralised descriptions elsewhere on these pages (including circle-of-Willis membership, olfactory-cell regeneration, muscle attachment directions and fixed anatomy/maturity assumptions) are not imported into this teaching. No named nerve route, precise force, fixed age or procedure is inferred from a bone surface.

Brief original factual writing only; no publisher prose, images, diagrams, tables, scans or datasets imported. Publication NC-ND/copyright terms are not a commercial asset grant. Original application code/text retain MIT terms; source-index evidence retains separate DBCLS BodyParts3D CC BY 4.0 attribution/change obligations. No paid API, font, texture, model, dependency or private data is added. References do not imply endorsement or clinical approval.

## Verification and remaining work

`npm run cranial-bone-curriculum:test -- --source` checks 23 exact source memberships/24 components, guarded dispatch, runtime/export parity, hyoid compound warnings, detached arrays, retained coverage notes/citations, nine negative cases and unrelated-copy preservation. Nineteen offline projections now pin 1,000 topic edits against the original immutable baseline. Thoracic and earlier report totals explicitly describe their own milestones; runtime/export stay current.

Current body totals: Anatomy 693 draft/329 identity-only; Function 749 draft/146 identity-only/127 pending. Pending Function comprises 125 skeletal entries elsewhere plus muscle FMA19728 and fornical FMA61970; those holds remain pending. Most specialist topics remain unauthored. Exhausting the current head/neck bone Function fallback does not establish full anatomy, educator acceptance or clinical validation.

Reviewers still need to validate surfaces, sutures/landmarks, bone–soft-tissue relationships, the hyoid union, foraminal/canal extent, sinus/ear/TMJ anatomy and attachments. Source/device/clinical and real imaging-registration gates remain. Next safe teaching work: appendicular bones, followed by vascular supply, pathology/clinical and modality-specific teaching with explicit evidence/review status, using existing panels. Local saves are not remote publication or GitHub delivery.
