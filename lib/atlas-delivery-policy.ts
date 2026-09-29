import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'e2d134a60d4d71a654e4b17fbdded3ade838a42872a9b67ce37b4b5998e6c9a9',
} as const satisfies AtlasDeliveryPolicy;
