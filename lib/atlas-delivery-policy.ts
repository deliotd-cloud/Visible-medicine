import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '85167c7ff6ee2742392caa4e6ea13aa620c9184d39f316f28e6bfd60ff9e2bd0',
} as const satisfies AtlasDeliveryPolicy;
