import { Brand } from "../../brand";
import {
  specimenReviewRows,
  specimenReviewMaterial,
} from "@/atlas-review/lib/specimen-review-material";
import { SpecimenReviewWorkspace } from "./workspace";
import "../body/body-review.css";
import "./specimen-review.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Specimen Review | Visible Medicine" };
export default async function SpecimenReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ specimen?: string; structure?: string }>;
}) {
  const p = await searchParams;
  const packet =
    typeof p.specimen === "string" && typeof p.structure === "string"
      ? await specimenReviewMaterial(p.specimen, p.structure)
      : null;
  return (
    <div className="body-review-app">
      <header className="body-review-header">
        <Brand />
        <span>Independent specimen reviews</span>
        <a href="/workspace/atlas-review">Clinical review home</a>
        <a href="/atlas">Atlas</a>
      </header>
      <main className="body-review-shell">
        <h1>Review the exact specimen</h1>
        <p>
          Private, account-specific records. No automatic clinical approval or
          transfer between models. Source worksheets contain no private records.
        </p>
        <SpecimenReviewWorkspace
          key={packet?.context.materialHash ?? "pick"}
          rows={specimenReviewRows}
          packet={packet}
          invalid={!!(p.specimen || p.structure) && !packet}
        />
      </main>
    </div>
  );
}
