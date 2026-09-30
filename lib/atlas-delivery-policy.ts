import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '633409cf8c03e8f1276f6b2dc96b2bb2953aa2037fa1a43aa709f3a654bf2a3c',
} as const satisfies AtlasDeliveryPolicy;
