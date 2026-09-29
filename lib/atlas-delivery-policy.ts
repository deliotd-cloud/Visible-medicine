import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'f2d3607a946203b968b9866f6d92a0a6c162906f61ec3c1f59340cd3c5465ab9',
} as const satisfies AtlasDeliveryPolicy;
