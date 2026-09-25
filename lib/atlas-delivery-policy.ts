import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '78c5a496ba957e493674d28701b92051ac15e06aa056cadbfe3fc0db1fd21c4a',
} as const satisfies AtlasDeliveryPolicy;
