import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '63deac791a6abec60ba0c746a89415fe3c694ad1eab09b998f5e9df8a65cb926',
} as const satisfies AtlasDeliveryPolicy;
