import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '629604986922ab17dc00b1b1dd8780bc351869e8fdf44a31b2f32174df52e04f',
} as const satisfies AtlasDeliveryPolicy;
