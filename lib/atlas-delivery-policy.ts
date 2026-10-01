import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '110bac3a8cd4e3ab6b275e552234cd70881952db8f37165e21628c5eb58de4a1',
} as const satisfies AtlasDeliveryPolicy;
