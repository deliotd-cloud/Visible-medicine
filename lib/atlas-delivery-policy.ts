import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'e8fac291a2b8a74a60f3b8ef885665f52446e8bc5cb3fc2a1d5a9cc98c88553f',
} as const satisfies AtlasDeliveryPolicy;
