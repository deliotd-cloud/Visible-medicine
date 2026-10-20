import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '0aef1dd56042e61870f8fcc933cdd18f0d5441417bdc2f4bae05e54f3f414296',
} as const satisfies AtlasDeliveryPolicy;
