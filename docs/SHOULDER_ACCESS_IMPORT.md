# Shoulder model access feedback

Local integration target: Atlas `43162b7050a93e7ea7cdf5800cee063d2503fa49`.
The learner modules and protected Clinical Review are rebuilt from the same
source revision through the existing export/import pipeline. Generated code is
not edited by hand. Existing model bytes, teaching and access policies remain
unchanged.

The shoulder error boundary now distinguishes an exact requested-model 401
(sign in) from 403 (check access with the owner). Both offer **Check access
again**. Other URLs, malformed responses, network and decoding errors retain
the generic **Retry shoulder anatomy** feedback. Raw errors are never rendered.
Retry clears only the requested GLTF cache entry; it does not grant access,
invent readiness or reset camera/selection controls. A changed model URL gets a
fresh error boundary. The fixed guidance is an accessible status message.

`tests/atlas-shoulder-access.test.ts` pins the scene and strict classifier source
hashes in learner inputs and protected Review, checks imported/built bytes and
checks the delivered messages. The source's ten classifier/boundary tests cover
rendered 401/403/generic states, retry, readiness and URL changes. Browser
acceptance is recorded separately in the dated checkpoint: a protected-model
401 permits testing feedback but does not prove loaded-model/GPU interaction.

No CT/MRI mask, anatomical geometry, clinical PACS, approval, entitlement,
dependency, licence, fee or public deployment is changed. Source-backed review
remains exact-revision-bound; semantic links are not spatial registration.
