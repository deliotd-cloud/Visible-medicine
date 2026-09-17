# Selected-label depth clarity

The shared shoulder and regional/whole-body label layer adds **Behind tissue**
and a dashed leader when other rendered opaque anatomy covers the selected
label's anchor. The endpoint, anatomical identity and screen-side placement do
not move. No new panel, model, dataset, dependency, font or patient data is added.

This is an anchor-depth cue, not a claim that the entire structure is hidden or
visible, a clinical landmark, or an imaging registration. Its accessible
description suggests the existing rotate/isolate/fade controls. No cue means no
confirmed opaque covering surface, not guaranteed whole-structure visibility.

## Rendering contract

- Only tagged anatomical surface meshes participate; contours and origin guides
  do not. Invisible ancestors/materials, camera layers, transparent/faded tissue
  and the selected structure's own subtree are excluded.
- Actual triangle intersections before the anchor are required. Shader clipping
  planes are respected. Native batch raycasting includes non-pickable context
  tissue and skips hidden instances; cutting/transparency already leave batching.
- Probe one selected anchor, at most ten times per second. A trailing demand
  frame updates the settled camera/display state; it does not start an idle loop.
- Errors/unsupported material arrays return unknown, never fabricated coverage.
  Current tagged renderers use single materials. Future alpha-tested/displaced
  tissue shaders require corresponding depth tests before using this tag.
- Projection, label collision layout, keyboard selection, mobile sizing and
  camera-side label assignment remain shared. No self-occlusion claim is made.

## Evidence and remaining gates

`label-depth:test` checks real triangle intersections with perspective and
orthographic cameras: covering/off-ray/behind-anchor tissue, opacity, clipping,
hidden ancestors/materials/layers, transformed groups, own surfaces, failures
and context/hidden/cut/faded batches. `labels:test` exercises the actual component
frame/DOM handlers, including the cue and accessible explanation, alongside
existing projection/side/collision tests. CPU fixtures are not GPU acceptance.

The coordinating 17 September checkpoint records actual desktop/mobile browser
checks and builds. Shoulder and body display review fingerprints change; teaching,
source geometry and historical private decisions are not rewritten or approved.
Owner radiologist, physical-device and hosted-release gates remain separate.
