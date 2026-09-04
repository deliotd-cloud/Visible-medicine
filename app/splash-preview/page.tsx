import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CinematicFilm } from "../../components/CinematicFilm";
import styles from "./splash-preview.module.css";

export const metadata: Metadata = {
  title: "Dark opening-film collection",
  description: "Compare Aperture, Glide and Lumen with the original dark Signature opening for Visible Medicine.",
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
        <h1>The dark collection.</h1>
        <p>Glide selected · Alternatives retained</p>
      </div>
      <CinematicFilm />
      <footer className={styles.footer}>
        <p>Silent by default. Optional sound in each preview.</p>
        <details className={styles.credits}>
          <summary>Film &amp; imaging credits</summary>
          <div>
            <p>Original motion composition, 3D lighting and sound design for Visible Medicine. The refined Glide cut is selected for the website’s splash screen; the other films are retained for comparison.</p>
            <p><a href="https://commons.wikimedia.org/wiki/File:Chest_Xray_PA_3-8-2010.png" target="_blank" rel="noreferrer">Chest radiograph</a> — Stillwaterising. <a href="https://commons.wikimedia.org/wiki/Scrollable_computed_tomography_images_of_a_normal_brain_(case_1)" target="_blank" rel="noreferrer">CT head</a> — Mikael Häggström, M.D. <a href="https://doi.org/10.5061/dryad.119f80q" target="_blank" rel="noreferrer">7T brain MRI</a> — Edlow et al. (2019), Dryad; WebM conversion by Jahobr.</p>
            <p>Reveal also uses a <a href="https://opengameart.org/content/brain-and-skull" target="_blank" rel="noreferrer">3D brain model by Drummyfish</a>, made by its creator using their MRI as a reference. The model is lit, smoothed and animated for this film.</p>
            <p>The imaging and brain model are released under <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">CC0</a>. The scans are cropped, colour-treated and retimed; the MRI is an ex vivo research scan. These are separate sources arranged artistically, not one patient, a diagnostic reconstruction or atlas teaching content.</p>
          </div>
        </details>
      </footer>
    </main>
  );
}
