# Didanix Education selection adapter

The existing atlas selection bridge now accepts X-ray adapters as well as CT, MRI, US and multimodal. `connectDidanixEducation` connects the real bridge to a supplied Education viewer port and the existing source/revision-bound learning registry. It does not implement another DICOM viewer.

## Implemented behaviour

- Two-way **annotation/structure selection only**. Exact current-source matches can navigate automatically after explicit opt-in. Multiple matches or `component`, `broader` and `related` links require an explicit choice, in the correct direction.
- The loaded resource ID, revision and material hash must match. A link cannot silently switch cases, substitute a side, reuse a stale annotation or send a donor-model point as a patient coordinate. Didanix retains its annotation-to-source-frame/DICOM patient-LPS resolution.
- Current registry policies are rechecked for lookup, choice and pending navigation. Atlas, case and lecture entitlement decisions remain independent. Lecture and quiz anchors are never sent to the imaging viewer, even if individually accessible.
- New selections, study changes, close, practice and disposal cancel pending navigation. Context changes pause both the adapter and the atlas's linked-selection checkbox. Stable user-event IDs suppress repeated events. Port implementations must not echo programmatic reveals as user clicks.
- No network endpoint, message listener, scan data, credentials, patient UID, registration transform or access grant is created by this adapter. No clinical or privacy approval is inferred.

## Website shoulder integration

The compiled shoulder installs `iframe.contentWindow.visibleMedicineShoulderEducation` as a non-writable, same-origin, in-memory API. It is deliberately **not** a cross-origin `postMessage` endpoint. The embedding website can call:

```ts
const connection = shoulderFrame.contentWindow.visibleMedicineShoulderEducation.connect({
  document: clearedLearningDocument,
  policy: currentLearningPolicy,
  viewer: didanixEducationPort,
  onStatus: updateLinkStatus,
});
connection.setEnabled(true); // only when a cleared, authorized Education study is ready
// The learner must also enable linked selection in the atlas.
connection.choices(); // explicit choices carry { match, destination: 'atlas' | 'viewer' }
await connection.choose(locator);
connection.dispose();
```

The API constructs trusted shoulder representations from the actual mesh manifest, not host-supplied anatomical names or coordinates. It rejects a second connection until the first is disposed. Page-hide cleanup disconnects it; page-show after back/forward restoration creates a fresh, paused interface. The host must reconnect deliberately.

Removed interfaces are permanently inert, including cached host references.
Repeated old cleanup cannot delete a newly installed interface. Synchronous
host callbacks during attachment cannot leave a connection alive after removal,
and failed attachment or throwing unsubscribe handlers do not prevent a fresh
explicit connection. These lifecycle guards are not new authentication rights.
Plain data objects from the same-origin host's separate JavaScript realm are
accepted, including incoming locators. Strict own-field, accessor, unknown-field,
source/revision and policy checks remain; class instances are not transport data.

The injected `viewer.reveal(match, {signal, isCurrent})` must:

1. Resolve the opaque annotation/frame/clip anchor in the current Didanix Education study.
2. Recheck **server-owned** case/media access before retrieving content; honour abort during work.
3. Call `isCurrent()` immediately before changing viewer state, then show the annotation without inventing a spatial registration.
4. Emit context changes on case/revision changes, access revocation, close and practice/exam changes. Subscription cleanup must remove listeners.

Client-side policies and the same-origin API are UX guards, **not authentication or a paywall**. Resource/lecture servers must independently enforce current entitlements on each request. Never deserialize policy callbacks or grant authority from an imported document. No actual study is connected by this installation: the published learning registry remains empty, Didanix's real-DICOM/OIDC readiness gates remain unresolved, and no owner study has been cleared for public release here.

## Verification and remaining work

17 September: a new regression first reproduced stale-facade reconnection after
removal. The compiled browser then exposed a valid host-to-iframe document being
rejected by a realm-specific prototype check. Both product defects are corrected;
the adapter suite now passes118 checks. A synthetic same-origin host loaded the
actual414-input compiled shoulder module, connected, navigated its iframe away,
verified both subscriptions were removed and the cached facade rejected, then
reloaded and connected through the fresh API. No media was revealed under denied
policies. This is actual iframe-navigation evidence, not BFCache, real-DICOM,
server authorization, physical-device or clinical acceptance.

`node scripts/validate-didanix-adapter.mjs` executes the actual adapter, registry, bridge and shoulder API with synthetic CT/MRI/X-ray/US/lecture fixtures. Checks cover both directions, ambiguous and non-exact matches, source/revision mismatch, independent lecture rules, revoked access during an asynchronous reveal, context change, practice, duplicates, cleanup and reconnection. Existing imaging-link regressions also run. This is not browser, GPU, real-DICOM, clinical or complete server-authorization acceptance.

Next: bind this port to the Education viewer's actual learner annotation events and reveal function, after its readiness gates; wire status and choice UI only when a viewer is available; use one fully cleared study and lecture anchor for end-to-end/device and entitlement testing. The current standalone atlas remains usable with no viewer connected.
