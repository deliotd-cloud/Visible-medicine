import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  parseStudyLink,
  makeStudyLink,
  resolveStudyLink,
  studyDestinations,
  bodyStudyScope,
  studyLinkKey,
} from '../lib/study-links.ts';
import {
  dissectionProfiles,
  dissectionReducer,
  initialDissection,
  resolveDissection,
  matchesRule,
} from '../app/dissection-data.ts';
// Check the installed route runtime's actual duplicate-parameter collection too.
import { collectAppPageSearchParams } from '../node_modules/vinext/dist/server/app-page-head.js';

const bytes = await readFile(
  'public/models/bodyparts3d/full-body/catalog.json',
);
const catalog = JSON.parse(bytes);
const before = JSON.stringify(catalog);
const hash = (data) => createHash('sha256').update(data).digest('hex');
let assertions = 0,
  links = 0,
  focusedLinks = 0;
const same = (a, b, message) => {
  assert.deepEqual(a, b, message);
  assertions++;
};
const check = (condition, message) => {
  assert.ok(condition, message);
  assertions++;
};
const parseHref = (href) => {
  const url = new URL(href, 'https://atlas.invalid');
  const { pageSearchParams } = collectAppPageSearchParams(url.searchParams);
  return {
    url,
    parsed: parseStudyLink(pageSearchParams),
    params: pageSearchParams,
  };
};
same(
  hash(bytes),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const rows = [];
for (const [region, profile] of Object.entries(dissectionProfiles)) {
  for (const side of ['both', 'left', 'right']) {
    const scope = bodyStudyScope(catalog, region, side);
    let tested = 0;
    for (const selected of scope) {
      for (const focus of [null, ...profile.focuses.map((focus) => focus.id)]) {
        const expected = resolveDissection(
          scope,
          profile,
          dissectionReducer(
            initialDissection,
            focus
              ? { type: 'focus', id: focus }
              : { type: 'stage', id: 'assembled' },
          ),
        ).visible;
        const href = makeStudyLink(catalog, region, selected.id, side, focus);
        const definition = profile.focuses.find((item) => item.id === focus);
        const missingTarget = definition && !scope.some((item) => matchesRule(item, definition.rule));
        if (missingTarget || !expected.includes(selected)) {
          same(href, null);
          continue;
        }
        check(
          href &&
            href.startsWith(
              region === 'whole-body' ? '/?' : `/regions/${region}?`,
            ),
        );
        const { url, parsed, params } = parseHref(href);
        same(url.origin, 'https://atlas.invalid');
        same(url.hash, '');
        same(parsed.status, 'requested');
        same(parsed.request.structureId, selected.id);
        same(parsed.request.side, side);
        same(parsed.request.focusId, focus);
        check(
          Object.keys(params).every((key) =>
            ['study', 'structure', 'side', 'source', 'focus'].includes(key),
          ),
        );
        const result = resolveStudyLink(catalog, region, parsed);
        same(result.status, 'ready');
        same(result.selected, selected);
        same(
          result.visibleIds,
          expected.map((item) => item.id),
        );
        same(
          result.view,
          focus
            ? profile.focuses.find((item) => item.id === focus).view
            : profile.stages[0].view,
        );
        same(studyLinkKey(parsed), studyLinkKey(parseStudyLink(params)));
        same(
          resolveStudyLink(
            catalog,
            region,
            parseStudyLink({ ...params, source: '0'.repeat(64) }),
          ).reason,
          'source-changed',
        );
        links++;
        tested++;
        if (focus) focusedLinks++;
      }
    }
    rows.push({ region, side, structures: scope.length, testedLinks: tested });
  }
}
// Every actual whole-body -> regional destination must retain identity and side.
let destinationsTested = 0;
for (const selected of catalog.structures) {
  for (const side of ['both', 'left', 'right']) {
    const destinations = studyDestinations(
      catalog,
      selected,
      'whole-body',
      side,
    );
    const shouldFit = bodyStudyScope(catalog, 'whole-body', side).includes(
      selected,
    );
    same(
      destinations.map((item) => item.region),
      shouldFit
        ? catalog.regions
            .filter((region) => selected.regions.includes(region.id))
            .map((region) => region.id)
        : [],
    );
    for (const destination of destinations) {
      for (const href of [
        destination.href,
        ...destination.focuses.map((focus) => focus.href),
      ]) {
        const result = resolveStudyLink(
          catalog,
          destination.region,
          parseHref(href).parsed,
        );
        same(result.status, 'ready');
        same(result.selected.id, selected.id);
        same(result.side, side);
        destinationsTested++;
      }
      const reverse = studyDestinations(
        catalog,
        selected,
        destination.region,
        side,
      ).find((entry) => entry.region === 'whole-body');
      check(reverse, 'Regional selection needs a whole-body return link');
      same(
        resolveStudyLink(catalog, 'whole-body', parseHref(reverse.href).parsed)
          .selected.id,
        selected.id,
      );
    }
  }
}
const first = catalog.structures[0];
const valid = parseHref(
  makeStudyLink(catalog, 'whole-body', first.id, 'both'),
).params;
same(parseStudyLink({}).status, 'none');
same(parseStudyLink({ unrelated: 'not-copied' }).status, 'none');
same(
  parseStudyLink({ ...valid, unrelated: '<private>' }),
  parseStudyLink(valid),
);
for (const key of ['study', 'structure', 'side', 'source']) {
  const omitted = { ...valid };
  delete omitted[key];
  same(parseStudyLink(omitted).status, 'invalid');
  for (const value of [
    '',
    [valid[key]],
    [valid[key], valid[key]],
    '<script>',
    'x'.repeat(10000),
  ])
    same(parseStudyLink({ ...valid, [key]: value }).status, 'invalid');
}
for (const focus of ['', [], ['arteries', 'veins'], '../', 'x'.repeat(101)])
  same(parseStudyLink({ ...valid, focus }).status, 'invalid');
for (const study of ['0', '2', '01', ' 1'])
  same(parseStudyLink({ ...valid, study }).status, 'invalid');
for (const side of ['RIGHT', 'unspecified', '__proto__'])
  same(parseStudyLink({ ...valid, side }).status, 'invalid');
for (const params of [
  null,
  [],
  'study=1',
  Object.assign(Object.create(valid), { study: '1' }),
])
  same(parseStudyLink(params).status, 'invalid');
for (const key of ['study', 'structure', 'side', 'source', 'focus']) {
  const url = new URL(
    makeStudyLink(catalog, 'whole-body', first.id, 'both'),
    'https://atlas.invalid',
  );
  if (key === 'focus') url.searchParams.append(key, 'arteries');
  url.searchParams.append(key, url.searchParams.get(key));
  same(
    parseStudyLink(
      collectAppPageSearchParams(url.searchParams).pageSearchParams,
    ).status,
    'invalid',
  );
}
for (const region of [
  'missing',
  '__proto__',
  'constructor',
  '../../review',
  'https://outside.invalid',
]) {
  same(bodyStudyScope(catalog, region, 'both'), []);
  same(makeStudyLink(catalog, region, first.id, 'both'), null);
  same(
    resolveStudyLink(catalog, region, parseStudyLink(valid)).status,
    'rejected',
  );
}
same(makeStudyLink(catalog, 'whole-body', 'missing', 'both'), null);
same(
  resolveStudyLink(
    catalog,
    'whole-body',
    parseStudyLink({ ...valid, focus: 'missing' }),
  ).reason,
  'focus-unavailable',
);
same(
  resolveStudyLink(
    catalog,
    'whole-body',
    parseStudyLink({ ...valid, structure: 'missing' }),
  ).reason,
  'out-of-scope',
);
same(
  resolveStudyLink(catalog, 'whole-body', { status: 'none' }).status,
  'none',
);
same(
  resolveStudyLink(catalog, 'whole-body', { status: 'invalid' }).status,
  'rejected',
);
const wrongFocus = parseStudyLink({ ...valid, focus: 'arteries' });
const organ = catalog.structures.find((item) => item.system === 'organs');
const organParams = parseHref(
  makeStudyLink(catalog, 'whole-body', organ.id, 'both'),
).params;
same(
  resolveStudyLink(
    catalog,
    'whole-body',
    parseStudyLink({ ...organParams, focus: 'arteries' }),
  ).reason,
  'selection-not-in-focus',
);
check(wrongFocus.status === 'requested'); // A valid syntax is not an admission.
same(makeStudyLink(catalog, 'whole-body', first.id, 'invalid'), null);
same(
  studyDestinations(catalog, { ...first, id: 'missing' }, 'whole-body', 'both'),
  [],
);
same(JSON.stringify(catalog), before);

// Component/route wiring checks are offline, not browser interaction tests.
const explorer = await readFile('app/body-explorer.tsx', 'utf8');
const initializer = explorer.slice(
  explorer.indexOf('if (!appliedStudyLink.current)'),
  explorer.indexOf('setCatalog(value);'),
);
check(
  initializer.includes('resolveStudyLink(value, initialRegion, studyLink)'),
);
check(
  !initializer.includes('publishSelection') &&
    !initializer.includes('practiceDispatch'),
);
check(explorer.includes('if (!catalog || !linkedStudyReady)'));
for (const path of ['app/page.tsx', 'app/regions/[region]/page.tsx']) {
  const page = await readFile(path, 'utf8');
  check(page.includes('parseStudyLink((await searchParams) ?? {})'));
  check(
    page.includes('studyLinkKey(link)') && page.includes('studyLink={link}'),
  );
}
const report = {
  passed: true,
  assertions,
  links,
  focusedLinks,
  destinationsTested,
  rows,
  sourceGeometryChanged: false,
  catalogueSha256: hash(bytes),
  actualInstalledRuntimeDuplicateParsingTested: true,
  browserInteractionTesting: false,
  clinicalValidation: false,
  acquiredImagingIncluded: false,
};
await writeFile(
  'docs/study-links-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify({ ...report, rows: rows.length }, null, 2));
