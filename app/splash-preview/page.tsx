import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CinematicFilm } from "../../components/CinematicFilm";
import styles from "./splash-preview.module.css";

export const metadata: Metadata = {
  title: "Cinematic opening",
  description: "Watch the new Visible Medicine cinematic opening.",
  robots: { index: false, follow: false },
};

export default function SplashPreviewPage() {
  return (
    <main className={`splash-preview-page ${styles.page}`}>
      <header className={styles.header}>
        <Link href="/" aria-label="Visible Medicine home">
          <Image src="/brand/approved/visible-medicine-lockup-dark.png" width={1024} height={205} alt="Visible Medicine, by Elivion" priority />
        </Link>
        <Link className={styles.back} href="/">Back to website <span aria-hidden="true">↗</span></Link>
      </header>
      <div className={styles.titleRow}>
        <h1>Look closer.</h1>
        <p>A new cinematic opening</p>
      </div>
      <CinematicFilm />
      <footer className={styles.footer}>
        <p>Real radiology. A journey beneath the surface.</p>
        <details className={styles.credits}>
          <summary>Film &amp; imaging credits</summary>
          <div>
            <p>Original motion composition and sound design for Visible Medicine. The website opens silently; audio is optional in this preview.</p>
            <p><a href="https://commons.wikimedia.org/wiki/File:Chest_Xray_PA_3-8-2010.png" target="_blank" rel="noreferrer">Chest radiograph</a> — Stillwaterising. <a href="https://commons.wikimedia.org/wiki/Scrollable_computed_tomography_images_of_a_normal_brain_(case_1)" target="_blank" rel="noreferrer">CT head</a> — Mikael Häggström, M.D. <a href="https://doi.org/10.5061/dryad.119f80q" target="_blank" rel="noreferrer">7T brain MRI</a> — Edlow et al. (2019), Dryad; WebM conversion by Jahobr.</p>
            <p>All three imaging sources are released under <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">CC0</a>. Cropped, colour-treated, retimed and composited for this film. The MRI is an ex vivo research scan. The movement through CT planes is an artistic composition.</p>
          </div>
        </details>
      </footer>
    </main>
  );
}
