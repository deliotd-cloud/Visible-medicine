import type { BodyStructure } from '../app/body-types';
import type { DissectionView } from '../app/dissection-data';
import { cardiacFor, cardiacPresets } from './cardiac';
import { cardiacRelationshipsFor } from './cardiac-context';

const flowReference = 'https://www.nhlbi.nih.gov/health/heart/blood-flow';
const chamberReference =
  'https://training.seer.cancer.gov/anatomy/cardiovascular/heart/structure.html';
const definitions = [
  {
    preset: 'right-atrial-inflow',
    fmas: ['FMA11359'],
    view: 'right',
    title: 'Systemic return',
    body: 'The superior vena cava brings blood from the upper body into the right atrium. Other inflows, including the inferior vena cava, are not shown in this view.',
    reference: flowReference,
  },
  {
    preset: 'right',
    fmas: ['FMA11359', 'FMA9291'],
    view: 'right',
    title: 'Right atrium to right ventricle',
    body: 'Blood passes through the tricuspid valve between these chambers. Compare both cavity shapes; the valve and a continuous passage are not modelled.',
    reference: chamberReference,
  },
  {
    preset: 'pulmonary-outflow',
    fmas: ['FMA9291'],
    view: 'anterior',
    title: 'Out towards the lungs',
    body: 'The right ventricle ejects through the pulmonary valve and trunk into the pulmonary arteries. The valve and trunk are not delineated. Lung capillary gas exchange occurs before the next step; it is not shown here.',
    reference: flowReference,
  },
  {
    preset: 'left-atrial-inflow',
    fmas: ['FMA9465'],
    view: 'posterior',
    title: 'Return from the lungs',
    body: 'After gas exchange, pulmonary veins return oxygenated blood to the left atrium. The displayed vein groups are landmarks, not validated individual ostia or continuous lumens.',
    reference: flowReference,
  },
  {
    preset: 'left',
    fmas: ['FMA9465', 'FMA9466'],
    view: 'left',
    title: 'Left atrium to left ventricle',
    body: 'Blood passes through the mitral valve between these chambers. Compare both cavities without inferring wall thickness, leaflet motion or a measured valve plane.',
    reference: chamberReference,
  },
  {
    preset: 'aortic-outflow',
    fmas: ['FMA9466'],
    view: 'left',
    title: 'Out towards the body',
    body: 'The left ventricle ejects through the aortic valve into the aorta. Systemic tissue exchange and venous return complete the circuit; those connecting pathways are not displayed here.',
    reference: flowReference,
  },
] as const;

/** A manual teaching sequence of existing views, never a timed flow/phase model. */
export function cardiacCirculationFor(parent: BodyStructure | null) {
  const spaces = cardiacFor(parent),
    relationships = cardiacRelationshipsFor(parent);
  if (spaces.length !== 4 || relationships.length !== 4) return [];
  const pairs = cardiacPresets(spaces);
  const steps = definitions.map((definition) => {
    const selections = definition.fmas.map((fma) =>
      spaces.filter((s) => s.fmaId === fma),
    );
    if (selections.some((matches) => matches.length !== 1)) return null;
    const selectedIds = selections.map((matches) => matches[0].id);
    const relationship = relationships.find((r) => r.id === definition.preset);
    const supplied = relationship
      ? [relationship.spaceId]
      : pairs[definition.preset as 'right' | 'left'];
    if (
      !supplied ||
      supplied.length !== selectedIds.length ||
      !supplied.every((id) => selectedIds.includes(id))
    )
      return null;
    return {
      ...definition,
      view: definition.view as DissectionView,
      selectedIds,
      context: !!relationship,
    };
  });
  // Never silently skip a failed step and imply a new anatomical connection.
  return steps.every((step) => step !== null) ? steps : [];
}
