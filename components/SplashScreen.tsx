"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { SplashConcept } from "./SplashConcept";

const SPLASH_STORAGE_KEY = "visible-medicine-splash-v4";

export function SplashScreen() {
  const pathname = usePathname();
  const dismissRef = useRef<() => void>(() => undefined);
  const skipButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (pathname !== "/") {
      root.dataset.visibleMedicineSplash = "hidden";
      return;
    }
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
      window.localStorage.setItem(SPLASH_STORAGE_KEY, "seen");
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
    const autoDismissTimer = window.setTimeout(dismiss, reduceMotion ? 850 : 3900);
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
  }, [pathname]);

  if (pathname !== "/") return null;

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
        <SplashConcept variant="relay" />
        <p className="sr-only" id="splash-description">Where medicine becomes visible.</p>
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
