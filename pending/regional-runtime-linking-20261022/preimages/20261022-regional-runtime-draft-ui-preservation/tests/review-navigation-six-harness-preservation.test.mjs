import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const changes=[
  {
    "path": "tests/head-ct-bone-decision-form.test.ts",
    "preimageSha256": "a8d635dc874acf3e7b328f0cbc4992a6943272c6add1770f406278af7ac9b080",
    "proposedSha256": "28606bdbeaf7d55a7a974c3d6d1d2c01192102c9a3fceebeb7791e851c99b08c",
    "fixture": "tests/fixtures/review-navigation-six-harness-originals/head-ct-bone-decision-form.test.ts.raw",
    "fixtureSha256": "a8d635dc874acf3e7b328f0cbc4992a6943272c6add1770f406278af7ac9b080",
    "seams": [
      {
        "from": "import {readFileSync} from 'node:fs';",
        "to": "import {readFileSync} from 'node:fs';\nimport * as navigationGuard from '../lib/clinical-review-navigation-guard.ts';"
      },
      {
        "from": "const load=(id:string)=>",
        "to": "const load=(id:string)=>id==='../lib/clinical-review-navigation-guard'?navigationGuard:"
      },
      {
        "from": "  const oldWindow=",
        "to": " const oldNavigationDocument=Object.getOwnPropertyDescriptor(globalThis,'document');\n const navigationListeners=new Set<Function>();\n const navigationDocument={\n  defaultView:{location:{href:'https://visiblemedicine.test/atlas/head-learning?mode=review'},confirm(){throw Error('No synthetic navigation was dispatched');}},\n  addEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(!navigationListeners.has(listener));navigationListeners.add(listener);},\n  removeEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(navigationListeners.delete(listener),'registered navigation listener removed');},\n };\n (globalThis as any).document=navigationDocument;\n  const oldWindow="
      },
      {
        "from": "(globalThis as any).window=oldWindow;",
        "to": "(globalThis as any).window=oldWindow;assert.equal(navigationListeners.size,0,'navigation listener cleaned up on unmount');if(oldNavigationDocument)Object.defineProperty(globalThis,'document',oldNavigationDocument);else delete (globalThis as any).document;"
      }
    ]
  },
  {
    "path": "tests/head-ct-bone-teaching-decision-form.test.ts",
    "preimageSha256": "4518acca04fbe4dcce5720442bb1a295e8d18df66de0996950b49fdcf73021e8",
    "proposedSha256": "824610ad0c17af829be8751c2dbfcb5d732d8ec09834829b25bd27760e7abdd7",
    "fixture": "tests/fixtures/review-navigation-six-harness-originals/head-ct-bone-teaching-decision-form.test.ts.raw",
    "fixtureSha256": "4518acca04fbe4dcce5720442bb1a295e8d18df66de0996950b49fdcf73021e8",
    "seams": [
      {
        "from": "import {readFileSync} from 'node:fs';",
        "to": "import {readFileSync} from 'node:fs';\nimport * as navigationGuard from '../lib/clinical-review-navigation-guard.ts';"
      },
      {
        "from": "const load=(id:string)=>",
        "to": "const load=(id:string)=>id==='../lib/clinical-review-navigation-guard'?navigationGuard:"
      },
      {
        "from": "  const oldWindow=",
        "to": " const oldNavigationDocument=Object.getOwnPropertyDescriptor(globalThis,'document');\n const navigationListeners=new Set<Function>();\n const navigationDocument={\n  defaultView:{location:{href:'https://visiblemedicine.test/atlas/head-learning?mode=review'},confirm(){throw Error('No synthetic navigation was dispatched');}},\n  addEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(!navigationListeners.has(listener));navigationListeners.add(listener);},\n  removeEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(navigationListeners.delete(listener),'registered navigation listener removed');},\n };\n (globalThis as any).document=navigationDocument;\n  const oldWindow="
      },
      {
        "from": "(globalThis as any).window=oldWindow;",
        "to": "(globalThis as any).window=oldWindow;assert.equal(navigationListeners.size,0,'navigation listener cleaned up on unmount');if(oldNavigationDocument)Object.defineProperty(globalThis,'document',oldNavigationDocument);else delete (globalThis as any).document;"
      }
    ]
  },
  {
    "path": "tests/head-ct-facial-decision-form.test.ts",
    "preimageSha256": "acd6042c21adeae7968a6e4a903c89031bb974b9e050f1346b5aae123d117f03",
    "proposedSha256": "7e36ccf5df1ac4d8870460dfaa19d5b5e52245ae3af85e06d1d678cad5647321",
    "fixture": "tests/fixtures/review-navigation-six-harness-originals/head-ct-facial-decision-form.test.ts.raw",
    "fixtureSha256": "acd6042c21adeae7968a6e4a903c89031bb974b9e050f1346b5aae123d117f03",
    "seams": [
      {
        "from": "import {readFileSync} from 'node:fs';",
        "to": "import {readFileSync} from 'node:fs';\nimport * as navigationGuard from '../lib/clinical-review-navigation-guard.ts';"
      },
      {
        "from": "const load=(id:string)=>",
        "to": "const load=(id:string)=>id==='../lib/clinical-review-navigation-guard'?navigationGuard:"
      },
      {
        "from": "  const oldWindow=",
        "to": " const oldNavigationDocument=Object.getOwnPropertyDescriptor(globalThis,'document');\n const navigationListeners=new Set<Function>();\n const navigationDocument={\n  defaultView:{location:{href:'https://visiblemedicine.test/atlas/head-learning?mode=review'},confirm(){throw Error('No synthetic navigation was dispatched');}},\n  addEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(!navigationListeners.has(listener));navigationListeners.add(listener);},\n  removeEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(navigationListeners.delete(listener),'registered navigation listener removed');},\n };\n (globalThis as any).document=navigationDocument;\n  const oldWindow="
      },
      {
        "from": "(globalThis as any).window=oldWindow;",
        "to": "(globalThis as any).window=oldWindow;assert.equal(navigationListeners.size,0,'navigation listener cleaned up on unmount');if(oldNavigationDocument)Object.defineProperty(globalThis,'document',oldNavigationDocument);else delete (globalThis as any).document;"
      }
    ]
  },
  {
    "path": "tests/head-paired-decision-form.test.ts",
    "preimageSha256": "a681f31d357ed4a9ab2ab8469c123ba95f2a3bfddbede5778ec98a84cba629c0",
    "proposedSha256": "017563651236c9b91e7251316290070c1782a8f5bf34d62420fb58c395db100c",
    "fixture": "tests/fixtures/review-navigation-six-harness-originals/head-paired-decision-form.test.ts.raw",
    "fixtureSha256": "a681f31d357ed4a9ab2ab8469c123ba95f2a3bfddbede5778ec98a84cba629c0",
    "seams": [
      {
        "from": "import {readFileSync} from 'node:fs';",
        "to": "import {readFileSync} from 'node:fs';\nimport * as navigationGuard from '../lib/clinical-review-navigation-guard.ts';"
      },
      {
        "from": "const load=(id:string)=>",
        "to": "const load=(id:string)=>id==='../lib/clinical-review-navigation-guard'?navigationGuard:"
      },
      {
        "from": "  const oldWindow=",
        "to": " const oldNavigationDocument=Object.getOwnPropertyDescriptor(globalThis,'document');\n const navigationListeners=new Set<Function>();\n const navigationDocument={\n  defaultView:{location:{href:'https://visiblemedicine.test/atlas/head-learning?mode=review'},confirm(){throw Error('No synthetic navigation was dispatched');}},\n  addEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(!navigationListeners.has(listener));navigationListeners.add(listener);},\n  removeEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(navigationListeners.delete(listener),'registered navigation listener removed');},\n };\n (globalThis as any).document=navigationDocument;\n  const oldWindow="
      },
      {
        "from": "(globalThis as any).window=oldWindow;",
        "to": "(globalThis as any).window=oldWindow;assert.equal(navigationListeners.size,0,'navigation listener cleaned up on unmount');if(oldNavigationDocument)Object.defineProperty(globalThis,'document',oldNavigationDocument);else delete (globalThis as any).document;"
      }
    ]
  },
  {
    "path": "tests/regional-guide-review-ui.test.ts",
    "preimageSha256": "2706275af45beb11452f4a72a8adc7209af18f54c6964b38ad59b2406c3b40a3",
    "proposedSha256": "2df58c94c51a1944f1e5253d52d4c3bfcb5d77520fc975f9a4c14dec8ff7bcc2",
    "fixture": "tests/fixtures/review-navigation-six-harness-originals/regional-guide-review-ui.test.ts.raw",
    "fixtureSha256": "2706275af45beb11452f4a72a8adc7209af18f54c6964b38ad59b2406c3b40a3",
    "seams": [
      {
        "from": "import {readFileSync} from 'node:fs';",
        "to": "import {readFileSync} from 'node:fs';\nimport * as navigationGuard from '../lib/clinical-review-navigation-guard.ts';"
      },
      {
        "from": "const load=(id:string)=>",
        "to": "const load=(id:string)=>id==='../lib/clinical-review-navigation-guard'?navigationGuard:"
      },
      {
        "from": " const oldWindow=",
        "to": " const oldNavigationDocument=Object.getOwnPropertyDescriptor(globalThis,'document');\n const navigationListeners=new Set<Function>();\n const navigationDocument={\n  defaultView:{location:{href:'https://visiblemedicine.test/atlas/head-learning?mode=review'},confirm(){throw Error('No synthetic navigation was dispatched');}},\n  addEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(!navigationListeners.has(listener));navigationListeners.add(listener);},\n  removeEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(navigationListeners.delete(listener),'registered navigation listener removed');},\n };\n const oldWindow="
      },
      {
        "from": "(globalThis as any).document={body:",
        "to": "(globalThis as any).document={...navigationDocument,body:"
      },
      {
        "from": "(globalThis as any).document=oldDocument;",
        "to": "(globalThis as any).document=oldDocument;assert.equal(navigationListeners.size,0,'navigation listener cleaned up on unmount');if(oldNavigationDocument)Object.defineProperty(globalThis,'document',oldNavigationDocument);else delete (globalThis as any).document;"
      }
    ]
  },
  {
    "path": "tests/regional-reference-draft-ui.test.ts",
    "preimageSha256": "60be257de429b63eb311458092417da29326f737c5b9a9779324b57c8bdcace1",
    "proposedSha256": "87c59dc7bfab758df61a81646d95194037c44b76ad13381181232a11aa84ee18",
    "fixture": "tests/fixtures/review-navigation-six-harness-originals/regional-reference-draft-ui.test.ts.raw",
    "fixtureSha256": "60be257de429b63eb311458092417da29326f737c5b9a9779324b57c8bdcace1",
    "seams": [
      {
        "from": "import {readFileSync} from 'node:fs';",
        "to": "import {readFileSync} from 'node:fs';\nimport * as navigationGuard from '../lib/clinical-review-navigation-guard.ts';"
      },
      {
        "from": "const load=(id:string)=>",
        "to": "const load=(id:string)=>id==='../lib/clinical-review-navigation-guard'?navigationGuard:"
      },
      {
        "from": " const oldWindow=",
        "to": " const oldNavigationDocument=Object.getOwnPropertyDescriptor(globalThis,'document');\n const navigationListeners=new Set<Function>();\n const navigationDocument={\n  defaultView:{location:{href:'https://visiblemedicine.test/atlas/head-learning?mode=review'},confirm(){throw Error('No synthetic navigation was dispatched');}},\n  addEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(!navigationListeners.has(listener));navigationListeners.add(listener);},\n  removeEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(navigationListeners.delete(listener),'registered navigation listener removed');},\n };\n (globalThis as any).document=navigationDocument;\n const oldWindow="
      },
      {
        "from": "(globalThis as any).window=oldWindow;",
        "to": "(globalThis as any).window=oldWindow;assert.equal(navigationListeners.size,0,'navigation listener cleaned up on unmount');if(oldNavigationDocument)Object.defineProperty(globalThis,'document',oldNavigationDocument);else delete (globalThis as any).document;"
      }
    ]
  }
];
for(const change of changes)test(change.path+' preserves its complete original outside navigation harness seams',()=>{
 const original=readFileSync(new URL('./fixtures/review-navigation-six-harness-originals/'+change.path.slice(6)+'.raw',import.meta.url));
 assert.equal(createHash('sha256').update(original).digest('hex'),change.preimageSha256,'authentic raw preimage');
 let source=readFileSync(new URL('./'+change.path.slice(6),import.meta.url),'utf8');
 for(const {from,to} of [...change.seams].reverse()){
  assert.equal(source.split(to).length-1,1,'unique exact harness seam');
  source=source.replace(to,from);
 }
 assert.deepEqual(Buffer.from(source),original,'entire original body and every assertion retained');
});
