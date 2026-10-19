// Deterministic two-mark rule. Clinical key approval is a separate workflow.
export const PAPER_CASES = 50;
export const CASE_MARKS = 2;
export const PAPER_MARKS = PAPER_CASES * CASE_MARKS;
export const normalizeBoneAnswer = value => typeof value === 'string' ? value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ') : '';

export function decodeFractureResponse(raw) {
  try {
    const r = JSON.parse(raw);
    if (!r || Object.keys(r).sort().join(',') !== 'bone,choice,submitted' || ![null,'yes','no'].includes(r.choice) || typeof r.bone !== 'string' || r.bone.length > 300 || typeof r.submitted !== 'boolean' || (r.submitted && r.choice === null)) throw Error();
    return r;
  } catch { return {choice:null, bone:'', submitted:false}; }
}

/** Returns no mark for a pending key or an unsubmitted response. */
export function scoreFracture(key, response) {
  if (!response?.submitted || !['yes','no'].includes(response.choice)) return {status:'unanswered', marks:null};
  if (!key || key.status !== 'reviewed' || typeof key.fracturePresent !== 'boolean') return {status:'pending-key', marks:null};
  if ((response.choice === 'yes') !== key.fracturePresent) return {status:'scored', marks:0};
  if (!key.fracturePresent) return {status:'scored', marks:2};
  if (!Array.isArray(key.acceptedBoneAnswers) || !key.acceptedBoneAnswers.length || key.acceptedBoneAnswers.some(a => !normalizeBoneAnswer(a))) return {status:'pending-key', marks:null};
  const answer = normalizeBoneAnswer(response.bone);
  // Whole-response alternatives only: no substring, fuzzy or AI matching.
  return {status:'scored', marks: key.acceptedBoneAnswers.some(a => normalizeBoneAnswer(a) === answer) ? 2 : 1};
}

export function scorePaper(cases) {
  if (!Array.isArray(cases) || cases.length !== PAPER_CASES || new Set(cases.map(c => c.id)).size !== PAPER_CASES) throw Error('PAPER_REQUIRES_50_UNIQUE_CASES');
  const results = cases.map(c => scoreFracture(c.key, c.response));
  return {maxMarks:PAPER_MARKS, marks:results.every(r => r.status === 'scored') ? results.reduce((n,r) => n + r.marks,0) : null, results};
}
