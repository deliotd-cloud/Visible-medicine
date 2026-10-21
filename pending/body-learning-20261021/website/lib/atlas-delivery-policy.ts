import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'd0ca5c236d77cf33ef0858bf6e3c9eaa136b243779c94817c32a4b75a4e62c1d',
} as const satisfies AtlasDeliveryPolicy;
