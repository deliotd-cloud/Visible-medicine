import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const baseline = 'F:/VisibleMedicine/staging/20261024-pancreatic-us-website/website/tests/ae84-metadata-closure.test.mjs';
const baselineHash = '02d0cc1f9669995e5e2f71302a571d24a848a8e8a0a1fe9e46c4640c9a203755';
const ownRoot = dirname(fileURLToPath(import.meta.url));
const produced = join(ownRoot, 'tests/ae84-metadata-closure.test.mjs');

const seams = [
 ["import {createHash} from 'node:crypto';\r\n", "import {createHash} from 'node:crypto';\r\nimport {pathToFileURL} from 'node:url';\r\nimport {join} from 'node:path';\r\n"],
 ["const historical=p=>historicalReviewAe84Read(p,read);\r\n", `const historicalValidatorPath='F:/VisibleMedicine/staging/20261023-ae84-metadata-closure/website/tests/current-atlas-delivery.mjs';\r
assert.equal(sha(readFileSync(historicalValidatorPath)),'52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5','Historical validator source changed');\r
const {validateCurrentAtlasDelivery:validateHistoricalAe84Delivery}=await import(pathToFileURL(historicalValidatorPath).href);\r
const historicalReceiptPath='F:/VisibleMedicine/staging/20261022-release-diagnostic-successor/SOURCE.json';\r
const historicalReceiptBytes=readFileSync(historicalReceiptPath);\r
assert.equal(sha(historicalReceiptBytes),'65d2838d513a79ecbf5f9a7eb085354c34b6ebfe0d584c445922eda8e2574522','Historical source receipt changed');\r
const historicalReceipt=JSON.parse(historicalReceiptBytes);\r
assert.equal(historicalReceipt.website,'F:/VisibleMedicine/staging/20261022-release-diagnostic-successor/website');\r
const historicalPin=historicalReviewAe84Pin(read);\r
const historicalRuntimePaths=['shoulder','lower-limb','female-pelvis'].flatMap(name=>['manifest.json','source-inputs.json'].map(file=>\`public/atlas-runtime/\${name}/\${file}\`));\r
const historicalRuntimeRows=new Map(historicalRuntimePaths.map(p=>{\r
 const rows=historicalReceipt.sourceRows.filter(row=>row.path===p);\r
 assert.equal(rows.length,1,'Exactly one old source row: '+p);\r
 assert.equal(rows[0].sha256,historicalPin.documents[p],'Receipt and ae84 pin agree: '+p);\r
 return [p,rows[0]];\r
}));\r
const historicalLive=p=>{\r
 const row=historicalRuntimeRows.get(p);if(!row)return read(p);\r
 const bytes=readFileSync(join(historicalReceipt.website,p));\r
 assert.equal(bytes.length,row.bytes,'Old source byte length: '+p);\r
 assert.equal(sha(bytes),row.sha256,'Old source row hash: '+p);\r
 assert.equal(sha(bytes),historicalPin.documents[p],'Ae84 pin document hash: '+p);\r
 return bytes;\r
};\r
const historical=p=>historicalReviewAe84Read(p,historicalLive);\r
`],
 ["const packet=validateCurrentAtlasDelivery({pin,read:p=>{seen.push(p);return historical(p);}});", "const packet=validateHistoricalAe84Delivery({pin,read:p=>{seen.push(p);return historical(p);}});"],
 ["assert.throws(()=>validateCurrentAtlasDelivery({pin:old}),/Current delivery changed/);", "assert.throws(()=>validateCurrentAtlasDelivery({pin:old}),error=>error?.code==='ERR_ASSERTION'&&error.actual===46&&error.expected===54);"]
];

function replaceOne(text, from, to) {
 assert.equal(text.split(from).length,2,'Expected unique transform seam');
 return text.replace(from,to);
}

export function applyRepair(input) {
 assert.equal(sha(input),baselineHash,'Wrong epoch or changed baseline');
 let text=input.toString('utf8');
 for(const [from,to] of seams)text=replaceOne(text,from.replaceAll('\r\n','\n'),to.replaceAll('\r\n','\n'));
 return Buffer.from(text,'utf8');
}

const expectedProducedHash=sha(applyRepair(readFileSync(baseline)));

export function restoreRepair(input) {
 assert.equal(sha(input),expectedProducedHash,'Changed or appended transformed test');
 let text=input.toString('utf8');
 for(const [from,to] of [...seams].reverse())text=replaceOne(text,to.replaceAll('\r\n','\n'),from.replaceAll('\r\n','\n'));
 const restored=Buffer.from(text,'utf8');
 assert.equal(sha(restored),baselineHash,'Inverse did not recover exact baseline');
 return restored;
}

export const contract=Object.freeze({baseline,baselineHash,produced,producedHash:expectedProducedHash});

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const bytes=applyRepair(readFileSync(baseline));
 assert.deepEqual(restoreRepair(bytes),readFileSync(baseline));
 mkdirSync(dirname(produced),{recursive:true});
 writeFileSync(produced,bytes,{flag:'wx'});
}
export const replacementSeams = seams.map(([a,b])=>[a.replaceAll('\r\n','\n'),b.replaceAll('\r\n','\n')]);
