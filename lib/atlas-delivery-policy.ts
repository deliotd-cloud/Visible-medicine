import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'b03d0705e3ffc5b29b3735d1e1efcde9af00df5cd2a724f1eadc978bbd4c5264',
} as const satisfies AtlasDeliveryPolicy;
