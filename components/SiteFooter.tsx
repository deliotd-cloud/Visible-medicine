import Link from "next/link";
import { BrandLockup } from "./BrandLockup";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Link className="brand footer-brand" href="/">
          <BrandLockup />
        </Link>
        <p>Imaging education for learners, educators and institutions.</p>
      </div>
      <div className="footer-links">
        <Link href="/atlas">Atlas</Link><Link href="/courses">Courses</Link><Link href="/research">Research</Link>
        <Link href="/studio">Studio</Link><Link href="/institutions">Institutions</Link><Link href="/pricing">Plans</Link>
        <Link href="/embed">Embeds</Link><Link href="/trust">Trust centre</Link><Link href="/workspace">Workspace</Link>
      </div>
      <div className="footer-boundary">
        <span>Education &amp; research only</span>
        <p>Not intended for diagnosis, patient care, clinical reporting or clinical decision-making.</p>
        <small>An Elivion family platform · Separate from the clinical Didanix PACS</small>
      </div>
    </footer>
  );
}
