import fs from 'node:fs';import assert from 'node:assert/strict';
const site='G:/VisibleMedicine-temp/staging/20261031-release21-final/website',root='G:/VisibleMedicine-temp/proposals/20261031-release23-main';
let source=fs.readFileSync(site+'/tests/fixtures/local-reference-entry-before/clinical-review-inbox-ui.test.mjs.raw','utf8');
for(const [before,after]of [["links.map(link => link.props.href), ['","links.map(link => link.props.href), ['/workspace/clinical-review-inbox/local-reference', '"],["links.map(link => words(link)), ['","links.map(link => words(link)), ['Local reference inspection · choose a held packet folder ↗', '"]]){assert.equal(source.split(before).length,2);source=source.replace(before,after);}
fs.writeFileSync(root+'/INBOX_AT_LOCAL_REFERENCE.mjs.raw',source,{flag:'wx'});
