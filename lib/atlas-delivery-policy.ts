import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '68973dd7d1d64302ff78804519464904b807bb09f0e3f16dde745cc598152fa5',
} as const satisfies AtlasDeliveryPolicy;
