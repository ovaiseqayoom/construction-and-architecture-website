import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import Lenis from "lenis";

const SCROLL_STORAGE_KEY = "app_scroll_positions_v1";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function getStoredPositions() {
  if (typeof window === "undefined" || !window.sessionStorage) return {};
  try {
    const raw = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const pendingStorageUpdates = {};
let persistTimer = null;

function flushStoredPositions() {
  persistTimer = null;
  if (typeof window === "undefined" || !window.sessionStorage) return;
  try {
    const data = getStoredPositions();
    for (const [k, v] of Object.entries(pendingStorageUpdates)) {
      data[k] = v;
      delete pendingStorageUpdates[k];
    }
    const keys = Object.keys(data);
    if (keys.length > 50) {
      delete data[keys[0]];
    }
    sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(data));
  } catch {
  }
}

// Debounce sessionStorage writes so scroll frames never trigger synchronous JSON parsing/serialization
function saveStoredPosition(key, val) {
  if (typeof window === "undefined" || !window.sessionStorage || !key) return;
  pendingStorageUpdates[key] = Math.round(val);
  if (persistTimer) return;
  persistTimer = setTimeout(flushStoredPositions, 180);
}

export default function ScrollManager() {
  const location = useLocation();
  const navType = useNavigationType(); 
  const lenisRef = useRef(null);

  const scrollPositions = useRef(new Map());
  const activeLocationRef = useRef(location);
  const isRestoringRef = useRef(false);
  const restoreTimerRef = useRef(null);

  useEffect(() => {
    const stored = getStoredPositions();
    for (const [k, v] of Object.entries(stored)) {
      if (typeof v === "number" && !isNaN(v)) {
        scrollPositions.current.set(k, v);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const lenis = new Lenis({
      lerp: 0.12,
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      syncTouch: false,
      infinite: false,
      autoResize: true,
      autoRaf: true,
      anchors: { offset: -70 },
      stopInertiaOnNavigate: true,
      respectReducedMotion: false,
      allowNestedScroll: false,
    });

    lenisRef.current = lenis;
    window.lenis = lenis;

    const recordScroll = () => {
      if (isRestoringRef.current) return;

      const y = window.lenis ? window.lenis.scroll : window.scrollY;
      if (typeof y !== "number" || isNaN(y)) return;

      const currentLoc = activeLocationRef.current;
      if (currentLoc) {
        if (currentLoc.key && currentLoc.key !== "default") {
          scrollPositions.current.set(currentLoc.key, y);
          saveStoredPosition(currentLoc.key, y);
        }
        const pathKey = currentLoc.pathname + (currentLoc.search || "");
        scrollPositions.current.set(pathKey, y);
        scrollPositions.current.set(currentLoc.pathname, y);
        saveStoredPosition(pathKey, y);
      }
    };

    const unsubscribeLenis = lenis.on ? lenis.on("scroll", recordScroll) : null;
    window.addEventListener("scroll", recordScroll, { passive: true });

    const handleAnchorClick = (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href === "#" || href === "#!") return;

      try {
        const targetElement = document.querySelector(href);
        if (targetElement) {
          e.preventDefault();
          lenis.scrollTo(targetElement, { offset: -70, duration: 1.2 });
        }
      } catch {
      }
    };

    document.addEventListener("click", handleAnchorClick);

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      if (typeof unsubscribeLenis === "function") {
        unsubscribeLenis();
      } else if (lenis.off) {
        lenis.off("scroll", recordScroll);
      }
      window.removeEventListener("scroll", recordScroll);
      lenis.destroy();
      window.lenis = undefined;
      lenisRef.current = null;
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    const prevLoc = activeLocationRef.current;
    const isSamePathname = prevLoc?.pathname === location.pathname;

    if (lenisRef.current || typeof window !== "undefined") {
      const lastY = lenisRef.current ? lenisRef.current.scroll : window.scrollY;
      if (typeof lastY === "number" && !isNaN(lastY) && !isRestoringRef.current && prevLoc) {
        if (prevLoc.key && prevLoc.key !== "default") {
          scrollPositions.current.set(prevLoc.key, lastY);
          saveStoredPosition(prevLoc.key, lastY);
        }
        const prevPathKey = prevLoc.pathname + (prevLoc.search || "");
        scrollPositions.current.set(prevPathKey, lastY);
        scrollPositions.current.set(prevLoc.pathname, lastY);
        saveStoredPosition(prevPathKey, lastY);
      }
    }

    activeLocationRef.current = location;

    if (isSamePathname) {
      if (location.hash) {
        const target = document.querySelector(location.hash);
        if (target && !window.history.state?.isProjectModalOpen) {
          if (lenisRef.current) {
            lenisRef.current.scrollTo(target, { offset: -70, duration: 1.0 });
          } else {
            target.scrollIntoView({ behavior: "smooth" });
          }
        }
      }
      return;
    }

    if (restoreTimerRef.current) {
      clearTimeout(restoreTimerRef.current);
      restoreTimerRef.current = null;
    }

    if (navType === "POP") {
      const stored = getStoredPositions();
      const pathKey = location.pathname + (location.search || "");
      const savedY =
        scrollPositions.current.get(location.key) ??
        stored[location.key] ??
        scrollPositions.current.get(pathKey) ??
        stored[pathKey] ??
        scrollPositions.current.get(location.pathname) ??
        stored[location.pathname] ??
        0;

      isRestoringRef.current = true;

      if (typeof window !== "undefined") {
        window.scrollTo({ top: savedY, left: 0, behavior: "instant" });
        if (document.documentElement) document.documentElement.scrollTop = savedY;
        if (document.body) document.body.scrollTop = savedY;
      }
      if (lenisRef.current) {
        lenisRef.current.scrollTo(savedY, { immediate: true });
      }

      let attempts = 0;
      const verifyScroll = () => {
        if (!isRestoringRef.current || typeof window === "undefined") return;

        const maxScroll = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight
        );
        const targetY = Math.min(savedY, maxScroll);
        const currentY = lenisRef.current ? lenisRef.current.scroll : window.scrollY;

        if (Math.abs(currentY - targetY) > 8) {
          window.scrollTo({ top: targetY, left: 0, behavior: "instant" });
          if (lenisRef.current) {
            lenisRef.current.resize();
            lenisRef.current.scrollTo(targetY, { immediate: true });
          }
        }

        attempts += 1;
        if (attempts < 5 && maxScroll < savedY) {
          restoreTimerRef.current = setTimeout(verifyScroll, 50);
        } else {
          isRestoringRef.current = false;
        }
      };

      requestAnimationFrame(verifyScroll);

      const cancelOnUserAction = () => {
        isRestoringRef.current = false;
        if (restoreTimerRef.current) {
          clearTimeout(restoreTimerRef.current);
          restoreTimerRef.current = null;
        }
        window.removeEventListener("wheel", cancelOnUserAction);
        window.removeEventListener("touchstart", cancelOnUserAction);
      };

      window.addEventListener("wheel", cancelOnUserAction, { passive: true, once: true });
      window.addEventListener("touchstart", cancelOnUserAction, { passive: true, once: true });

      return () => {
        if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
      };
    }

    if (location.hash) {
      const timer = setTimeout(() => {
        try {
          const target = document.querySelector(location.hash);
          if (target) {
            if (lenisRef.current) {
              lenisRef.current.scrollTo(target, { offset: -70, duration: 1.0 });
            } else {
              target.scrollIntoView({ behavior: "smooth" });
            }
            return;
          }
        } catch {
        }
        if (lenisRef.current) {
          lenisRef.current.scrollTo(0, { immediate: true });
          lenisRef.current.resize();
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
      }, 80);
      return () => clearTimeout(timer);
    }

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    }
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
      lenisRef.current.resize();
    }
  }, [location, navType]);

  return null;
}
