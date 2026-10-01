import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '132f0fecc664a91f9e442073825d77472b01df861a575a7bf9824d569f7a3877',
} as const satisfies AtlasDeliveryPolicy;
