import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'c8b00e53f3c0580f2a66ad4d29c855becb23becab85cccc6dc9c1cd1c37d0f09',
} as const satisfies AtlasDeliveryPolicy;
