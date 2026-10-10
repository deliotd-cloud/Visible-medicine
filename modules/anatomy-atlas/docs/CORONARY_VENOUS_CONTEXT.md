# Coronary venous orientation context — draft extension

The guarded **Explore coronary venous parts** study now offers an optional
**Show cardiac vein landmarks** button in its existing control row. The default
still displays only coronary sinus FMA4706 and small cardiac vein FMA4714.
When requested at zero separation, three existing root selections appear as
nonselectable orientation surfaces with a compact colour key (not additional
structure callout boxes): the anterior cardiac vein
**source group** FMA76767, great cardiac vein FMA4707 and middle cardiac vein
FMA4713. The anterior selection contains two original source files; it is not
a count of one anatomical vein. The middle selection retains fourteen grouped
files, not independently named branches. The heart aggregate is excluded in every state.

This joins existing teaching viewpoints without creating geometry, source
identities, connectivity, flow or a new permanent control. The context has no
pick/Practice/Education target. It disappears during separation and returns at
zero while the option remains enabled. Reassemble and Undo/Redo continue to
operate on the two nested selectable parts. Context colours only distinguish
the supplied surfaces. They are not a joined lumen, ostial map, procedure
route, patient registration or a clinical finding.

The new
`public/models/bodyparts3d/coronary-venous/root-vessel-context.json` is an
exact, source-derived snapshot: complete heart parent, three full root records,
their two bundle records plus the parent bundle, coordinate frame, version,
licence and credit. The resolver compares every record against the existing
root and supplemental catalogues and, when supplied, the current mounted root
catalogue. Altered, missing or duplicate source identities/bundles fail closed.
The three context records share no source file with either nested child. The
bundle carrying great/middle vein meshes contains other anatomy, but the
workbench passes only the three enumerated context records to the renderer.
The source snapshots are detached from callers.

`coronaryVenousContextMaterial(parent, currentRoot?)` returns these exact
records and the visible optional-context copy for revision-bound protected
Review; it returns `null` on a failed source gate. Changed display/source
revisions require new radiologist review. Earlier sign-off does not transfer.
This extension does not alter source geometry, teaching topics, access rules
or the historical coronary-venous source-gate record.

Protected Review includes the three full landmark records/bundles and the exact
visible captions for each of the two original child worksheets. Both geometry
and teaching gain a specific landmark check; stale material and prior approvals
require re-review. Ordered source file IDs are shown in the collapsed source
evidence section, with complete hashes available in the unsigned export. No
private decision is read, migrated or marked approved by this implementation.

Run `npm run coronary-venous-context:test` for exact
source/bundle checks, mutations, child-whitelist preservation, separation,
reassembly and actual workbench callback wiring. This software test is not
browser, device, clinical or hosted-delivery acceptance. Integrated desktop
and mobile visual checks remain necessary after the website imports the exact
saved Atlas source and Review revisions.
