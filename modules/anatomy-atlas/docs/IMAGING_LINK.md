# Imaging selection link — version 1

## Delivered scope

The shoulder, all regions and whole-body explorer now expose the same opt-in, two-way **structure-selection** contract. The “Imaging link” disclosure starts **Not connected**. No adapter, study, segmentation or patient registration is installed by this milestone. Registering an adapter only establishes an in-process software connection; it does not verify that imaging is loaded or clinically reviewed.

An incoming exact selection enables its system and restores it if removed by dissection. It clears inspection cuts/opacity overrides so an old cut does not conceal the target. Region and laterality filters remain unchanged. The shoulder retains its existing useful anterior/posterior selection presets. No incoming selection is emitted back automatically. Local clicks/search emit only when linking is enabled. Practice pauses both directions and hides incoming-selection notices. Connecting/replacing an adapter resets consent to off; consent is not saved with study views.

No new dependency, scan, font, texture, anatomical mesh or third-party service is included. All existing commercial licence and attribution obligations remain unchanged. Clinical review and hands-on visual/touch/assistive-technology acceptance are still required.

## Identity and scope

Use product IDs from the checked-in anatomy catalogue, not display names, colours, array positions or a guessed FMA match. A request carries one identity. A result describes what happened; `selected` means the atlas accepted selection state, not that a mesh has finished loading or that imaging moved.

| Situation | Result | Behaviour |
| --- | --- | --- |
| Same product ID | `selected`, `exact` | Select within the current region/side |
| Long-head biceps, shoulder ↔ body | `selected`, `alias` | Explicit same-source representation mapping |
| Shoulder deltoid → body | `choice-required`, `components` | Offer its three separate deltoid parts; never choose the first silently |
| Body deltoid part → shoulder | `choice-required`, `aggregate` | Ask before showing the larger shoulder deltoid group |
| Known anatomy outside region or side | `out-of-scope` | Leave anatomy unchanged; change scope and send a fresh request |
| Unknown/unavailable or incomplete mapping | `unknown-structure` | No guessed replacement |
| Linking off or practice active | `paused` | No selection and no queued replay |

Seven other shoulder identities already match their body IDs directly. Tests verify that all nine shoulder-to-body relationships cover identical source OBJ names and SHA-256 hashes. Compound/component mappings express representation differences, not new anatomical or clinical equivalence claims. Choosing a proposed part is a new explicit user action and emits its exact ID back to the adapter. Dismissing a choice makes no change.

## Adapter contract

Import the singleton `imagingBridge` from `lib/imaging-sync.ts` in the same client application as the atlas. Register the user's actual viewer after it mounts and dispose the registration when it unmounts. One adapter and one active atlas are supported per bridge; a second is rejected rather than routed ambiguously. `createImagingBridge()` is available for separately wired custom integrations; the shipped viewers use the singleton.

Example integration function (the supplied callbacks below belong to the future imaging implementation):

```ts
import { imagingBridge } from '@/lib/imaging-sync';

export function connectImagingViewer(
  highlightReviewedSegmentation: (atlasId: string) => void,
) {
  const connection = imagingBridge.registerAdapter({
    id: 'visible-medicine-imaging',
    label: 'Visible Medicine imaging viewer',
    modality: 'multimodal', // CT, MRI, US or multimodal
    onAtlasSelection(event) {
      // Use an explicit reviewed ID-to-segmentation mapping.
      // Do not treat event.anatomy.reference.point as a patient coordinate.
      highlightReviewedSegmentation(event.structureId);
      // Do not send this event back to selectStructure.
    },
  });

  return {
    onImagingStructureClick(atlasId: string) {
      return connection.selectStructure({
        version: 1,
        origin: 'imaging',
        messageId: crypto.randomUUID(),
        structureId: atlasId,
      });
    },
    dispose: connection.dispose,
  };
}
```

The user must enable **Allow linked structure selection** after registration. Only actual user selection actions should call `onImagingStructureClick`; receiving an atlas selection is not another user click. Handle every result, including `choice-required`, `paused`, `no-atlas`, `disconnected`, `invalid`, `duplicate` and `adapter-error`. To retry after scope or consent changes, send a fresh message ID. No pending request is replayed automatically.

Incoming payloads have exactly four fields: version 1, origin `imaging`, a bounded message ID and a bounded `vm:anatomy:` structure ID. Unknown keys, patient fields, coordinate fields and synthetic slice positions are rejected. Outgoing events have origin `atlas` and include a detached copy of the entry's source hashes and reference centre. Receivers cannot mutate the atlas catalogue through that copy.

Origin checks, no receive-to-publish path, synchronous re-entrancy guards and a bounded 256-message replay cache prevent feedback. Disposal invalidates old handles. A throwing or asynchronously rejecting imaging callback disconnects its own adapter without breaking local atlas selection; a late failure cannot disconnect a replacement adapter. A successful callback dispatch is not an imaging-viewer acknowledgement.

This is a same-document module API, **not** an authentication boundary, a network endpoint, a cross-tab channel or an iframe `postMessage` bridge. It has no patient-data persistence. A future cross-origin integration needs explicit origin allowlists, authenticated routing and a separate security review; never add wildcard messaging. The former `visible-medicine:imaging-sync` CustomEvent and constant `normalizedSlice: 0.5` demonstrator were removed. The shoulder reference-plane button now only toggles an explicitly labelled illustration.

## Source-coordinate contract

`lib/anatomy-coordinates.ts` validates and inverts each recorded rigid/uniform-scale, column-major source-to-scene matrix. The source frame is `bodyparts3d:4.0:lps-mm`: millimetres, left/posterior/superior positive. The dedicated shoulder and body use different scene centres and scales (0.026 and 0.01 scene units/mm); copying their scene coordinates directly is wrong. Transform through common reference millimetres:

```ts
const reference = shoulderTransform.toReference(assembledShoulderPoint);
const assembledBodyPoint = bodyTransform.toScene(reference);
```

The outgoing `reference.point` is calculated from the **assembled source surface bounds**, never from the exploded display, camera, cutaway percentage or pointer position. Its kind is `surface-bounds-centre`. A bounds centre can lie outside a concave structure and is **not a reviewed landmark**. The frame carries source version; the entry carries individual source hashes. Changed versions are rejected until a new explicit frame contract is implemented. No patient FrameOfReferenceUID is attached to reference anatomy.

## Gate for real CT / MRI / ultrasound

The DICOM image-plane definition supplies patient orientation, image position and pixel spacing. It uses biped left/posterior/superior axes, but matching axis names do not register two subjects. Image position describes the first pixel centre; pixel spacing is ordered row then column. A percentage or slice number alone is not sufficient spatial metadata. [DICOM PS3.3 Image Plane Module](https://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_C.7.6.2.html).

Before spatial synchronisation is enabled, obtain:

1. The user's viewer interface, intended modalities and deployment/security boundaries.
2. Explicitly rights-cleared, de-identified studies and a documented data-retention policy; no patient data enters this selection API.
3. Reviewed mappings from atlas identities to segmentation/landmark identities, including laterality, missing parts and compound structures.
4. Study/frame identifiers, per-frame orientation, position, spacing and units, with validated handling of oblique, enhanced/multiframe and non-uniform acquisitions as applicable.
5. A separately validated reference-model ↔ patient transform, its direction, landmark evidence, error bounds, valid extent and revision-bound specialist approval. Do not infer this transform from a model centre or use explode offsets.
6. For ultrasound, probe/image calibration and the appropriate spatial tracking or deliberately non-spatial teaching linkage. An arbitrary 2D US image does not establish a CT-like volume coordinate system.
7. Radiologist review, failure/mismatch tests, real-device interaction acceptance and an explicit distinction between selection linkage and spatial registration in the UI.

The existing review dashboard continues to show no imaging revision or imaging approval. This milestone cannot make patient-specific or diagnostic use safe by itself.

## Verification

`npm run imaging:test` currently runs 41,596 helper assertions against all 881 body and nine shoulder reference identities: surface-bound corner round trips; known LPS orientation; source-hash cross-view mapping; all region scopes; partial/group handling; malformed inputs; consent/practice gating; loop/replay/disposal behaviour; synchronous/asynchronous adapter failures and immutable outgoing data. Round trips use 0.00001 in the input units (scene units or reference millimetres); independently float32-exported source centres are compared within 0.001 mm. These are numerical export tolerances, **not clinical registration tolerances**.

Type checks, focused lint, production build and existing anatomy/dissection/explode/inspection/study/review regressions must also pass before publication. Browser interaction, real adapter behaviour, acquired images, patient registration and clinical correctness have not been certified by these tests. The subsequent [source inventory](SOURCE_INVENTORY.md) expands reference anatomy without claiming that all anatomical gaps are filled.
