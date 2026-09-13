import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'eb6d448ab2a2532dd28617cb0446474340d5ef727a95669c50f2e5757a424d85',
} as const satisfies AtlasDeliveryPolicy;
