// Original draft teaching about usual deep-hip relationships. The UM surfaces
// do not reconstruct nerves, vessels, tendon layers, compression or pathology.
import type { SpecimenDepthLesson, SpecimenDepthNote } from './um-calf-depth';

type DeepHipDepthLesson = SpecimenDepthLesson & { reviewScope: 'thigh-depth' };
const gluteal = { title: 'Texas Tech · Hip and posterior thigh anatomy', url: 'https://anatomy.ttuhscep.edu/musculoskeletal_system/gluteal_tables.html' };
const lowerLimb = { title: 'Texas Tech · Lower-limb muscle anatomy', url: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html' };
const piriformis = { title: 'NCBI Bookshelf · Piriformis muscle', url: 'https://www.ncbi.nlm.nih.gov/books/NBK519497/' };
const gemelli = { title: 'NCBI Bookshelf · Gemelli muscles', url: 'https://www.ncbi.nlm.nih.gov/books/NBK557420/' };
const obturators = { title: 'NCBI Bookshelf · Obturator muscles', url: 'https://www.ncbi.nlm.nih.gov/books/NBK589636/' };
const ischiofemoral = { title: 'Torriani et al. · Ischiofemoral MRI study', url: 'https://pubmed.ncbi.nlm.nih.gov/19542413/' };
const quadratusSupply = { title: 'Cadaveric study · Quadratus femoris arterial supply', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9773483/' };
const inferiorGemellusSupply = { title: 'UW Radiology · Inferior gemellus', url: 'https://rad.uw.edu/muscle-atlas/inferior-gemellus' };
const inferiorGemellusCircumflex = { title: 'Elsevier · Inferior gemellus arterial supply', url: 'https://www.elsevier.com/resources/anatomy/muscular-system/muscles-of-lower-limb/inferior-gemellus-muscle/20349' };
const note = (body: string, ...references: SpecimenDepthNote['references']): SpecimenDepthNote => ({ body, references });
const revision = 'um-deep-hip-depth-20261005-v1';
const reviewScope = 'thigh-depth' as const;

export const umDeepHipDepth: Record<string, DeepHipDepthLesson> = {
  piriformis: {
    status: 'draft', revision, reviewScope,
    relationships: note('Piriformis leaves the anterior sacrum through the greater sciatic foramen toward the upper greater trochanter. The sciatic nerve usually passes below it, but the nerve-muscle relationship varies.', gluteal, piriformis),
    arterialSupply: note('Superior and inferior gluteal branches commonly contribute to piriformis supply. Lateral sacral or internal pudendal contributions are also described; none is resolved here.', gluteal, piriformis),
    clinicalPitfall: note('A piriformis silhouette cannot establish sciatic entrapment or a through-muscle nerve variant. Buttock or radiating pain requires clinical assessment beyond this static surface.', piriformis),
    modelLimit: 'Sciatic nerve variants, arterial branches and tendon details are not mapped; vessels and nerves are absent. No compression, perfusion or diagnosis is shown.',
  },
  'superior-gemellus': {
    status: 'draft', revision, reviewScope,
    relationships: note('Superior gemellus arises at the ischial spine above obturator internus and joins its tendon toward the medial greater trochanter. It remains a distinct muscle despite the shared insertion.', gemelli),
    arterialSupply: note('Inferior gluteal arterial branches typically supply superior gemellus. Their course and individual contribution are not represented by this muscle surface.', gluteal),
    clinicalPitfall: note('The superior gemellus surface cannot identify its motor nerve or prove gemelli-obturator entrapment. Variable innervation and absent sciatic anatomy require separate clinical assessment.', gemelli),
    modelLimit: 'Shared tendon layers, sciatic relationships and small arterial branches are not resolved; vessels and nerves are absent. No compression, perfusion or diagnosis is shown.',
  },
  'inferior-gemellus': {
    status: 'draft', revision, reviewScope,
    relationships: note('Inferior gemellus arises from the ischial tuberosity below obturator internus and joins its tendon near the medial greater trochanter. The gemelli have distinct origins and typical motor supplies.', gemelli),
    arterialSupply: note('Anatomy references describe inferior gluteal and medial circumflex femoral supply to inferior gemellus. This isolated muscle surface cannot establish either branch or its territory.', inferiorGemellusSupply, inferiorGemellusCircumflex),
    clinicalPitfall: note('An inferior gemellus selection cannot isolate a deep-gluteal pain generator. Its shared tendon, neighboring obturator internus and absent neural anatomy require independent assessment.', gemelli),
    modelLimit: 'The conjoined tendon, adjacent sciatic relationship and arterial branches are not resolved; vessels and nerves are absent. No entrapment, perfusion or diagnosis is shown.',
  },
  'obturator-internus': {
    status: 'draft', revision, reviewScope,
    relationships: note('Obturator internus begins on the inner obturator membrane, leaves the pelvis through the lesser sciatic foramen, and turns toward the medial greater trochanter with both gemelli.', gluteal, gemelli),
    arterialSupply: note('Obturator and inferior gluteal branches supply obturator internus; internal pudendal contributions are also described and variable. No arterial branch is mapped on this surface.', obturators),
    clinicalPitfall: note('A posterior hip surface cannot distinguish obturator-internus strain from adjacent joint or neural causes of buttock pain. Its tendon and neighboring sciatic nerve need separate assessment.', obturators),
    modelLimit: 'The lesser sciatic foramen, tendon bend and fascial relations are not fully mapped; vessels and nerves are absent. No strain, perfusion, entrapment or diagnosis is shown.',
  },
  'obturator-externus': {
    status: 'draft', revision, reviewScope,
    relationships: note('Obturator externus starts outside the obturator membrane, passes below and behind the femoral neck, and reaches the trochanteric fossa. Its course differs from obturator internus.', lowerLimb, obturators),
    arterialSupply: note('Obturator and medial circumflex femoral arterial branches may supply obturator externus, with variable contributions. The source surface does not show either arterial course.', obturators),
    clinicalPitfall: note('A deep hip surface cannot show obturator-externus tendon injury or establish femoral-head perfusion. Nearby medial circumflex femoral branches require independent vascular assessment.', obturators),
    modelLimit: 'The trochanteric-fossa tendon, femoral-neck vessel relationship and bursa are not resolved; vessels and nerves are absent. No injury, perfusion or diagnosis is shown.',
  },
  'quadratus-femoris': {
    status: 'draft', revision, reviewScope,
    relationships: note('Quadratus femoris spans the lateral ischial tuberosity to the posterior proximal femur below the gemelli-obturator complex. The ischiofemoral interval includes neighboring bone and soft tissue.', gluteal),
    arterialSupply: note('Inferior gluteal and medial circumflex femoral branches both contribute to quadratus femoris supply. This isolated muscle surface maps neither branch nor an individual perfusion territory.', quadratusSupply),
    clinicalPitfall: note('Posterior hip pain cannot be labelled ischiofemoral impingement from quadratus femoris shape. Reported MRI findings include narrowed space and muscle signal change, requiring clinical and imaging correlation.', ischiofemoral),
    modelLimit: 'The ischiofemoral space, sciatic relationship and tendon boundaries are not measured; vessels and nerves are absent. No impingement, perfusion or diagnosis is shown.',
  },
};
