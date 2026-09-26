# Internal thoracic vessel teaching — 26 September 2026

Four previously pending placements use the existing thoracic-branch teaching
handler: MRI for right/left internal thoracic arteries (FMA3969/4068), and MRI
and ultrasound for the right internal thoracic vein (FMA4758). Existing source
identities, meshes, other teaching, CT notes and artery-US notes are unchanged.
No new UI, datasets or media. All additions are original drafts for review.

## Evidence and limits

- Tuinder et al., 2012, *Anatomical evaluation of the internal mammary vessels
  based on magnetic resonance imaging (MRI)*,
  https://pubmed.ncbi.nlm.nih.gov/22695715/. The primary abstract describes133
  women, reconstructed T2-weighted images and assessment at the second/third
  intercostal levels. We do not generalise this to complete vessel depiction,
  luminal patency, male/paediatric validation or a safe operative route. The
  venous note distinguishes variable arrangements from the single selected
  right-sided source. Full text was not used; publisher retains copyright.
- Blanco and Volpicelli, 2014, *Looking a bit superficial to the pleura*,
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4255330/. The inspected technique
  article describes parasternal channels anterior to pleura, phasic venous flow
  and transmitted pulsatility from the adjacent artery. These are observational
  descriptions, not measured diagnostic accuracy; the authors explicitly state
  that feasibility had not been studied. Do not repeat its stronger procedural
  safety or universal-visibility claims. Original article is CC BY4.0, but no
  figure, video, prose or patient image has been copied into the Atlas.

New summaries total163 words attributable to the MRI reference across all three
placements and58 words for the US reference. Existing anatomy citations remain.
No mandatory fee, font, model, texture or dependency is added. Clinical review,
image privacy/reuse clearance and website delivery are separate requirements.

## Gaps deliberately still open

The inspected sources do not establish modality-specific depiction of the
superior epigastric arteries on MRI, or musculophrenic arteries/veins on MRI/US.
Those ten candidate placements remain pending. Internal thoracic evidence must
not be extrapolated to every distal branch. A second breast-MRI article
(PMC3609958) returned a browser-check page; its full text was not relied on.
No unverified inference was substituted to fill the original14-slot candidate.

## Verification

`npm run internal-thoracic-imaging:test` checks exact pre-change Git source,
source/bundle pins, only four changed topics, every other topic/recipe retained,
malformed identities, real note callback rendering, unsigned export/review and
immutable editorial transition. Historical adapters remove only this exact
recorded change for earlier tests; runtime never imports editorial replay.
No tests grant clinical approval or establish real scan visibility/registration.

The older thoracic-branch report intentionally projects the original50-slot
batch; its pending list is historical, not today's gap inventory. Its original
before/after Git trees and9,859 unchanged topics remain verified. The current
projection additionally contains the exact later-admitted corpus-spongiosum
record (nine unchanged topics), checked against its original source commit.
Do not change old pin/transition hashes to match a newer whole-atlas snapshot.
