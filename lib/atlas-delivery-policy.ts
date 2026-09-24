import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'cb773a44f100dae694ec45821d6181a3e52415fe6560443f82a9f860749dfe34',
} as const satisfies AtlasDeliveryPolicy;
