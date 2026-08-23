import { env } from "cloudflare:workers";
import type { AuthContext } from "@/lib/auth";
import { appendAudit, ensureEducationUser } from "@/db/bootstrap";
import { EducationApiError } from "@/lib/education-api";
import { safeText } from "@/lib/domain";
import {
  aggregatePollResponses,
  canAnswerTeachingPolls,
  canControlOwnedTeachingResource,
  canManageTeachingPolls,
  validatePollSelection,
  type PollOption,
  type PollSelectionMode,
  type TeachingPollView,
} from "@/lib/teaching-polls";
import { canAccessPublishedWorkbook } from "@/lib/workbook-access";

type Row = Record<string, string | number | null>;
function rows<T>(result: D1Result<T>) {
  return result.results ?? [];
}
function parseJson<T>(value: unknown, fallback: T): T {
  try {
    return typeof value === "string" ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}
function exactKeys(
  payload: Record<string, unknown>,
  allowed: readonly string[],
) {
  const unsupported = Object.keys(payload).find(
    (key) => !allowed.includes(key),
  );
  if (unsupported)
    throw new EducationApiError(`Unsupported field ${unsupported}.`, 422);
}
function version(value: unknown) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0)
    throw new EducationApiError(
      "expectedVersion must be a non-negative integer.",
      422,
    );
  return parsed;
}

async function rolesFor(auth: AuthContext) {
  await ensureEducationUser(auth);
  const user = await env.DB.prepare(`SELECT roles FROM users WHERE id = ?`)
    .bind(auth.userId)
    .first<{ roles: string }>();
  return user?.roles.split(",").filter(Boolean) ?? [];
}

async function requireManager(auth: AuthContext) {
  const roles = await rolesFor(auth);
  if (!canManageTeachingPolls(roles))
    throw new EducationApiError(
      "Only an instructor or administrator can control live teaching polls.",
      403,
    );
  return roles;
}

async function requireLearner(auth: AuthContext) {
  const roles = await rolesFor(auth);
  if (!canAnswerTeachingPolls(roles))
    throw new EducationApiError(
      "A learner enrolment is required to answer this teaching poll.",
      403,
    );
  return roles;
}

async function publishedPoll(pollId: string) {
  const poll = await env.DB.prepare(
    `SELECT p.*, w.mode AS workbook_mode, w.status AS workbook_status FROM teaching_polls p JOIN workbooks w ON w.id = p.workbook_id WHERE p.id = ? AND p.status = 'published'`,
  )
    .bind(pollId)
    .first<Row>();
  if (
    !poll ||
    poll.workbook_mode !== "teaching" ||
    poll.workbook_status !== "published"
  )
    throw new EducationApiError("Published teaching poll not found.", 404);
  return poll;
}

async function latestRun(pollId: string) {
  return env.DB.prepare(
    `SELECT id, poll_id, instructor_id, state, results_revealed, version, opened_at, closed_at FROM teaching_poll_runs WHERE poll_id = ? ORDER BY opened_at DESC, rowid DESC LIMIT 1`,
  )
    .bind(pollId)
    .first<Row>();
}

async function workbookOwner(workbookId: string) {
  return env.DB.prepare(
    `SELECT author_id FROM workbook_authorship WHERE workbook_id = ?`,
  ).bind(workbookId).first<{ author_id: string }>();
}

async function mayControlWorkbook(
  auth: AuthContext,
  roles: readonly string[],
  workbookId: string,
) {
  if (roles.includes("administrator")) return true;
  const ownership = await workbookOwner(workbookId);
  return canControlOwnedTeachingResource(
    roles,
    auth.userId,
    ownership?.author_id ?? "",
  );
}

async function responseSelections(runId: string) {
  const result = await env.DB.prepare(
    `SELECT selections_json FROM teaching_poll_responses WHERE run_id = ?`,
  )
    .bind(runId)
    .all<{ selections_json: string }>();
  return rows(result).map((item) =>
    parseJson<string[]>(item.selections_json, []),
  );
}

export async function getTeachingPollBundle(
  auth: AuthContext,
  caseId: string,
  workbookId?: string,
) {
  const roles = await rolesFor(auth);
  const safeCaseId = safeText(caseId, 100);
  if (!safeCaseId)
    throw new EducationApiError("A case identifier is required to fetch teaching polls.", 422);
  const safeWorkbookId = workbookId ? safeText(workbookId, 100) : "";
  if (
    safeWorkbookId &&
    !(await canAccessPublishedWorkbook(auth.userId, roles, safeWorkbookId))
  )
    throw new EducationApiError(
      "This teaching workbook is not allocated to your education account.",
      403,
    );
  const teachingCase = await env.DB.prepare(
    `SELECT id, status FROM cases WHERE id = ?`,
  )
    .bind(safeCaseId)
    .first<Row>();
  if (!teachingCase || teachingCase.status !== "published")
    throw new EducationApiError("Published education case not found.", 404);
  const result = await env.DB.prepare(
    `SELECT p.* FROM teaching_polls p JOIN workbooks w ON w.id = p.workbook_id WHERE p.case_id = ? AND (? = '' OR p.workbook_id = ?) AND p.status = 'published' AND w.mode = 'teaching' AND w.status = 'published' ORDER BY p.position, p.created_at, p.id`,
  )
    .bind(safeCaseId, safeWorkbookId, safeWorkbookId)
    .all<Row>();
  const polls: TeachingPollView[] = [];
  let mayManage = false;
  for (const poll of rows(result)) {
    if (
      !(await canAccessPublishedWorkbook(
        auth.userId,
        roles,
        String(poll.workbook_id),
      ))
    )
      continue;
    const options = parseJson<PollOption[]>(poll.options_json, []);
    const pollManager = await mayControlWorkbook(
      auth,
      roles,
      String(poll.workbook_id),
    );
    mayManage ||= pollManager;
    const run = await latestRun(String(poll.id));
    const responses = run ? await responseSelections(String(run.id)) : [];
    const own =
      run && canAnswerTeachingPolls(roles)
        ? await env.DB.prepare(
            `SELECT selections_json, revision, responded_at FROM teaching_poll_responses WHERE run_id = ? AND learner_id = ?`,
          )
            .bind(run.id, auth.userId)
            .first<Row>()
        : null;
    const resultsVisible = run
      ? pollManager ||
        (canAnswerTeachingPolls(roles) && Boolean(run.results_revealed))
      : pollManager;
    polls.push({
      id: String(poll.id),
      workbookId: String(poll.workbook_id),
      caseId: String(poll.case_id),
      prompt: String(poll.prompt),
      selectionMode: String(poll.selection_mode) as PollSelectionMode,
      options,
      correctOptionIds: resultsVisible
        ? parseJson<string[]>(poll.correct_option_ids_json, [])
        : [],
      explanation: resultsVisible ? String(poll.explanation) : "",
      position: Number(poll.position),
      version: Number(poll.version),
      run: run
        ? {
            id: String(run.id),
            state: String(run.state) as "open" | "closed",
            version: Number(run.version),
            resultsRevealed: Boolean(run.results_revealed),
            responseCount: responses.length,
            openedAt: String(run.opened_at),
            closedAt: run.closed_at === null ? null : String(run.closed_at),
            results: resultsVisible
              ? aggregatePollResponses(options, responses)
              : null,
          }
        : null,
      ownResponse: own
        ? {
            selections: parseJson<string[]>(own.selections_json, []),
            revision: Number(own.revision),
            respondedAt: String(own.responded_at),
          }
        : null,
    });
  }
  return {
    polls,
    permissions: {
      manage: mayManage,
      answer: canAnswerTeachingPolls(roles),
    },
    refreshedAt: new Date().toISOString(),
  };
}

export async function startTeachingPoll(
  auth: AuthContext,
  payload: Record<string, unknown>,
) {
  const roles = await requireManager(auth);
  exactKeys(payload, ["action", "caseId", "pollId"]);
  const pollId = safeText(payload.pollId, 100);
  const poll = await publishedPoll(pollId);
  if (!(await mayControlWorkbook(auth, roles, String(poll.workbook_id))))
    throw new EducationApiError(
      "Only this workbook's instructor or an administrator can open its polls.",
      403,
    );
  if (safeText(payload.caseId, 100) !== String(poll.case_id))
    throw new EducationApiError(
      "This teaching poll is not linked to the requested case.",
      409,
    );
  const current = await latestRun(pollId);
  if (current?.state === "open")
    throw new EducationApiError("This teaching poll is already open.", 409);
  const runId = crypto.randomUUID();
  const openedAt = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO teaching_poll_runs (id, poll_id, instructor_id, state, results_revealed, version, opened_at, closed_at) VALUES (?, ?, ?, 'open', 0, 1, ?, NULL)`,
  )
    .bind(runId, pollId, auth.userId, openedAt)
    .run();
  await appendAudit(
    auth.userId,
    "teaching-poll.opened",
    "teaching-poll-run",
    runId,
    "success",
    `poll=${pollId};case=${poll.case_id}`,
  );
  return getTeachingPollBundle(auth, String(poll.case_id));
}

export async function controlTeachingPoll(
  auth: AuthContext,
  payload: Record<string, unknown>,
) {
  const roles = await requireManager(auth);
  exactKeys(payload, [
    "action",
    "caseId",
    "runId",
    "operation",
    "expectedVersion",
  ]);
  const runId = safeText(payload.runId, 100);
  const operation = safeText(payload.operation, 20);
  const expectedVersion = version(payload.expectedVersion);
  const run = await env.DB.prepare(
    `SELECT r.*, p.case_id, p.workbook_id, p.status AS poll_status FROM teaching_poll_runs r JOIN teaching_polls p ON p.id = r.poll_id WHERE r.id = ?`,
  )
    .bind(runId)
    .first<Row>();
  if (!run || run.poll_status !== "published")
    throw new EducationApiError("Teaching poll run not found.", 404);
  if (!(await mayControlWorkbook(auth, roles, String(run.workbook_id))))
    throw new EducationApiError(
      "Only this workbook's instructor or an administrator can control its polls.",
      403,
    );
  if (safeText(payload.caseId, 100) !== String(run.case_id))
    throw new EducationApiError(
      "This live poll is not linked to the requested case.",
      409,
    );
  if (Number(run.version) !== expectedVersion)
    throw new EducationApiError(
      "The live poll changed; refresh before controlling it.",
      409,
    );
  let nextState = String(run.state);
  let revealed = Number(run.results_revealed);
  let closedAt = run.closed_at;
  if (operation === "close") {
    if (run.state !== "open")
      throw new EducationApiError("Only an open poll can be closed.", 409);
    nextState = "closed";
    closedAt = new Date().toISOString();
  } else if (operation === "reopen") {
    if (run.state !== "closed" || revealed)
      throw new EducationApiError(
        "A revealed poll cannot be reopened; launch a new run instead.",
        409,
      );
    nextState = "open";
    closedAt = null;
  } else if (operation === "reveal") {
    if (run.state !== "closed")
      throw new EducationApiError(
        "Close the poll before revealing its results.",
        409,
      );
    revealed = 1;
  } else throw new EducationApiError("Unsupported live poll control.", 422);
  const nextVersion = expectedVersion + 1;
  const result = await env.DB.prepare(
    `UPDATE teaching_poll_runs SET state = ?, results_revealed = ?, version = ?, closed_at = ? WHERE id = ? AND version = ?`,
  )
    .bind(nextState, revealed, nextVersion, closedAt, runId, expectedVersion)
    .run();
  if (!result.meta.changes)
    throw new EducationApiError(
      "The live poll changed; refresh before controlling it.",
      409,
    );
  await appendAudit(
    auth.userId,
    `teaching-poll.${operation}`,
    "teaching-poll-run",
    runId,
    "success",
    `version=${nextVersion}`,
  );
  return getTeachingPollBundle(auth, String(run.case_id));
}

export async function answerTeachingPoll(
  auth: AuthContext,
  payload: Record<string, unknown>,
) {
  const roles = await requireLearner(auth);
  exactKeys(payload, [
    "action",
    "caseId",
    "runId",
    "selections",
    "expectedRevision",
  ]);
  const runId = safeText(payload.runId, 100);
  const expectedRevision = version(payload.expectedRevision);
  const run = await env.DB.prepare(
    `SELECT r.state, r.results_revealed, p.id AS poll_id, p.case_id, p.workbook_id, p.selection_mode, p.options_json, p.status AS poll_status, w.mode AS workbook_mode, w.status AS workbook_status FROM teaching_poll_runs r JOIN teaching_polls p ON p.id = r.poll_id JOIN workbooks w ON w.id = p.workbook_id WHERE r.id = ?`,
  )
    .bind(runId)
    .first<Row>();
  if (
    !run ||
    run.poll_status !== "published" ||
    run.workbook_mode !== "teaching" ||
    run.workbook_status !== "published"
  )
    throw new EducationApiError("Published teaching poll not found.", 404);
  if (safeText(payload.caseId, 100) !== String(run.case_id))
    throw new EducationApiError(
      "This live poll is not linked to the requested case.",
      409,
    );
  if (
    !(await canAccessPublishedWorkbook(
      auth.userId,
      roles,
      String(run.workbook_id),
    ))
  )
    throw new EducationApiError(
      "This teaching workbook is not allocated to your education account.",
      403,
    );
  if (run.state !== "open" || Boolean(run.results_revealed))
    throw new EducationApiError("This teaching poll is closed.", 409);
  const selections = validatePollSelection(
    payload.selections,
    String(run.selection_mode) as PollSelectionMode,
    parseJson<PollOption[]>(run.options_json, []),
  );
  const current = await env.DB.prepare(
    `SELECT revision FROM teaching_poll_responses WHERE run_id = ? AND learner_id = ?`,
  )
    .bind(runId, auth.userId)
    .first<{ revision: number }>();
  if ((current?.revision ?? 0) !== expectedRevision)
    throw new EducationApiError(
      "A newer poll response exists; refresh before replacing it.",
      409,
    );
  const nextRevision = expectedRevision + 1;
  const respondedAt = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO teaching_poll_responses (run_id, learner_id, selections_json, revision, responded_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(run_id, learner_id) DO UPDATE SET selections_json = excluded.selections_json, revision = excluded.revision, responded_at = excluded.responded_at`,
  )
    .bind(
      runId,
      auth.userId,
      JSON.stringify(selections),
      nextRevision,
      respondedAt,
    )
    .run();
  await appendAudit(
    auth.userId,
    "teaching-poll.response-saved",
    "teaching-poll-run",
    runId,
    "success",
    `revision=${nextRevision};choices=${selections.length}`,
  );
  return getTeachingPollBundle(
    auth,
    String(run.case_id),
    String(run.workbook_id),
  );
}

function csv(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function exportTeachingPollAggregate(
  auth: AuthContext,
  runId: string,
) {
  const roles = await requireManager(auth);
  const run = await env.DB.prepare(
    `SELECT r.id, r.state, r.results_revealed, r.opened_at, r.closed_at, p.prompt, p.options_json, p.workbook_id FROM teaching_poll_runs r JOIN teaching_polls p ON p.id = r.poll_id WHERE r.id = ?`,
  )
    .bind(safeText(runId, 100))
    .first<Row>();
  if (!run) throw new EducationApiError("Teaching poll run not found.", 404);
  if (!(await mayControlWorkbook(auth, roles, String(run.workbook_id))))
    throw new EducationApiError(
      "Only this workbook's instructor or an administrator can export its poll results.",
      403,
    );
  const options = parseJson<PollOption[]>(run.options_json, []);
  const responses = await responseSelections(String(run.id));
  const results = aggregatePollResponses(options, responses);
  const lines = [
    "question,run_id,state,opened_at,closed_at,responses,option,count,percentage",
  ];
  for (const option of options) {
    const result = results.find((item) => item.optionId === option.id)!;
    lines.push(
      [
        run.prompt,
        run.id,
        run.state,
        run.opened_at,
        run.closed_at ?? "",
        responses.length,
        option.label,
        result.count,
        result.percentage,
      ]
        .map(csv)
        .join(","),
    );
  }
  await appendAudit(
    auth.userId,
    "teaching-poll.aggregate-exported",
    "teaching-poll-run",
    String(run.id),
    "success",
    `responses=${responses.length}`,
  );
  return `${lines.join("\r\n")}\r\n`;
}
