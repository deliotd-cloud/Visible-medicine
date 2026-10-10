import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const SHA256 = /^[a-fA-F0-9]{64}$/;
const COMMIT = /^[a-fA-F0-9]{40}$/;
const MECHANISMS = new Set(['spread', 'extract', 'tray']);

/** Check a browser capture report. All geometry is rendered DOM pixels, not anatomy. */
export function validateDesktopExplodeEvidence(report) {
  const errors = [];
  let checks = 0;
  let labelCount = 0;
  const check = (condition, message) => {
    checks += 1;
    if (!condition) errors.push(message);
    return condition;
  };
  const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  const keys = (value, required, optional, at) => {
    if (!check(object(value), `${at} must be an object`)) return false;
    for (const key of required) check(Object.hasOwn(value, key), `${at}.${key} is required`);
    for (const key of Object.keys(value)) check(required.includes(key) || optional.includes(key), `${at}.${key} is unknown`);
    return true;
  };
  const text = (value, at) => check(typeof value === 'string' && value.trim().length > 0, `${at} must be a nonempty string`);
  const number = (value, low, high, at) => check(typeof value === 'number' && Number.isFinite(value)
    && value >= low && value <= high, `${at} must be finite and between ${low} and ${high}`);
  const hash = (value, expression, at) => check(typeof value === 'string' && expression.test(value), `${at} has invalid hex digest`);
  const positive = (value, at) => number(value, Number.MIN_VALUE, Number.MAX_VALUE, at);
  const result = () => ({
    ok: errors.length === 0, errors, checks, cases: Array.isArray(report?.cases) ? report.cases.length : 0,
    labels: labelCount, anatomicalValidation: false, cameraSmoothnessProven: false,
  });

  if (!keys(report, ['schema', 'sourceCommit', 'websiteCommit', 'runtimeManifestSha256', 'scope', 'viewport', 'cases'], ['metadata'], 'report')) return result();
  check(report.schema === 'vm-desktop-explode-qa/1', 'report.schema must be vm-desktop-explode-qa/1');
  hash(report.sourceCommit, COMMIT, 'report.sourceCommit');
  hash(report.websiteCommit, COMMIT, 'report.websiteCommit');
  hash(report.runtimeManifestSha256, SHA256, 'report.runtimeManifestSha256');
  text(report.scope, 'report.scope');
  if (keys(report.viewport, ['width', 'height'], [], 'report.viewport')) {
    positive(report.viewport.width, 'report.viewport.width');
    positive(report.viewport.height, 'report.viewport.height');
  }
  if (Object.hasOwn(report, 'metadata') && keys(report.metadata, [], ['notes', 'consoleErrors', 'observedWarnings'], 'report.metadata')) {
    for (const key of ['notes', 'consoleErrors', 'observedWarnings']) {
      if (!Object.hasOwn(report.metadata, key)) continue;
      if (check(Array.isArray(report.metadata[key]), `report.metadata.${key} must be an array`)) {
        report.metadata[key].forEach((item, index) => check(typeof item === 'string', `report.metadata.${key}[${index}] must be a string`));
      }
    }
  }
  if (!check(Array.isArray(report.cases) && report.cases.length > 0, 'report.cases must be a nonempty array')) return result();

  const ids = new Set();
  report.cases.forEach((sample, index) => {
    const at = `report.cases[${index}]`;
    if (!keys(sample, ['id', 'mechanism', 'amount', 'cameraView', 'page', 'labels', 'screenshotSha256', 'domSha256'], [], at)) return;
    if (text(sample.id, `${at}.id`)) {
      check(!ids.has(sample.id), `${at}.id is duplicated`);
      ids.add(sample.id);
    }
    check(MECHANISMS.has(sample.mechanism), `${at}.mechanism must be spread, extract, or tray`);
    number(sample.amount, 0, 100, `${at}.amount`);
    text(sample.cameraView, `${at}.cameraView`);
    hash(sample.screenshotSha256, SHA256, `${at}.screenshotSha256`);
    hash(sample.domSha256, SHA256, `${at}.domSha256`);

    if (keys(sample.page, ['scrollWidth', 'scrollHeight', 'viewportWidth', 'viewportHeight'], [], `${at}.page`)) {
      for (const key of ['scrollWidth', 'scrollHeight', 'viewportWidth', 'viewportHeight']) positive(sample.page[key], `${at}.page.${key}`);
      if (['scrollWidth', 'scrollHeight', 'viewportWidth', 'viewportHeight'].every((key) => Number.isFinite(sample.page[key]))) {
        check(sample.page.scrollWidth <= sample.page.viewportWidth + 1, `${at}.page has horizontal overflow`);
        check(sample.page.scrollHeight <= sample.page.viewportHeight + 1, `${at}.page has vertical overflow`);
      }
      if (object(report.viewport)) {
        check(sample.page.viewportWidth === report.viewport.width, `${at}.page.viewportWidth differs from report.viewport.width`);
        check(sample.page.viewportHeight === report.viewport.height, `${at}.page.viewportHeight differs from report.viewport.height`);
      }
    }

    if (!keys(sample.labels, ['width', 'height', 'items'], [], `${at}.labels`)) return;
    const { width, height, items } = sample.labels;
    positive(width, `${at}.labels.width`);
    positive(height, `${at}.labels.height`);
    if (!check(Array.isArray(items), `${at}.labels.items must be an array`)) return;
    labelCount += items.length;
    const boxes = [];
    items.forEach((item, labelIndex) => {
      const labelAt = `${at}.labels.items[${labelIndex}]`;
      if (!keys(item, ['name', 'side', 'anchor', 'box'], [], labelAt)) return;
      text(item.name, `${labelAt}.name`);
      check(item.side === 'left' || item.side === 'right', `${labelAt}.side must be left or right`);
      if (keys(item.anchor, ['x', 'y'], [], `${labelAt}.anchor`)) {
        number(item.anchor.x, -1, width + 1, `${labelAt}.anchor.x`);
        number(item.anchor.y, -1, height + 1, `${labelAt}.anchor.y`);
        if (Number.isFinite(item.anchor.x) && Number.isFinite(width)) {
          if (item.side === 'left') check(item.anchor.x <= width / 2 + 1, `${labelAt}.anchor is on the wrong side`);
          if (item.side === 'right') check(item.anchor.x >= width / 2 - 1, `${labelAt}.anchor is on the wrong side`);
        }
      }
      if (!keys(item.box, ['x', 'y', 'width', 'height'], [], `${labelAt}.box`)) return;
      const box = item.box;
      number(box.x, -1, width + 1, `${labelAt}.box.x`);
      number(box.y, -1, height + 1, `${labelAt}.box.y`);
      positive(box.width, `${labelAt}.box.width`);
      positive(box.height, `${labelAt}.box.height`);
      if (![box.x, box.y, box.width, box.height, width, height].every(Number.isFinite)) return;
      check(box.x + box.width <= width + 1, `${labelAt}.box exits overlay horizontally`);
      check(box.y + box.height <= height + 1, `${labelAt}.box exits overlay vertically`);
      if (item.side === 'left') check(box.x + box.width <= width / 2 + 1, `${labelAt}.box crosses into right half`);
      if (item.side === 'right') check(box.x >= width / 2 - 1, `${labelAt}.box crosses into left half`);
      for (const previous of boxes) {
        const overlapX = Math.min(box.x + box.width, previous.x + previous.width) - Math.max(box.x, previous.x);
        const overlapY = Math.min(box.y + box.height, previous.y + previous.height) - Math.max(box.y, previous.y);
        check(overlapX <= 1 || overlapY <= 1, `${labelAt}.box overlaps another label box`);
      }
      boxes.push(box);
    });
  });
  return result();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node scripts/desktop-explode-evidence.mjs REPORT.json');
    const report = JSON.parse(await readFile(process.argv[2], 'utf8'));
    const summary = validateDesktopExplodeEvidence(report);
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    if (!summary.ok) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
