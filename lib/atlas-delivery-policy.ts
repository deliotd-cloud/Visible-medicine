import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '560a2cea0e1db39039cbb2b6629f98f054a0e5732a7449253b5f30ccc4788f36',
} as const satisfies AtlasDeliveryPolicy;
