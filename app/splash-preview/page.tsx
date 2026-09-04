import type { Metadata } from "next";
import { SplashPreviewGallery } from "../../components/SplashPreviewGallery";
import styles from "./splash-preview.module.css";

export const metadata: Metadata = {
  title: "Splash animation preview",
  description: "Private review of Visible Medicine splash-screen animation concepts.",
  robots: { index: false, follow: false },
};

export default function SplashPreviewPage() {
  return (
    <main className={`splash-preview-page ${styles.page}`}>
      <header className={styles.intro}>
        <p>Private motion review</p>
        <h1>Three ways to make imaging visible.</h1>
        <span>Each concept is deliberately brief, uses the same X-ray, CT and MRI imagery, and ends with the approved Visible Medicine identity.</span>
      </header>
      <SplashPreviewGallery />
      <aside className={styles.note}>
        <span>Current recommendation</span>
        <strong>01 — Modality relay</strong>
        <p>It reads immediately, remains clean at phone sizes and connects all three modalities without making the opening feel like an advert.</p>
      </aside>
    </main>
  );
}
