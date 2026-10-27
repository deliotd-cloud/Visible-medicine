import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '28fe32d503b9fe62f409f1704c93d4a97ac6a7116e731a597a04382cf2028647',
} as const satisfies AtlasDeliveryPolicy;
