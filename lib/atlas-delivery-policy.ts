import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '3fe4650e961bed564d727d260c8bbe85f2685cf026afb99e5c244490d8023c05',
} as const satisfies AtlasDeliveryPolicy;
