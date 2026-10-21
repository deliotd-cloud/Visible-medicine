import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const REGIONS = ['head-neck', 'shoulder', 'female-pelvis', 'lower-limb'];
const SOURCE_REGIONS = { 'head-neck': 'head-neck', shoulder: 'shoulder-right', 'female-pelvis': 'independent-female-pelvis', 'lower-limb': 'independent-right-lower-limb' };
const SHA = /^[a-f0-9]{40}$/;
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const issue = (code, detail) => ({ code, detail });

export function parseDeclaredPackages(value) {
  if (!Array.isArray(value)) throw new Error('dependencies must be an array');
  const seen = new Set();
  return value.map((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row) ||
        !['name', 'version', 'license'].every(k => typeof row[k] === 'string' && row[k].trim()) ||
        Object.keys(row).some(k => !['name', 'version', 'license'].includes(k))) {
      throw new Error(`invalid dependency at index ${index}`);
    }
    const key = `${row.name}@${row.version}`;
    if (seen.has(key)) throw new Error(`duplicate dependency ${key}`);
    seen.add(key);
    return { name: row.name, version: row.version, license: row.license };
  });
}

export function parseDependencies(text) {
  return parseDeclaredPackages(JSON.parse(text));
}

function entries(text, format) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const re = format === 'learner'
    ? /^(@[^\s]+|[^@\s][^\s]*)@([^\s]+) \((.+)\)$/
    : /^## (\S+) (\d+\.\d+\.\d+(?:[-+][^\s]+)?) \((.+)\)$/;
  const headings = [];
  for (let i = 0; i < lines.length; i++) {
    const match = re.exec(lines[i]);
    if (match) headings.push({ name: match[1], version: match[2], license: match[3], line: i + 1 });
  }
  return { lines, headings };
}

export function parseNotice(text, format) {
  const { lines, headings } = entries(text, format);
  const records = headings.map((heading, index) => ({
    ...heading,
    body: lines.slice(heading.line, (headings[index + 1]?.line ?? lines.length + 1) - 1).join('\n').trim(),
  }));
  const seen = new Set();
  const problems = [];
  for (const row of records) {
    const key = `${row.name}@${row.version}`;
    if (seen.has(key)) problems.push(issue('duplicate-notice', `${key} line ${row.line}`));
    seen.add(key);
    if (!row.body) problems.push(issue('empty-notice', `${key} line ${row.line}`));
  }
  return { records, problems };
}

export function checkDependencies(dependencies, notice) {
  const problems = [...notice.problems];
  const byKey = new Map(notice.records.map(row => [`${row.name}@${row.version}`, row]));
  const declared = new Set(dependencies.map(row => `${row.name}@${row.version}`));
  for (const row of dependencies) {
    const key = `${row.name}@${row.version}`;
    const found = byKey.get(key);
    if (!found) problems.push(issue('missing-notice', key));
    else if (found.license !== row.license) problems.push(issue('license-expression-mismatch', `${key}: manifest=${row.license}; notice=${found.license}`));
  }
  for (const row of notice.records) {
    const key = `${row.name}@${row.version}`;
    if (!declared.has(key)) problems.push(issue('undeclared-notice', key));
  }
  return problems;
}

function readPinned(root, relative, inspected, problems) {
  const absolute = path.join(root, ...relative.split('/'));
  try {
    const bytes = fs.readFileSync(absolute);
    inspected.push({ path: relative, sha256: sha256(bytes), bytes: bytes.length });
    return bytes.toString('utf8');
  } catch (error) {
    problems.push(issue('missing-file', `${relative}: ${error.code ?? error.message}`));
    return null;
  }
}

function walkFiles(root, relative) {
  const absolute = path.join(root, ...relative.split('/'));
  if (!fs.existsSync(absolute)) return null;
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap(entry => {
    const next = `${relative}/${entry.name}`;
    return entry.isDirectory() ? walkFiles(root, next) : entry.isFile() ? [next] : [];
  }).sort();
}

function sourceManifest(text, expectedCommit, label, problems) {
  if (text === null) return null;
  try {
    const manifest = JSON.parse(text);
    if (!SHA.test(manifest.sourceCommit ?? '') || manifest.sourceCommit !== expectedCommit) {
      problems.push(issue('source-commit-mismatch', `${label}: ${manifest.sourceCommit ?? 'missing'}`));
    }
    return manifest;
  } catch (error) {
    problems.push(issue('invalid-manifest', `${label}: ${error.message}`));
    return null;
  }
}

export function audit(root, expectedCommit) {
  if (!SHA.test(expectedCommit)) throw new Error('expected sourceCommit must be a 40-character lowercase SHA');
  const websiteHead = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const websiteHeadExpected = 'b953ff3f5f1891599cb6e91cb91311d9d6006270';
  const inspected = [];
  const scopes = [];
  const globalProblems = [];
  if (websiteHead !== websiteHeadExpected) globalProblems.push(issue('website-head-mismatch', `${websiteHead} vs ${websiteHeadExpected}`));
  for (const region of REGIONS) {
    const base = `public/atlas-runtime/${region}`;
    const problems = [];
    const manifestText = readPinned(root, `${base}/manifest.json`, inspected, problems);
    const manifest = sourceManifest(manifestText, expectedCommit, region, problems);
    if (manifest && manifest.region !== SOURCE_REGIONS[region]) problems.push(issue('region-mismatch', `${region}: ${manifest.region ?? 'missing'}`));
    const dependenciesText = readPinned(root, `${base}/bundled-dependencies.json`, inspected, problems);
    const noticesText = readPinned(root, `${base}/BUNDLED_NOTICES.txt`, inspected, problems);
    const licenseFiles = walkFiles(root, `${base}/LICENSES`);
    if (!licenseFiles?.length) problems.push(issue('missing-licenses', base));
    else for (const file of licenseFiles) readPinned(root, file, inspected, problems);
    readPinned(root, `${base}/LICENSE`, inspected, problems);
    let dependencies = null;
    if (dependenciesText !== null) {
      try { dependencies = parseDependencies(dependenciesText); }
      catch (error) { problems.push(issue('invalid-dependencies', `${region}: ${error.message}`)); }
    }
    let notice = null;
    if (noticesText !== null) notice = parseNotice(noticesText, 'learner');
    if (dependencies && notice) problems.push(...checkDependencies(dependencies, notice));
    if (notice && !notice.records.length) problems.push(issue('unparsed-notices', region));
    if (manifest) for (const file of inspected.filter(row => row.path.startsWith(`${base}/`) && row.path !== `${base}/manifest.json`)) {
      const relative = file.path.slice(base.length + 1);
      const declared = manifest.files?.find(row => row.path === relative);
      if (!declared || declared.sha256 !== file.sha256) problems.push(issue('manifest-file-hash-mismatch', `${region}/${relative}: ${declared?.sha256 ?? 'missing'} vs ${file.sha256}`));
    }
    scopes.push({ scope: region, declaredPackages: dependencies?.length ?? null, parsedNotices: notice?.records.length ?? null, licenseFiles: licenseFiles?.length ?? 0, problems });
  }
  const reviewBase = 'public/atlas-review-viewer';
  const problems = [];
  const manifestText = readPinned(root, `${reviewBase}/manifest.json`, inspected, problems);
  const manifest = sourceManifest(manifestText, expectedCommit, 'review', problems);
  let reviewDependencies = null;
  if (manifest) {
    try { reviewDependencies = parseDeclaredPackages(manifest.packages); }
    catch (error) { problems.push(issue('invalid-review-packages', error.message)); }
  }
  const noticeText = readPinned(root, `${reviewBase}/THIRD_PARTY_NOTICES.txt`, inspected, problems);
  let reviewNotices = null;
  if (noticeText !== null) {
    if (!noticeText.includes(`Atlas source: ${expectedCommit}`)) problems.push(issue('notice-source-mismatch', 'Review notice source identity'));
    reviewNotices = parseNotice(noticeText, 'review');
    problems.push(...reviewNotices.problems);
    if (!reviewNotices.records.length) problems.push(issue('unparsed-notices', 'Review'));
  }
  if (reviewDependencies && reviewNotices) problems.push(...checkDependencies(reviewDependencies, reviewNotices));
  if (manifest && noticeText !== null) {
    const declaredNotice = manifest.files?.find(row => row.path === 'THIRD_PARTY_NOTICES.txt');
    const actual = inspected.find(row => row.path === `${reviewBase}/THIRD_PARTY_NOTICES.txt`)?.sha256;
    if (!declaredNotice || declaredNotice.sha256 !== actual) problems.push(issue('review-manifest-notice-hash-mismatch', `${declaredNotice?.sha256 ?? 'missing'} vs ${actual}`));
  }
  const observations = [];
  if (reviewNotices && scopes[0].parsedNotices !== null) {
    const firstNoticeText = fs.readFileSync(path.join(root, 'public/atlas-runtime/head-neck/BUNDLED_NOTICES.txt'), 'utf8');
    const learner = parseNotice(firstNoticeText, 'learner');
    const learnerMap = new Map(learner.records.map(row => [`${row.name}@${row.version}`, row]));
    const reviewMap = new Map(reviewNotices.records.map(row => [`${row.name}@${row.version}`, row]));
    for (const [key, row] of learnerMap) {
      const reviewRow = reviewMap.get(key);
      if (!reviewRow) observations.push(issue('review-package-differs-from-learner', key));
      else if (reviewRow.license !== row.license) observations.push(issue('review-license-expression-differs-from-learner', key));
    }
    for (const key of reviewMap.keys()) if (!learnerMap.has(key)) observations.push(issue('review-only-package', key));
  }
  scopes.push({ scope: 'review', declaredPackages: reviewDependencies?.length ?? null, parsedNotices: reviewNotices?.records.length ?? null, licenseFiles: null, problems,
    observations, limitation: 'Review manifest.packages is the emitted package declaration; this checks declared packages against notices, not actual bundle contents.' });
  return { schema: 'visible-medicine.runtime-notice-audit/1', websiteRoot: path.resolve(root), websiteHead, websiteHeadExpected, sourceCommit: expectedCommit,
    inspectedFiles: inspected.sort((a, b) => a.path.localeCompare(b.path)), scopes,
    globalProblems, allConsistent: globalProblems.length === 0 && scopes.every(scope => scope.problems.length === 0),
    limits: ['Notice text and declared package consistency only; no independent code bundle graph verification, source rights, attribution sufficiency, downstream licence obligations, clinical or release clearance.'] };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const [root, commit, output] = process.argv.slice(2);
  if (!root || !commit || !output) throw new Error('usage: node audit.mjs WEBSITE_ROOT SOURCE_COMMIT OUTPUT_JSON');
  fs.writeFileSync(output, `${JSON.stringify(audit(root, commit), null, 2)}\n`);
}
