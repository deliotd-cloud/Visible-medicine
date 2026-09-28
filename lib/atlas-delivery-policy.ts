import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '1a51e42b94da674a1a26ae4cc7a21053f3f918a4ff963a8ac1515a75c99a8a5c',
} as const satisfies AtlasDeliveryPolicy;
