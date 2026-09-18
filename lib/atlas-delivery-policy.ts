import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '23385abb9c34947b4118efa3106eea53e3f955c3fa163feae7f2484550dfb0ed',
} as const satisfies AtlasDeliveryPolicy;
