import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'bd15f85cdc90174f430af4273968f5035c153cca815e30c1803bbfc8c1ba7767',
} as const satisfies AtlasDeliveryPolicy;
