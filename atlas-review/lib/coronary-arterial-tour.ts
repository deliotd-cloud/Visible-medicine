import type { BodyCatalog } from '../app/body-types';
import type { RegionalTour } from './regional-tours';
import { coronaryArterialStudyFor } from './coronary-arterial-study';
import { sourceCanonical } from './body-source-additions';
import pins from '../content/coronary-arterial-study-pins.json' with { type: 'json' };

const byFma = (fma: string): string => {
  const matches = pins.entries.filter(entry => entry.fmaId === fma);
  if (matches.length !== 1) throw Error('Ambiguous coronary tour source pin.');
  return matches[0].id;
};
const right = byFma('FMA3802');
const left = byFma('FMA3855');
const descending = byFma('FMA3862');
const circumflex = byFma('FMA3895');
const heart = byFma('FMA7088');
const anatomy = 'https://anatomy.ttuhscep.edu/anatomytables/arteries_thorax.html';
const ccta = 'https://www.radiologyinfo.org/en/info/angiocoroct';
const stop = (
  id: string, title: string, selectedId: string,
  view: RegionalTour['steps'][number]['view'], frameIds: string[],
  caption: string, references = [anatomy],
): RegionalTour['steps'][number] => ({
  id, title, selectedId, view, frameIds, caption, references,
  durationMs: 14000, fadeOthers: true,
});

/** Original captions over the existing exact five-source assembly, not new anatomy. */
export const coronaryArterialTour: RegionalTour = {
  id: 'coronary-arterial-orientation',
  title: 'Coronary arteries: surface orientation',
  region: 'thorax', revision: 'coronary-arterial-orientation-v1', status: 'draft',
  description: 'Six guided views of the right and left coronary trunks, anterior interventricular branch and circumflex branch. The heart remains faded context in the original source frame.',
  limitations: 'Exactly four supplied arterial selections and one heart aggregate, not a complete coronary tree. The anterior interventricular selection groups 18 source files and the circumflex groups six; source-file counts do not identify clinical segments. The heart is exterior context, not a myocardial perfusion or chamber-wall map. Separate surfaces do not verify ostia, junctions, continuous lumens, nodal or marginal branches, posterior interventricular supply, dominance, flow, stenosis or patient registration. Camera views are teaching orientations, not calibrated CT/MRI projections. No acquired images or additional access entitlement; draft pending revision-bound radiologist sign-off.',
  contextIds: [heart],
  requiredDisplayBundles: Object.fromEntries(pins.entries.map(entry => [entry.id, entry.bundle])),
  steps: [
    stop('right-coronary', 'Right coronary trunk', right, 'anterior', [right, heart],
      'Begin on the anatomical right. The right coronary artery usually follows the groove between right atrium and ventricle. Compare the highlighted surface with the faded heart; this source does not establish its aortic opening.'),
    stop('left-coronary', 'Left coronary trunk', left, 'left', [left, descending, circumflex],
      'Move to the short left coronary trunk. Its usual main branches are the anterior interventricular and circumflex arteries. These separately labelled selections help orientation; apparent contact is not proof of a continuous bifurcation.'),
    stop('anterior-interventricular', 'Anterior interventricular branch · LAD', descending, 'anterior', [descending, left],
      'Follow the anterior interventricular surface towards the apex. LAD is a common clinical name for this branch. Eighteen source files share one selection here; do not interpret their boundaries as stenosis or separate clinical coronary segments.'),
    stop('circumflex-left', 'Circumflex branch · Left-side comparison', circumflex, 'left', [circumflex, left, heart],
      'Sweep left to compare the circumflex branch with the trunk. In usual anatomy it courses in the left atrioventricular groove. The faded heart offers spatial context without assigning an individual myocardial supply territory.'),
    stop('circumflex-posterior', 'Circumflex branch · Posterior comparison', circumflex, 'posterior', [circumflex, heart],
      'Keep the same circumflex selection while moving behind the heart. Compare its visible extent from another direction. No posterior interventricular selection is supplied by this tour, so this view cannot establish coronary dominance.'),
    stop('coronary-comparison', 'Return to the coronary overview', right, 'anterior', [right, left, descending, circumflex, heart],
      'Return to the four arterial selections. Future coronary CTA can compare anatomy on contrast-enhanced, multiplanar CT images. This static source assembly is not a CT angiogram: no contrast, cardiac phase, plaque assessment or scan correspondence is present.', [anatomy, ccta]),
  ],
};

const admittedTourCanonical = sourceCanonical(coronaryArterialTour);
/** Reject source drift or an altered sequence before playback and private-review evidence. */
export function coronaryArterialTourMatches(catalog: BodyCatalog, tour: RegionalTour): boolean {
  return sourceCanonical(tour) === admittedTourCanonical
    && coronaryArterialStudyFor(catalog) !== null;
}
