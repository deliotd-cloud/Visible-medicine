import Link from "next/link";
import { BrandLockup } from "./BrandLockup";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Link className="brand footer-brand" href="/">
          <BrandLockup tone="dark" />
        </Link>
        <p><b>Where medicine becomes visible.</b><br />Imaging education for learners, educators and institutions.</p>
      </div>
      <div className="footer-links">
        <nav aria-label="Explore Visible Medicine"><b>Explore</b><Link href="/atlas">Atlas</Link><Link href="/courses">Courses</Link><Link href="/research">Research</Link><Link href="/search">Search</Link></nav>
        <nav aria-label="Teach with Visible Medicine"><b>Teach</b><Link href="/studio">For educators</Link><Link href="/institutions">Institutions</Link><Link href="/pricing">Plans</Link><Link href="/embed">Embeds</Link></nav>
        <nav aria-label="Visible Medicine account links"><b>Workspace</b><Link href="/my-learning">My learning</Link><Link href="/studio/workspace">Studio</Link><Link href="/workspace">Institution</Link><Link href="/account">Account &amp; data</Link></nav>
        <nav aria-label="Visible Medicine governance"><b>Governance</b><Link href="/trust">Trust centre</Link><Link href="/intended-use">Intended use</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/acceptable-use">Acceptable use</Link><Link href="/accessibility">Accessibility</Link></nav>
      </div>
      <div className="footer-boundary">
        <span>Education &amp; research only</span>
        <p>Not intended for diagnosis, patient care, clinical reporting or clinical decision-making.</p>
        <small>Visible Medicine · by Elivion</small>
        <small className="viewer-credit">Imaging viewer <b>Powered by Didanix</b> · No PACS or diagnostic access</small>
      </div>
    </footer>
  );
}
