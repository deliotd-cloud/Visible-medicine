import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'e1271b8517f184937d2d8c2937b62a7258b6562f795e0fa69103b91d41bde079',
} as const satisfies AtlasDeliveryPolicy;
