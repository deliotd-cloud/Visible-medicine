import { env } from "cloudflare:workers";
import type { AuthContext } from "@/lib/auth";
import { appendAudit, ensureEducationUser } from "@/db/bootstrap";
import { EducationApiError } from "@/lib/education-api";
import { safeText } from "@/lib/domain";
import {
  importQuestionBankQti,
  validateQuestionBankDraft,
  type QuestionBankItem,
} from "@/lib/question-bank";

type Row = Record<string, string | number | null>;
function parseJson<T>(value: unknown, fallback: T): T {
  try {
    return typeof value === "string" ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function managerRoles(auth: AuthContext) {
  await ensureEducationUser(auth);
  const user = await env.DB.prepare(`SELECT roles FROM users WHERE id = ?`)
    .bind(auth.userId)
    .first<{ roles: string }>();
  const roles = user?.roles.split(",").filter(Boolean) ?? [];
  if (!roles.some((role) => ["administrator", "instructor", "examiner"].includes(role)))
    throw new EducationApiError(
      "Only an instructor, examiner or administrator can manage the question bank.",
      403,
    );
  return roles;
}

function mapItem(row: Row): QuestionBankItem {
  return {
    id: String(row.id),
    title: String(row.title),
    prompt: String(row.prompt),
    responseType: String(row.response_type) as QuestionBankItem["responseType"],
    maxMarks: Number(row.max_marks),
    modality: String(row.modality) as QuestionBankItem["modality"],
    difficulty: String(row.difficulty) as QuestionBankItem["difficulty"],
    tags: parseJson<string[]>(row.tags_json, []),
    options: parseJson<string[]>(row.options_json, []),
    correctOptionIndexes: parseJson<number[]>(row.correct_option_indexes_json, []),
    rationale: String(row.rationale),
    status: String(row.status) as QuestionBankItem["status"],
    version: Number(row.version),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function getQuestionBank(auth: AuthContext, filters?: {
  modality?: string;
  difficulty?: string;
  tag?: string;
}) {
  await managerRoles(auth);
  const result = await env.DB.prepare(
    `SELECT * FROM question_bank_items WHERE status = 'active' ORDER BY updated_at DESC, id`,
  ).all<Row>();
  const modality = safeText(filters?.modality, 30);
  const difficulty = safeText(filters?.difficulty, 30);
  const tag = safeText(filters?.tag, 40).toLocaleLowerCase();
  const items = (result.results ?? []).map(mapItem).filter((item) =>
    (!modality || item.modality === modality) &&
    (!difficulty || item.difficulty === difficulty) &&
    (!tag || item.tags.includes(tag)),
  );
  return { items, permissions: { manage: true }, refreshedAt: new Date().toISOString() };
}

export async function createQuestionBankItem(
  auth: AuthContext,
  value: unknown,
) {
  await managerRoles(auth);
  const item = validateQuestionBankDraft(value);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO question_bank_items (id, title, prompt, response_type, max_marks, modality, difficulty, tags_json, options_json, correct_option_indexes_json, rationale, status, version, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?, ?, ?)`,
  )
    .bind(
      id,
      item.title,
      item.prompt,
      item.responseType,
      item.maxMarks,
      item.modality,
      item.difficulty,
      JSON.stringify(item.tags),
      JSON.stringify(item.options),
      JSON.stringify(item.correctOptionIndexes),
      item.rationale,
      auth.userId,
      createdAt,
      createdAt,
    )
    .run();
  await appendAudit(auth.userId, "question-bank.created", "question-bank-item", id);
  return getQuestionBank(auth);
}

export async function archiveQuestionBankItem(
  auth: AuthContext,
  idValue: unknown,
  expectedVersionValue: unknown,
) {
  await managerRoles(auth);
  const id = safeText(idValue, 100);
  const expectedVersion = Number(expectedVersionValue);
  if (!id || !Number.isInteger(expectedVersion) || expectedVersion < 1)
    throw new EducationApiError("A valid item and expected version are required.", 422);
  const result = await env.DB.prepare(
    `UPDATE question_bank_items SET status = 'archived', version = version + 1, updated_at = ? WHERE id = ? AND status = 'active' AND version = ?`,
  )
    .bind(new Date().toISOString(), id, expectedVersion)
    .run();
  if (Number(result.meta.changes ?? 0) !== 1)
    throw new EducationApiError(
      "The question changed before it could be archived. Refresh and try again.",
      409,
    );
  await appendAudit(auth.userId, "question-bank.archived", "question-bank-item", id);
  return getQuestionBank(auth);
}

export async function importQuestionBank(
  auth: AuthContext,
  xml: unknown,
) {
  await managerRoles(auth);
  const drafts = importQuestionBankQti(xml);
  const createdAt = new Date().toISOString();
  const statements = drafts.map((item) =>
    env.DB.prepare(
      `INSERT INTO question_bank_items (id, title, prompt, response_type, max_marks, modality, difficulty, tags_json, options_json, correct_option_indexes_json, rationale, status, version, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      item.title,
      item.prompt,
      item.responseType,
      item.maxMarks,
      item.modality,
      item.difficulty,
      JSON.stringify(item.tags),
      JSON.stringify(item.options),
      JSON.stringify(item.correctOptionIndexes),
      item.rationale,
      auth.userId,
      createdAt,
      createdAt,
    ),
  );
  await env.DB.batch(statements);
  await appendAudit(
    auth.userId,
    "question-bank.qti-imported",
    "question-bank",
    "education",
    "success",
    `items=${drafts.length}`,
  );
  return getQuestionBank(auth);
}
