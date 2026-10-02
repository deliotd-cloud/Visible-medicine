import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '9160a95ed2c69d0aa217c366b73baf4133e15a2491a91da053442c74c88b56d4',
} as const satisfies AtlasDeliveryPolicy;
