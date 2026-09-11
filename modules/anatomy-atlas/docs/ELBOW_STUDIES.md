# Focused elbow dissection

Open **Forearm → Study**, search **elbow**, and choose a view. The same choices appear among the existing dissection windows. Select Left or Right for one elbow; rotate, select or remove a structure and use Undo/Redo to restore it. No permanent panel or new toolbar.

| Study | Visible source anatomy per side | Starting view |
| --- | --- | --- |
| Bony relationships | Humerus, radius, ulna | Anterior |
| Humeroulnar window | Humerus, ulna | Posterior |
| Radiocapitellar window | Humerus, radius | Anterior |
| Proximal radioulnar window | Radius, ulna | Superior |
| Supinator exposed | Supinator with all three bones | Posterior |

These are **five views using eight existing selections**, not eight new structures. Every whole bone and muscle stays intact, at its original coordinates. Windows hide whole source selections, not surgical layers, bone resections or dislocations. The three articulations remain distinct; neither surface contact nor displayed gaps establish cartilage, joint congruence or stability. Supinator is not separated into laminae or converted into a nerve tunnel. Anconeus remains in the source arm scope, outside these forearm views; no source membership is silently changed.

## Close-up and labels

All five studies share stable source-derived elbow/proximal-forearm framing. The retained supinator extent determines a viewing band, and actual vertices of the three source bones inside that band determine its transverse extent. Small display margins are not anatomical landmarks or diagnostic measurements. Full supinator surfaces fit; long bone shafts intentionally extend beyond the viewport. The caption discloses this. Pan/pinch still explores the unchanged model.

Left and right bounds are derived independently; one side is not reflected to create the other. Both-side viewing uses the union. Removing a single structure does not make the joint jump; eliminating a whole side reframes to the remaining side. Empty, duplicate or unknown visible IDs and restored anatomy outside the recipe fall back to ordinary framing. Bounds are returned detached from the stored definition.

Automatic close-up is disabled during exam, isolate/focus, ghosted removals, origin guides, separation, non-spatial layouts and cutaway. Existing full-model/selected-structure framing then applies. The knee close-up is preserved. Labels inside the close-up use actual in-view source vertices through the existing label helper; no clamped or fabricated attachment point is introduced.

`content/elbow-study-pins.json` pins eight complete source records, relevant bundles, source version and frame. Runtime camera lookup rejects changed/duplicate/missing pinned records or bundles and changed frames. The pinning script reopens hash-checked existing GLBs to reproduce viewing bounds; it never writes geometry. All original catalogue memberships, source bounds, anchors, model bytes and teaching remain unchanged.

## Evidence, rights and limitations

The original brief instructions were checked against UAMS [upper-limb joints](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/joint-tables/joints-and-ligaments-of-the-upper-limb/) and [muscle teaching](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/muscle-tables/muscles-of-the-upper-limb/) on 11 September 2026. They are factual reading references only: no table, illustration, publisher prose, scan or question bank is imported. New code and original notes are MIT; retained BodyParts3D CC BY 4.0 credit and source notices remain. No font, texture, mesh, dependency, API charge or paid-resource entitlement is introduced.

Cartilage, annular/collateral ligaments, capsule and radial/posterior-interosseous nerve routes are not provided by these windows. No joint motion, attachment footprint, validated lumen, surgical corridor, X-ray projection, CT/MRI slice or patient registration is inferred. Specialist anatomical/interface and educational review remains necessary. Real desktop/mobile, touch, keyboard, screen-reader and GPU acceptance has not been performed in this background pass. Future imaging/lecture resources require their own approved identities, registration and server-side entitlements.

## Verification and continuation

`npm run elbow-studies:test` checks five exact sided memberships, one Study card per stage/focus pair, removal/Undo/Redo, source-bound links, actual vertex label anchors, whole-supinator inclusion, malformed source/bundle/frame rejection, detached bounds and the actual parent close-up callback across its suppression modes. Knee and shared dissection tests cover the existing renderer/history separately; software tests are not clinical or browser certification.

`content/elbow-study-transition.json` and the offline history helper admit only this exact five-stage/five-focus/two-reference addition. All earlier recipes are restored byte-for-byte for historical tests; unrelated modifications fail. Imaging history compares teaching against these exact prior recipes without changing approval records or replacing runtime recipes. Generated dissection/current-status inventories must be refreshed after this addition.

Continue substantial broader anatomy/function and genuinely cleared missing tissues. Do not repeat this introductory elbow exposure pass or return to routine oral detail. The earlier saved wrist teaching remains included in source; publication is established only by a terminal release checkpoint, not this document.
