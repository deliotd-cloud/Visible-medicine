import fs from 'node:fs';import assert from 'node:assert/strict';import {hash} from './seal-simple-website-successor.mjs';
const out='serve-canonical-csp-built-worker-20261025.mjs';assert(!fs.existsSync(out));
let text=fs.readFileSync('serve-built-workers-candidate-20261025.mjs','utf8');
assert(text.includes('20261025-tour-neck-renal-types-website'));text=text.replaceAll('20261025-tour-neck-renal-types-website','20261025-canonical-csp-website');
assert.equal(text.split('04659d023c2fb36b0ee03ae47583aefa31478653abbf7f461759df62d4629fbf').length,2);text=text.replace('04659d023c2fb36b0ee03ae47583aefa31478653abbf7f461759df62d4629fbf','b21223ba0c84a9cf6b56e9a1956a2c13fad03f66353197acde115bc1e0eb0c90');
assert.equal(text.split('20261025-tour-neck-renal-built-workers-preview').length,2);text=text.replace('20261025-tour-neck-renal-built-workers-preview','20261025-canonical-csp-built-workers-preview');
text=text.replaceAll('build-attempt-2','build-attempt-1');fs.writeFileSync(out,text,{flag:'wx'});
console.log(JSON.stringify({recipe:out,sha256:hash(out),sourceSha256:'b21223ba0c84a9cf6b56e9a1956a2c13fad03f66353197acde115bc1e0eb0c90',localOnly:true}));
