import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '2ba05aaf032cb1af2099e4c8cf6ce671be7434e412a194cdc5781993d73556e2',
} as const satisfies AtlasDeliveryPolicy;
