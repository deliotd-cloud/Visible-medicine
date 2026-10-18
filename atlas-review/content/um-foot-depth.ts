// Original, source-bound drafts about usual intrinsic-foot relationships.
// References are linked only; the UM surfaces do not map nerves or vessels.
import type { SpecimenDepthLesson, SpecimenDepthNote } from './um-calf-depth';

type FootDepthLesson = SpecimenDepthLesson & { reviewScope: 'foot-depth' };
const table = { title: 'Texas Tech · Lower-limb muscle anatomy', url: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html' };
const foot = { title: 'NCBI Bookshelf · Foot muscle anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK539705/' };
const vascular = { title: 'Orbay et al. · Cadaveric plantar muscle vascular anatomy', url: 'https://pubmed.ncbi.nlm.nih.gov/17413886/' };
const tarsalTunnel = { title: 'Harej et al. · Sonographic and cadaveric tarsal tunnel anatomy', url: 'https://pubmed.ncbi.nlm.nih.gov/37701055/' };
const quadratusVariation = { title: 'Cadaveric study · Quadratus plantae morphology and variation', url: 'https://pubmed.ncbi.nlm.nih.gov/29166622/' };
const baxterReview = { title: 'Chen et al. · ADM fatty infiltration and Baxter neuropathy systematic review', url: 'https://pubmed.ncbi.nlm.nih.gov/40836398/' };
const note = (body: string, ...references: SpecimenDepthNote['references']): SpecimenDepthNote => ({ body, references });
const revision = 'um-foot-depth-20261005-v1';
const reviewScope = 'foot-depth' as const;

export const umFootDepth: Record<string, FootDepthLesson> = {
  'abductor-hallucis': {
    status: 'draft', revision, reviewScope,
    relationships: note('Abductor hallucis runs along the medial sole from the calcaneal tuberosity toward the hallux proximal phalanx. Its position marks the medial plantar margin, beside deeper plantar structures.', table),
    arterialSupply: note('The medial plantar artery is the principal reported supply to abductor hallucis. This reference muscle does not map its branches or an individual vascular territory.', vascular),
    clinicalPitfall: note('A medial plantar muscle silhouette cannot locate tarsal-tunnel nerve compression. The relevant nerve branching and fascial boundaries need an independent examination.', tarsalTunnel),
    modelLimit: 'Plantar fascia and deeper fascial boundaries are not resolved; nerves and vessels are absent. No compression, measured perfusion, loaded arch behavior or diagnosis is shown.',
  },
  'abductor-digiti-minimi': {
    status: 'draft', revision, reviewScope,
    relationships: note('The foot abductor digiti minimi follows the lateral sole from the calcaneal tuberosity to the fifth toe proximal phalanx. It is distinct from the hand muscle of the same name.', table),
    arterialSupply: note('The lateral plantar artery is the main reported supply to foot abductor digiti minimi. Its course and branching are not visible on this reference surface.', vascular),
    clinicalPitfall: note('Fatty infiltration of this muscle on MRI alone does not establish Baxter neuropathy. A systematic review found the proposed association uncertain because robust evidence is lacking.', baxterReview),
    modelLimit: 'Plantar fascia, nerves and vessels are absent. No fatty infiltration, denervation, compression, measured perfusion, loaded foot behavior or diagnosis is shown.',
  },
  'flexor-digitorum-brevis': {
    status: 'draft', revision, reviewScope,
    relationships: note('Flexor digitorum brevis lies in the superficial central sole. Its tendons reach the middle phalanges of toes two through five after splitting around the deeper long-flexor tendons.', table),
    arterialSupply: note('Cadaveric dissection found branches from both medial and lateral plantar arteries supplying flexor digitorum brevis. This mesh resolves neither branch nor its territory.', vascular),
    clinicalPitfall: note('A selected short-flexor belly does not prove damage to one digital slip. Distinguish its middle-phalanx attachments from the deeper long flexor reaching the distal phalanges.', foot),
    modelLimit: 'Individual tendon slips, plantar fascia, nerves and vessels are not resolved. No tendon tear, measured perfusion, toe loading or diagnosis is shown.',
  },
  'quadratus-plantae': {
    status: 'draft', revision, reviewScope,
    relationships: note('Quadratus plantae arises near the plantar calcaneus and joins the flexor digitorum longus tendon apparatus. Its usual medial and lateral heads are anatomically variable, not separate selections here.', table, quadratusVariation),
    arterialSupply: note('Sources describe lateral plantar arterial supply and a direct posterior tibial branch in cadaveric specimens. Neither course nor contribution is established for this source surface.', table, vascular),
    clinicalPitfall: note('This muscle acts through the long-flexor tendon apparatus, not a direct toe-phalanx insertion. One surface cannot identify which head or tendon connection explains an individual symptom.', foot, quadratusVariation),
    modelLimit: 'Two heads and their tendon connections are not separately validated; plantar fascia, nerves and vessels are absent. No measured perfusion, toe loading or diagnosis is shown.',
  },
  'extensor-digitorum-brevis': {
    status: 'draft', revision, reviewScope,
    relationships: note('Extensor digitorum brevis begins on the superolateral calcaneus and crosses the dorsal foot toward the toe extensor apparatus. Its hallux-directed part is often termed extensor hallucis brevis.', table),
    arterialSupply: note('The dorsalis pedis artery is listed as the usual supply to extensor digitorum brevis. No artery or branch is mapped on this dorsal muscle surface.', table),
    clinicalPitfall: note('A deep fibular nerve pattern cannot be diagnosed from this isolated dorsal muscle. The hallux-directed part is not a separately validated extensor hallucis brevis selection in this source.', foot),
    modelLimit: 'Separate extensor hallucis brevis, individual slips, retinacula, nerves and vessels are absent. No weakness, measured perfusion, loaded toe extension or diagnosis is shown.',
  },
};
