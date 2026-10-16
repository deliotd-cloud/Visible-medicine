// Original short teaching drafts. Reading references do not license images or tables.
export const cervicalProjectionXrayReferences = [
  'https://anatomy.ttuhscep.edu/anatomytables/muscles_head_neck.html',
  'https://pubmed.ncbi.nlm.nih.gov/1941327/',
  'https://pubmed.ncbi.nlm.nih.gov/21558035/',
  'https://pmc.ncbi.nlm.nih.gov/articles/PMC7051716/',
  'https://pubmed.ncbi.nlm.nih.gov/31082563/',
] as const;

export const cervicalProjectionXrayFacts = {
  longusCapitis: {
    body: 'Use the assembled 3D view to orient this deep anterior neck muscle between the anterior transverse-process tubercles of C3–C6 and the occipital base.',
    distinction: 'Longus capitis reaches the skull. Do not substitute longus colli, which has cervical and upper-thoracic vertebral attachments, for this named source muscle.',
    projection: 'On a lateral neck radiograph, consider the adjacent prevertebral soft-tissue contour rather than trying to outline either longus capitis separately. A contour measurement is not a muscle thickness or a segmented muscle boundary.',
  },
  rectusAnterior: {
    body: 'Orient rectus capitis anterior at the short connection from the atlas lateral mass toward the undersurface of the occipital base.',
    distinction: 'This upper-cervical attachment differs from the longer C3–C6 course of longus capitis. Keep the atlas and occiput in view to compare the two source muscles.',
    projection: 'A lateral radiograph can provide bony and regional soft-tissue context at the craniovertebral junction. It does not supply a separate outline of this small paired muscle or establish its attachment integrity.',
  },
  rectusLateralis: {
    body: 'Locate rectus capitis lateralis between the atlas transverse process and the jugular process of the occipital bone, lateral to the anterior upper-cervical muscle group.',
    distinction: 'The jugular-process attachment distinguishes this muscle from rectus capitis anterior. Cadaveric landmark descriptions are not proof that the same small muscle is resolved on a plain radiograph.',
    projection: 'Projection overlap at the skull base prevents treating a visible bony edge or the midsagittal prevertebral contour as a labelled rectus capitis lateralis boundary. Its lateral location matters when returning to the 3D view.',
  },
} as const;

export const cervicalProjectionXrayLimitations = [
  'Prevertebral width describes a regional soft-tissue column. Normal ranges depend on vertebral level, population and imaging technique; radiograph measurements must not be transferred directly to CT. No numeric injury threshold is supplied here.',
  'Normal prevertebral thickness does not exclude cervical injury or prove that an individual muscle is intact. Cross-sectional imaging offers different tissue information, but no patient study, mask, guaranteed visibility or imaging recommendation is supplied by this lesson.',
  'Keep separation at zero for anatomical relationships. The reference model is not a simulated X-ray projection, measured attachment map or registered patient scan.',
] as const;
