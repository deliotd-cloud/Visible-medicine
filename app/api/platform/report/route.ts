import { getAuthContext } from "@/lib/auth";
import { InstitutionOperationsError, institutionProgressCsv } from "@/lib/institution-operations";

export const dynamic = "force-dynamic";
export async function GET() { try { const auth = await getAuthContext(); if (!auth) throw new InstitutionOperationsError("Education sign-in is required.", 401); const csv = await institutionProgressCsv(auth); return new Response(`\uFEFF${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="elivion-education-progress-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } }); } catch (error) { if (error instanceof InstitutionOperationsError) return Response.json({ error: error.message }, { status: error.status }); console.error("Institution report error", error); return Response.json({ error: "The report could not be generated." }, { status: 500 }); } }
