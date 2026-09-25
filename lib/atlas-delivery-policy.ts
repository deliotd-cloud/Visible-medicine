import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '4b7e0ab6177a11bb9ed8c151eb61481a032c879b26fb60b73cd8d64eba9a70cb',
} as const satisfies AtlasDeliveryPolicy;
