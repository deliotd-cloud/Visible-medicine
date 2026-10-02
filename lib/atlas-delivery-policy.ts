import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '43330a625bfa7d271201590d38b5f84f132fab68bc0c3d7ded6ac9be21f14429',
} as const satisfies AtlasDeliveryPolicy;
