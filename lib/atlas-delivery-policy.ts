import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '46b4511124b570d4a4bdba481e491d47cf2abe77b0be19f3759eaa59562cb9eb',
} as const satisfies AtlasDeliveryPolicy;
