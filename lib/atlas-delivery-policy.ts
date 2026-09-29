import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '29978267334fd891f3d57c651e99f06095dffe7fbad9e8c82f863fdacf03620c',
} as const satisfies AtlasDeliveryPolicy;
