import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '2e5accc6d2a6c749bbacdfc5721b841a57a6cce715be6c3bd300870b28680284',
} as const satisfies AtlasDeliveryPolicy;
