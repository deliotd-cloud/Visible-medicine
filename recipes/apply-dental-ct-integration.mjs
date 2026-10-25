// Original exact edit recipe; contains no private configuration or medical coordinates.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const [mode,root]=process.argv.slice(2);assert(['--check','--write'].includes(mode)&&root);const sha=b=>createHash('sha256').update(b).digest('hex'),rows=[
  {
    "path": "app/body-content.ts",
    "beforeSha256": "ff88872a7ac36e8c16e0fcddd002eae8cac3d48df9daf93d4da625e41bfa304e",
    "afterSha256": "a4685fc37cf77c65d8544d8e231ff7087bbddcd6401e0dcca2eb2b6de6854019",
    "replacements": [
      [
        "import {dentalMriLesson} from '../lib/dental-mri';",
        "import {dentalMriLesson} from '../lib/dental-mri';\nimport {dentalCtLesson} from '../lib/dental-ct';"
      ],
      [
        "  if(dentalMri)return dentalMri;",
        "  if(dentalMri)return dentalMri;\n  const dentalCt=dentalCtLesson(s,tab);\n  if(dentalCt)return dentalCt;"
      ]
    ]
  },
  {
    "path": "package.json",
    "beforeSha256": "55824dd743250fb9f2b225f6b993b6cd55a2baf077c0e0dcc6a17dc4138b5d0c",
    "afterSha256": "ec725db4a80d9627bee7bf8f1649de38055d239a97d4e1c7819f1c01228291cc",
    "replacements": [
      [
        "    \"dental-mri:test\": \"node --test scripts/test-dental-mri-native.mjs\",",
        "    \"dental-ct:test\": \"node --test scripts/test-dental-ct-native.mjs\",\n    \"dental-mri:test\": \"node --test scripts/test-dental-mri-native.mjs\","
      ]
    ]
  }
];
for(const row of rows){const p=path.resolve(root,row.path),original=fs.readFileSync(p);if(mode==='--check'){assert.equal(sha(original),row.afterSha256,row.path);let inverse=original.toString('utf8');for(const [a,b]of [...row.replacements].reverse()){assert.equal(inverse.split(b).length,2);inverse=inverse.replace(b,a);}assert.equal(sha(Buffer.from(inverse)),row.beforeSha256,row.path);continue;}assert.equal(sha(original),row.beforeSha256,row.path);let text=original.toString('utf8');for(const [a,b]of row.replacements){assert.equal(text.split(a).length,2);text=text.replace(a,b);}assert.equal(sha(Buffer.from(text)),row.afterSha256,row.path);fs.writeFileSync(p,text);}
console.log(JSON.stringify({mode,paths:rows.map(r=>r.path),exactSourceInverse:true}));
