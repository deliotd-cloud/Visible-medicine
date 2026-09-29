import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { build } from './workspace-component-test-build.mjs';

const root = new URL('../', import.meta.url);
const [base, report = fileURLToPath(new URL('docs/lower-limb-bone-reasoning-browser-validation.json', root))] = process.argv.slice(2);
assert(base && ['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Local source QA server required');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const inputs = await (await fetch(new URL('source-inputs.json', base))).json();
const sourceHashes = {};
for (const path of ['lib/lower-limb-bone-reasoning.ts', 'lib/upper-limb-bone-reasoning.ts', 'lib/reasoning-questions.ts', 'app/body-explorer.tsx', 'app/reasoning-feedback.tsx']) {
  sourceHashes[path] = sha256(await readFile(new URL(path, root)));
  assert.equal(inputs.find(input => input.path === path)?.sha256, sourceHashes[path], `QA source bound to ${path}`);
}
const bundled = await build({ stdin: { contents: `export * from './lib/lower-limb-bone-reasoning'; export * from './lib/upper-limb-bone-reasoning';`, resolveDir: fileURLToPath(root), loader: 'ts' }, bundle: true, platform: 'node', format: 'cjs', write: false });
const module = { exports: {} };
runInNewContext(bundled.outputFiles[0].text, { require: createRequire(new URL('package.json', root)), module, exports: module.exports });
const { lowerLimbBoneReasoningConcepts: lowerConcepts, upperLimbBoneReasoningConcepts: upperConcepts } = module.exports;
const concepts = [...upperConcepts, ...lowerConcepts];
const catalog = JSON.parse(await readFile(new URL('public/models/bodyparts3d/full-body/catalog.json', root), 'utf8'));
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
  for (const [region, width, height, touch, textScale] of [
    ['leg', 1280, 900, false, 1], ['foot', 375, 812, true, 1], ['whole-body', 320, 480, true, 2],
  ]) {
    const expected = Array.from(concepts).filter(c => region === 'whole-body' || (c.sourceRegions ?? [c.region]).includes(region));
    const expectedKeys = expected.map(c => c.key).sort();
    const total = expected.length;
    assert.equal(total, region === 'whole-body' ? 13 : 4);
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch });
    const page = await context.newPage(); page.setDefaultTimeout(45000);
    page.on('pageerror', error => evidence.errors.push({ region, width, message: error.message }));
    page.on('requestfailed', request => evidence.resourceFailures.push({ region, width, url: request.url(), error: request.failure()?.errorText }));
    await page.goto(new URL('/qa', base).href);
    const address = new URL(base); address.search = `?region=${region}`;
    await page.locator('iframe').evaluate((element, url) => { element.src = url; }, address.href);
    await page.waitForFunction(url => document.querySelector('iframe')?.contentWindow.location.href === url && document.querySelector('iframe')?.contentDocument.querySelector('.body-toolbar'), address.href);
    const frame = page.frames().find(candidate => candidate.url() === address.href); assert(frame);
    if (textScale !== 1) await frame.locator('html').evaluate((element, scale) => { element.style.fontSize = `${100 * scale}%`; }, textScale);
    const tools = frame.getByRole('button', { name: 'Systems & tools', exact: true });
    if (await tools.isVisible()) await tools.click();
    const filters = {};
    for (const name of ['Bones', 'Muscles', 'Organs', 'Nervous', 'Vessels', 'Connective']) {
      const control = frame.getByRole('switch', { name: `Show ${name}`, exact: true });
      await control.waitFor();
      const desired = name === 'Bones';
      if (await control.getAttribute('aria-disabled') === 'true') {
        const system = { Bones: 'skeleton', Muscles: 'muscles', Organs: 'organs', Nervous: 'nerves', Vessels: 'vessels', Connective: 'connective' }[name];
        const count = catalog.structures.filter(s => s.system === system && (region === 'whole-body' || s.regions.includes(region))).length;
        assert.equal(count, 0, 'Only zero-entry systems may be unavailable before practice');
        filters[name] = { unavailable: true, entries: count, checked: await control.getAttribute('aria-checked') === 'true' };
        continue;
      }
      if ((await control.getAttribute('aria-checked') === 'true') !== desired) await control.click();
      assert.equal(await control.getAttribute('aria-checked'), String(desired), `Normal UI filter ${name}`);
      filters[name] = desired;
    }
    const closeTools = frame.getByRole('button', { name: 'Close systems & tools', exact: true });
    if (await closeTools.isVisible()) await closeTools.click();
    await frame.getByText('Practice', { exact: true }).click();
    await frame.getByRole('combobox', { name: 'Practice answer mode', exact: true }).click();
    await frame.getByRole('option', { name: 'Apply anatomy · draft', exact: true }).click();
    const length = frame.getByRole('combobox', { name: 'Practice session length', exact: true });
    await length.click();
    await frame.getByRole('option', { name: '20 questions', exact: true }).click();
    await frame.getByRole('button', { name: `Start ${total} questions`, exact: true }).click();
    const caseEvidence = { region, width, height, touch, textScale, filters, expectedConcepts: expectedKeys, questions: [], retryQuestions: [], completedScore: null, retryScore: null, noHorizontalOverflow: null };
    evidence.cases.push(caseEvidence);
    let score = 0;
    const missed = [];
    async function answerQuestion(index, count, retry = false) {
      const heading = frame.locator('[data-practice-question]:visible'); await heading.waitFor();
      assert.equal(await heading.getAttribute('aria-label'), `Question ${index + 1} of ${count}`);
      const promptId = await heading.getAttribute('aria-describedby');
      const prompt = (await frame.locator(`[id="${promptId}"]`).innerText()).trim();
      const concept = expected.find(c => c.prompt === prompt); assert(concept, `Authored bone prompt: ${prompt}`);
      const choices = frame.locator('.vm-practice-choices:visible button'); await choices.first().waitFor();
      const labels = await choices.allTextContents();
      const correctLabels = concept.bindings.map(b => catalog.structures.find(s => s.fmaId === b.fma)?.name).filter(Boolean);
      const correctRegex = new RegExp(`^(?:${correctLabels.map(escape).join('|')})$`);
      const correctLabel = labels.find(label => correctRegex.test(label)); assert(correctLabel, `Exact source answer for ${concept.key}`);
      const target = catalog.structures.find(s => s.name === correctLabel); assert(target);
      const choiceCount = concept.key.startsWith('upper-limb-bone-') ? 5 : 4;
      assert.equal(labels.length, choiceCount);
      assert.equal(new Set(labels).size, choiceCount);
      for (const label of labels) {
        const choice = catalog.structures.find(s => s.name === label); assert(choice);
        assert.equal(choice.system, 'skeleton'); assert.equal(choice.category, 'bone');
        assert.equal(choice.laterality, target.laterality, 'Same-side actual UI choices');
        assert(region === 'whole-body' || choice.regions.includes(region), 'Choice within requested region');
        const choiceConcept = expected.find(c => c.bindings.some(b => b.fma === choice.fmaId)); assert(choiceConcept);
        assert(choiceConcept.key === concept.key || concept.distractors.includes(choiceConcept.key));
      }
      assert.equal(await frame.locator('.vm-reasoning-feedback:visible').count(), 0, 'No explanation before answer');
      const incorrect = !retry && index % 2 === 0;
      if (incorrect) missed.push(concept.key);
      const chosen = incorrect ? labels.find(label => !correctRegex.test(label)) : correctLabel;
      await choices.filter({ hasText: new RegExp(`^${escape(chosen)}$`) }).click();
      const feedback = frame.locator('[data-practice-feedback]:visible'); await feedback.waitFor();
      assert.equal((await feedback.locator(':scope > strong').innerText()).trim(), incorrect ? 'Not quite' : 'Correct');
      if (incorrect) assert((await feedback.innerText()).includes(`Correct answer: ${correctLabel}`));
      assert((await feedback.locator('.vm-reasoning-feedback > p').innerText()).includes(concept.explanation));
      await feedback.getByText('Sources & scope', { exact: true }).click();
      const scope = await feedback.locator('.vm-reasoning-feedback').innerText();
      assert(scope.includes('review pending')); assert(scope.includes('Not') && scope.includes('validated assessment'));
      assert.deepEqual(await feedback.locator('.vm-reasoning-feedback a').evaluateAll(links => links.map(link => link.href)), Array.from(concept.references, reference => reference.url));
      assert.equal(await frame.locator('.vm-practice-choices:visible').count(), 0, 'Answered choices unavailable');
      if (!incorrect) score++;
      assert.equal((await frame.locator('.body-practice-score:visible strong').innerText()).replace(/\s+/g, ''), `${score}/${index + 1}`);
      (retry ? caseEvidence.retryQuestions : caseEvidence.questions).push({ index: index + 1, key: concept.key, target: correctLabel, targetId: target.id, side: target.laterality, choices: labels, chosen, correct: !incorrect, feedbackAndCitations: true, draftGate: true, answerOnce: true });
      await feedback.getByRole('button', { name: index + 1 === count ? 'Finish practice' : 'Next question', exact: true }).click();
    }
    for (let index = 0; index < total; index++) await answerQuestion(index, total);
    assert.deepEqual(caseEvidence.questions.map(q => q.key).sort(), expectedKeys, 'Every eligible bone concept exercised once');
    const results = frame.getByRole('region', { name: 'Completed practice results', exact: true });
    await results.waitFor(); assert((await results.innerText()).includes(`${score} / ${total} correct.`));
    caseEvidence.completedScore = `${score}/${total}`;
    await results.getByRole('button', { name: `Retry missed (${missed.length} available)`, exact: true }).click();
    score = 0;
    for (let index = 0; index < missed.length; index++) await answerQuestion(index, missed.length, true);
    assert.deepEqual(caseEvidence.retryQuestions.map(q => q.key).sort(), [...missed].sort());
    await results.waitFor(); assert((await results.innerText()).includes(`${missed.length} / ${missed.length} correct.`));
    caseEvidence.retryScore = `${score}/${missed.length}`;
    caseEvidence.noHorizontalOverflow = await frame.locator('html').evaluate(element => element.scrollWidth <= innerWidth + 1);
    assert(caseEvidence.noHorizontalOverflow);
    await context.close();
  }
  assert.deepEqual(evidence.errors, [], 'No browser page errors');
  evidence.passed = true;
} catch (error) { evidence.failure = error.message; throw error; }
finally { await browser.close(); await writeFile(report, JSON.stringify(evidence, null, 2) + '\n'); }
console.log(JSON.stringify({ passed: evidence.passed, cases: evidence.cases.length, questions: evidence.cases.map(c => c.questions.length), retries: evidence.cases.map(c => c.retryQuestions.length), scores: evidence.cases.map(c => c.completedScore), sourceHashes }, null, 2));
