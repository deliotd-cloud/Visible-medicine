import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'ff1c64c386f1859b6e711d8909d4821f8100c0fa5aa5c4c997eb52ae7e2d54ed',
} as const satisfies AtlasDeliveryPolicy;
