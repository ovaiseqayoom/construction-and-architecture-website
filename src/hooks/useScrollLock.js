import { useEffect } from "react";

export default function useScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return;

    const html = document.documentElement;
    const body = document.body;

    const scrollbarWidth = window.innerWidth - html.clientWidth;
    const originalPaddingRight = body.style.paddingRight;
    const originalOverflow = body.style.overflow;

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
    body.style.overflow = "hidden";
    html.classList.add("nav-menu-open");
    body.classList.add("nav-menu-open");

    if (window.lenis) {
      window.lenis.stop();
    }

    return () => {
      body.style.paddingRight = originalPaddingRight;
      body.style.overflow = originalOverflow;
      html.classList.remove("nav-menu-open");
      body.classList.remove("nav-menu-open");

      if (window.lenis) {
        window.lenis.start();
      }
    };
  }, [isLocked]);
}