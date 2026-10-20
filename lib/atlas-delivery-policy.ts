import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '5681ea09ccefdc619e2859a33ef2cb5b026ad1fe6ac6b34fd0f62a68596caa7b',
} as const satisfies AtlasDeliveryPolicy;
