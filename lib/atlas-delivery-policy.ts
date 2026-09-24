import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '19332a330bde1e18291829e7b89e6d2b5f2fd35ac5978194d1feb48ed76437a7',
} as const satisfies AtlasDeliveryPolicy;
