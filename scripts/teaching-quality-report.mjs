// Pure editorial checks for root-body teaching drafts. No fact, rights, readiness,
// publication, or clinical approval is inferred from this report.
const STATES = Object.freeze(['draft', 'identity-only', 'pending', 'generated-identification']);
const stateSet = new Set(STATES);
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const nonempty = (value, label) => {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${label} must be a nonempty string`);
  return value;
};
const counts = () => Object.fromEntries(STATES.map(state => [state, 0]));
const normalized = value => value.trim().replace(/\s+/gu, ' ').toLowerCase();
const placeholder = /\b(?:TODO|TBD|FIXME)\b/iu;
const citationURL = value => {
  if (typeof value !== 'string' || !/^https?:\/\/\S+$/iu.test(value)) return false;
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !!url.hostname; }
  catch { return false; }
};

/** `lessons` contains one resolved lesson per exact identity/topic placement. */
export function buildTeachingQualityReport({ lessons, sourceRevision }) {
  if (!Array.isArray(lessons)) throw new TypeError('lessons must be an array');
  nonempty(sourceRevision, 'sourceRevision');
  const seen = new Map();
  const sorted = lessons.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new TypeError(`lessons[${index}] must be an object`);
    const { identity, region, topic, lesson } = entry;
    nonempty(identity, `lessons[${index}].identity`);
    nonempty(region, `lessons[${index}].region`);
    nonempty(topic, `lessons[${index}].topic`);
    if (!lesson || typeof lesson !== 'object' || Array.isArray(lesson) || !stateSet.has(lesson.readiness))
      throw new TypeError(`lessons[${index}].lesson must have a known readiness`);
    const topicIds = seen.get(topic) ?? new Set();
    if (topicIds.has(identity)) throw new Error(`duplicate identity/topic: ${identity} / ${topic}`);
    topicIds.add(identity);
    seen.set(topic, topicIds);
    return { identity, region, topic, lesson };
  }).sort((a, b) => compare(a.region, b.region) || compare(a.topic, b.topic) || compare(a.identity, b.identity));

  const totals = counts();
  const byTopic = Object.fromEntries([...new Set(sorted.map(entry => entry.topic))].sort(compare).map(topic => [topic, counts()]));
  const issues = [];
  const fingerprints = new Map();
  const issue = (entry, field, code) => issues.push({ identity: entry.identity, region: entry.region, topic: entry.topic, field, code });
  const checkCitations = (entry, value, field) => {
    if (value === undefined || Array.isArray(value) && value.length === 0) { issue(entry, field, 'missing-citations'); return; }
    if (!Array.isArray(value)) throw new TypeError(`${field} must be an array`);
    value.forEach((citation, index) => { if (!citationURL(citation)) issue(entry, `${field}[${index}]`, 'malformed-citation'); });
  };
  const checkText = (entry, value, field) => {
    if (typeof value !== 'string') throw new TypeError(`${field} must be a string`);
    if (placeholder.test(value)) issue(entry, field, 'placeholder');
  };
  const checkBullets = (entry, value, field) => {
    if (value === undefined) return [];
    if (!Array.isArray(value) || value.some(option => typeof option !== 'string')) throw new TypeError(`${field} must be a string array`);
    value.forEach((option, index) => checkText(entry, option, `${field}[${index}]`));
    return value;
  };
  const checkQuiz = (entry, bullets, answer, field) => {
    if (answer !== undefined && typeof answer !== 'string') throw new TypeError(`${field}.correctAnswer must be a string`);
    if (answer === undefined) issue(entry, `${field}.correctAnswer`, 'quiz-without-scoring-key');
    else if (bullets.filter(option => option === answer).length !== 1)
      issue(entry, `${field}.correctAnswer`, 'quiz-answer-not-unique-option');
    const options = bullets.map(normalized);
    if (new Set(options).size !== options.length) issue(entry, `${field}.bullets`, 'duplicate-quiz-options');
  };

  for (const entry of sorted) {
    const { lesson } = entry;
    totals[lesson.readiness]++;
    byTopic[entry.topic][lesson.readiness]++;
    if (lesson.readiness !== 'draft') continue;
    checkText(entry, lesson.title, 'title');
    checkText(entry, lesson.body, 'body');
    const bullets = checkBullets(entry, lesson.bullets, 'bullets');
    checkCitations(entry, lesson.citations, 'citations');
    if (entry.topic === 'quiz') checkQuiz(entry, bullets, lesson.correctAnswer, 'lesson');
    if (lesson.additionalChecks !== undefined) {
      if (!Array.isArray(lesson.additionalChecks)) throw new TypeError('additionalChecks must be an array');
      lesson.additionalChecks.forEach((check, index) => {
        if (!check || typeof check !== 'object' || Array.isArray(check)) throw new TypeError(`additionalChecks[${index}] must be an object`);
        const field = `additionalChecks[${index}]`;
        checkText(entry, check.body, `${field}.body`);
        const options = checkBullets(entry, check.bullets, `${field}.bullets`);
        checkCitations(entry, check.citations, `${field}.citations`);
        checkQuiz(entry, options, check.correctAnswer, field);
      });
    }
    const fingerprint = JSON.stringify([normalized(lesson.body), bullets.map(normalized)]);
    if (normalized(lesson.body) || bullets.length) {
      const key = JSON.stringify([entry.topic, fingerprint]);
      const group = fingerprints.get(key) ?? [];
      group.push(entry.identity);
      fingerprints.set(key, group);
    }
  }
  issues.sort((a, b) => compare(a.region, b.region) || compare(a.topic, b.topic) ||
    compare(a.identity, b.identity) || compare(a.field, b.field) || compare(a.code, b.code));
  const repetitions = [...fingerprints].filter(([, identities]) => identities.length >= 3)
    .map(([key, identities]) => ({ topic: JSON.parse(key)[0], identities: [...identities].sort(compare), reviewOnly: true }))
    .sort((a, b) => compare(a.topic, b.topic) || compare(a.identities[0], b.identities[0]));
  return {
    schemaVersion: 1, scope: 'root-body-editorial', sourceRevision,
    placementCount: sorted.length, totals, byTopic, issues, issueCount: issues.length,
    repetitions,
    limitation: 'Editorial string checks only; citations are not fetched, and facts, rights, readiness, publication, and clinical approval are not validated.',
  };
}
