import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const once = (text, from, to) => {
  assert.equal(text.split(from).length, 2, `One exact inverse seam: ${from.slice(0, 70)}`);
  return text.replace(from, to);
};
const removeExact = (text, start, end, digest) => {
  const at = text.indexOf(start), after = text.indexOf(end, at + start.length);
  assert(at >= 0 && after > at);
  assert.equal(text.indexOf(start, at + start.length), -1);
  assert.equal(sha(text.slice(at, after)), digest);
  return text.slice(0, at) + text.slice(after);
};
function verify(name, codeSha, rawSha, inverse) {
  const code = readFileSync(new URL(`./CODE/tests/${name}`, import.meta.url));
  const raw = readFileSync(new URL(`./RAW/tests/${name}`, import.meta.url));
  assert.equal(sha(code), codeSha);
  assert.equal(sha(raw), rawSha);
  const text = code.toString('utf8');
  assert.deepEqual(Buffer.from(text), code);
  assert.deepEqual(Buffer.from(inverse(text)), raw);
  console.log(`${name}: exact CODE-to-RAW inverse PASS`);
}
verify('craniofacial-ct-current-delivery.test.mjs',
  '2de47b24e78247eb1aa1d60d5d8763a35a79e3f5cc3ab3e136fef6c726490ecc',
  '5d3b6ce69f3db7e91eacca50c78e76d91dc6f2648f5f8232ca097358dd1c5e92',
  text => once(text, 'assert.equal(inputs.inputs.length,1724);', 'assert.equal(inputs.inputs.length,1723);'));
verify('ui-teaching-lifecycle-contract.test.mjs',
  'b413cc684f0cc899e3fdb578dc747bec6cb2ae85839d03acb2c341aa519b33d2',
  '99eeebea4fd0fe9e0038f31a22752e7ee6c30fcb7cb42f4c194309c08a13d87b',
  text => {
    text = removeExact(text, '// Authenticate the sole current loading count',
      '// The complete historical lifecycle',
      '68e408fc3d40d08daf72bbb929c42723e1a6faaeaee721970e11f60f8026d173');
    text = once(text, 'restoreUiV5Source(priorUi(readFileSync(candidateUrl)))',
      'restoreUiV5Source(readFileSync(candidateUrl))');
    text = once(text,
      " const bytes=readFileSync(candidateUrl);assert.equal(sha(bytes),'8d585dd4af1fa8e5c3ed6256e822cdffa9dbbff0e09428aebeb1bf26961b5ed7');\n const prior=priorUi(bytes);assert.equal(sha(restoreUiV5Source(prior)),candidateSha);\n assert.throws(()=>restoreUiV5Source(Buffer.concat([prior,Buffer.from('\\n// unknown')])));\n assert.throws(()=>priorUi(Buffer.concat([bytes,Buffer.from('\\n// unknown')])));",
      " const bytes=readFileSync(candidateUrl);assert.equal(sha(bytes),'89125a0699029efb7186800ba761ecbe0748c052753424fc02fc36231f5f5913');\n assert.equal(sha(restoreUiV5Source(bytes)),candidateSha);\n assert.throws(()=>restoreUiV5Source(Buffer.concat([bytes,Buffer.from('\\n// unknown')])));");
    return text;
  });
verify('head-disclosure-role-preservation-20261021.test.mjs',
  '92a0e6cb75e50a50a336fa22520e41661dd9feecba2a4e39948bed1ce57bb349',
  '682155eee19af01a2fe3882db9534c2a59a3d77795626c18e8d398f387f3bdb8',
  text => {
    text = removeExact(text, 'const once=', 'function sections(',
      '43efeb15420bf7a765de8ca2fdb9ae078ed4aae4cdd3f13cd351d413f7ffbc02');
    text = once(text, '];\nfunction sections(', '];\n\nfunction sections(');
    text = once(text, 'function verify(whole,archive=original){return verify190(prior190(whole),archive);}\n', '');
    text = once(text, 'function verify190(prior,archive=original){', 'function verify(whole,archive=original){');
    text = once(text, 'const old=sections(archive.toString(),oldStarts),next=sections(prior,newStarts);',
      'const old=sections(archive.toString(),oldStarts),next=sections(whole,newStarts);');
    text = once(text, "assert.equal(forward,prior,'The exact declared replacements forward reconstruct the 190 source');",
      "assert.equal(forward,whole,'The exact declared replacements forward reconstruct the current candidate');");
    text = once(text, ' const historical=prior190(candidate);\n', '');
    text = once(text,
      "]){assert.equal(historical.split(from).length-1,1,from);assert.throws(()=>verify190(historical.replace(from,to)),{code:'ERR_ASSERTION'});}",
      "]){assert.equal(candidate.split(from).length-1,1,from);assert.throws(()=>verify(candidate.replace(from,to)),{code:'ERR_ASSERTION'});}");
    text = once(text,
      " for(const [from,to]of [\n  ['assert.equal(binding.inputs.length,1724)','assert.equal(binding.inputs.length,1709)'],\n  ['525f8fbe122bf6bdc15d8b89f572e49e3ac0ce09cd411b8009f67454d938a163','0'.repeat(64)],\n ]){assert.equal(candidate.split(from).length-1,1,from);assert.throws(()=>verify(candidate.replace(from,to)),{code:'ERR_ASSERTION'});}\n",
      '');
    return text;
  });
