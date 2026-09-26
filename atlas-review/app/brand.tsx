import Link from 'next/link';
import Image from 'next/image';

/** Approved Visible Medicine master, reused without redrawing the lockup. */
export function Brand({ surface = 'dark' }: { surface?: 'dark' | 'light' }) {
  return (
    <Link
      href="/"
      className="vm-brand"
      aria-label="Visible Medicine by Elivion — anatomy home"
    >
      <Image
        unoptimized
        src={`/brand/visible-medicine-lockup-${surface}.png`}
        alt="Visible Medicine by Elivion"
        width={1005}
        height={202}
      />
    </Link>
  );
}
