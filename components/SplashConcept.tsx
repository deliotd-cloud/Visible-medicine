import Image from "next/image";

export type SplashConceptVariant = "relay" | "orbit" | "cinematic";

const scans = [
  {
    key: "xray",
    label: "X-ray",
    detail: "Projection imaging",
    src: "/media/splash/xray-chest.webp",
    width: 720,
    height: 960,
  },
  {
    key: "ct",
    label: "CT",
    detail: "Cross-sectional anatomy",
    src: "/media/splash/ct-head.webp",
    width: 760,
    height: 760,
  },
  {
    key: "mri",
    label: "MRI",
    detail: "Soft-tissue contrast",
    src: "/media/splash/mri-brain.webp",
    width: 800,
    height: 800,
  },
] as const;

export function SplashConcept({ variant }: { variant: SplashConceptVariant }) {
  return (
    <div className={`splash-concept splash-concept-${variant}`} aria-hidden="true">
      <div className="splash-concept-field" />
      <div className="splash-modality-track">
        {scans.map((scan) => (
          <div
            className={`splash-scan-card splash-scan-card-${scan.key}`}
            key={scan.key}
          >
            <Image
              src={scan.src}
              alt=""
              width={scan.width}
              height={scan.height}
              priority
              sizes="(max-width: 700px) 38vw, 240px"
            />
            <span className="splash-scan-shade" />
            <span className="splash-reticle splash-reticle-a" />
            <span className="splash-reticle splash-reticle-b" />
            <span className="splash-scan-copy">
              <b>{scan.label}</b>
              <small>{scan.detail}</small>
            </span>
          </div>
        ))}
      </div>
      <span className="splash-orbit splash-orbit-a" />
      <span className="splash-orbit splash-orbit-b" />
      <span className="splash-sweep" />
      <div className="splash-concept-brand">
        <Image
          className="splash-concept-lockup"
          src="/brand/approved/visible-medicine-lockup-dark.png"
          alt=""
          width={1024}
          height={205}
          priority
          sizes="(max-width: 700px) 78vw, 700px"
        />
        <p>Where medicine becomes visible.</p>
      </div>
    </div>
  );
}
