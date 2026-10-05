import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '8151e6a9cb7fa18fc6b5eeeeded4d27977899fabd61381ea3731d038af7bb72f',
} as const satisfies AtlasDeliveryPolicy;
