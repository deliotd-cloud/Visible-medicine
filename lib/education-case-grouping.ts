export type EducationCaseQuestionRow = {
  caseId: string;
  questionId: string;
  prompt: string;
  maxMarks: number;
};

export function groupEducationCaseQuestions(
  rows: readonly EducationCaseQuestionRow[],
) {
  const grouped = new Map<
    string,
    {
      caseId: string;
      questions: Array<{ id: string; prompt: string; maxMarks: number }>;
      maxMarks: number;
    }
  >();
  for (const row of rows) {
    const existing = grouped.get(row.caseId) ?? {
      caseId: row.caseId,
      questions: [],
      maxMarks: 0,
    };
    if (!existing.questions.some((question) => question.id === row.questionId)) {
      existing.questions.push({
        id: row.questionId,
        prompt: row.prompt,
        maxMarks: row.maxMarks,
      });
      existing.maxMarks += row.maxMarks;
    }
    grouped.set(row.caseId, existing);
  }
  return [...grouped.values()];
}
