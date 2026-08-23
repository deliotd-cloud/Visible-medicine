import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="Didanix Atlas home">
        <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
        <span>Didanix <b>Atlas</b></span>
      </Link>
      <nav className="nav-links" aria-label="Primary navigation">
        <Link href="/atlas">Atlas</Link>
        <Link href="/courses">Courses</Link>
        <Link href="/research">Research</Link>
        <Link href="/institutions">Institutions</Link>
      </nav>
      <Link className="account-link" href="/my-learning">My learning <span aria-hidden="true">↗</span></Link>
    </header>
  );
}
