import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';
import { contentContext } from './content-contract-tools.mjs';
import { prePelvicUrethralProfiles } from './pelvic-urethral-study-history.mjs';

export const clinicalReferenceRevisionHash = value =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

const detached = value => JSON.parse(JSON.stringify(value));

export function wholeBodyTeachingSnapshot(api, catalog) {
  const display = api.bodyDisplayCatalog(catalog);
  return {
    body: display.structures.map(structure => ({
      id: structure.id,
      sections: Object.fromEntries(
        api.contentTabs.map(topic => [topic, api.bodyLesson(structure, topic)]),
      ),
    })),
    shoulder: api.structures,
    // Compare the clinical-reference era, retaining a strict guard on the only
    // later recipe addition. This is not the current runtime recipe snapshot.
    recipes: prePelvicUrethralProfiles(api.dissectionProfiles, {allowOlder: true}),
  };
}

async function sourceModule() {
  const compiled = await build({
    stdin: {
      contents: `
        export { hraRenalClinicalReferences, hraRenalTopicFamilies, hraRenalClinicalConcepts, authoredHraRenalClinical } from './content/hra-renal-clinical.ts';
        export { renalConcepts, renalTeachingReferences } from './content/renal-teaching.ts';
        export { pelvicOrganImagingTopics, pelvicOrganReferences } from './content/pelvic-organ-imaging.ts';
      `,
      resolveDir: process.cwd(),
      loader: 'ts',
    },
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
  });
  return import(
    'data:text/javascript;base64,' +
      Buffer.from(compiled.outputFiles[0].text).toString('base64')
  );
}

export async function currentClinicalReferenceProjection() {
  const [source, context] = await Promise.all([sourceModule(), contentContext()]);
  const display = context.api.bodyDisplayCatalog(context.catalog);
  const urethra = display.structures.find(
    structure => structure.fmaId === 'FMA19667',
  );
  if (!urethra) throw Error('Pinned male urethra source is missing');
  const modalities = ['ct', 'mri', 'ultrasound', 'xray'];
  const renalUreteric = source.renalConcepts.find(
    concept => concept.id === 'renal-ureteric-arteries',
  );
  if (!renalUreteric) throw Error('Renal ureteric-artery concept is missing');
  const selected = {
    hra: {
      references: {
        trauma: source.hraRenalClinicalReferences.trauma,
        rcc: source.hraRenalClinicalReferences.rcc,
      },
      topicFamilies: {
        capsule: source.hraRenalTopicFamilies.capsule,
        hilum: source.hraRenalTopicFamilies.hilum,
      },
      concepts: {
        capsule: source.hraRenalClinicalConcepts.capsule,
        hilum: source.hraRenalClinicalConcepts.hilum,
      },
      authored: {
        capsule: source.authoredHraRenalClinical('capsule'),
        hilum: source.authoredHraRenalClinical('hilum'),
      },
    },
    nested: {
      references: {
        renalUreterInjury: source.renalTeachingReferences.renalUreterInjury,
      },
      concept: renalUreteric,
    },
    pelvic: {
      references: { urethra: source.pelvicOrganReferences.urethra },
      topics: source.pelvicOrganImagingTopics.urethra,
      identity: urethra,
      lessons: Object.fromEntries(
        modalities.map(topic => [
          topic,
          context.api.pelvicOrganImagingLesson(urethra, topic),
        ]),
      ),
    },
  };
  const fullSource = {
    hra: {
      references: source.hraRenalClinicalReferences,
      topicFamilies: source.hraRenalTopicFamilies,
      concepts: source.hraRenalClinicalConcepts,
    },
    nested: {
      references: source.renalTeachingReferences,
      concepts: source.renalConcepts,
    },
    pelvic: {
      references: source.pelvicOrganReferences,
      topics: source.pelvicOrganImagingTopics,
    },
  };
  const wholeBody = wholeBodyTeachingSnapshot(context.api, context.catalog);
  return detached({
    selected,
    selectedHash: clinicalReferenceRevisionHash(selected),
    fullSource,
    fullSourceHash: clinicalReferenceRevisionHash(fullSource),
    wholeBodyHash: clinicalReferenceRevisionHash(wholeBody),
  });
}

export async function readClinicalReferenceBaseline() {
  return JSON.parse(
    await readFile(
      new URL('../content/clinical-reference-revision.baseline.json', import.meta.url),
      'utf8',
    ),
  );
}

export async function readClinicalReferenceTransition() {
  return JSON.parse(
    await readFile(
      new URL('../content/clinical-reference-revision.transition.json', import.meta.url),
      'utf8',
    ),
  );
}
