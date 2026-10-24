import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'd6e934a9fb640cb1daec135a08f794c7847eaaf4145d95eddcd7dbf13fade791',
} as const satisfies AtlasDeliveryPolicy;
