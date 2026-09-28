import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '656f9cff24182a045c8533db6222504ae4363ff4a0f563b104b9719dc2f01c9d',
} as const satisfies AtlasDeliveryPolicy;
