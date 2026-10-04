import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '76cdd28287872a5be8d0f3e08cb04bbb452171f1968204faeeef2e674f62178b',
} as const satisfies AtlasDeliveryPolicy;
