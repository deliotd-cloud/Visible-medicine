export const LEARNER_PORTFOLIO_PAGE_SIZE = 50;

export type PortfolioSection = "notes" | "reviews";
export type PortfolioCursor =
  | { section: "notes"; updatedAt: string; id: string }
  | { section: "reviews"; rank: 0 | 1; dueAt: string; id: string };

const stamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/;
const id = /^[\x21-\x7e]{1,120}$/;

export function parsePortfolioSection(value: unknown): PortfolioSection {
  if (value === "notes" || value === "reviews") return value;
  throw new Error("Choose notes or reviews to load.");
}

export function parsePortfolioCursor(value: unknown, section: PortfolioSection): PortfolioCursor {
  if (typeof value !== "string" || value.length < 8 || value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid learning history cursor.");
  let parsed: unknown;
  try { parsed = JSON.parse(atob(value.replace(/-/g, "+").replace(/_/g, "/"))); }
  catch { throw new Error("Invalid learning history cursor."); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid learning history cursor.");
  const row = parsed as Record<string, unknown>;
  const keys = Object.keys(row).sort().join(",");
  const expected = section === "notes" ? "id,section,updatedAt" : "dueAt,id,rank,section";
  if (keys !== expected || row.section !== section || typeof row.id !== "string" || !id.test(row.id)) throw new Error("Invalid learning history cursor.");
  if (section === "notes" && typeof row.updatedAt === "string" && stamp.test(row.updatedAt) && !Number.isNaN(Date.parse(row.updatedAt)))
    return { section, updatedAt: row.updatedAt, id: row.id };
  if (section === "reviews" && (row.rank === 0 || row.rank === 1) && typeof row.dueAt === "string" && stamp.test(row.dueAt) && !Number.isNaN(Date.parse(row.dueAt)))
    return { section, rank: row.rank, dueAt: row.dueAt, id: row.id };
  throw new Error("Invalid learning history cursor.");
}

export function encodePortfolioCursor(cursor: PortfolioCursor): string {
  return btoa(JSON.stringify(cursor)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function portfolioPage<Row>(rows: Row[], cursorFor: (row: Row) => PortfolioCursor) {
  const items = rows.slice(0, LEARNER_PORTFOLIO_PAGE_SIZE);
  const nextCursor = rows.length > LEARNER_PORTFOLIO_PAGE_SIZE && items.length
    ? encodePortfolioCursor(cursorFor(items[items.length - 1])) : null;
  return { items, nextCursor };
}
