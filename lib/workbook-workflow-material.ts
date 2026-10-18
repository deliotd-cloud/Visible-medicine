// A closed SQL expression shared by the read-only authoring snapshot and its
// transactional compare-and-swap. Identities are code-owned, never user SQL.
export function workbookWorkflowMaterialSql(identity: "w.id" | "workbooks.id", coreVersion: string) {
  const core = "'" + coreVersion.replaceAll("'", "''") + "'";
  return `SELECT json_object(
    'schema','vm-workbook-material-1','coreVersion',${core},
    'workbook',json_object('id',material.id,'moduleId',material.module_id,'title',material.title,'mode',material.mode,'version',material.version,'durationMinutes',material.duration_minutes,'dualDisplayAllowed',material.dual_display_allowed),
    'courseId',(SELECT course_id FROM modules WHERE id=material.module_id),
    'authorId',(SELECT author_id FROM workbook_authorship WHERE workbook_id=material.id),
    'cases',json((SELECT json_group_array(json_object('id',linked_id,'title',title,'classification',classification,'status',status,'version',version,'description',description,'visualKind',visual_kind,'toolsJson',tools_json,'publicationHash',publication_hash,'deidentified',deidentified,'publicationCleared',publication_cleared,'position',position)) FROM
      (SELECT c.*,wc.case_id AS linked_id,wc.position FROM workbook_cases wc LEFT JOIN cases c ON c.id=wc.case_id WHERE wc.workbook_id=material.id ORDER BY wc.position,wc.case_id))),
    'questions',json((SELECT json_group_array(json_object('id',id,'caseId',case_id,'prompt',prompt,'maxMarks',max_marks,'version',version,'responseType',response_type,'optionsJson',options_json,'position',position,'editedPrompt',edited_prompt,'editedRevision',edited_revision)) FROM
      (SELECT q.*,e.prompt AS edited_prompt,e.revision AS edited_revision,wc.position AS case_position FROM workbook_cases wc JOIN questions q ON q.case_id=wc.case_id LEFT JOIN workbook_draft_question_edits e ON e.workbook_id=wc.workbook_id AND e.question_id=q.id WHERE wc.workbook_id=material.id ORDER BY wc.position,q.position,q.id))),
    'rubrics',json((SELECT json_group_array(json_object('id',id,'questionId',question_id,'version',version,'criteriaJson',criteria_json)) FROM
      (SELECT r.* FROM workbook_cases wc JOIN questions q ON q.case_id=wc.case_id JOIN rubrics r ON r.question_id=q.id WHERE wc.workbook_id=material.id AND r.status='published' ORDER BY r.question_id,r.version DESC,r.id DESC))),
    'notes',json((SELECT json_group_array(json_object('caseId',case_id,'title',title,'body',body,'keyPointsJson',key_points_json,'revealText',reveal_text,'position',position)) FROM
      (SELECT n.* FROM workbook_cases wc JOIN teaching_notes n ON n.case_id=wc.case_id WHERE wc.workbook_id=material.id ORDER BY wc.position,n.position,n.id))),
    'blocks',json((SELECT json_group_array(json_object('id',id,'caseId',case_id,'type',type,'title',title,'body',body,'url',url,'position',position,'version',version)) FROM
      (SELECT * FROM teaching_content_blocks WHERE workbook_id=material.id AND status=CASE WHEN material.status='published' THEN 'published' ELSE 'draft' END ORDER BY position,id))),
    'polls',json((SELECT json_group_array(json_object('id',id,'caseId',case_id,'prompt',prompt,'selectionMode',selection_mode,'optionsJson',options_json,'correctOptionIdsJson',correct_option_ids_json,'explanation',explanation,'position',position,'version',version)) FROM
      (SELECT * FROM teaching_polls WHERE workbook_id=material.id AND status=CASE WHEN material.status='published' THEN 'published' ELSE 'draft' END ORDER BY position,id))),
    'edits',json((SELECT json_group_array(json_object('questionId',question_id,'prompt',prompt,'revision',revision)) FROM
      (SELECT * FROM workbook_draft_question_edits WHERE workbook_id=material.id ORDER BY question_id)))
  ) FROM workbooks material WHERE material.id=${identity}`;
}

export type WorkbookReviewContent = {
  cases: Array<{ id: string; title: string; description: string; position: number; unavailable: boolean;
    questions: Array<{ id: string; prompt: string; maxMarks: number; responseType: string; optionsJson: string;
      rubric: { version: number; criteriaJson: string } | null }> }>;
  notes: Array<{ caseId: string; title: string; body: string; keyPointsJson: string; revealText: string }>;
  blocks: Array<{ caseId: string; type: string; title: string; body: string; url: string; position: number }>;
  polls: Array<{ caseId: string; prompt: string; selectionMode: string; optionsJson: string; correctOptionIdsJson: string; explanation: string; position: number }>;
};

// Only already-cleared cases are inspectable. The hash still covers unavailable
// source rows, but never sends their text or marking material to the browser.
export function workbookReviewContent(raw: string): WorkbookReviewContent {
  const material = JSON.parse(raw);
  if (material.schema !== "vm-workbook-material-1" || !Array.isArray(material.cases) || !Array.isArray(material.questions) || !Array.isArray(material.rubrics)) throw new Error("Invalid workbook review source");
  const cleared = new Set<string>();
  const cases = material.cases.map((item: Record<string, unknown>, index: number) => {
    const id = String(item.id ?? ""), unavailable = !id || item.status !== "published" || item.deidentified !== 1 || item.publicationCleared !== 1 || ["unsupported", "requires-review"].includes(String(item.classification));
    if (unavailable) return { id, title: "Source unavailable for review", description: "This case must pass Education publication controls before approval.", position: index + 1, unavailable: true, questions: [] };
    cleared.add(id);
    return { id, title: String(item.title), description: String(item.description), position: Number(item.position), unavailable: false,
      questions: material.questions.filter((q: Record<string, unknown>) => q.caseId === id).map((q: Record<string, unknown>) => {
        const rubric = material.rubrics.find((r: Record<string, unknown>) => r.questionId === q.id);
        return { id: String(q.id), prompt: String(q.editedPrompt ?? q.prompt), maxMarks: Number(q.maxMarks), responseType: String(q.responseType), optionsJson: String(q.optionsJson), rubric: rubric ? { version: Number(rubric.version), criteriaJson: String(rubric.criteriaJson) } : null };
      }) };
  });
  const allowed = (item: Record<string, unknown>) => cleared.has(String(item.caseId));
  return { cases,
    notes: material.notes.filter(allowed).map((n: Record<string, unknown>) => ({ caseId: String(n.caseId), title: String(n.title), body: String(n.body), keyPointsJson: String(n.keyPointsJson), revealText: String(n.revealText) })),
    blocks: material.blocks.filter(allowed).map((b: Record<string, unknown>) => ({ caseId: String(b.caseId), type: String(b.type), title: String(b.title), body: String(b.body), url: String(b.url), position: Number(b.position) })),
    polls: material.polls.filter(allowed).map((p: Record<string, unknown>) => ({ caseId: String(p.caseId), prompt: String(p.prompt), selectionMode: String(p.selectionMode), optionsJson: String(p.optionsJson), correctOptionIdsJson: String(p.correctOptionIdsJson), explanation: String(p.explanation), position: Number(p.position) })),
  };
}
