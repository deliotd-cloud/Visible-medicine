import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '6722ace3c776b35aa68bf4b17feb6261888fdaa89f942449a59887f067862a0f',
} as const satisfies AtlasDeliveryPolicy;
