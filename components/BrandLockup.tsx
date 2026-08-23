import Image from "next/image";

type BrandLockupProps = { priority?: boolean };

export function BrandLockup({ priority = false }: BrandLockupProps) {
  return (
    <span className="brand-lockup" aria-label="Elivion Didanix Atlas">
      <Image
        className="brand-logo"
        src="/elivion-logo.png"
        alt=""
        width={264}
        height={208}
        priority={priority}
      />
      <span className="brand-word">
        <b>Elivion</b>
        <em>Didanix</em>
        <i>Atlas</i>
      </span>
    </span>
  );
}
