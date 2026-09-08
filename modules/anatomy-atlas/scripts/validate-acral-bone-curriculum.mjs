import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeAcralBones } from './acral-bone-curriculum-transition.mjs';
import { authoringBeforeThoracicVessels } from './thoracic-vessel-curriculum-transition.mjs';
import {
  curriculumHash,
  copyBeforeShoulderArmCurriculum,
} from './curriculum-transition.mjs';
let checks = 0;
const same = (a, b, label) => {
  checks++;
  assert.deepEqual(a, b, label);
};
const check = (a, label) => {
  checks++;
  assert(a, label);
};
const context = await contentContext();
const { api, catalog, body } = context;
const before = await readContentJson(
  'content/acral-bone-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeAcralBones(context);
const copy = (a) => ({
  body: catalog.structures.map((s) => ({
    id: s.id,
    sections: Object.fromEntries(
      api.contentTabs.map((t) => [t, a.bodyContent(s, t)]),
    ),
  })),
  shoulder: api.structures,
  dissectionProfiles: api.dissectionProfiles,
});
same(curriculumHash(copy(previous)), before.copyAndRecipeHash);
same(
  curriculumHash(await copyBeforeShoulderArmCurriculum(context)),
  baseline.copyAndRecipeHash,
);
// Independent observations from exact ISA/PART-OF rows, not derived from lessons.
// Laterality, region and membership are source facts, not clinical validation.
const expected = {
  FMA32653: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3179'],
    'Distal phalanx of left second toe',
  ],
  FMA32655: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3180'],
    'Distal phalanx of left third toe',
  ],
  FMA32657: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3181'],
    'Distal phalanx of left fourth toe',
  ],
  FMA32651: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3182'],
    'Distal phalanx of left big toe',
  ],
  FMA23953: [
    'left',
    'hand',
    'bone',
    'isa',
    ['FJ3183'],
    'Distal phalanx of left index finger',
  ],
  FMA23959: [
    'left',
    'hand',
    'bone',
    'isa',
    ['FJ3184'],
    'Distal phalanx of left little finger',
  ],
  FMA32659: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3185'],
    'Distal phalanx of left little toe',
  ],
  FMA23955: [
    'left',
    'hand',
    'bone',
    'isa',
    ['FJ3186'],
    'Distal phalanx of left middle finger',
  ],
  FMA23957: [
    'left',
    'hand',
    'bone',
    'isa',
    ['FJ3187'],
    'Distal phalanx of left ring finger',
  ],
  FMA23951: [
    'left',
    'hand',
    'bone',
    'isa',
    ['FJ3188'],
    'Distal phalanx of left thumb',
  ],
  FMA32652: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3189'],
    'Distal phalanx of right second toe',
  ],
  FMA32654: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3190'],
    'Distal phalanx of right third toe',
  ],
  FMA32656: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3191'],
    'Distal phalanx of right fourth toe',
  ],
  FMA32650: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3192'],
    'Distal phalanx of right big toe',
  ],
  FMA24460: [
    'right',
    'hand',
    'bone',
    'isa',
    ['FJ3193'],
    'Distal phalanx of right index finger',
  ],
  FMA24463: [
    'right',
    'hand',
    'bone',
    'isa',
    ['FJ3194'],
    'Distal phalanx of right little finger',
  ],
  FMA32658: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3195'],
    'Distal phalanx of right little toe',
  ],
  FMA24461: [
    'right',
    'hand',
    'bone',
    'isa',
    ['FJ3196'],
    'Distal phalanx of right middle finger',
  ],
  FMA24462: [
    'right',
    'hand',
    'bone',
    'isa',
    ['FJ3197'],
    'Distal phalanx of right ring finger',
  ],
  FMA24459: [
    'right',
    'hand',
    'bone',
    'isa',
    ['FJ3198'],
    'Distal phalanx of right thumb',
  ],
  FMA24465: [
    'left',
    'hand',
    'bone',
    'isa',
    ['FJ3240'],
    'Left first metacarpal bone',
  ],
  FMA24508: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3241'],
    'Left first metatarsal bone',
  ],
  FMA24467: [
    'left',
    'hand',
    'bone',
    'isa',
    ['FJ3243'],
    'Left second metacarpal bone',
  ],
  FMA24510: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3244'],
    'Left second metatarsal bone',
  ],
  FMA24469: [
    'left',
    'hand',
    'bone',
    'isa',
    ['FJ3246'],
    'Left third metacarpal bone',
  ],
  FMA24512: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3247'],
    'Left third metatarsal bone',
  ],
  FMA24471: [
    'left',
    'hand',
    'bone',
    'isa',
    ['FJ3249'],
    'Left fourth metacarpal bone',
  ],
  FMA24514: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3250'],
    'Left fourth metatarsal bone',
  ],
  FMA24473: [
    'left',
    'hand',
    'bone',
    'isa',
    ['FJ3252'],
    'Left fifth metacarpal bone',
  ],
  FMA24516: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3253'],
    'Left fifth metatarsal bone',
  ],
  FMA24498: ['left', 'foot', 'bone', 'isa', ['FJ3256'], 'Left calcaneus'],
  FMA24447: ['left', 'hand', 'bone', 'isa', ['FJ3257'], 'Left capitate'],
  FMA24529: ['left', 'foot', 'bone', 'isa', ['FJ3258'], 'Left cuboid bone'],
  FMA24449: ['left', 'hand', 'bone', 'isa', ['FJ3261'], 'Left hamate'],
  FMA24524: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3264'],
    'Left intermediate cuneiform bone',
  ],
  FMA24526: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3267'],
    'Left lateral cuneiform bone',
  ],
  FMA24438: ['left', 'hand', 'bone', 'isa', ['FJ3268'], 'Left lunate'],
  FMA24522: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3271'],
    'Left medial cuneiform bone',
  ],
  FMA24442: ['left', 'hand', 'bone', 'isa', ['FJ3276'], 'Left pisiform'],
  FMA24436: ['left', 'hand', 'bone', 'isa', ['FJ3278'], 'Left scaphoid'],
  FMA24483: ['left', 'foot', 'bone', 'isa', ['FJ3280'], 'Left talus'],
  FMA24444: ['left', 'hand', 'bone', 'isa', ['FJ3283'], 'Left trapezium'],
  FMA24445: ['left', 'hand', 'bone', 'isa', ['FJ3284'], 'Left trapezoid'],
  FMA24440: ['left', 'hand', 'bone', 'isa', ['FJ3285'], 'Left triquetral'],
  FMA23942: [
    'left',
    'hand',
    'bone',
    'isa',
    ['FJ3291'],
    'Middle phalanx of left ring finger',
  ],
  FMA24457: [
    'right',
    'hand',
    'bone',
    'isa',
    ['FJ3292'],
    'Middle phalanx of right ring finger',
  ],
  FMA32643: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3293'],
    'Middle phalanx of left second toe',
  ],
  FMA32645: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3294'],
    'Middle phalanx of left third toe',
  ],
  FMA32647: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3295'],
    'Middle phalanx of left fourth toe',
  ],
  FMA23938: [
    'left',
    'hand',
    'bone',
    'isa',
    ['FJ3296'],
    'Middle phalanx of left index finger',
  ],
  FMA23944: [
    'left',
    'hand',
    'bone',
    'isa',
    ['FJ3297'],
    'Middle phalanx of left little finger',
  ],
  FMA230988: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3298'],
    'Middle phalanx of left little toe',
  ],
  FMA23940: [
    'left',
    'hand',
    'bone',
    'isa',
    ['FJ3299'],
    'Middle phalanx of left middle finger',
  ],
  FMA32642: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3300'],
    'Middle phalanx of right second toe',
  ],
  FMA32644: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3301'],
    'Middle phalanx of right third toe',
  ],
  FMA32646: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3302'],
    'Middle phalanx of right fourth toe',
  ],
  FMA24455: [
    'right',
    'hand',
    'bone',
    'isa',
    ['FJ3303'],
    'Middle phalanx of right index finger',
  ],
  FMA24458: [
    'right',
    'hand',
    'bone',
    'isa',
    ['FJ3304'],
    'Middle phalanx of right little finger',
  ],
  FMA230986: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3305'],
    'Middle phalanx of right little toe',
  ],
  FMA24456: [
    'right',
    'hand',
    'bone',
    'isa',
    ['FJ3306'],
    'Middle phalanx of right middle finger',
  ],
  FMA24501: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3307'],
    'Navicular bone of left foot',
  ],
  FMA24500: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3308'],
    'Navicular bone of right foot',
  ],
  FMA43253: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3310'],
    'Proximal phalanx of right big toe',
  ],
  FMA32637: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3311'],
    'Proximal phalanx of left third toe',
  ],
  FMA32639: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3312'],
    'Proximal phalanx of left fourth toe',
  ],
  FMA71915: [
    'left',
    'hand',
    'bone',
    'isa',
    ['FJ3313'],
    'Proximal phalanx of left index finger',
  ],
  FMA66791: [
    'left',
    'hand',
    'bone',
    'isa',
    ['FJ3314'],
    'Proximal phalanx of left little finger',
  ],
  FMA32641: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3315'],
    'Proximal phalanx of left little toe',
  ],
  FMA71908: [
    'left',
    'hand',
    'bone',
    'isa',
    ['FJ3316'],
    'Proximal phalanx of left middle finger',
  ],
  FMA71916: [
    'left',
    'hand',
    'bone',
    'isa',
    ['FJ3317'],
    'Proximal phalanx of left ring finger',
  ],
  FMA65470: [
    'left',
    'hand',
    'bone',
    'isa',
    ['FJ3318'],
    'Proximal phalanx of left thumb',
  ],
  FMA32634: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3319'],
    'Proximal phalanx of right second toe',
  ],
  FMA32636: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3320'],
    'Proximal phalanx of right third toe',
  ],
  FMA32638: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3321'],
    'Proximal phalanx of right fourth toe',
  ],
  FMA24451: [
    'right',
    'hand',
    'bone',
    'isa',
    ['FJ3322'],
    'Proximal phalanx of right index finger',
  ],
  FMA24454: [
    'right',
    'hand',
    'bone',
    'isa',
    ['FJ3323'],
    'Proximal phalanx of right little finger',
  ],
  FMA32640: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3324'],
    'Proximal phalanx of right little toe',
  ],
  FMA24452: [
    'right',
    'hand',
    'bone',
    'isa',
    ['FJ3325'],
    'Proximal phalanx of right middle finger',
  ],
  FMA24453: [
    'right',
    'hand',
    'bone',
    'isa',
    ['FJ3326'],
    'Proximal phalanx of right ring finger',
  ],
  FMA24450: [
    'right',
    'hand',
    'bone',
    'isa',
    ['FJ3327'],
    'Proximal phalanx of right thumb',
  ],
  FMA32635: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3328'],
    'Proximal phalanx of left second toe',
  ],
  FMA43254: [
    'left',
    'foot',
    'bone',
    'isa',
    ['FJ3329'],
    'Proximal phalanx of left big toe',
  ],
  FMA24464: [
    'right',
    'hand',
    'bone',
    'isa',
    ['FJ3350'],
    'Right first metacarpal bone',
  ],
  FMA24507: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3351'],
    'Right first metatarsal bone',
  ],
  FMA24466: [
    'right',
    'hand',
    'bone',
    'isa',
    ['FJ3352'],
    'Right second metacarpal bone',
  ],
  FMA24509: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3353'],
    'Right second metatarsal bone',
  ],
  FMA24468: [
    'right',
    'hand',
    'bone',
    'isa',
    ['FJ3354'],
    'Right third metacarpal bone',
  ],
  FMA24511: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3355'],
    'Right third metatarsal bone',
  ],
  FMA24470: [
    'right',
    'hand',
    'bone',
    'isa',
    ['FJ3356'],
    'Right fourth metacarpal bone',
  ],
  FMA24513: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3357'],
    'Right fourth metatarsal bone',
  ],
  FMA24472: [
    'right',
    'hand',
    'bone',
    'isa',
    ['FJ3358'],
    'Right fifth metacarpal bone',
  ],
  FMA24515: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3359'],
    'Right fifth metatarsal bone',
  ],
  FMA24497: ['right', 'foot', 'bone', 'isa', ['FJ3360'], 'Right calcaneus'],
  FMA24446: ['right', 'hand', 'bone', 'isa', ['FJ3361'], 'Right capitate'],
  FMA24528: ['right', 'foot', 'bone', 'isa', ['FJ3364'], 'Right cuboid bone'],
  FMA24448: ['right', 'hand', 'bone', 'isa', ['FJ3367'], 'Right hamate'],
  FMA24523: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3370'],
    'Right intermediate cuneiform bone',
  ],
  FMA24525: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3373'],
    'Right lateral cuneiform bone',
  ],
  FMA24437: ['right', 'hand', 'bone', 'isa', ['FJ3374'], 'Right lunate'],
  FMA24521: [
    'right',
    'foot',
    'bone',
    'isa',
    ['FJ3377'],
    'Right medial cuneiform bone',
  ],
  FMA24441: ['right', 'hand', 'bone', 'isa', ['FJ3382'], 'Right pisiform'],
  FMA24435: ['right', 'hand', 'bone', 'isa', ['FJ3383'], 'Right scaphoid'],
  FMA24482: ['right', 'foot', 'bone', 'isa', ['FJ3385'], 'Right talus'],
  FMA24443: ['right', 'hand', 'bone', 'isa', ['FJ3388'], 'Right trapezium'],
  FMA23725: ['right', 'hand', 'bone', 'isa', ['FJ3389'], 'Right trapezoid'],
  FMA24439: ['right', 'hand', 'bone', 'isa', ['FJ3390'], 'Right triquetral'],
};
same(api.acralBoneLessons.length, 53);
same(
  api.acralBoneLessons.flatMap((l) => l.fmaIds).sort(),
  Object.keys(expected).sort(),
);
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
for (const [fma, [side, region, category, tree, files]] of Object.entries(
  expected,
)) {
  const s = entry(fma);
  const l = api.acralBoneLessons.find((l) => l.fmaIds.includes(fma));
  check(s && l);
  same(s.system, 'skeleton');
  same(s.category, category);
  same(s.region, region);
  same(s.laterality, side);

  same(s.sourceTree, tree);
  same(
    s.sources.map((p) => p.file),
    files,
  );
  same(s.regions, [region]);
  same(s.name, expected[fma][5]);
  for (const t of api.contentTabs) {
    const result = api.acralBoneLesson(s, t);
    if (!before.tabs.includes(t)) {
      same(result, undefined);
      continue;
    }
    same(result, api.bodyLesson(s, t));
    same(
      JSON.parse(JSON.stringify(result)),
      body.find((r) => r.id === s.id).content[t],
    );
    same(result.readiness, 'draft');
    same(result.body, l[t]);
    same(result.bullets[0], l.distinction);
    check(result.note.includes('clinical review pending'));
    if (s.coverageNote) check(result.note.includes(s.coverageNote));
    check(
      api
        .acralBoneLesson({ ...s, coverageNote: 'Coverage hold retained.' }, t)
        .note.includes('Coverage hold retained.'),
    );
    check(result.note.includes('not tissue interiors'));
    same(result.citations, l.references);
    check(result.citations.length > 0);
    for (const url of result.citations) same(new URL(url).protocol, 'https:');
    const original = structuredClone(result);
    result.bullets.push('mutation');
    result.citations.push('mutation');
    same(api.bodyLesson(s, t), original, 'Detached arrays');
  }
  const record = body.find((r) => r.id === s.id);
  same(record.validation.clinicalApproval, 'not-included');
  same(record.validation.materialRevisions, {
    geometry: null,
    teaching: null,
    imaging: null,
  });
  for (const mutation of [
    { system: 'nerves' },
    { laterality: side === 'left' ? 'right' : 'left' },
    { region: region === 'hand' ? 'foot' : 'hand' },
    { category: category === 'ligament' ? 'cartilage' : 'ligament' },
    { regions: [region === 'hand' ? 'foot' : 'hand'] },
    { fmaId: 'FMA_UNKNOWN' },
  ])
    same(api.acralBoneLesson({ ...s, ...mutation }, 'function'), undefined);
}
for (const s of catalog.structures)
  if (!expected[s.fmaId])
    for (const t of api.contentTabs) same(api.acralBoneLesson(s, t), undefined);
const lesson = (fma, t) => api.bodyLesson(entry(fma), t);
check(lesson('FMA24435', 'anatomy').body.includes('scaphoid'));
check(lesson('FMA23725', 'anatomy').body.includes('trapezoid'));
check(lesson('FMA24441', 'anatomy').body.includes('flexor carpi ulnaris'));
check(
  lesson('FMA24482', 'function').body.includes(
    'without direct muscular attachment',
  ),
);
check(lesson('FMA24497', 'anatomy').body.includes('heel'));
check(lesson('FMA24509', 'anatomy').body.includes('intermediate cuneiform'));
check(lesson('FMA24511', 'anatomy').body.includes('lateral cuneiform'));
check(lesson('FMA24513', 'anatomy').body.includes('cuboid'));
check(
  lesson('FMA24466', 'anatomy').body.includes(
    'trapezoid, trapezium and capitate',
  ),
);
check(lesson('FMA24470', 'anatomy').body.includes('capitate and hamate'));
// Independently derive digit and segment from preserved source names, not authoring arrays.
const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];
let metacarpalMetatarsalChecks = 0;
for (const [fma, [, , , , , name]] of Object.entries(expected)) {
  const match = name.match(
    /(first|second|third|fourth|fifth) (metacarpal|metatarsal) bone/,
  );
  if (!match) continue;
  const l = api.acralBoneLessons.find((l) => l.fmaIds.includes(fma));
  const digit = ordinals.indexOf(match[1]) + 1;
  same(l.digit, digit);
  check(l.anatomy.toLowerCase().startsWith(`${match[2]} ${digit} `));
  metacarpalMetatarsalChecks++;
}
same(metacarpalMetatarsalChecks, 20);
const names = {
  hand: [
    'thumb',
    'index finger',
    'middle finger',
    'ring finger',
    'little finger',
  ],
  foot: ['big toe', 'second toe', 'third toe', 'fourth toe', 'little toe'],
};
for (const [fma, [, region, , , , name]] of Object.entries(expected)) {
  const l = api.acralBoneLessons.find((l) => l.fmaIds.includes(fma));
  if (/phalanx/i.test(name)) {
    const digit = names[region].findIndex((n) => name.endsWith(n)) + 1;
    const segment = name.split(' ')[0].toLowerCase();
    same(l.digit, digit);
    same(l.segment, segment);
    check(!(digit === 1 && segment === 'middle'));
    check(l.anatomy.includes(segment + ' phalanx'));
    check(
      l.anatomy.includes(
        digit === 1 && region === 'foot'
          ? 'great toe'
          : names[region][digit - 1],
      ),
    );
    const expectedJoint =
      digit === 1
        ? 'IP joint'
        : segment === 'proximal'
          ? 'PIP joint'
          : 'DIP joint';
    check(l.anatomy.includes(expectedJoint));
    if (segment === 'proximal')
      check(l.anatomy.includes(region === 'hand' ? 'MCP joint' : 'MTP joint'));
    if (segment === 'distal')
      check(l.anatomy.includes('terminal bony support'));
    if (digit === 1) check(l.distinction.includes('no middle phalanx'));
  }
}
same(api.acralBoneLessons.filter((l) => l.segment).length, 28);
same(api.acralBoneLessons.filter((l) => l.region === 'hand').length, 27);
same(api.acralBoneLessons.filter((l) => l.region === 'foot').length, 26);
for (const fma of ['FMA45097', 'FMA45098', 'FMA61970', 'FMA19728']) {
  same(api.acralBoneLesson(entry(fma), 'function'), undefined);
  same(lesson(fma, 'function').readiness, 'pending');
  same(lesson(fma, 'anatomy'), previous.bodyLesson(entry(fma), 'anatomy'));
}
const heldFoot = {
  FMA45097: ['FJ3372', 'FJ3376'],
  FMA45098: ['FJ3266', 'FJ3270'],
};
for (const [fma, files] of Object.entries(heldFoot)) {
  same(
    entry(fma).sources.map((p) => p.file),
    files,
  );
  same(lesson(fma, 'anatomy').readiness, 'identity-only');
}
let sourceIndexChecks = 0;
if (process.argv.includes('--source')) {
  const rowsByTree = {};
  for (const tree of ['isa', 'partof'])
    rowsByTree[tree] = (
      await readFile(
        new URL(
          `../../work/bodyparts3d/${tree}_element_parts.txt`,
          import.meta.url,
        ),
        'utf8',
      )
    )
      .trim()
      .split(/\r?\n/)
      .map((l) => l.split('\t'));
  for (const [fma, [, , , tree, files]] of Object.entries(expected)) {
    same(
      rowsByTree[tree].filter((row) => row[0] === fma),
      files.map((file) => [fma, entry(fma).name.toLowerCase(), file]),
    );
    sourceIndexChecks++;
  }
}
const negatives = [
  ['FMA24435', 'anatomy', 'body'],
  ['FMA23725', 'function', 'readiness'],
  ['FMA24450', 'anatomy', 'body'],
  ['FMA43253', 'function', 'body'],
  ['FMA24509', 'ct', 'body'],
  ['FMA230986', 'function', 'body'],
  ['FMA24482', 'anatomy', 'body'],
  ['FMA13322', 'anatomy', 'body'],
  ['FMA45097', 'function', 'readiness'],
  ['FMA45098', 'function', 'readiness'],
  ['FMA61970', 'function', 'readiness'],
  ['FMA19728', 'function', 'readiness'],
];
for (const [fma, t, field] of negatives) {
  const changed = {
    ...api,
    bodyLesson: (s, tab) =>
      s.fmaId === fma && tab === t
        ? {
            ...api.bodyLesson(s, tab),
            [field]:
              field === 'readiness'
                ? expected[fma]
                  ? 'pending'
                  : 'draft'
                : 'unrecorded',
          }
        : api.bodyLesson(s, tab),
    bodyContent: (s, tab) =>
      s.fmaId === fma && tab === t && field === 'body'
        ? { ...api.bodyContent(s, tab), body: 'unrecorded' }
        : api.bodyContent(s, tab),
  };
  await assert.rejects(async () =>
    assert.equal(
      curriculumHash(
        await copyBeforeShoulderArmCurriculum({ ...context, api: changed }),
      ),
      baseline.copyAndRecipeHash,
    ),
  );
  checks++;
}
const acralMilestone = await authoringBeforeThoracicVessels(context);
const counts = (t) =>
  Object.fromEntries(
    ['draft', 'identity-only', 'pending', 'generated-identification'].map(
      (r) => [
        r,
        catalog.structures.filter(
          (s) => acralMilestone.bodyLesson(s, t).readiness === r,
        ).length,
      ],
    ),
  );
same(counts('anatomy'), {
  draft: 816,
  'identity-only': 206,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 872,
  'identity-only': 146,
  pending: 4,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'skeleton' &&
      !['hand', 'foot'].includes(s.region) &&
      api.bodyLesson(s, 'function').readiness === 'pending',
  ).length,
  0,
);
const report = {
  passed: true,
  checks,
  bodyRepresentations: 106,
  sourceComponents: 106,
  lessonGroups: 53,
  explicitTopicEdits: 212,
  combinedPinnedCurriculumSections: 1246,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadinessAtAcralMilestone: {
    anatomy: counts('anatomy'),
    function: counts('function'),
  },
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Original draft teaching only; digit joints, carpal/tarsal facets, attachments and geometry remain unvalidated. Two grouped foot-sesamoid selections retain pending Function. No acquired imaging, physiological movement or clinical approval.',
};
await writeFile(
  new URL('docs/acral-bone-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
