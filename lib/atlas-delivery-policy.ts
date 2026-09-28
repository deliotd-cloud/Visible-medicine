import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '03a0a7d54dc02e6c9cb18ef81e973ed600f88a1a2635030a399bafa3c5fbd5f3',
} as const satisfies AtlasDeliveryPolicy;
