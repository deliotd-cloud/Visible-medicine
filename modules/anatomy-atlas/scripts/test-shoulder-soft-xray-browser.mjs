import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { shoulderSoftTissueXrayLesson } from '../lib/shoulder-soft-tissue-xray.ts';
import transition from '../content/shoulder-soft-tissue-xray-transition.json' with {type:'json'};
const [url, report] = process.argv.slice(2);
assert(url && report && ['localhost','127.0.0.1'].includes(new URL(url).hostname));
const inputs = await (await fetch(new URL('source-inputs.json', url))).json();
for (const path of ['app/anatomy-data.ts','lib/shoulder-soft-tissue-xray.ts'])
  assert.equal(inputs.find(input => input.path === path)?.sha256,
    createHash('sha256').update(await readFile(new URL('../'+path, import.meta.url))).digest('hex'));
const { chromium } = await import(process.env.VM_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({headless:true});
const cases = [], errors = [];
try {
  const page = await browser.newPage(); page.setDefaultTimeout(15000);
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [375, 1280]) for (const entry of transition.entries) {
    await page.setViewportSize({width, height:812});
    const address = new URL(url); address.searchParams.set('structure', entry.id);
    await page.goto(address.href); await page.locator('canvas').waitFor();
    await page.getByRole('button', {name:'Details', exact:true}).click();
    await page.getByRole('tab', {name:'Imaging', exact:true}).click();
    await page.getByRole('tab', {name:'X-ray', exact:true}).click();
    const lesson = shoulderSoftTissueXrayLesson(entry.id.split(':').at(-1));
    const note = page.locator('.shoulder-note:visible').filter({hasText:lesson.title});
    await note.getByText(lesson.body, {exact:true}).waitFor();
    assert((await note.innerText()).includes('No X-ray study loaded'));
    assert((await note.innerText()).includes('sign-off pending'));
    assert.equal(await note.getByRole('button', {name:/reference plane/}).count(), 0);
    assert.deepEqual(await note.locator('.clinical-list li').allTextContents(), lesson.bullets);
    assert.deepEqual(await note.locator('.body-reference-links a').evaluateAll(links => links.map(a => a.href)), lesson.citations);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Horizontal page overflow');
    cases.push({id:entry.id,width,passed:true});
  }
  assert.deepEqual(errors, []);
  await writeFile(report, JSON.stringify({passed:true,cases,errors,clinicalApproval:false},null,2)+'\n');
  console.log(`${cases.length} real shoulder X-ray cases passed at mobile/desktop widths.`);
} finally { await browser.close(); }
