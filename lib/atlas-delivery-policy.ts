import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '8e4161133336118becf6535b95ef0ff8d81f7a8f2f68e8056a7e7f435ae357fd',
} as const satisfies AtlasDeliveryPolicy;
