"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const SPLASH_STORAGE_KEY = "visible-medicine-splash-v5";

export function SplashScreen() {
  const pathname = usePathname();
  return pathname === "/" ? <HomeSplash /> : null;
}

function HomeSplash() {
  const [playFilm, setPlayFilm] = useState(false);
  const dismissRef = useRef<() => void>(() => undefined);
  const skipButtonRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.visibleMedicineSplash !== "show") return;

    const siteContent = document.getElementById("visible-medicine-site-content");
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const staticIntro = motionPreference.matches || Boolean(connection?.saveData);
    let dismissed = false;
    let finishTimer = 0;
    let playFrame = 0;

    document.body.classList.add("splash-open");
    if (siteContent) {
      siteContent.inert = true;
      siteContent.setAttribute("aria-hidden", "true");
    }
    try { localStorage.setItem(SPLASH_STORAGE_KEY, "seen"); } catch { /* Storage is optional. */ }

    const finish = (restoreFocus = true) => {
      root.dataset.visibleMedicineSplash = "hidden";
      document.body.classList.remove("splash-open");
      if (siteContent) {
        siteContent.inert = false;
        siteContent.removeAttribute("aria-hidden");
      }
      videoRef.current?.pause();
      if (restoreFocus) {
        const target = previousFocus && previousFocus !== document.body
          ? previousFocus
          : document.getElementById("main-content");
        target?.focus({ preventScroll: true });
      }
    };

    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      videoRef.current?.pause();
      root.dataset.visibleMedicineSplash = staticIntro ? "hidden" : "leaving";
      if (staticIntro) finish();
      else finishTimer = window.setTimeout(() => finish(), 420);
    };
    dismissRef.current = dismiss;
    // A missing or stalled movie must never trap someone in the introduction.
    const deadline = window.setTimeout(dismiss, staticIntro ? 700 : 8500);
    const focusTimer = window.setTimeout(() => skipButtonRef.current?.focus({ preventScroll: true }), 40);
    if (!staticIntro) playFrame = requestAnimationFrame(() => setPlayFilm(true));
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
      if (event.key === "Tab" && !dismissed) {
        event.preventDefault();
        skipButtonRef.current?.focus();
      }
    };
    const handleMotionChange = () => { if (motionPreference.matches) dismiss(); };
    window.addEventListener("keydown", handleKey);
    motionPreference.addEventListener("change", handleMotionChange);

    return () => {
      window.clearTimeout(deadline);
      window.clearTimeout(focusTimer);
      window.clearTimeout(finishTimer);
      cancelAnimationFrame(playFrame);
      window.removeEventListener("keydown", handleKey);
      motionPreference.removeEventListener("change", handleMotionChange);
      dismissRef.current = () => undefined;
      // Route changes must release the page even if they interrupt playback.
      finish(false);
    };
  }, []);

  return (
    <div className="splash-screen" role="dialog" aria-modal="true" aria-labelledby="splash-title" aria-describedby="splash-description">
      <h1 className="sr-only" id="splash-title">Visible Medicine, by Elivion</h1>
      <p className="sr-only" id="splash-description">Where medicine becomes visible. A short introduction featuring X-ray, CT and MRI imaging.</p>
      <div className="splash-film-stage" aria-hidden="true">
        {playFilm ? (
          <video
            ref={videoRef}
            className="splash-film"
            src="/media/splash/visible-medicine-splash-v1.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            onCanPlay={() => {
              if (document.documentElement.dataset.visibleMedicineSplash === "show") {
                videoRef.current?.play().catch(() => dismissRef.current());
              }
            }}
            onEnded={() => dismissRef.current()}
            onError={() => dismissRef.current()}
            tabIndex={-1}
          />
        ) : (
          <Image className="splash-static-brand" src="/brand/approved/visible-medicine-lockup-dark.png" alt="" width={1024} height={205} priority />
        )}
      </div>
      <button ref={skipButtonRef} className="splash-skip" type="button" onClick={() => dismissRef.current()}>
        Skip intro <span aria-hidden="true">→</span>
      </button>
      <span className="splash-education-note">Education &amp; research</span>
    </div>
  );
}
