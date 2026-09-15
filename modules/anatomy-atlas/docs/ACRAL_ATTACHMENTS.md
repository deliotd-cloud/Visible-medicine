# Hand and foot attachment relationships

The existing collapsed Muscle attachment relationships panel now covers all
20 primary hand and 36 primary foot muscle/head/group selections: 28 concepts
and 60 existing bones. It is available in Hand, Foot and Whole body. No new
toolbar, popup, geometry, tendon, footprint coordinate or movement simulation.

Select a structure, open the panel, then Show. Whole-bone relationships use
existing reversible visibility and sided selection. Non-bony-only relationships
say Show selected muscle: they retain the muscle without substituting bones.
Both homologues remain available to Left/Right; Undo/Redo restores the layer/
removal state. Camera and system resets are separately disclosed. Exam mode
does not expose this study.

## Important source distinctions

- Hand lumbricals and interossei remain source-labelled groups, not individually
  selectable numbered muscles. Interosseous bony partners describe the group;
  the palmar thumb variant is not inferred from its grouped source surface.
- Hand and foot lumbricals retain tendon-to-extensor-apparatus attachments with
  empty bony origin/insertion lists. Neither a long-flexor origin bone nor a
  distal phalanx is substituted for the actual non-bony attachment.
- Quadratus plantae links to calcaneus but not to an invented digital insertion
  bone; its insertion remains the long-flexor tendon apparatus. Its two heads
  are not separate source selections.
- Adductor hallucis transverse head has a non-bony ligamentous origin. The
  variable opponens digiti minimi foot slip has no asserted origin bone; its
  existing uncertain origin description is retained rather than turned into
  a confirmed footprint. Its metatarsal insertion is not toe opposition.
- FHB head-specific medial/lateral sesamoid pathways stay explicit. The
  unidentified source sesamoid groups FMA45097/45098 are not assigned to a head.
  The linked hallux proximal phalanx is a distal bony partner via that apparatus.
- Thumb adductor heads have different origins. Opponens muscles link to
  metacarpals, not phalanges. Foot FDB retains middle-phalanx insertions; EHB
  retains the proximal hallux phalanx. Missing EDB/dorsal-foot-interosseous
  geometry is not manufactured by this study.

The original hand/foot curriculum's attachment text and source cautions are
reused. Each panel gives its primary reading reference; the unchanged main
Anatomy/Function tabs retain their full reference lists. Bony and non-bony
distinctions were cross-checked against the TTUHSC upper/lower-limb tables and
the linked hand/foot anatomy resources. No publisher prose, figures, table
dataset, clinical image, question bank or measurement is imported. Paid access
elsewhere is not a runtime dependency or a redistribution licence.

## Evidence and clinical sign-off

Eight original GLBs and all 116 participating source identities are pinned to
the unchanged source catalogue, coordinate system, licence and exact source
revision. Right/left and finger/toe IDs are explicit, never arithmetic guesses.
Wrong source, bounds, side, region, name, duplicate entry or bundle fails closed.
Hand/foot name collisions are namespaced and cannot cross-select anatomy.

Run `npm run acral-attachments:test`. It checks independent bony expectations,
complete current primary-region muscle coverage, muscle-only plans, group/
sesamoid disclosures, actual component renders and button/parent callbacks,
host links, source rejection and Undo/Redo. Reference budgets include both
sided placements. The generated validation report gives exact results.

Radiologist review must verify source identity, digit numbering, group/head
scope, joint-axis terminology, direct versus apparatus-mediated insertions and
all non-bony/variant qualifications in the actual rendered source. No tests
prove anatomical correctness, individual device acceptance or clinical release.
Source scans and CT-head masks remain local/unchanged; the clinical PACS,
Didanix Education/light and independent entitlements are unaffected.

No new model, dependency, font, texture, paid service or mandatory fee. Existing
BodyParts3D credits/holds remain and original code retains MIT terms. Source,
GitHub/D recovery and hosted availability are in the main task's dated checkpoint.
