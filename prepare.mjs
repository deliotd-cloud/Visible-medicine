import fs from 'node:fs';
import assert from 'node:assert/strict';
const own='G:/VisibleMedicine-temp/proposals/20261101-renal-learner-checks';
const old='G:/VisibleMedicine-temp/proposals/20261101-hepatic-learner-checks';
const substitutions=text=>text
 .replaceAll('20261101-hepatic-learner-checks','20261101-renal-learner-checks')
 .replaceAll('20261101-regional-teaching-types','20261101-hepatic-native-integration')
 .replaceAll('20261101-hepatic-vascular-xray','20261101-renal-venous-xray')
 .replaceAll("['content/nested-teaching.ts','content/hepatic-teaching.ts','content/hepatic-vascular-xray.ts']","['content/renal-teaching.ts','content/renal-venous-xray.ts']")
 .replaceAll("['content/hepatic-teaching.ts','content/hepatic-vascular-xray.ts','content/nested-teaching.ts']","['content/renal-teaching.ts','content/renal-venous-xray.ts']")
 .replaceAll('hepatic-arterial','renal-veins').replaceAll('hepatic-portal','renal-suprarenal-veins')
 .replaceAll('hepatic-venous-tributary','renal-inferior-suprarenal-artery');
const render=substitutions(fs.readFileSync(old+'/render.mjs','utf8'));
let tests=substitutions(fs.readFileSync(old+'/verify.test.mjs','utf8'));
tests=tests.replace("    assert.equal(row.lesson.citations.length, 1);\n    const url = row.conceptId === 'renal-veins' ? 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8415139/' : 'https://pubs.rsna.org/radiology/doi/10.1148/rg.220020';\n    assert.deepEqual(row.lesson.citations, [url]);\n    assert.ok(row.html.includes(`<a href=\"${url}\" target=\"_blank\" rel=\"noreferrer\">`));", "    const urls = row.conceptId === 'renal-veins'\n      ? ['https://pubmed.ncbi.nlm.nih.gov/9888735/']\n      : ['https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0279552','https://creativecommons.org/licenses/by/4.0/'];\n    assert.deepEqual(row.lesson.citations, urls);\n    for(const url of urls) assert.ok(row.html.includes(`<a href=\"${escape(url)}\" target=\"_blank\" rel=\"noreferrer\">`));");
tests=tests.replace('the unsupported hepatic tributary retains all prior rendered output and pending status','the unchanged arterial selection retains all prior rendered output and pending X-ray status');
assert(!tests.includes('hepatic tributary'));assert(!tests.includes('PMC8415139'));assert(!tests.includes('rg.220020'));
for(const [name,bytes]of [['render.mjs',render],['verify.test.mjs',tests]])fs.writeFileSync(own+'/'+name,bytes,{flag:'wx'});
fs.mkdirSync(own+'/evidence');console.log('Prepared actual React learner rendering and six focused assertions.');
