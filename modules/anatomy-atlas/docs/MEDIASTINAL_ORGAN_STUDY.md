# Mediastinal conduits & thymus

The Thorax Dissect panel has one collapsed focus, **Mediastinal conduits & thymus**. It shows three supplied BodyParts3D v4 exterior reference surfaces together: trachea (`FMA7394`, `FJ2541`), esophagus (`FMA7131`, `FJ2563`), and thymus (`FMA9607`, `FJ3150` plus `FJ3151`). The existing full-body catalog supplies their exact identities and source hashes. No mesh, scan, alignment, or additional navigation item is introduced. BodyParts3D source geometry is [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); retain its source attribution.

The learner may rotate, select, hide, and Undo these surfaces to compare their fixed source positions. They are exterior reference surfaces only. They do not establish a lumen, motility or swallowing, airway continuity, thymic microanatomy or involution, mediastinal distances, or patient registration. The focus is an educational visibility control, not a clinical or procedural representation. Source boundaries and relationships remain subject to revision-bound radiologist review.

Run `npm run mediastinal-organ-study:test` for source binding, side scope, mismatch rejection, and recipe-history checks. `npm run dissection-history:test`, `node scripts/validate-dissection.mjs`, `npm run source-holds:test`, and `npm run content:test` cover adjacent contracts. These are software checks, not clinical acceptance.
