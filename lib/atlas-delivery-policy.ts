import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '179193f0b4d4821c0c66702ba03cf5beda4382244a7d7256263ad3a77da22748',
} as const satisfies AtlasDeliveryPolicy;
