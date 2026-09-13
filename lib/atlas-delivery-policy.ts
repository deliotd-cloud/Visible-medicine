import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Transport integrity is verified, but no revision-bound clinical release has
// been granted. Keep the current private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '9ea589c32267111ac1d4076c15cbdd024cfd26b8e49588879a045c1f65f48ebe',
} as const satisfies AtlasDeliveryPolicy;
