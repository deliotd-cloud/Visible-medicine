import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '26695820adabe8ea587e01646e739cb6cc1c48dd76193e1d320e29062e3c79ec',
} as const satisfies AtlasDeliveryPolicy;
