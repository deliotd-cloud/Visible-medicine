import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { localPreviewServerOptions } from '../scripts/local-preview-policy.mjs';

test('normal development and Seatbelt behavior remain unchanged', () => {
  for (const stable of [undefined, '', '0']) {
    assert.equal(localPreviewServerOptions({command:'serve', stable}), undefined);
    assert.deepEqual(localPreviewServerOptions({command:'serve', stable, seatbelt:true}),
      {watch:{useFsEvents:false, usePolling:true}});
  }
});

test('manual-reload opt-in disables file watching without broadening the server address', () => {
  for (const seatbelt of [true, false]) assert.deepEqual(
    localPreviewServerOptions({command:'serve', stable:'1', seatbelt}),
    {host:'127.0.0.1', strictPort:true, watch:null, hmr:false});
});

test('builds ignore the local flag and no environment object is modified', () => {
  const input=Object.freeze({command:'build', stable:'1', seatbelt:true});
  assert.equal(localPreviewServerOptions(input), undefined);
  assert.equal(localPreviewServerOptions({command:'build', stable:'invalid'}), undefined);
  assert.deepEqual(input,{command:'build', stable:'1', seatbelt:true});
});

test('malformed opt-ins are refused and fresh returned objects cannot alter later settings', () => {
  for (const stable of ['true','false','yes',' 1','1 ',1,null]) assert.throws(
    ()=>localPreviewServerOptions({command:'serve', stable}), /VM_LOCAL_PREVIEW_STABLE/);
  const first=localPreviewServerOptions({command:'serve',stable:'1'});
  first.host='0.0.0.0'; first.watch={};
  assert.deepEqual(localPreviewServerOptions({command:'serve',stable:'1'}),
    {host:'127.0.0.1',strictPort:true,watch:null,hmr:false});
});

test('launcher refuses caller overrides before starting Vinext', () => {
  const launcher=fileURLToPath(new URL('../scripts/start-stable-preview.mjs',import.meta.url));
  for (const args of [['--host','0.0.0.0'],['--port','3001'],['--help']]) {
    const result=spawnSync(process.execPath,[launcher,...args],{encoding:'utf8',windowsHide:true,timeout:5000});
    assert.equal(result.status,1); assert.match(result.stderr,/accepts no overrides/);
    assert.doesNotMatch(result.stdout,/vinext dev/);
  }
});

test('launcher refuses another working directory before starting Vinext', () => {
  const launcher=fileURLToPath(new URL('../scripts/start-stable-preview.mjs',import.meta.url));
  const result=spawnSync(process.execPath,[launcher],{cwd:fileURLToPath(new URL('../scripts',import.meta.url)),
    encoding:'utf8',windowsHide:true,timeout:5000});
  assert.equal(result.status,1); assert.match(result.stderr,/website checkout/);
  assert.doesNotMatch(result.stdout,/vinext dev/);
});

test('website config uses the tested development policy and retains real plugins', () => {
  const config=readFileSync(new URL('../vite.config.ts',import.meta.url),'utf8');
  assert.match(config,/server: localPreviewServerOptions\(\{command, stable: process\.env\.VM_LOCAL_PREVIEW_STABLE,/);
  for(const plugin of ['localHeadAtlasPlugin(','localRegionalMriReviewPlugin(','vinext(),','sites(),','cloudflare({'])
    assert.ok(config.includes(plugin),plugin);
});

test('launcher imports a file URL rather than a Windows drive-letter specifier', () => {
  const launcher=readFileSync(new URL('../scripts/start-stable-preview.mjs',import.meta.url),'utf8');
  assert.match(launcher,/const cliUrl = new URL\('\.\.\/node_modules\/vinext\/dist\/cli\.js', import\.meta\.url\);/);
  assert.match(launcher,/await import\(cliUrl\);/);
  assert.doesNotMatch(launcher,/await import\(cli\);/);
});
