import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'b8f35e13551ee8d71da442d176f6ef4a21b4368171046d26480a687db848c982',
} as const satisfies AtlasDeliveryPolicy;
