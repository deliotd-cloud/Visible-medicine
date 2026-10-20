import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '2e3fc777ec3e740a163698dad849ddbea7f90feb61bfb29a6c3e272b2849f052',
} as const satisfies AtlasDeliveryPolicy;
