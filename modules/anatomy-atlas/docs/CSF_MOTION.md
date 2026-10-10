# CSF motion — illustrative draft

An optional **CSF motion** disclosure in the ventricular study provides Start/Pause.
It is initially off. Reversible cyan markers remain within four separately supplied
BodyParts3D ventricular spaces; translucent source surfaces reveal them. No source
mesh is altered. The five-stop ventricular walkthrough uses the existing smooth
camera transition and restores manual selection, layers and camera on exit.

CSF can show cardiac- and respiratory-related bidirectional motion (Chen, Beckett,
Verma and Feinberg, NeuroImage 2015, DOI 10.1016/j.neuroimage.2015.07.073;
[primary MRI study](https://pubmed.ncbi.nlm.nih.gov/26241682/)). This implementation
does **not** reproduce the study's flow field, measured rates or respiratory phases.
The common four-second display cycle, superior/inferior marker axis, amplitudes,
phases and density are arbitrary visual choices, not calibrated physiology.

## Source and safety

`scripts/generate-csf-motion.mjs` derives 40 short scanline intervals per space from
the exact existing ventricular GLB, whose SHA is checked before generation. Only
closed oriented source topology is accepted; odd or ambiguous crossing rays are
discarded. Each interval is shortened by 25% at both ends. Marker extrema and
centres are independently tested by three-axis ray parity against actual surfaces.
This is numerical containment evidence, not anatomical or self-intersection proof.
The marker packet is renderer-revision-bound and the complete original parent,
four child records and bundle are required. No cross-space paths are generated.
The packet must list exactly the four canonical ventricular-space IDs in their
source order. A real catalogue context structure substituted for a space, or a
reordered packet, is rejected as a whole before exposing any marker tracks.

Motion pauses when the page is hidden, renderer/assets are unready, reduced motion
is requested, the view is cut or exploded, or assessment is active. It cannot pick
structures and does not publish imaging events. The demand-render loop is active
only while the optional overlay is mounted; frame deltas are clamped to avoid
catch-up jumps. No additional package, texture, font, mesh or service is required.

Foramina, cerebral aqueduct, fourth-ventricle outlets, choroid plexus and the wider
subarachnoid system are not resolved here. Net circulation, fluid pressure,
hydrocephalus, obstruction, glymphatic transport, disease, patient-specific flow and
acquired CT/MRI registration are **not simulated**. This is not computational fluid
dynamics, a diagnostic tool or an anatomical-completeness claim.

## Clinical review still required

The owner radiologist must review the exact four source-space placements, guide
captions, transparency, visible marker trajectories, arbitrary oscillation choices,
start/pause and accessibility behavior, and all omissions. Clinical Review includes
unchecked `guided-learning` and `csf-motion` teaching scope plus `csf-motion` display
scope; old revisions cannot approve the additions. No approval is migrated.
Future measured phase-contrast MRI requires separately cleared data, a validated
coordinate transform, explicit waveform units/uncertainty and separate sign-off.

The article is a factual reference only: no text, figures, MRI frames or datasets
are reproduced. Original code and prose use project MIT terms; marker coordinates
derived from the admitted BodyParts3D geometry retain its existing CC BY 4.0
source credit and notice. No new fee or third-party media licence is introduced.
