import { courseSearchText } from "./pilot-readiness.ts";

export type CourseCatalogueFilters = {
  query: string;
  level: string;
  access: "all" | "free" | "invitation" | "institution" | "paid";
  publisher: "all" | "official" | "institution";
};

export const emptyCourseCatalogueFilters = (): CourseCatalogueFilters => ({ query: "", level: "all", access: "all", publisher: "all" });

const filterKeys = ["q", "level", "access", "publisher"] as const;
const maxQueryLength = 160;
const unsafeQueryCharacters = /[\u0000-\u001f\u007f]/g;

export function cleanCourseCatalogueQuery(value: string) {
  return value.replace(unsafeQueryCharacters, "").slice(0, maxQueryLength);
}

export function courseCatalogueSearchTerm(query: string) {
  return courseSearchText({ id: "", title: query, summary: "", level: "", outcomes: [], publisherKind: "", accessModel: "" });
}

export function courseCatalogueSearchParams(values: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of filterKeys) {
    const value = values[key];
    if (typeof value === "string") params.append(key, value);
    else if (Array.isArray(value)) for (const item of value) if (typeof item === "string") params.append(key, item);
  }
  return params;
}

export function parseCourseCatalogueFilters(params: URLSearchParams, levels: readonly string[]): CourseCatalogueFilters {
  const one = (key: string) => { const values = params.getAll(key); return values.length === 1 ? values[0] : null; };
  const query = one("q");
  const level = one("level");
  const access = one("access");
  const publisher = one("publisher");
  return {
    query: query === null ? "" : cleanCourseCatalogueQuery(query),
    level: level !== null && levels.includes(level) ? level : "all",
    access: access === "free" || access === "invitation" || access === "institution" || access === "paid" ? access : "all",
    publisher: publisher === "official" || publisher === "institution" ? publisher : "all",
  };
}

export function courseCatalogueHref(currentHref: string, filters: CourseCatalogueFilters): string {
  const url = new URL(currentHref);
  for (const key of filterKeys) url.searchParams.delete(key);
  if (filters.query) url.searchParams.set("q", cleanCourseCatalogueQuery(filters.query));
  if (filters.level !== "all") url.searchParams.set("level", filters.level);
  if (filters.access !== "all") url.searchParams.set("access", filters.access);
  if (filters.publisher !== "all") url.searchParams.set("publisher", filters.publisher);
  return `${url.pathname}${url.search}${url.hash}`;
}

