import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '24a8057087a86a1316afc62fcb17346cfba689f18af12c168a3e7b4fd4f9c6cf',
} as const satisfies AtlasDeliveryPolicy;
