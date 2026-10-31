import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/staging/20261031-neonatal-lobar-atlas';
let source=fs.readFileSync(root+'/validate.mjs','utf8');
assert(source.includes("['--max-old-space-size=384',...args]"));
source=source.replace("['--max-old-space-size=384',...args]","['--max-old-space-size=384','--import','tsx',...args]")
 .replace("root+'/CHECK-'","root+'/CHECK-TSX-'").replace("root+'/VALIDATION.json'","root+'/VALIDATION-TSX.json'")
 .replace('const result={at,passed,results,changed,','const result={at,passed,runtimeLoader:"tsx (existing dependency; native Node extensionless TS resolution failed before assertions)",results,changed,');
fs.writeFileSync(root+'/validate-tsx.mjs',source,{flag:'wx'});
