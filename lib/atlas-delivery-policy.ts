import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '2f417dc1b5458097783ea5f194f56252525568da14d52b47cd0661972f4ed38d',
} as const satisfies AtlasDeliveryPolicy;
