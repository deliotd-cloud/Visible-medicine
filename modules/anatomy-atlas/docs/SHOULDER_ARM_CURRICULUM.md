# Shoulder and arm muscle teaching drafts

## Delivered scope

Twenty short lesson definitions now serve **32 existing body representations**, with 64 new Anatomy/Function sections. The notes appear in the existing selected-structure panel, including whole-body and overlapping regional views; no new toolbar or scrolling section is added. Every lesson is explicitly draft. This is teaching-content enrichment, not new geometry or clinical approval.

The explicit source mapping in `lib/shoulder-arm-curriculum.ts` covers bilateral serratus anterior, anconeus, brachialis, coracobrachialis, teres major, levator scapulae and both rhomboids; the four left cuff muscles; three left deltoid portions; both short biceps heads and the left long head; and all six triceps heads. The dedicated right shoulder's existing nine records and their eleven body representations are unchanged. Source-side names, source component counts and existing coverage notes remain visible. No name matching or automatic mirrored mesh/content admission is used.

Anatomy gives typical proximal/distal attachments, not measured mesh footprints. Function gives a concise action and named motor supply. Part/head records explicitly warn that they are not the whole muscle or an independently validated tendon. Neural supply is textual teaching only: the named limb nerves and plexus are not rendered by this regional model. No nerve route, motion simulation, force estimate or diagnostic claim is inferred from the surface geometry.

Body Anatomy coverage changes from 195 to 227 draft representations (795 remain identity-only). Function changes from 257 to 289 drafts, with 146 generic vascular disclaimers and 587 pending entries. Shoulder/arm now has 43 draft Anatomy/Function representations; its remaining three pending Function records are the left clavicle, humerus and scapula. These are editorial counts, not clinical completeness. CT, MRI, Ultrasound, Pathology, Clinical and Quiz content is untouched.

## Factual references and rights boundary

References were consulted on 7 September 2026 for common anatomical facts. The notes are original brief explanations selected for the atlas's existing IDs; no chapter, table dataset, illustration, scan or question bank is imported, translated, traced or redistributed. The following are teaching references, not a substitute for independent clinical validation or primary morphometric evidence:

- [Serratus anterior](https://www.ncbi.nlm.nih.gov/books/NBK531457/): rib/scapular attachments and scapular movement.
- [Forearm compartments](https://www.ncbi.nlm.nih.gov/books/NBK539784/): anconeus; [brachialis](https://www.ncbi.nlm.nih.gov/books/NBK551630/): attachments, elbow flexion and variable dual innervation.
- [Arm muscles](https://www.ncbi.nlm.nih.gov/books/NBK554420/): coracobrachialis and biceps heads; [triceps](https://www.ncbi.nlm.nih.gov/books/NBK536996/): head-specific origins, distal apparatus and actions.
- [Infraspinatus](https://www.ncbi.nlm.nih.gov/books/NBK513255/) and [shoulder ultrasound anatomy](https://pmc.ncbi.nlm.nih.gov/articles/PMC3553044/): cuff attachment context; the latter's images are not included.
- [Rotator cuff](https://www.ncbi.nlm.nih.gov/books/NBK441844/), [supraspinatus](https://www.ncbi.nlm.nih.gov/books/NBK537202/) and [teres minor](https://www.ncbi.nlm.nih.gov/books/NBK513324/): cuff identities and actions.
- [Teres major](https://www.ncbi.nlm.nih.gov/books/NBK580487/), [levator scapulae](https://www.ncbi.nlm.nih.gov/books/NBK553120/), [rhomboids](https://www.ncbi.nlm.nih.gov/books/NBK534856/) and [deltoid](https://www.ncbi.nlm.nih.gov/books/NBK537056/): selected attachments and functions.
- [Texas Tech University Health Sciences Center El Paso upper-limb tables](https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html): factual cross-checks, especially rhomboid levels, anconeus extent and distinction between teres major and minor. No authored table or image is copied.

StatPearls chapters display CC BY-NC-ND restrictions and are **not admitted as redistributable commercial assets**. A citation is not permission to copy them. Texas Tech's tables also retain their own copyright. Original app text/code retain the repository's MIT terms; unchanged BodyParts3D meshes retain CC BY 4.0/DBCLS attribution. No dependency, font, model, texture, medical dataset, paid API or runtime reference-fetching service is added. Retain all prior notices. This is a documented implementation boundary, not blanket legal clearance of external resources.

Some reference explanations differ or contain over-simplifications. The drafts avoid fixed 15-degree muscle hand-offs, universal root-level rules, exaggerated injury conclusions and disputed spatial details. Source citations do not certify every statement elsewhere on those pages. Precise variants and attachment maps remain for specialist adjudication.

## Regression evidence

Run `npm run shoulder-arm-curriculum:test`, `npm run content:test`, `npm run content:export -- --check` and `npm run requirements:audit -- --check`. The new suite checks exact IDs and parts, routing into actual displayed/exported sections, detached arrays, citations, review/nerve boundaries and unchanged unsupported topics.

`content/shoulder-arm-curriculum.before.json` was captured before authoring at source commit `4a180683536f6c67035d0cfca54aac9f91cb0fc1`. The transition file pins only the 64 newly authored section hashes. `scripts/curriculum-transition.mjs` verifies both immutable snapshots and projects those exact sections back before comparing the original complete copy/recipe hash. The original `content-contract-baseline.json` remains unchanged. Negative tests reject unrecorded edits both within and outside this scope. This does not confer clinical approval.

The current [curriculum report](shoulder-arm-curriculum-validation.json) and [content contract report](content-contract-validation.json) record automated evidence. Geometry, all 87 asset hashes, catalogue, source transforms, shoulder manifest, review fingerprints, dissection recipes and lockfile are preserved. Automated checks cannot validate medical facts or actual-device presentation. No browser/device or private clinical review was performed for this milestone.

## Remaining acceptance and next work

1. Have an anatomist review each source identity, laterality, part scope and typical attachment against the actual mesh; a generic attachment statement is not a validated footprint.
2. Review actions, naming conventions and innervation variants, especially brachialis and levator; expand fibre-specific deltoid/cuff and biceps attachment detail only with appropriate evidence. Do not transfer a right-pilot review to a left or whole-body record.
3. Author reviewed modality, pathology and clinical lessons separately. Do not fill scan tabs with generated scans or imply missing labral, capsular, bursal or nerve surfaces exist.
4. Continue with a bounded forearm muscle curriculum using already admitted identities, applying the same explicit topic/identity transition and retaining source-group caveats. Avoid new navigation widgets for a content gap.
5. Keep real-device acceptance, missing rights-cleared anatomy, revision-bound clinical review, the user's imaging function and exact private remote delivery as separate gates.
