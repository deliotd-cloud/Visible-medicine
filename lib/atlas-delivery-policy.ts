import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'fc564a1f8d757584a84792d5a583da6af0682f055037d4998dfb77bf03c07edb',
} as const satisfies AtlasDeliveryPolicy;
