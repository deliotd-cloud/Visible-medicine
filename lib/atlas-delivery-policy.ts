import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'e82614a456794f4987609b691635f8f20ed32b5b2429edf765d67e0bc688373a',
} as const satisfies AtlasDeliveryPolicy;
