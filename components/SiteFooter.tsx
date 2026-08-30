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
        <Link href="/embed">Embeds</Link><Link href="/trust">Trust centre</Link><Link href="/intended-use">Intended use</Link><Link href="/my-learning">My learning</Link><Link href="/workspace">Institution workspace</Link><Link href="/account">Account &amp; data</Link><Link href="/privacy">Privacy framework</Link><Link href="/terms">Terms framework</Link><Link href="/acceptable-use">Acceptable use</Link><Link href="/accessibility">Accessibility</Link>
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
