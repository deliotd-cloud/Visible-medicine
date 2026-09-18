import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'f40a881b43c0a10ecaa67a02f8f74257051934fcdc75bd8653fa95e3312086c1',
} as const satisfies AtlasDeliveryPolicy;
