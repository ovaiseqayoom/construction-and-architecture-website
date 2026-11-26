import { lazy } from "react";

export const ROUTE_IMPORTERS = {
  "/": () => import("../pages/Home/Home"),
  "/services": () => import("../pages/Services/Services"),
  "/projects": () => import("../pages/Projects/Projects"),
  "/blog": () => import("../pages/Blog/BlogHub"),
  "/about": () => import("../pages/About/About"),
  "/contact": () => import("../pages/Contact/Contact"),
  "/careers": () => import("../pages/Careers/Careers"),
  "/terms": () => import("../pages/Legal/Terms"),
  "/privacy": () => import("../pages/Legal/Privacy"),
  "services-detail": () => import("../pages/Services/ServiceDetail"),
  "project-detail": () => import("../pages/Projects/ProjectDetail"),
  "blog-detail": () => import("../pages/Blog/BlogPost"),
  "team-profile": () => import("../pages/Team/TeamProfile"),
  "not-found": () => import("../pages/NotFound/NotFound"),
};

const modulePromiseCache = new Map();
const prefetchedRouteKeys = new Set();

export function loadModule(routeKey, importer) {
  if (modulePromiseCache.has(routeKey)) {
    return modulePromiseCache.get(routeKey);
  }

  const fn = importer || ROUTE_IMPORTERS[routeKey];
  if (!fn) {
    return Promise.reject(new Error(`No importer found for route key: ${routeKey}`));
  }

  const promise = fn().catch((err) => {
    modulePromiseCache.delete(routeKey);
    throw err;
  });

  modulePromiseCache.set(routeKey, promise);
  return promise;
}

// Immediate eager preload for direct URL navigation
if (typeof window !== "undefined" && window.location) {
  try {
    const p = window.location.pathname;
    if (p === "/blog" || p === "/blog/") {
      loadModule("/blog");
    } else if (p.startsWith("/blog/")) {
      loadModule("blog-detail");
    }
  } catch {}
}

export function lazyWithRetry(routeKey, importer, options = {}) {
  const {
    retries = 2,
    timeoutMs = 7500,
    routeName = routeKey,
  } = options;

  return lazy(() => {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const attempt = () => {
        let isSettled = false;

        const timer = setTimeout(() => {
          if (isSettled) return;
          isSettled = true;
          modulePromiseCache.delete(routeKey);
          handleFailure(new Error(`Timeout (${timeoutMs}ms) while loading route chunk for ${routeName}`));
        }, timeoutMs);

        loadModule(routeKey, importer)
          .then((module) => {
            if (isSettled) return;
            isSettled = true;
            clearTimeout(timer);
            resolve(module);
          })
          .catch((error) => {
            if (isSettled) return;
            isSettled = true;
            clearTimeout(timer);
            modulePromiseCache.delete(routeKey);
            handleFailure(error);
          });
      };

      const handleFailure = (error) => {
        attempts += 1;
        if (attempts <= retries) {
          const delay = attempts * 300;
          setTimeout(() => {
            attempt();
          }, delay);
        } else {
          if (typeof window !== "undefined") {
            const reloadKey = `app_chunk_recover_${routeName}`;
            const lastReload = window.sessionStorage.getItem(reloadKey);
            const now = Date.now();
            if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
              window.sessionStorage.setItem(reloadKey, now.toString());
              window.location.reload();
              return;
            }
          }
          reject(error);
        }
      };

      attempt();
    });
  });
}

export function resolveRouteKey(path) {
  if (!path) return "/";
  const clean = path.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";

  if (clean.startsWith("/services/")) {
    return "services-detail";
  }
  if (clean.startsWith("/projects/")) {
    return "project-detail";
  }
  if (clean.startsWith("/blog/")) {
    return "blog-detail";
  }
  if (clean.startsWith("/team/")) {
    return "team-profile";
  }
  if (ROUTE_IMPORTERS[clean]) {
    return clean;
  }
  return clean;
}

export function prefetchRoute(rawPath) {
  if (typeof window === "undefined") return;

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn && (conn.saveData || /2g/.test(conn.effectiveType))) {
    return;
  }

  const key = resolveRouteKey(rawPath);
  if (prefetchedRouteKeys.has(key)) return;

  const importer = ROUTE_IMPORTERS[key];
  if (typeof importer === "function") {
    prefetchedRouteKeys.add(key);
    loadModule(key, importer).catch(() => {
      prefetchedRouteKeys.delete(key);
    });
  }
}

export function prefetchCoreRoutes() {
  if (typeof window === "undefined") return;

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn && (conn.saveData || /2g/.test(conn.effectiveType))) {
    return;
  }

  const run = () => {
    const coreRoutes = [
      "/services",
      "/projects",
      "/blog",
      "/about",
      "/contact",
      "/careers",
      "services-detail",
      "project-detail",
      "blog-detail",
    ];
    coreRoutes.forEach((route, idx) => {
      setTimeout(() => {
        prefetchRoute(route);
      }, idx * 120);
    });
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 3500 });
  } else {
    setTimeout(run, 1800);
  }
}
