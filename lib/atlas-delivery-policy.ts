import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'd70c25513660e34f5551fe7839cbcecd62c17db04431c57b8ab8966ffe97fd2c',
} as const satisfies AtlasDeliveryPolicy;
