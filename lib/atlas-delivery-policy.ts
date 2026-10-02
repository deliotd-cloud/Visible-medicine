import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '9b59abb9978b60ae396154232304725fbd11d0a5cb4b201663a6e110be3836f6',
} as const satisfies AtlasDeliveryPolicy;
