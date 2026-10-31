import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const root = 'F:/VisibleMedicine/atlas';
const out = 'G:/VisibleMedicine-temp/proposals/20261031-neonatal-lobar-us';
const file = 'content/cerebral-lobar-imaging.ts';
const before = fs.readFileSync(root + '/' + file, 'utf8');
const sha = text => createHash('sha256').update(text).digest('hex');
let after = before;
const marker = 'export const cerebralLobarReferences = {\n';
const normalized = before.replaceAll('\r\n', '\n');
assert(normalized.includes(marker));
after = normalized.replace(marker, marker + `  cerebralNeonatalUS: {
    title: 'Gonçalves and Hwang · Superficial anatomy of the neonatal cerebrum: an ultrasonographic roadmap (2021)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/33026469/',
  },
  cerebralNeonatalUSWindow: {
    title: 'EFSUMB / ECMUS · Neonatal cranial ultrasound: Safety Aspects (2022), pp. 1–3',
    url: 'https://efsumb.org/wp-content/uploads/2022/03/neonatal_cranial_ultrasound_safety_aspects_update2022_final.pdf',
  },
`);
const additions = {
  frontal: 'Neonatal orientation: through an open anterior fontanelle, compare coronal and sagittal views. Where the central sulcus is visible, the precentral gyrus lies immediately in front of it. The sulcus may be absent from a more anterior orbitofrontal image; one frame cannot establish the entire lobe. Visibility depends on the window and technique. This grouped 3D surface is not a neonatal segmentation, a complete frontal lobe or a registered ultrasound image.',
  parietal: 'Neonatal orientation: a coronal view towards the vertex through the anterior fontanelle can show the postcentral gyrus behind the central sulcus. The marginal branch of the cingulate sulcus is a nearby landmark that can help locate that sulcus. This does not delineate every parietal boundary; the superficial convexity can be difficult to assess. The grouped 3D surface is not a neonatal segmentation, a complete parietal lobe or a registered ultrasound image.',
};
for (const [lobe, body] of Object.entries(additions)) {
  const point = `  ${lobe}: {\n`;
  assert.equal(after.split(point).length, 2);
  after = after.replace(point, point + `    ultrasound: draft(\n      '${body}',\n      'cerebralNeonatalUS', 'cerebralNeonatalUSWindow',\n    ),\n`);
}
// Keep the original newline convention; no unrelated content normalization.
if (before.includes('\r\n')) after = after.replaceAll('\n', '\r\n');
fs.mkdirSync(out + '/content', { recursive: true });
fs.writeFileSync(out + '/' + file, after, { flag: 'wx' });
fs.writeFileSync(out + '/CHANGE.json', JSON.stringify({ baseline: root, head: 'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3', file, beforeSha256: sha(before), afterSha256: sha(after), canonicalModified: false, clinicalApproval: false }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ file, beforeSha256: sha(before), afterSha256: sha(after), paragraphs: 2, canonicalModified: false }));
