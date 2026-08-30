"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const SPLASH_STORAGE_KEY = "visible-medicine-splash-v2";

export function SplashScreen() {
  const dismissRef = useRef<() => void>(() => undefined);
  const skipButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.visibleMedicineSplash !== "show") return;

    const siteContent = document.getElementById("visible-medicine-site-content");
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dismissed = false;
    let finishTimer = 0;

    document.body.classList.add("splash-open");
    if (siteContent) {
      siteContent.inert = true;
      siteContent.setAttribute("aria-hidden", "true");
    }

    try {
      window.sessionStorage.setItem(SPLASH_STORAGE_KEY, "seen");
    } catch {
      // The introduction remains safe to dismiss when storage is unavailable.
    }

    const finish = (restoreFocus = true) => {
      root.dataset.visibleMedicineSplash = "hidden";
      document.body.classList.remove("splash-open");
      if (siteContent) {
        siteContent.inert = false;
        siteContent.removeAttribute("aria-hidden");
      }
      if (restoreFocus) previouslyFocused?.focus({ preventScroll: true });
    };

    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      root.dataset.visibleMedicineSplash = reduceMotion ? "hidden" : "leaving";
      if (reduceMotion) finish();
      else finishTimer = window.setTimeout(() => finish(), 440);
    };

    dismissRef.current = dismiss;
    const autoDismissTimer = window.setTimeout(dismiss, reduceMotion ? 850 : 2850);
    const focusTimer = window.setTimeout(() => skipButtonRef.current?.focus({ preventScroll: true }), 40);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(autoDismissTimer);
      window.clearTimeout(focusTimer);
      window.clearTimeout(finishTimer);
      window.removeEventListener("keydown", handleKeyDown);
      if (root.dataset.visibleMedicineSplash === "leaving") finish(false);
    };
  }, []);

  return (
    <div
      className="splash-screen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="splash-title"
      aria-describedby="splash-description"
    >
      <div className="splash-content">
        <h1 className="sr-only" id="splash-title">Visible Medicine, by Elivion</h1>
        <div className="splash-scan-stage" aria-hidden="true">
          <i className="splash-corner splash-corner-tl" />
          <i className="splash-corner splash-corner-tr" />
          <i className="splash-corner splash-corner-bl" />
          <i className="splash-corner splash-corner-br" />
          <div className="splash-logo-reveal">
            <Image
              className="splash-lockup"
              src="/brand/approved/visible-medicine-lockup-dark.png"
              alt=""
              width={1024}
              height={205}
              priority
              sizes="(max-width: 620px) 88vw, 860px"
            />
          </div>
          <span className="splash-scan-line" />
        </div>
        <p className="splash-tagline" id="splash-description">Where medicine becomes visible.</p>
        <div className="splash-boundary">
          <span>Education &amp; research only</span>
          <i aria-hidden="true" />
          <span>Imaging viewer <b>Powered by Didanix</b></span>
        </div>
      </div>
      <button ref={skipButtonRef} className="splash-skip" type="button" onClick={() => dismissRef.current()}>
        Skip intro <span aria-hidden="true">→</span>
      </button>
      <div className="splash-progress" aria-hidden="true"><i /></div>
    </div>
  );
}
