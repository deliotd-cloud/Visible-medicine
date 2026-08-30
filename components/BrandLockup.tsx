import Image from "next/image";

type BrandLockupProps = {
  priority?: boolean;
  tone?: "light" | "dark";
};

const lockups = {
  light: {
    src: "/brand/approved/visible-medicine-lockup-light.png",
    width: 1024,
    height: 217,
  },
  dark: {
    src: "/brand/approved/visible-medicine-lockup-dark.png",
    width: 1024,
    height: 205,
  },
} as const;

export function BrandLockup({ priority = false, tone = "light" }: BrandLockupProps) {
  const lockup = lockups[tone];

  return (
    <span className={`brand-lockup brand-lockup-${tone}`} aria-label="Visible Medicine, by Elivion">
      <Image
        className="brand-lockup-image"
        src={lockup.src}
        alt=""
        width={lockup.width}
        height={lockup.height}
        priority={priority}
        sizes="(max-width: 760px) 168px, 214px"
      />
    </span>
  );
}
