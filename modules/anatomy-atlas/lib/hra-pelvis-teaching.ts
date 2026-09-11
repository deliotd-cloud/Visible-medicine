import type {
  SpecimenDefinition,
  SpecimenSurface,
} from './independent-specimen';
import type { SpecimenLesson } from '../content/um-limb-teaching';
import { hraPelvicSurfaceMatches, hraPelvisMatches } from './hra-pelvis';
import {
  identificationFromPool,
  type SpecimenPracticeAdapter,
} from './specimen-identification';
const ovaries =
  'https://training.seer.cancer.gov/anatomy/reproductive/female/ovaries.html';
const tract =
  'https://training.seer.cancer.gov/anatomy/reproductive/female/tract.html';
export function hraPelvicTeaching(
  definition: SpecimenDefinition,
  s: SpecimenSurface,
): SpecimenLesson | null {
  if (!hraPelvicSurfaceMatches(definition, s)) return null;
  const note =
    ' This selection is a partial reference surface, not validated complete anatomy or a patient scan.';
  if (['left-ovary', 'right-ovary'].includes(s.slug))
    return {
      anatomy:
        'A paired reproductive organ lateral to the uterus. Follicles and internal ovarian tissues are not separately supplied here.' +
        note,
      function:
        'Produces oocytes and ovarian hormones; the model does not simulate ovulation.',
      references: [ovaries],
    };
  if (/^(ampulla|isthmus|fibria|uterine-tube-infundibulum)/.test(s.slug))
    return {
      anatomy:
        'A source-labelled region of the uterine tube. Compare the four available regions on the same side; the entire intramural course is not established.' +
        note,
      function:
        'The uterine tube supports transport towards the uterus. Individual surface segments do not prove lumen continuity or patency.',
      references: [tract],
    };
  if (
    ['body-of-uterus', 'fundus-of-uterus', 'lower-uterine-segment'].includes(
      s.slug,
    )
  )
    return {
      anatomy:
        'A regional source surface of the uterus. The body, fundus and lower segment are shown separately; these selections are not endometrial and myometrial tissue layers.' +
        note,
      function:
        'The uterus supports pregnancy and contributes muscular contractions at delivery; neither pregnancy nor motion is simulated.',
      references: [tract],
    };
  if (
    ['cervix', 'internal-cervical-os', 'external-cervical-os'].includes(s.slug)
  )
    return {
      anatomy:
        'A source surface at the uterine cervix or one of its named openings. Removing it is a display operation, not a tissue incision.' +
        note,
      function:
        'The cervix connects the uterine cavity and vagina through its canal. The supplied surfaces do not establish a complete patent canal.',
      references: [tract],
    };
  if (s.slug === 'vagina')
    return {
      anatomy:
        'A muscular canal extending from the cervix towards the exterior; the supplied surface has open boundaries.' +
        note,
      function:
        'Provides a passage for menstrual discharge and forms part of the birth canal. Dynamic distension is not modelled.',
      references: [tract],
    };
  return null;
}
function eligibleIds(d: SpecimenDefinition, ids: string[]) {
  if (
    !hraPelvisMatches(d) ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !d.surfaces.some((s) => s.id === id))
  )
    return [];
  return d.surfaces
    .filter((s) => ids.includes(s.id) && hraPelvicTeaching(d, s))
    .map((s) => s.id);
}
export const hraPelvicPractice: SpecimenPracticeAdapter = {
  eligibleIds,
  createRound(d, ids, random = Math.random, targets) {
    const eligible = eligibleIds(d, ids);
    if (
      targets &&
      (new Set(targets).size !== targets.length ||
        targets.some((id) => !eligible.includes(id)))
    )
      return null;
    return identificationFromPool(
      d.surfaces.filter((s) => eligible.includes(s.id)),
      random,
      targets,
    );
  },
  feedback: (d, s) => hraPelvicTeaching(d, s)?.function ?? null,
  scopeNote:
    'Source-identification practice only, using up to ten visible source-checked reproductive surfaces with draft teaching. Not a validated anatomy examination. Your dissection is preserved on return.',
};
