import { useEffect, useRef } from "react";

let hasDismissedInitialLoader = false;

export default function InitialSiteLoader() {
  const exitTimerRef = useRef(null);
  const cleanupTimerRef = useRef(null);

  useEffect(() => {
    if (hasDismissedInitialLoader) {
      const staticLoader = document.getElementById("initial-site-loader");
      if (staticLoader) staticLoader.remove();
      document.documentElement.classList.remove("site-loading");
      return;
    }

    exitTimerRef.current = setTimeout(() => {
      hasDismissedInitialLoader = true;
      try {
        document.documentElement.classList.remove("site-loading");
        const staticLoader = document.getElementById("initial-site-loader");
        if (staticLoader) {
          staticLoader.classList.add("exiting");
          cleanupTimerRef.current = setTimeout(() => {
            staticLoader.remove();
          }, 450);
        }
        if (typeof window !== "undefined") {
          window.__studio_initialized = true;
          window.dispatchEvent(new CustomEvent("site-loader-complete"));
        }
      } catch {
      }
    }, 700);

    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
    };
  }, []);

  return null;
}
