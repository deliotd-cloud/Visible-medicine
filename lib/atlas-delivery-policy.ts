import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'd06eddf940b48473aa0bd02aa345085b4f03461c7e5733af4dd39ad414916e34',
} as const satisfies AtlasDeliveryPolicy;
