import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'c6ae07f6acaec8c9c4174618ebb4d4543674f8c64d61dc90aac3d6350a82911d',
} as const satisfies AtlasDeliveryPolicy;
