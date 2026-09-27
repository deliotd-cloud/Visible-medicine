import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '22fdc5a5c2f9aba262c8a4d06422ca25c2ce93c640887aa7fb7dfc6128cf7eb0',
} as const satisfies AtlasDeliveryPolicy;
