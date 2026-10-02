import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'eaf9fa5d92be6ec4cbbe5113441eb7277a461bf4ecd7387c28f482153bdb6414',
} as const satisfies AtlasDeliveryPolicy;
