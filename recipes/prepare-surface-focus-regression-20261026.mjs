import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {hash,json} from './bounded-source-hash-20261026.mjs';
const root='F:/VisibleMedicine/staging/20261026-surface-focus-regression',parentFile='F:/VisibleMedicine/staging/20261026-quick-check-website/SOURCE_CANDIDATE.json',parent=json(parentFile),file='tests/head-surface-context-recovery.test.ts';assert.equal(hash(parentFile),'96a22c10dbee0b319bc05feca46e2bf6400f97c6998c0c91830b6016b0fa3f15');assert(!fs.existsSync(root));fs.mkdirSync(root);fs.mkdirSync(root+'/tests');fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),root+'/node_modules','junction');const before=fs.readFileSync(parent.website+'/'+file,'utf8'),extra=`
test('retry preserves a later focus choice while the replacement renderer opens',()=>{
 const h=harness();try{h.flush(sample());h.lose();const retry=h.retry();assert(retry);h.dom(retry).focus();retry.props.onClick();const outside={kind:'independent-control'};h.document.activeElement=outside;h.flush();assert.equal(h.alert(),undefined);assert.equal(h.document.activeElement,outside);}finally{h.dispose();}
});
test('automatic restoration preserves a later focus choice before its commit',()=>{
 const h=harness();try{h.flush(sample());h.lose();const retry=h.retry();assert(retry);h.dom(retry).focus();h.renderer.lost=false;h.renderer.canvas.emit('webglcontextrestored');const outside={kind:'independent-control'};h.document.activeElement=outside;h.flush();assert.equal(h.alert(),undefined);assert.equal(h.document.activeElement,outside);}finally{h.dispose();}
});
test('a hidden document does not receive recovery focus',()=>{
 const h=harness();try{h.flush(sample());h.lose();const retry=h.retry();assert(retry);const origin=h.dom(retry);origin.focus();(h.document as any).hidden=true;h.restore();assert.equal(h.document.activeElement,origin);}finally{h.dispose();}
});
`;
fs.writeFileSync(root+'/'+file,before+extra,{flag:'wx'});fs.writeFileSync(root+'/PROVENANCE.json',JSON.stringify({parent:{path:parentFile,sha256:hash(parentFile)},sourceRoot:parent.website,original:{path:parent.website+'/'+file,sha256:hash(parent.website+'/'+file),bytes:Buffer.byteLength(before)},test:{path:root+'/'+file,sha256:hash(root+'/'+file)},originalWholeRootPrefixExact:true,additiveCases:3,sourceChanged:false},null,2)+'\n',{flag:'wx'});assert.equal(fs.readFileSync(root+'/'+file,'utf8').slice(0,before.length),before);console.log(JSON.stringify({root,test:root+'/'+file,extraCases:3}));
