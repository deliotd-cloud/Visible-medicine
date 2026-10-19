// Exact admitted BodyParts3D v4 surfaces. Group membership follows the cited
// anatomy tables; it does not assert that these mesh endpoints join.
const targets = [
  ['right-frontal-nerve', 'FMA52639', 'right', 'FJ1341', '1d9f4f0ed3196ceb32439608452ef9849f631e1adce9920a6e31bc517bf2f714'],
  ['left-frontal-nerve', 'FMA52640', 'left', 'FJ1290', '66c53668aa92b73c55ce5fcfe6476e6665eedf923c8ea02290cdf3456296e0e9'],
  ['right-supra-orbital-nerve', 'FMA52656', 'right', 'FJ1376', '18a71e5cefbb6c68e1daf6147fedfa0943ee3044725ea7eccbe5ca62db4c15e4'],
  ['left-supra-orbital-nerve', 'FMA52657', 'left', 'FJ1325', 'c37ecf086b1049ac3b8acbd0b50ac5eb4c14a58e3a7c56b9d952f463b183853a'],
  ['right-supratrochlear-nerve', 'FMA52643', 'right', 'FJ1377', 'd11bfb0864f689cc996e2e41c91ce975e3c1dee33c947e2668cce82c03c663d2'],
  ['left-supratrochlear-nerve', 'FMA52644', 'left', 'FJ1326', 'f8a3b51c6408d43a35ccf8a773e4bdd5b5872d562402a9834c34c5dc0b3d9c25'],
  ['right-lacrimal-nerve', 'FMA52629', 'right', 'FJ1351', '0e563e908e3c1e6ea08e3233e8e90c37b6fd029b165a0e6c41d37f985b538f22'],
  ['left-lacrimal-nerve', 'FMA52630', 'left', 'FJ1300', '4922693d563eaa50f8b0b0f7547dce8fd265fc40de5414b83020e5b302cecd0a'],
  ['right-nasociliary-nerve', 'FMA52669', 'right', 'FJ1361', 'f399ec1e5dd080357ba1bdde33393932e400f76567cf9c9c2392430600f99059'],
  ['left-nasociliary-nerve', 'FMA52670', 'left', 'FJ1310', 'c6f00f35feecee6f75646ac7a5461f03ee6ca89e55158c9574fbf5663270df77'],
  ['right-anterior-ethmoidal-nerve', 'FMA52676', 'right', 'FJ1333', '125af43b25653f04d3c1efcb0ae71cc19da9b13dd305ff443881bcc1fbec138f'],
  ['left-anterior-ethmoidal-nerve', 'FMA52677', 'left', 'FJ1283', 'b75bf29e8ccea444f1a0ccd694c9f7fdbc7ad8d0cace68f60be489024e647af9'],
  ['right-posterior-ethmoidal-nerve', 'FMA52715', 'right', 'FJ1366', 'f57d8678d7c047eff9a104ece72c3e0391909fef1f895679bb37ffb7a88dbb00'],
  ['left-posterior-ethmoidal-nerve', 'FMA52716', 'left', 'FJ1315', '5d9a0810f0345ba52ca1680d132e0e63021af48a691e6abd1a137c898f78134e'],
  ['right-infratrochlear-nerve', 'FMA52698', 'right', 'FJ1347', '01773f3e0da8b9564817531e2aba0d85f97a9da6d1e20b593b44c14ded8281ac'],
  ['left-infratrochlear-nerve', 'FMA52699', 'left', 'FJ1296', 'd209c170330a18a2f1065be1bd0acacc034ea30a46e19a9bf0946fa12eece412'],
  ['right-long-ciliary-nerve', 'FMA82734', 'right', 'FJ1369', 'a3e9a8f15fcd4b9ed6bb12ca2fa984b971ecb9e090b832effc8e108537871917'],
  ['left-long-ciliary-nerve', 'FMA82735', 'left', 'FJ1318', '41dd32800ddf73a2dabd9dc2556766d2fea99a593793a98879985bc926b89c7b'],
  ['communicating-branch-of-right-nasociliary-nerve-with-right-ciliary-ganglion', 'FMA52673', 'right', 'FJ1362', 'e9055e3812268376fcb1d0dc51e212e3c1b5b506947abde5d9d2a1de61516970'],
  ['communicating-branch-of-left-nasociliary-nerve-with-left-ciliary-ganglion', 'FMA52674', 'left', 'FJ1311', '9511e0d9b9f66f61538766c053cb26c0a1aab37c15b01e5b6269c00a9047647d'],
] as const;

const context = [
  ['right-lacrimal-gland', 'FMA59102', 'right', 'organ', 'head-neck-organs-gaps', 'FJ1350', 'ff108bfd00a1a4dc0eebfa62c8553b1ca94d7003d18437e7d637566db433f604'],
  ['left-lacrimal-gland', 'FMA59103', 'left', 'organ', 'head-neck-organs-gaps', 'FJ1299', '4249d4bed4b176bb504a756ebffca8ea5b96268e6f57b000206c81ead66674d8'],
  ['right-ciliary-ganglion', 'FMA53549', 'right', 'organ', 'head-neck-nerves-inventory', 'FJ1339', 'de1f5bc0af45dc52a70d8e2d647f509b3ff0072ae504ab95483e9c1662195076'],
  ['left-ciliary-ganglion', 'FMA53550', 'left', 'organ', 'head-neck-nerves-inventory', 'FJ1288', 'c362a3813e882588d31710138ce6e180c2d0dd32e9755a0f53452a82657371e0'],
] as const;

export const ophthalmicNerveTargetBindings = targets.map(([slug, fmaId, laterality, file, sha256]) => ({
  id: `vm:anatomy:body:head-neck:${laterality}:nerve:${slug}`,
  fmaId, laterality, bundle: 'head-neck-nerves', nodeName: fmaId,
  sources: [{ file, sha256 }],
}));
export const ophthalmicNerveContextBindings = context.map(([slug, fmaId, laterality, category, bundle, file, sha256]) => ({
  id: `vm:anatomy:body:head-neck:${laterality}:${category}:${slug}`,
  fmaId, laterality, bundle, nodeName: fmaId,
  sources: [{ file, sha256 }],
}));

const fmas = (start: number, end: number) => ophthalmicNerveTargetBindings.slice(start, end).map(b => b.fmaId);
const contextFmas = (start: number, end: number) => ophthalmicNerveContextBindings.slice(start, end).map(b => b.fmaId);
const inspect = 'Choose Both, Left or Right. Select a source surface, Remove it and Undo to restore it; return separation to 0% before comparing source positions. This conventional V1 grouping does not prove a complete CN V, branch continuity, sensory function, patient registration or clinical approval. Source relationships await revision-bound radiologist review.';
export const ophthalmicNerveStudies = [
  {
    id: 'v1-frontal-lacrimal-subset', title: 'V1 · frontal & lacrimal source subset',
    targetFmaIds: fmas(0, 8), contextFmaIds: contextFmas(0, 2), view: 'superior',
    description: 'Compare the source-labelled frontal, supra-orbital, supratrochlear and lacrimal nerves with the lacrimal glands as separate orbital context. These surfaces do not establish branch continuity or sensory territories.',
    inspect,
  },
  {
    id: 'v1-nasociliary-subset', title: 'V1 · nasociliary source subset',
    targetFmaIds: fmas(8, 20), contextFmaIds: contextFmas(2, 4), view: 'superior',
    description: 'Compare the source-labelled nasociliary, ethmoidal, infratrochlear, long ciliary and ciliary-ganglion communicating branches. The paired ciliary ganglia are context, not proof of a connected or functioning pathway.',
    inspect,
  },
] as const;

export const ophthalmicNerveReferences = [
  'https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html',
  'https://anatomy.ttuhscep.edu/nervous_system/eye.html',
];
