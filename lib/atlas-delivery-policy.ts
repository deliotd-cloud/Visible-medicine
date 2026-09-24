import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'fca0ddc51cc1ca3643a6b78d93e4b96eea44b3cbd7a39932315b5e981f70eb17',
} as const satisfies AtlasDeliveryPolicy;
