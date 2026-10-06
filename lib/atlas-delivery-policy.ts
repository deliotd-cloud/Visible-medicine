import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'a542ead01dec4638a1b0ce388e6bb125df092bd885675b23edaa4acf5a42a600',
} as const satisfies AtlasDeliveryPolicy;
