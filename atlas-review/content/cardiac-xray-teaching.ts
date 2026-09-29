import type { NestedSection } from './nested-teaching';

// Original factual orientation notes; references do not license their images.
export const cardiacXrayReferences = {
  cardiacRadiographicContours: {
    title: 'Radiology Assistant · Chest X-Ray: cardiac contours and chamber relationships',
    url: 'https://radiologyassistant.nl/chest/chest-x-ray/basic-interpretation',
  },
  cardiacProjectionQuality: {
    title: 'Graham Lloyd-Jones · Chest X-ray quality: PA and AP projection',
    url: 'https://www.radiologymasterclass.co.uk/tutorials/chest/chest_quality/chest_xray_quality_projection',
  },
};
const draft=(body:string,...references:string[]):NestedSection=>({body,references,readiness:'draft'});
export const cardiacXrayTeaching = {
  'right-atrium': draft(
    'On a usual PA chest radiograph, the right atrium contributes the right cardiac border, not a separately visible blood-pool outline. AP projection can exaggerate heart size. Check projection before interpreting a prominent border; this source cavity cannot supply a radiographic cardiothoracic ratio.',
    'cardiacRadiographicContours','cardiacProjectionQuality',
  ),
  'left-atrium': draft(
    'The left atrium lies posteriorly, corresponding to the upper posterior cardiac contour on a lateral chest radiograph. Enlargement may change that contour and separate the main bronchi. These signs do not measure atrial volume or establish a cause. The model does not separately segment the appendage.',
    'cardiacRadiographicContours',
  ),
  'right-ventricle': draft(
    'The right ventricle lies anteriorly behind the sternum. Enlargement may reduce the lower retrosternal clear space on a lateral chest radiograph. The usual PA right cardiac border belongs principally to the right atrium, not this ventricle. This static cavity cannot diagnose enlargement or simulate X-ray density.',
    'cardiacRadiographicContours',
  ),
  'left-ventricle': draft(
    'Relate the left ventricle to the lower left cardiac contour on PA chest radiography and the lower posterior contour on the lateral view. AP magnification can exaggerate heart size. Neither these silhouette relationships nor the displayed cavity measures myocardial thickness, contraction or ejection fraction.',
    'cardiacRadiographicContours','cardiacProjectionQuality',
  ),
};
