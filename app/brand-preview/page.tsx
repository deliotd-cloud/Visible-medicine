import type { Metadata } from "next";
import Image from "next/image";
import styles from "./brand-preview.module.css";

export const metadata: Metadata = {
  title: "Logo system preview",
  description: "Private review of the Visible Medicine and Elivion endorsement system.",
  robots: { index: false, follow: false },
};

export default function BrandPreviewPage() {
  return (
    <main className={`brand-preview-page ${styles.page}`}>
      <header className={styles.intro}>
        <p>Private brand review</p>
        <h1>The selected Visible Medicine identity.</h1>
        <span>The matched light and dark artwork uses a clean typographic “by Elivion” endorsement. The Elivion emblem is not used inside the wordmark.</span>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <span>01</span>
          <div><h2>Matched light and dark system</h2><p>The selected direction for continued development.</p></div>
        </div>
        <figure className={styles.artwork}>
          <Image src="/brand/review/visible-medicine-light-approved.png" width={2172} height={724} alt="Approved light Visible Medicine logo with by Elivion endorsement" priority />
          <figcaption><b>Light master</b><span>Warm ivory · navy and teal · endorsement below the wordmark</span></figcaption>
        </figure>
        <figure className={styles.artwork}>
          <Image src="/brand/review/visible-medicine-dark-approved.png" width={2140} height={735} alt="Approved dark Visible Medicine logo with inline by Elivion endorsement" />
          <figcaption><b>Dark master</b><span>Deep teal · warm white and teal · inline endorsement</span></figcaption>
        </figure>
      </section>

      <aside className={styles.decision}>
        <span>Decision recorded</span>
        <strong>Use the standard “by Elivion” endorsement. Do not place the Elivion emblem inside the Visible Medicine wordmark.</strong>
      </aside>
    </main>
  );
}
