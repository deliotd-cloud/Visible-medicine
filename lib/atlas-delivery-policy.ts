import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'bdc80edea3883a64a3335e7ddc56908020a71499cb26df2f99e713357aa035b1',
} as const satisfies AtlasDeliveryPolicy;
