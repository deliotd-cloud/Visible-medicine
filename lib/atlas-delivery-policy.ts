import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '1c32b28a0fa53ee186b6e523567ab606bfe5af6646548a205a46c83644477a51',
} as const satisfies AtlasDeliveryPolicy;
