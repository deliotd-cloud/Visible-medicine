import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-inbox-deferred-return';
const parent=json(stage+'/PREPARATION.json'),file=stage+'/website/components/ClinicalReviewInbox.tsx';
const baseline=json(parent.parent.path),row=baseline.sourceRows.find(r=>r.path==='components/ClinicalReviewInbox.tsx');
assert.equal(hash(file),row.sha256);
const before=fs.readFileSync(file,'utf8');let text=before;const operations=[];
function replace(from,to){assert.equal(text.split(from).length,2,from);text=text.replace(from,to);operations.push({from,to});}
replace('  const generation = useRef(0);','  const generation = useRef(0);\n  const pendingReturnScan = useRef<number | null>(null);');
replace('  const run = (restart: boolean, automatic = false) => {\n    generation.current++;','  const run = (restart: boolean, automatic = false) => {\n    pendingReturnScan.current = null;\n    generation.current++;');
replace('              } else publish(snapshot);\n            }\n            return;',`              } else publish(snapshot);
            }
            // A return while pages were loading must not cancel that scan, but
            // its earlier pages may predate a decision made in another tab.
            // Consume one generation-bound request only after valid completion.
            if (pendingReturnScan.current === id) {
              pendingReturnScan.current = null;
              if (mounted.current && current.current.phase === 'complete' && viewActive() &&
                  (typeof document === 'undefined' || document.visibilityState !== 'hidden')) loadOnMount.current(true, true);
            }
            return;`);
replace('      } catch (error) {\n        if (id !== generation.current || abort.signal.aborted) return;\n        controller.current = null;', '      } catch (error) {\n        if (id !== generation.current || abort.signal.aborted) return;\n        pendingReturnScan.current = null;\n        controller.current = null;');
replace("      if (mounted.current && current.current.phase === 'complete' && !controller.current && viewActive()) loadOnMount.current(true, true);",`      if (!mounted.current || !viewActive()) return;
      if (current.current.phase === 'complete' && !controller.current) loadOnMount.current(true, true);
      else if (current.current.phase === 'loading' && controller.current) pendingReturnScan.current = generation.current;`);
replace('return () => { active = false; mounted.current = false; window.removeEventListener', 'return () => { active = false; mounted.current = false; pendingReturnScan.current = null; window.removeEventListener');
replace('  const pause = () => {\n    generation.current++;','  const pause = () => {\n    pendingReturnScan.current = null;\n    generation.current++;');
let inverse=text;for(const{from,to}of [...operations].reverse())inverse=inverse.replace(to,from);assert.equal(inverse,before);
fs.writeFileSync(file,text);
fs.writeFileSync(stage+'/COMPONENT_CHANGE.json',JSON.stringify({at:new Date().toISOString(),file,beforeSha256:row.sha256,afterSha256:hash(file),operations,byteExactInverse:true,scope:'One deferred read-only return refresh after valid completion; unchanged access, account, revision, pause and failure gates.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({file,sha256:hash(file),operations:operations.length}));
