import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '28f5da5d5481a1583df3057ec6f883d6c6b9273d8a86ddb4c55edc43bbabb765',
} as const satisfies AtlasDeliveryPolicy;
