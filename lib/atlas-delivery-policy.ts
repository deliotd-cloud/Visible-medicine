import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '832bfcdf2aee44e68cd2a6756e64019d398d7136562946e2e5edcb05e9b01663',
} as const satisfies AtlasDeliveryPolicy;
