import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '17fec8b5a9860e05fc2341b3bbbeaec360d51ab4ee89bea42a8c785b6af63a4d',
} as const satisfies AtlasDeliveryPolicy;
