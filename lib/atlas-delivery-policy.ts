import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '76377479261a664d05daad5c1638f1ac733ab3a7b482dd9cffdff7be5d0a0fe6',
} as const satisfies AtlasDeliveryPolicy;
