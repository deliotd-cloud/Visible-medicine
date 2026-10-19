// Original, source-bound teaching drafts about usual anatomy. The UM muscle
// surfaces do not map vessels, nerves, fibre layers, or clinical findings.
import type { SpecimenDepthLesson, SpecimenDepthNote } from './um-calf-depth';

type ThighDepthLesson = SpecimenDepthLesson & { reviewScope: 'thigh-depth' };
const table = { title: 'Texas Tech · Lower-limb muscle anatomy', url: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html' };
const thigh = { title: 'Texas Tech · Anterior and medial thigh', url: 'https://anatomy.ttuhscep.edu/musculoskeletal_system/thigh_tables.html' };
const quadriceps = { title: 'NCBI Bookshelf · Quadriceps muscle', url: 'https://www.ncbi.nlm.nih.gov/books/NBK513334/' };
const hamstrings = { title: 'NCBI Bookshelf · Hamstring muscle', url: 'https://www.ncbi.nlm.nih.gov/books/NBK546688/' };
const magnus = { title: 'NCBI Bookshelf · Adductor magnus', url: 'https://www.ncbi.nlm.nih.gov/books/NBK534842/' };
const canal = { title: 'NCBI Bookshelf · Adductor canal', url: 'https://www.ncbi.nlm.nih.gov/books/NBK556046/' };
const medius = { title: 'NCBI Bookshelf · Gluteus medius', url: 'https://www.ncbi.nlm.nih.gov/books/NBK557509/' };
const superiorGluteal = { title: 'NCBI Bookshelf · Superior gluteal nerve', url: 'https://www.ncbi.nlm.nih.gov/books/NBK535408/' };
const note = (body: string, ...references: SpecimenDepthNote['references']): SpecimenDepthNote => ({ body, references });
const revision = 'um-thigh-depth-20261005-v1';
const reviewScope = 'thigh-depth' as const;

export const umThighDepth: Record<string, ThighDepthLesson> = {
  'rectus-femoris': {
    status: 'draft', revision, reviewScope,
    relationships: note('Rectus femoris is the superficial central quadriceps head, overlying vastus intermedius. Unlike the three vasti it crosses both hip and knee; its proximal attachment lies near the anterior inferior iliac spine.', thigh, quadriceps),
    arterialSupply: note('Femoral and lateral circumflex femoral arterial branches typically supply rectus femoris.', thigh),
    clinicalPitfall: note('Anterior thigh pain or weak knee extension cannot be assigned to rectus femoris by its position alone. Its hip action and shared distal extensor apparatus require examination beyond a static muscle surface.', quadriceps),
    modelLimit: 'The two proximal tendon origins, intramuscular tendon, vessels, nerves and fibre injury are not resolved. No hip or knee movement, strength, perfusion or tear is simulated.',
  },
  'vastus-intermedius': {
    status: 'draft', revision, reviewScope,
    relationships: note('Vastus intermedius lies deep to rectus femoris against the anterior femur and joins the quadriceps extensor apparatus. It crosses the knee but not the hip.', table),
    arterialSupply: note('Lateral circumflex femoral arterial branches typically supply vastus intermedius.', table),
    clinicalPitfall: note('A deep anterior thigh finding should not be called an isolated intermedius injury from this surface. Rectus femoris overlies it, and the shared tendon and nearby tissues require separate assessment.', quadriceps),
    modelLimit: 'Deep fibre planes, articularis genu, vessels, nerves and layered quadriceps tendon continuity are not validated. No injury, perfusion or active extension is shown.',
  },
  'vastus-lateralis': {
    status: 'draft', revision, reviewScope,
    relationships: note('Vastus lateralis occupies the lateral anterior thigh beside intermedius and contributes to the common quadriceps tendon at the patella. Its femoral origin leaves it acting across the knee, not the hip.', table),
    arterialSupply: note('Lateral circumflex femoral and perforating profunda femoris branches commonly supply vastus lateralis.', table),
    clinicalPitfall: note('A lateral quadriceps surface does not establish integrity of the whole extensor mechanism. Patellar tracking and tendon continuity depend on structures and movement outside this selection.', quadriceps),
    modelLimit: 'Lateral septum, retinacular fibres, layered tendon, vessels and nerves are not resolved. No patellar tracking, perfusion or tear can be assessed.',
  },
  'vastus-medialis': {
    status: 'draft', revision, reviewScope,
    relationships: note('Vastus medialis lies along the medial femur and joins the distal quadriceps apparatus beside the other vasti. The supplied surface is the whole muscle, without a separately identified oblique fibre part.', thigh, quadriceps),
    arterialSupply: note('Femoral and lateral circumflex femoral arterial branches commonly contribute to vastus medialis supply.', thigh),
    clinicalPitfall: note('Do not infer isolated oblique-fibre weakness or a patellar maltracking mechanism from the whole-muscle surface. Such findings require functional and clinical assessment of the wider extensor apparatus.', quadriceps),
    modelLimit: 'No separately validated VMO subdivision, medial retinaculum, vessels, nerves or layered tendon is mapped. No tracking, force or perfusion is measured.',
  },
  'biceps-femoris-long-head': {
    status: 'draft', revision, reviewScope,
    relationships: note('The long head arises near semitendinosus at the ischial tuberosity, descends laterally and meets the short head near the fibular head. Only the long head crosses hip and knee.', table, hamstrings),
    arterialSupply: note('Perforating profunda femoris branches are the usual supply; proximal hamstrings may also receive inferior gluteal contributions.', table),
    clinicalPitfall: note('A lateral hamstring selection cannot distinguish proximal tendon avulsion from belly strain, short-head disease or a neural cause of weakness. The two heads have different proximal attachments and motor supply.', hamstrings),
    modelLimit: 'Common proximal tendon, distal tendon details, sciatic nerve branches, vessels and injury planes are not mapped. No loading, perfusion or avulsion is simulated.',
  },
  semitendinosus: {
    status: 'draft', revision, reviewScope,
    relationships: note('Semitendinosus runs on the superficial medial side of the posterior thigh, near semimembranosus, and continues distally toward the medial tibia as part of the pes anserinus.', hamstrings),
    arterialSupply: note('Perforating branches of the profunda femoris typically supply semitendinosus; inferior gluteal contributions may supply proximal hamstrings.', table, hamstrings),
    clinicalPitfall: note('Medial posterior thigh pain cannot be localised to this muscle from a separated surface. The proximal common tendon and neighboring semimembranosus, adductor magnus and neurovascular structures need independent assessment.', hamstrings),
    modelLimit: 'Pes anserinus layers, common proximal tendon, vessels, nerves and injury planes are not validated. No contraction, perfusion or strain grade is shown.',
  },
  semimembranosus: {
    status: 'draft', revision, reviewScope,
    relationships: note('Semimembranosus lies deeper and more medial than semitendinosus in the posterior thigh. It crosses hip and knee and attaches near the posterior medial tibial condyle.', hamstrings),
    arterialSupply: note('Perforating profunda femoris branches typically supply semimembranosus, with possible proximal inferior gluteal contribution to the hamstring group.', table, hamstrings),
    clinicalPitfall: note('A deep medial hamstring surface does not depict the posteromedial knee stabilising complex. A distal finding needs separate evaluation of tendon, capsule and adjacent structures.', hamstrings),
    modelLimit: 'Distal capsular expansions, tendon layers, vessels and nerves are not resolved. No knee stability, perfusion or lesion is simulated.',
  },
  'adductor-longus': {
    status: 'draft', revision, reviewScope,
    relationships: note('Adductor longus is an anterior medial-thigh adductor. It overlies adductor brevis proximally; the profunda femoris passes deeper, while its medial border helps define the femoral triangle.', thigh),
    arterialSupply: note('Obturator and profunda femoris arterial branches typically supply adductor longus.', table),
    clinicalPitfall: note('Groin pain along the medial thigh does not by itself establish an adductor-longus tendon injury. The pubic attachment and neighboring adductors, joint and neural structures require assessment.', table),
    modelLimit: 'Proximal tendon architecture, femoral-triangle fascia, vessels and nerves are not mapped. No pain generator, perfusion or tendon lesion is shown.',
  },
  'adductor-magnus': {
    status: 'draft', revision, reviewScope,
    relationships: note('Adductor magnus spans the deep medial thigh. Its adductor and hamstring portions have different typical actions; the distal adductor hiatus is the passage where the femoral vessels reach the posterior knee.', magnus, canal),
    arterialSupply: note('Perforating profunda femoris branches are a major supply. Medial circumflex femoral branches contribute proximally, with variable distal femoral, popliteal or genicular contributions.', magnus),
    clinicalPitfall: note('The muscle silhouette cannot locate the adductor hiatus or prove femoral-vessel patency. An apparent division of the muscle is not a validated map of the two motor portions.', magnus, canal),
    modelLimit: 'The adductor hiatus, internal portions, fascial boundaries, vessels and nerves are not individually mapped. No perfusion, entrapment or regional motor loss is simulated.',
  },
  'gluteus-medius': {
    status: 'draft', revision, reviewScope,
    relationships: note('Gluteus medius lies over gluteus minimus on the lateral ilium; only its posterior portion is covered by gluteus maximus. It contributes to hip abduction and pelvic support during single-leg stance.', medius, superiorGluteal),
    arterialSupply: note('Deep branches of the superior gluteal artery typically supply gluteus medius.', medius),
    clinicalPitfall: note('Pelvic drop or lateral hip pain cannot be attributed to this muscle from shape alone. Tendon integrity, superior gluteal nerve function and competing hip causes require examination.', medius, superiorGluteal),
    modelLimit: 'Superior gluteal vessels and nerve, tendon subdivisions and adjacent bursae are not resolved. No gait, tendon tear, perfusion or functional weakness is simulated.',
  },
};
