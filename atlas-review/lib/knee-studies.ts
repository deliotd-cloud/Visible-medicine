import type { AxialStudy } from './axial-anatomy';
import type { BodyStructure } from '../app/body-types';

export const kneeStudyReferences = [
  'https://anatomy.ttuhscep.edu/anatomytables/joints_lowerlimb.html',
];
const femora = ['FMA24474', 'FMA24475'];
const tibiae = ['FMA24477', 'FMA24478'];
const fibulae = ['FMA24480', 'FMA24481'];
const patellae = ['FMA24486', 'FMA24487'];
const framework = [...femora, ...tibiae, ...fibulae];
const limitation =
  ' Whole bones remain selectable; the close-up does not create new bone segments. Cartilage, menisci, cruciate/collateral ligaments and the joint capsule are not segmented. Return separation to 0% to compare source positions; this is not knee motion or a registered scan.';

export const kneeStudySets: AxialStudy[] = [
  {
    id: 'knee-bones',
    title: 'Knee: bony relationships',
    regions: ['leg'],
    targetFmaIds: [...framework, ...patellae],
    context: [],
    view: 'anterior',
    description:
      'Inspect the patella in front of the distal femur, the proximal tibia and the lateral fibular head. Overlying muscles are set aside; select Left or Right for a single knee.',
    inspect:
      'Rotate to compare the femoral condyles, tibial plateau and patellar surface. The fibular head belongs to the proximal tibiofibular articulation, not the femorotibial bearing surface.' + limitation,
    landmarks: ['patella$', 'tibia$', 'fibula$'],
  },
  {
    id: 'knee-patella-off',
    title: 'Knee: set the patella aside',
    regions: ['leg'],
    targetFmaIds: framework,
    context: [],
    view: 'anterior',
    description:
      'Hide the patella as well as soft tissues to inspect the anterior distal femur and proximal tibia. Use Undo or the bony-relationships study to put it back.',
    inspect:
      'Compare the exposed femoral groove with the preceding view. This is a visibility exercise, not a patellar dislocation or a surgical approach.' + limitation,
    landmarks: ['femur$', 'tibia$', 'fibula$'],
  },
  {
    id: 'knee-popliteus',
    title: 'Knee: posterior popliteus',
    regions: ['leg'],
    targetFmaIds: ['FMA22591', 'FMA22592'],
    context: [{ fmaIds: framework }],
    view: 'posterior',
    description:
      'Expose the source popliteus surfaces against the femur, tibia and fibula. Gastrocnemius, soleus, plantaris and the longer posterior muscles are hidden.',
    inspect:
      'Select popliteus, isolate it or set it aside, then restore it to compare its source position with the bones. Nerves, ligament attachments and a complete popliteal-fossa dissection are not supplied.' + limitation,
    landmarks: ['popliteus$', 'tibia$', 'fibula$'],
  },
];

/** A camera-only region of interest, never a new anatomical segmentation.
 * Anchor to the original patella even in the patella-off recipe so removing
 * tissue does not shift the close-up. Bounds scale with this source model.
 */
export function kneeStudyBounds({
  region, recipeId, structures, visibleIds, enabled,
}: {
  region: string;
  recipeId: string | null;
  structures: BodyStructure[];
  visibleIds: string[];
  enabled: boolean;
}) {
  const study = kneeStudySets.find((item) => item.id === recipeId);
  if (!enabled || region !== 'leg' || !study || !visibleIds.length) return null;
  const allowed = new Set([...study.targetFmaIds, ...study.context.flatMap((rule) => rule.fmaIds ?? [])]);
  // Manually restored anatomy outside the recipe needs normal full framing.
  const visible = structures.filter((s) => visibleIds.includes(s.id));
  if (visible.length !== visibleIds.length || visible.some((s) => !allowed.has(s.fmaId))) return null;
  const sides = new Set(visible.map((s) => s.laterality));
  const anchors = structures.filter((s) => patellae.includes(s.fmaId) && sides.has(s.laterality));
  if (!anchors.length || anchors.length !== sides.size) return null;
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const anchor of anchors) {
    const { bounds } = anchor;
    if (bounds.min.length !== 3 || bounds.max.length !== 3 ||
      bounds.min.some((v, i) => !Number.isFinite(v) || !Number.isFinite(bounds.max[i]) || bounds.max[i] <= v)) return null;
    const scale = Math.max(...bounds.max.map((v, i) => v - bounds.min[i]));
    const center = bounds.min.map((v, i) => (v + bounds.max[i]) / 2);
    // Shift slightly inferior/posterior from the anterior patella to include
    // the proximal tibia and popliteus. This is a viewing margin, not a landmark.
    center[1] -= scale * 0.4;
    center[2] -= scale;
    const radius = [scale * 1.8, scale * 2.8, scale * 1.8];
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], center[i] - radius[i]);
      max[i] = Math.max(max[i], center[i] + radius[i]);
    }
  }
  return { min, max };
}
