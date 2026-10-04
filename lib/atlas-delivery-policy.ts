import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '4ce7621e93892f0e7d0dd6066cf8775ddd79311ea241ce1334b32825a22cef7c',
} as const satisfies AtlasDeliveryPolicy;
