import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'ca900b1d2dd957a87e129ab83bb67154f1801f81ed2fe73747b494ea9348e127',
} as const satisfies AtlasDeliveryPolicy;
