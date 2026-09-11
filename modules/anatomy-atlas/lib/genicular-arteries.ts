import data from '../public/models/bodyparts3d/genicular-arteries/catalog.json' with { type: 'json' };
import {
  applyBodySourceAddition,
  sourceCanonical,
  type BodySourceAddition,
} from './body-source-additions.ts';
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
const source = data as unknown as BodySourceAddition;
export function addGenicularArteries(catalog: BodyCatalog) {
  return applyBodySourceAddition(catalog, source);
}
export function genicularArteryLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (!source.structures.some((p) => sourceCanonical(p) === sourceCanonical(s)))
    return undefined;
  const middle = ['FMA22562', 'FMA22563'].includes(s.fmaId);
  const medial = ['FMA22586', 'FMA22587', 'FMA43890', 'FMA43891'].includes(
    s.fmaId,
  );
  const citations = [
    'https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html',
  ];
  const note =
    'Source-reference teaching draft for radiologist review. No verified perfusion territory, angiographic appearance, continuous lumen or procedural route is supplied.';
  if (tab === 'anatomy' || tab === 'function')
    return {
      readiness: 'draft',
      title: `${s.name} · ${tab === 'anatomy' ? 'Knee arterial anatomy' : 'Supply relationships'} · draft`,
      body:
        tab === 'anatomy'
          ? 'A source-labelled genicular branch in the knee region. The typical upstream vessel is the same-side popliteal artery; source contact does not validate the junction.'
          : middle
            ? 'The middle genicular artery contributes to deep knee structures, including the cruciate ligaments. This model does not delineate their microvascular supply.'
            : `This genicular branch contributes to the ${medial ? 'medial' : 'lateral'} knee arterial supply. The model does not establish an individual supply territory or a complete communicating network.`,
      bullets: [
        middle
          ? 'Each middle genicular source contains two disconnected pieces, retained together under its original label. No connecting tube or tissue course has been inferred.'
          : 'The original superior/inferior and medial/lateral source labels are preserved, without generating or fitting a counterpart.',
        'Use Arterial connections to inspect the available popliteal source and reversible bone-context view.',
        'Return separation to 0% before assessing original spatial relationships; cutaways are clipped exterior surfaces, not angiography.',
      ],
      note,
      citations,
    };
  if (tab === 'quiz')
    return {
      readiness: 'draft',
      title: `${s.name} · Self-check · draft`,
      body: 'Which major artery typically gives rise to this genicular branch?',
      bullets: [
        'Answer: the popliteal artery on the same side.',
        'A typical branch relationship is not proof that the displayed source meshes join or that all variants are represented.',
      ],
      note,
      citations,
    };
  return {
    readiness: 'pending',
    title: `${s.name} · Review pending`,
    body: 'Structure-specific clinical, pathology and imaging teaching is awaiting validation.',
    bullets: [],
    note: 'No patient CT/MRI/ultrasound, angiogram, embolisation target or intervention guidance is supplied.',
  };
}
