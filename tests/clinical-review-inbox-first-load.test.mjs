import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import {build} from 'esbuild';
import React from 'react';
import {renderToString} from 'react-dom/server';

const require = createRequire(import.meta.url);
const built = await build({stdin:{contents:"export {ClinicalReviewInbox} from './components/ClinicalReviewInbox';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',packages:'external',loader:{'.css':'empty'}});
const scope = {exports:{}};
runInNewContext(built.outputFiles[0].text,{module:scope,exports:scope.exports,require});

test('the server-rendered inbox promises automatic loading instead of an empty queue or inert load button',()=>{
  const html = renderToString(React.createElement(scope.exports.ClinicalReviewInbox));
  assert.match(html,/Your review queue will load automatically/);
  assert.match(html,/Preparing reviews/);
  assert.match(html,/aria-busy="true"/);
  assert.match(html,/You can start as soon as the first worksheets appear/);
  assert.doesNotMatch(html,/Statuses have not been loaded|Load all review statuses|0.*?matching.*?worksheets|<select|<input/);
  assert.match(html,/<noscript>/);
  assert.match(html,/Browse review areas/);
  assert.match(html,/href="\/workspace\/atlas-review"/);
});
