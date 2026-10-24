// Bounded read-only TAP observation. No graph/build, process or preview changes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {StringDecoder} from 'node:string_decoder';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export function failureCollector() {
  const failures = [];
  let current, closed = false;
  const flush = () => { if (current) failures.push(current); current = undefined; };
  return {
    line(line) {
      if (/^not ok \d+ - /.test(line)) {
        flush(); closed = false;
        current = {title:line.replace(/^not ok \d+ - /,''), location:null, root:null,
          errorCode:null, error:null, differences:[]};
        return;
      }
      if (!current || closed) return;
      if (/^  \.\.\.\s*$/.test(line)) { closed = true; return; }
      if (current.location === null) {
        const location = line.match(/^  location: (.*)$/m)?.[1];
        if (location !== undefined) {
          current.location = location;
          current.root = location.match(/tests(?:\\\\|\\|\/)([^'\n]+?\.test\.(?:mjs|ts))/)?.[1] ?? null;
        }
      }
      for (const [field, pattern] of [['errorCode', /^  code: (.*)$/m], ['error', /^  error: (.*)$/m]])
        if (current[field] === null) current[field] = line.match(pattern)?.[1] ?? null;
      const difference = line.match(/^    [+-].*$/m)?.[0];
      if (current.differences.length < 12 && difference !== undefined) current.differences.push(difference);
    },
    finish() { flush(); return failures; },
  };
}

// Read only the byte prefix present at admission, even while the runner appends.
export async function observeTap(file) {
  const before = fs.statSync(file); assert(before.isFile());
  const hash = createHash('sha256'), decoder = new StringDecoder('utf8');
  const collector = failureCollector();
  let buffered = '', readBytes = 0, maximumBufferedLine = 0;
  const lineLimit = 4 * 1024 * 1024;
  const consume = text => {
    buffered += text;
    let end;
    while ((end = buffered.indexOf('\n')) !== -1) {
      assert(end <= lineLimit, 'Oversized TAP line requires explicit separate review; not truncated');
      maximumBufferedLine = Math.max(maximumBufferedLine, end);
      collector.line(buffered.slice(0,end)); buffered = buffered.slice(end+1);
    }
    assert(buffered.length <= lineLimit, 'Oversized TAP line requires explicit separate review; not truncated');
  };
  if (before.size) for await (const chunk of fs.createReadStream(file, {start:0,end:before.size-1,highWaterMark:64*1024})) {
    hash.update(chunk); readBytes += chunk.length; consume(decoder.write(chunk));
  }
  consume(decoder.end());
  if (buffered) collector.line(buffered);
  assert.equal(readBytes,before.size,'The admitted TAP prefix was not completely read');
  return {file, prefixBytes:readBytes, prefixSha256:hash.digest('hex'),
    maximumBufferedLine, endsWithCompleteLine:!buffered,
    failures:collector.finish(), terminalCoverageClaim:false};
}

export async function inventory() {
  const root = 'F:/VisibleMedicine/staging/20261024-pancreatic-us-release-diagnostic';
  const json = file => JSON.parse(fs.readFileSync(file));
  const started = json(root+'/run/STARTED.json');
  assert.equal(started.runnerPid,372448);
  assert.equal(started.sourceSha256,'cf587b88877f0a51b082e1ac039792938ccd6f0a6272a958669651a651b22a8e');
  const output = started.website+'/.local/website-test-runs/2026-10-24T15-40-59-490Z-b7dd27f0-7267-4428-8e8c-c0a5be7715d8';
  assert.equal(json(output+'/started.json').runnerPid,started.runnerPid);
  const terminalAtStart = fs.existsSync(root+'/TERMINAL.json');
  const oldTerminal = json('F:/VisibleMedicine/staging/20261022-release-diagnostic-successor/complete-release-run/TERMINAL.json');
  const oldStock = json(oldTerminal.stockReceipt);
  const old = await observeTap(oldStock.output+'/child.tap');
  const current = await observeTap(output+'/child.tap');
  const oldTitles = new Set(old.failures.map(row=>row.title));
  for (const row of current.failures) row.titleAlsoFailedInOldDiagnostic = oldTitles.has(row.title);
  const grouped = Object.groupBy(current.failures,row=>row.root ?? '(unresolved)');
  const at = new Date().toISOString();
  const folder = root+'/failure-inventories/'+at.replace(/[:.]/g,'-')+'-streaming';
  const evidence = {at,sourceReceipt:started.sourcePath,sourceReceiptSha256:started.sourceSha256,
    terminalAtStart, current, old:{file:old.file,prefixBytes:old.prefixBytes,prefixSha256:old.prefixSha256,failures:old.failures.length},
    observedFailureEntries:current.failures.length, observedFailedRoots:Object.keys(grouped).length,
    passingClaim:false,previewChanged:false,
    limits:'Observed complete byte prefix, not whole-run coverage or pass. A partial final failure may be incomplete. Historical title matches alone do not establish identical causes. No giant whole-file string or block copies; oversized lines fail explicitly.'};
  fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(folder+'/inventory.json',JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
  return {evidence:folder+'/inventory.json',terminalAtStart,
    prefixBytes:current.prefixBytes, observedFailureEntries:current.failures.length,
    observedFailedRoots:Object.keys(grouped).length,
    roots:Object.fromEntries(Object.entries(grouped).map(([key,rows])=>[key,rows.length])), passingClaim:false};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  console.log(JSON.stringify(await inventory()));
