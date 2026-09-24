import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'b060791e3c488e5b780c170f7b8a09b877fa6fcb64c938051a0788eaf814ab5a',
} as const satisfies AtlasDeliveryPolicy;
