import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'f50fb82039867dadf3f60f40e2338b44caea0bb9b1efb514f8d853ee11760900',
} as const satisfies AtlasDeliveryPolicy;
