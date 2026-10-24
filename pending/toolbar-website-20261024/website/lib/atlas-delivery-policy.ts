import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '3017f239158cf73d8dad0542fd646963f1159a01ac13a141394b20b14a0f8353',
} as const satisfies AtlasDeliveryPolicy;
