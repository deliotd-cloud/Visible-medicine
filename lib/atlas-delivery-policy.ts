import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '721cfcc4ff027e49dd9107a226d195a88d60758800e050f80d888b27f587f8a5',
} as const satisfies AtlasDeliveryPolicy;
