/** Build a review mutation from the exact workbook state shown to the educator. */
export type WorkbookWorkflowView = {
  id: string;
  version: number;
  status: string;
  workflow?: {
    materialRevision: string;
    reviewRevision: number;
    submissionCurrent: boolean;
    approvalCurrent: boolean;
  } | null;
};

export type WorkbookWorkflowAction =
  | "request-workbook-review"
  | "review-workbook"
  | "publish-workbook";

export type WorkbookReviewDecision = "approved" | "changes-requested";

export function hasWorkbookWorkflowBinding(workbook: WorkbookWorkflowView): boolean {
  const workflow = workbook.workflow;
  return Boolean(
    workbook.id &&
    Number.isSafeInteger(workbook.version) && workbook.version >= 1 &&
    workflow &&
    Number.isSafeInteger(workflow.reviewRevision) && workflow.reviewRevision >= 0 &&
    typeof workflow.materialRevision === "string" && /^[a-f0-9]{64}$/.test(workflow.materialRevision) &&
    typeof workflow.submissionCurrent === "boolean" &&
    typeof workflow.approvalCurrent === "boolean"
  );
}

export function workbookWorkflowRequest(
  workbook: WorkbookWorkflowView,
  action: WorkbookWorkflowAction,
  options: { decision?: WorkbookReviewDecision; comment?: string } = {},
) {
  if (!hasWorkbookWorkflowBinding(workbook)) return null;
  const workflow = workbook.workflow!;

  if (action === "request-workbook-review" &&
      !["draft", "changes-requested"].includes(workbook.status)) return null;
  if (action === "review-workbook") {
    const comment = typeof options.comment === "string" ? options.comment.trim() : "";
    if (!comment || comment.length > 2000 || comment.includes("\0") ||
        !["approved", "changes-requested"].includes(options.decision ?? "")) return null;
    if (workbook.status === "in-review") {
      if (options.decision === "approved" && !workflow.submissionCurrent) return null;
    } else if (!(workbook.status === "approved" &&
      options.decision === "approved")) return null;
  }
  if (action === "publish-workbook" &&
      (workbook.status !== "approved" || !workflow.approvalCurrent)) return null;

  return {
    action,
    id: workbook.id,
    expectedVersion: workbook.version,
    expectedStatus: workbook.status,
    expectedReviewRevision: workflow.reviewRevision,
    expectedMaterialRevision: workflow.materialRevision,
    ...(action === "review-workbook" ? {
      decision: options.decision!,
      comment: options.comment!.trim(),
    } : {}),
  };
}
