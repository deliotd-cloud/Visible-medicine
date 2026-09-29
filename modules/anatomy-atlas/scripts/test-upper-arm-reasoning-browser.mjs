import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { build } from './workspace-component-test-build.mjs';

const root = new URL('../', import.meta.url);
const [base, report = fileURLToPath(new URL('docs/evidence/upper-arm-reasoning-browser-20260929.json', root))] = process.argv.slice(2);
assert(base && ['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Local source QA server required');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const inputs = await (await fetch(new URL('source-inputs.json', base))).json();
const sourceHashes = {};
for (const path of ['lib/upper-arm-reasoning.ts', 'lib/reasoning-questions.ts', 'app/body-explorer.tsx', 'app/reasoning-feedback.tsx']) {
  sourceHashes[path] = sha256(await readFile(new URL(path, root)));
  assert.equal(inputs.find(input => input.path === path)?.sha256, sourceHashes[path], `QA source bound to ${path}`);
}
const bundled = await build({ stdin: { contents: `export * from './lib/reasoning-questions'; export * from './lib/upper-arm-reasoning';`, resolveDir: fileURLToPath(root), loader: 'ts' }, bundle: true, platform: 'node', format: 'cjs', write: false });
const module = { exports: {} };
runInNewContext(bundled.outputFiles[0].text, { require: createRequire(new URL('package.json', root)), module, exports: module.exports });
const { reasoningConcepts, upperArmReasoningConcepts } = module.exports;
const catalog = JSON.parse(await readFile(new URL('public/models/bodyparts3d/full-body/catalog.json', root), 'utf8'));
const expectedKeys = Array.from(upperArmReasoningConcepts, concept => concept.key).sort();
const { chromium } = await import(process.env.VM_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true });
const priorAttempts = [];
try {
  const prior = JSON.parse(await readFile(report, 'utf8'));
  priorAttempts.push(...(prior.priorAttempts ?? []));
  if (prior.failure) priorAttempts.push({ failure: prior.failure, sourceHashes: prior.sourceHashes, completedQuestionCounts: prior.cases.map(c => c.questions.length) });
} catch (error) { if (error.code !== 'ENOENT') throw error; }
const evidence = { schemaVersion: 1, sourceServer: base, sourceHashes, sourceInputs: inputs.length, priorAttempts, cases: [], errors: [], resourceFailures: [], failure: null, passed: false, clinicalApproval: false, educatorApproval: false, spatialValidation: false, deploymentValidation: false };
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
try {
  for (const [width, height, touch, textScale = 1] of [[1280, 900, false], [375, 812, true], [320, 480, true, 2]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch });
    const page = await context.newPage(); page.setDefaultTimeout(45000);
    page.on('pageerror', error => evidence.errors.push({ width, message: error.message }));
    page.on('requestfailed', request => evidence.resourceFailures.push({ width, url: request.url(), error: request.failure()?.errorText }));
    await page.goto(new URL('/qa', base).href);
    const address = new URL(base); address.search = '?region=shoulder-arm';
    await page.locator('iframe').evaluate((element, url) => { element.src = url; }, address.href);
    await page.waitForFunction(url => document.querySelector('iframe')?.contentWindow.location.href === url && document.querySelector('iframe')?.contentDocument.querySelector('.body-toolbar'), address.href);
    const frame = page.frames().find(candidate => candidate.url() === address.href); assert(frame);
    if (textScale !== 1) await frame.locator('html').evaluate((element, scale) => { element.style.fontSize = `${100 * scale}%`; }, textScale);
    await frame.getByText('Practice', { exact: true }).click();
    await frame.getByRole('combobox', { name: 'Practice answer mode', exact: true }).click();
    await frame.getByRole('option', { name: 'Apply anatomy · draft', exact: true }).click();
    const lengthControl = frame.getByRole('combobox', { name: 'Practice session length', exact: true });
    assert.equal(await lengthControl.count(), 1, 'One session length control, no header duplicate');
    assert(await lengthControl.evaluate(element => Boolean(element.closest('.vm-practice-options'))), 'Session length belongs to the setup panel');
    for (const count of [10, 5, 20]) {
      await lengthControl.click();
      await frame.getByRole('option', { name: `${count} questions`, exact: true }).click();
      await frame.getByRole('button', { name: `Start ${count} questions`, exact: true }).waitFor();
      if (touch) await frame.getByRole('button', { name: 'Close practice', exact: true }).waitFor();
    }
    await frame.getByRole('button', { name: 'Start 20 questions', exact: true }).click();
    const caseEvidence = { width, height, touch, textScale, sessionLengthChanges: [10, 5, 20], controlInsideSetup: true, region: 'shoulder-arm', questions: [], retryQuestions: [], newConcepts: [], completedScore: null, retryScore: null, noHorizontalOverflow: null };
    evidence.cases.push(caseEvidence);
    let score = 0, newOrdinal = 0;
    const missed = [];
    async function answerQuestion(index, total, retry = false) {
      const heading = frame.locator('[data-practice-question]:visible');
      await heading.waitFor();
      assert.equal(await heading.getAttribute('aria-label'), `Question ${index + 1} of ${total}`);
      const promptId = await heading.getAttribute('aria-describedby');
      const prompt = (await frame.locator(`[id="${promptId}"]`).innerText()).trim();
      const concept = reasoningConcepts.find(candidate => candidate.prompt === prompt); assert(concept, `Authored prompt: ${prompt}`);
      const choices = frame.locator('.vm-practice-choices:visible button');
      await choices.first().waitFor();
      const labels = await choices.allTextContents();
      const correctLabels = concept.bindings.map(binding => catalog.structures.find(s => s.fmaId === binding.fma)?.name).filter(Boolean);
      const correctRegex = new RegExp(`^(?:${correctLabels.map(escape).join('|')})$`);
      const correctLabel = labels.find(label => correctRegex.test(label)); assert(correctLabel, `Exact authored answer for ${concept.key}`);
      const structure = catalog.structures.find(s => s.name === correctLabel); assert(structure);
      assert(labels.every(label => catalog.structures.find(s => s.name === label)?.laterality === structure.laterality), 'Same-side choices in actual UI');
      assert.equal(labels.length, 4);
      assert.equal(await frame.locator('.vm-reasoning-feedback:visible').count(), 0, 'No explanation before response');
      const isNew = expectedKeys.includes(concept.key);
      const incorrect = !retry && isNew && newOrdinal++ % 2 === 0;
      if (incorrect) missed.push(concept.key);
      if (!retry && isNew) caseEvidence.newConcepts.push(concept.key);
      const chosen = incorrect ? labels.find(label => !correctRegex.test(label)) : correctLabel;
      await choices.filter({ hasText: new RegExp(`^${escape(chosen)}$`) }).click();
      const feedback = frame.locator('[data-practice-feedback]:visible'); await feedback.waitFor();
      assert.equal((await feedback.locator(':scope > strong').innerText()).trim(), incorrect ? 'Not quite' : 'Correct');
      if (incorrect) assert((await feedback.innerText()).includes(`Correct answer: ${correctLabel}`));
      assert((await feedback.locator('.vm-reasoning-feedback > p').innerText()).includes(concept.explanation));
      await feedback.getByText('Sources & scope', { exact: true }).click();
      assert((await feedback.locator('.vm-reasoning-feedback').innerText()).includes('review pending'));
      assert.deepEqual(await feedback.locator('.vm-reasoning-feedback a').evaluateAll(links => links.map(link => link.href)), Array.from(concept.references, reference => reference.url));
      assert.equal(await frame.locator('.vm-practice-choices:visible').count(), 0, 'Answered choices unavailable to change response');
      if (!incorrect) score++;
      assert.equal((await frame.locator('.body-practice-score:visible strong').innerText()).replace(/\s+/g, ''), `${score}/${index + 1}`);
      (retry ? caseEvidence.retryQuestions : caseEvidence.questions).push({ index: index + 1, key: concept.key, prompt, target: correctLabel, choices: labels, chosen, correct: !incorrect, feedbackAndCitations: true, answerOnce: true });
      await feedback.getByRole('button', { name: index + 1 === total ? 'Finish practice' : 'Next question', exact: true }).click();
    }
    for (let index = 0; index < 20; index++) await answerQuestion(index, 20);
    assert.deepEqual([...caseEvidence.newConcepts].sort(), expectedKeys, 'All seven new concepts exercised exactly once');
    const results = frame.getByRole('region', { name: 'Completed practice results', exact: true });
    await results.waitFor(); assert((await results.innerText()).includes(`${score} / 20 correct.`));
    caseEvidence.completedScore = `${score}/20`;
    await results.getByRole('button', { name: `Retry missed (${missed.length} available)`, exact: true }).click();
    score = 0;
    for (let index = 0; index < missed.length; index++) await answerQuestion(index, missed.length, true);
    assert.deepEqual(caseEvidence.retryQuestions.map(q => q.key).sort(), [...missed].sort(), 'Retry contains only missed concepts');
    await results.waitFor(); assert((await results.innerText()).includes(`${missed.length} / ${missed.length} correct.`));
    caseEvidence.retryScore = `${score}/${missed.length}`;
    caseEvidence.noHorizontalOverflow = await frame.locator('html').evaluate(element => element.scrollWidth <= innerWidth + 1);
    assert(caseEvidence.noHorizontalOverflow);
    await context.close();
  }
  assert.deepEqual(evidence.errors, [], 'No browser page errors');
  evidence.passed = true;
} catch (error) {
  evidence.failure = error.message;
  throw error;
} finally {
  await browser.close();
  await writeFile(report, JSON.stringify(evidence, null, 2) + '\n');
}
console.log(JSON.stringify({ passed: evidence.passed, cases: evidence.cases.length, questions: evidence.cases.map(c => c.questions.length), retries: evidence.cases.map(c => c.retryQuestions.length), scores: evidence.cases.map(c => c.completedScore), sourceHashes }, null, 2));
