import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '6798c5179202868e7697d9cfdc57c6d1150de7664ca099cdf53d0080c0a34901',
} as const satisfies AtlasDeliveryPolicy;
