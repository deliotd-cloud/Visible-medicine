import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '4bf40ba123f481cf8ec57dda98a9b4ddca8d866a36170e9a18d9f56c0d720573',
} as const satisfies AtlasDeliveryPolicy;
