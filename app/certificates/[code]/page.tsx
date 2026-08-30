import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { verifyCertificate } from "@/lib/platform-governance";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Completion record", description: "Verify an Visible Medicine course completion record.", robots: { index: false, follow: false } };

export default async function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const certificate = await verifyCertificate((await params).code);
  if (!certificate) notFound();
  return <main className="inner-page certificate-page"><section className="certificate-card"><div className="certificate-mark">E</div><p className="eyebrow"><span /> Verifiable education record</p><h1>{certificate.valid ? "Completion confirmed" : "Record not active"}</h1><p className="certificate-name">{certificate.learnerName}</p><h2>{certificate.courseTitle}</h2><dl><div><dt>Record code</dt><dd>{certificate.code}</dd></div><div><dt>Completed</dt><dd>{new Date(certificate.completedAt).toLocaleDateString("en-GB", { dateStyle: "long" })}</dd></div><div><dt>Status</dt><dd>{certificate.valid ? "Valid" : "Revoked"}</dd></div></dl><p className="certificate-boundary">{certificate.statement}</p></section></main>;
}
