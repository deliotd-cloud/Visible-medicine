import raw from '../public/models/um-limb/catalog.json' with { type: 'json' };
import { kneeSpecimen, kneeSpecimenStudies, kneeJointBounds, kneeCatalog } from './um-knee-study';
import { specimenCatalog, type SpecimenDefinition, type SpecimenSurface, type SpecimenStudy } from './independent-specimen';
import type { DissectionView } from '../app/dissection-data';
import type { Vec3 } from '../app/body-types';

export const limbSurfaces: SpecimenSurface[] = [
  ...kneeSpecimen.structures.map((s) => ({ ...s, bundle: kneeSpecimen.bundle.id })), ...raw.structures,
];
const bySlug = new Map(limbSurfaces.map((s) => [s.slug, s]));
const ids = (slugs: string[]) => slugs.map((slug) => {
  const s = bySlug.get(slug); if (!s) throw new Error(`Unknown source surface: ${slug}`); return s.id;
});
const study = (id: string, title: string, slugs: string[], selected: string, view: DissectionView, note: string): SpecimenStudy => ({ id, title, ids: ids(slugs), selectedId: ids([selected])[0], view, note });
export const kneeDefinition: SpecimenDefinition = {
  key: kneeCatalog.sourceVersion, label: 'Knee', source: kneeSpecimen.source,
  surfaces: limbSurfaces.slice(0, 15), catalog: kneeCatalog,
  studies: kneeSpecimenStudies.map((s) => study(s.id, s.title, s.slugs, s.selected, s.view, s.note)),
  initialStudy: 'all', closeUp: kneeJointBounds, omittedFaces: 40,
  limitations: 'Nerves, vessels, capsule and other omitted tissues are not reconstructed.',
};
const hipParts = raw.structures.filter((s) => s.region === 'hip-thigh').map((s) => s.slug);
const legParts = raw.structures.filter((s) => s.region === 'leg').map((s) => s.slug);
const footParts = raw.structures.filter((s) => s.region === 'foot').map((s) => s.slug);
const hipBones = ['pelvis-group', 'femur'], kneeBones = ['femur', 'tibia', 'fibula', 'patella'];
const hipScope = [...hipParts, ...kneeBones, 'quadriceps-tendon', 'patellar-ligament'];
const legScope = [...legParts, 'tibia', 'fibula', 'popliteus', 'calcaneus'];
const footScope = [...footParts, 'tibia', 'fibula', 'achilles-tendon', 'tibialis-anterior', 'tibialis-posterior', 'flexor-digitorum-longus', 'flexor-hallucis-longus', 'extensor-digitorum-longus', 'extensor-hallucis-longus', 'peroneus-longus'];
function bounds(slugs: string[]) {
  const records = slugs.map((s) => bySlug.get(s)!);
  return { min: [0, 1, 2].map((i) => Math.min(...records.map((s) => s.bounds.min[i])) - .18) as Vec3,
    max: [0, 1, 2].map((i) => Math.max(...records.map((s) => s.bounds.max[i])) + .18) as Vec3 };
}
function definition(key: string, label: string, slugs: string[], studies: SpecimenStudy[], initialStudy: string, closeUp: SpecimenDefinition['closeUp'], limitations: string): SpecimenDefinition {
  const scope = new Set(ids(slugs)), surfaces = limbSurfaces.filter((s) => scope.has(s.id));
  for (const s of studies) if (!s.ids.length || s.ids.some((id) => !scope.has(id)) || !s.ids.includes(s.selectedId)) throw new Error('Invalid regional source study');
  return { key: `${raw.specimenId}:${key}`, label, source: raw.source, surfaces, studies, initialStudy, closeUp, limitations,
    omittedFaces: surfaces.reduce((n, s) => n + s.omittedSourceFaces.length, 0),
    catalog: specimenCatalog({ key: `${raw.specimenId}:${key}`, source: raw.source, surfaces, bundles: [kneeSpecimen.bundle, ...raw.bundles], matrix: raw.displayTransformColumnMajor }),
  };
}
export const hipThighDefinition = definition('hip-thigh', 'Hip & thigh', hipScope, [
  study('all', 'All regional tissues', hipScope, 'gluteus-maximus', 'anterior', 'All supplied hip/thigh surfaces with whole-bone context. This is one source specimen, not complete hip anatomy.'),
  study('gluteal', 'Gluteal muscles', [...hipBones, 'gluteus-maximus', 'gluteus-medius', 'gluteus-minimus', 'tensor-fasciae-latae'], 'gluteus-maximus', 'posterior', 'Set gluteus maximus aside to compare the deeper supplied surfaces. No sciatic nerve or fascia is reconstructed.'),
  study('deep-hip', 'Deep hip rotators', [...hipBones, 'piriformis', 'superior-gemellus', 'inferior-gemellus', 'obturator-internus', 'obturator-externus', 'quadratus-femoris'], 'piriformis', 'posterior', 'Superficial muscles are hidden. Compare the supplied short-rotator surfaces; nerves, bursae and tendon footprints are not mapped.'),
  study('hip-flexors', 'Iliacus & psoas', [...hipBones, 'iliacus', 'psoas-major'], 'iliacus', 'anterior', 'Inspect the separate source iliacus and psoas major. Lumbar vertebrae and the lumbar plexus are not included.'),
  study('quadriceps', 'Quadriceps group', [...kneeBones, 'rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'vastus-intermedius', 'quadriceps-tendon', 'patellar-ligament'], 'rectus-femoris', 'anterior', 'Four source quadriceps muscles with the supplied extensor tissues. Set rectus femoris aside to expose vastus intermedius.'),
  study('adductors', 'Medial thigh muscles', [...hipBones, 'adductor-longus', 'adductor-brevis', 'adductor-magnus', 'gracilis', 'pectineus'], 'adductor-longus', 'anterior', 'Set superficial source surfaces aside to inspect deeper ones. Small disconnected source fragments remain; they are not named accessory muscles.'),
  study('hamstrings', 'Posterior thigh muscles', [...hipBones, 'tibia', 'fibula', 'biceps-femoris-long-head', 'biceps-femoris-short-head', 'semimembranosus', 'semitendinosus'], 'biceps-femoris-long-head', 'posterior', 'Both biceps femoris heads remain separate selections. The other posterior thigh muscles and bony context retain their source positions.'),
  study('hip-cartilage', 'Femoral head cartilage', [...hipBones, 'femoral-head-cartilage'], 'femoral-head-cartilage', 'anterior', 'Only the supplied femoral cartilage surface is shown. Acetabular cartilage, labrum and capsule are absent, not inferred.'),
], 'gluteal', bounds([...hipParts, 'femur']), 'No peripheral nerves, vessels, fascia, hip capsule or labrum. Pelvic source surface remains one group; separate pelvic bones are not labelled.');
export const legDefinition = definition('calf', 'Calf & ankle tendons', legScope, [
  study('all', 'All regional tissues', legScope, 'soleus', 'posterior', 'Supplied calf surfaces and whole-bone context. Thin tendons and muscle boundaries retain source limitations.'),
  study('anterior', 'Anterior calf muscles', ['tibia', 'fibula', 'tibialis-anterior', 'extensor-digitorum-longus', 'extensor-hallucis-longus'], 'tibialis-anterior', 'anterior', 'The supplied anterior muscles are visible. Fibularis tertius, retinacula and the anterior neurovascular bundle are absent.'),
  study('superficial', 'Superficial posterior calf', ['tibia', 'fibula', 'calcaneus', 'gastrocnemius-medial', 'gastrocnemius-lateral', 'soleus', 'achilles-tendon'], 'gastrocnemius-medial', 'posterior', 'Set either gastrocnemius head aside to expose soleus. The source calcaneal tendon is retained; plantaris is not supplied.'),
  study('deep', 'Deep posterior calf', ['tibia', 'fibula', 'calcaneus', 'tibialis-posterior', 'flexor-digitorum-longus', 'flexor-hallucis-longus', 'popliteus'], 'tibialis-posterior', 'posterior', 'Compare supplied deep posterior surfaces. This is not a tarsal-tunnel or neurovascular dissection.'),
  study('lateral', 'Fibularis longus', ['tibia', 'fibula', 'calcaneus', 'peroneus-longus'], 'peroneus-longus', 'right', 'The source fibularis (peroneus) longus is supplied; fibularis brevis is not. Do not infer a complete lateral compartment.'),
], 'superficial', null, 'No peripheral nerves, vessels, plantaris, fibularis brevis/tertius, fascia or retinacula. Some source surfaces have nonmanifold edge contacts; this is not simulation-ready geometry.');
export const footDefinition = definition('foot', 'Ankle & foot', footScope, [
  study('all', 'All regional tissues', footScope, 'talus', 'anterior', 'Whole source structures are retained. Close-up centres on the foot; use Frame to inspect the full selected long muscle or bone.'),
  study('bones', 'Source foot bones', footParts.filter((slug) => bySlug.get(slug)!.tissue === 'skeleton'), 'talus', 'superior', 'Tarsal surfaces are separate. The source Phalanges surface remains one grouped entry, without individual digit or bone numbering.'),
  study('plantar', 'Supplied plantar muscles', [...footParts.filter((slug) => bySlug.get(slug)!.tissue === 'skeleton'), 'abductor-hallucis', 'abductor-digiti-minimi', 'flexor-digitorum-brevis', 'quadratus-plantae'], 'flexor-digitorum-brevis', 'inferior', 'Set flexor digitorum brevis aside to compare quadratus plantae. This is partial plantar anatomy, not complete four-layer dissection.'),
  study('dorsal', 'Dorsal muscle surface', [...footParts.filter((slug) => bySlug.get(slug)!.tissue === 'skeleton'), 'extensor-digitorum-brevis'], 'extensor-digitorum-brevis', 'superior', 'Extensor digitorum brevis is one source selection. No separate extensor hallucis brevis subdivision is invented.'),
  study('ankle-extensors', 'Anterior ankle tendons', ['tibia', 'fibula', 'talus', 'calcaneus', 'tibialis-anterior', 'extensor-digitorum-longus', 'extensor-hallucis-longus'], 'tibialis-anterior', 'anterior', 'Follow the supplied whole muscle/tendon surfaces toward the ankle. Retinacula and insertion footprints are not mapped.'),
  study('achilles', 'Calcaneal tendon', ['tibia', 'fibula', 'talus', 'calcaneus', 'achilles-tendon'], 'achilles-tendon', 'posterior', 'Compare the original calcaneal tendon surface with calcaneus. Small source fragments/edge contacts are retained; no rupture or repair is modelled.'),
], 'bones', bounds(footParts), 'Foot bone group is not individually numbered. Many intrinsic muscles, plantar fascia, ligament/retinacular structures and neurovascular anatomy are absent. No full gait or tendon-continuity simulation.');
const whole = limbSurfaces.map((s) => s.slug);
export const wholeLimbDefinition = definition('whole', 'Whole source limb', whole, [study('all', 'All 67 source surfaces', whole, 'femur', 'anterior', 'All supplied surfaces from this single source specimen. This heavier view is optional; regional studies load smaller subsets.')], 'all', null, 'Incomplete adult-male lower limb; no nerves or vessels, no mirrored contralateral limb or body registration. Source fragments and grouping remain.');
export const limbDefinitions = { knee: kneeDefinition, 'hip-thigh': hipThighDefinition, calf: legDefinition, foot: footDefinition, whole: wholeLimbDefinition };
export type LimbScope = keyof typeof limbDefinitions;
