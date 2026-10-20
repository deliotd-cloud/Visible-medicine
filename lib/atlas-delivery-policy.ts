import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '5fe61d14688706a07349802cb30a5200461fd3385f5eaa680b5973f5b046836d',
} as const satisfies AtlasDeliveryPolicy;
