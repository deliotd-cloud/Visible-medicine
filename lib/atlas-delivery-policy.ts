import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'beebfb12ff5d520529496f3ae260910431a2715bd563d54eb1bba21012b5c25a',
} as const satisfies AtlasDeliveryPolicy;
