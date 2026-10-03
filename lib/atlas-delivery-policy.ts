import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '199a1acb0736cbdcb8fc37c077384e7271bfa394cefd98eb57f31056620e5fca',
} as const satisfies AtlasDeliveryPolicy;
