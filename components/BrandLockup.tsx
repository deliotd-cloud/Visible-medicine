import Image from "next/image";

type BrandLockupProps = { priority?: boolean };

export function BrandLockup({ priority = false }: BrandLockupProps) {
  return (
    <span className="brand-lockup" aria-label="Visible Medicine, by Elivion">
      <Image
        className="brand-logo"
        src="/favicon.svg"
        alt=""
        width={24}
        height={24}
        priority={priority}
      />
      <span className="brand-word">
        <b>Visible</b>
        <em>Medicine</em>
        <i>by Elivion</i>
      </span>
    </span>
  );
}
