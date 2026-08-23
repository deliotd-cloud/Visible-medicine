import Link from "next/link";
import { BrandLockup } from "./BrandLockup";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Link className="brand footer-brand" href="/">
          <BrandLockup />
        </Link>
        <p>Radiological anatomy for education and non-clinical research.</p>
      </div>
      <div className="footer-links">
        <Link href="/atlas">Atlas</Link><Link href="/courses">Courses</Link><Link href="/research">Research</Link>
        <Link href="/teach">Teach with Didanix</Link><Link href="/institutions">Institutions</Link>
      </div>
      <div className="footer-boundary">
        <span>Education &amp; research only</span>
        <p>Not intended for diagnosis, patient care, clinical reporting or clinical decision-making.</p>
        <small>Elivion family · Didanix imaging products</small>
      </div>
    </footer>
  );
}
