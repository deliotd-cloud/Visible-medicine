# Insula comparison links — draft

Both insulae are now selectable in the existing **Linked anatomy** picker and
link the existing generic cerebral 3D targets with exact CT and MRI annotations.
This increases linked head concepts from 29 to 31. No new meshes or masks are
introduced. Native structure comparison already shows the binding's scope;
generic 3D comparison now exposes it in a collapsed **Comparison limits** section.

## Exact source binding

Head display manifest SHA-256:
`0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5`.

| Concept | CT identity / representation | MRI identity / representation |
| --- | --- | --- |
| `cortex-left-insula` | `cth.ctx.insula.left` / `mask` | `mrb.ctx.insula.left` / `partial-mask` |
| `cortex-right-insula` | `cth.ctx.insula.right` / `mask` | `mrb.ctx.insula.right` / `partial-mask` |

Native saved labels are exactly `Left insula — regional mask` and
`Right insula — regional mask`; laterality must match. These are identity checks,
not changes to the user-visible shortened labels. Changed labels, IDs,
representations or sides are rejected; points and curves are not substitutes.

Generic targets use study `2`, detail `cerebral`, brain parent
`vm:anatomy:body:head-neck:midline:organ:brain`, and parts
`vm:anatomy:body:head-neck:left:organ:left-insula` and
`vm:anatomy:body:head-neck:right:organ:right-insula`.
Parent source: `f68b34d46c0c6273b687e3c8c890541a34cb2c66cbb383a5a9783e4a5990d335`.
Part source: `7a62de7b68d7fe823b299ad5dfc9eb628db7a105d120f571789eacf7b3314410`.
The exact full tuple is required on return; stale or duplicate source fields fail.

## Review boundaries and next work

These are semantic comparison links between separate, unregistered subjects.
CT and partial MRI masks do not claim identical coverage or a corresponding
patient-space position. The generic meshes remain anatomically unvalidated.
No clinical or publication approval is recorded or inherited.

Existing original-25 teaching/five guided packets and independent four MRI-only
teaching/comparison/two guided packets retain their exact digests and review
scope. Insula links do **not** silently expand those packets or their note forms.
An independent read-only comparison packet is available in authorized
**Clinical Review → Head learning → Insula evidence**. It starts collapsed, with
two detailed bindings, CT/MRI/3D inspection links and a five-item checklist.
Packet SHA-256: `000ef8732b522db2396d7315727c18d7d09b79e5b9916bba381450fe730d11c1`.
The server checks exact native identities, nested source tuples and the packet
digest after existing authorization/source gates. If this packet changes, its
targets are withheld without replacing them or changing the other review forms.
It has no save/approve control; existing forms still cannot record decisions for it.

Next: source-backed teaching and guided steps after checking their anatomical
scope, plus a separately bound correction workflow if needed. Do not add these
to an existing signed-off record by merely changing a concept count.

Before sign-off, the radiologist should inspect each exact native annotation and
generic surface separately, confirm laterality and intended regional extent,
and assess whether the partial MRI region is suitable for the proposed teaching.
Neither tests nor this metadata audit establish clinical accuracy.

No dependency, font, texture, model or dataset was imported. Existing generic
BodyParts3D attribution/licensing stays unchanged. Audit reads only the local
manifest's identity metadata and existing public generic model bytes, never
private pixels or geometry; no private manifest is copied into source/recovery.
E-drive evidence: `E:/VisibleMedicine-LocalStaging/20261008-insula-links`.
Local-only work; no public deployment or off-device backup claim.
