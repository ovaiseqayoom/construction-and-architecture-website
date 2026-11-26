import React from "react";
import { supabase } from "../lib/supabaseClient";
import { API_ENDPOINTS } from "../config/api";
import { DEMO_PROJECTS } from "../data/demoContent";

export { DEMO_PROJECTS };

export const DEFAULT_PROJECT_DELIVERABLES = [
  "Full architectural design & code-compliant structural engineering.",
  "Turnkey site execution with dedicated superintendent supervision.",
  "Tested high-grade structural concrete, ductile rebar, and waterproof membranes.",
  "Itemized Bill of Quantities (BOQ) and documented milestone handover.",
];

export function getProjectCoverUrl(projectOrCover) {
  if (!projectOrCover) return "";
  if (typeof projectOrCover === "string") return projectOrCover;
  if (projectOrCover.coverImage && typeof projectOrCover.coverImage === "string") return projectOrCover.coverImage;
  if (projectOrCover.cover_image && typeof projectOrCover.cover_image === "string") return projectOrCover.cover_image;
  if (projectOrCover.coverImage?.url) return projectOrCover.coverImage.url;
  if (projectOrCover.cover_image?.url) return projectOrCover.cover_image.url;
  if (projectOrCover.url) return projectOrCover.url;
  if (projectOrCover.image) return typeof projectOrCover.image === "string" ? projectOrCover.image : projectOrCover.image.url || "";
  return "";
}

export function sanitizeProjectTitle(title) {
  if (!title || typeof title !== "string") return title || "";
  return title.trim();
}

export function normalizeProject(raw) {
  if (!raw) return null;

  const cover = getProjectCoverUrl(raw);
  const rawGallery = Array.isArray(raw.gallery_images)
    ? raw.gallery_images
    : Array.isArray(raw.galleryImages)
    ? raw.galleryImages
    : Array.isArray(raw.gallery)
    ? raw.gallery
    : [];

  return {
    id: raw.id,
    title: sanitizeProjectTitle(raw.title || ""),
    slug: raw.slug || (raw.id ? String(raw.id) : ""),
    category: raw.category || "Architecture & Engineering",
    location: raw.location || "Design District",
    duration: raw.duration || "",
    year: raw.year || "",
    summary: raw.summary || "",
    description: raw.description || "",
    deliverables: Array.isArray(raw.deliverables) && raw.deliverables.length > 0 ? raw.deliverables : [],
    coverImage: cover,
    galleryImages: rawGallery,
    hashtags: raw.hashtags || [],
    display_order: raw.display_order ?? null,
    displayOrder: raw.display_order ?? null,
    is_featured: Boolean(raw.is_featured || raw.isFeatured),
    isFeatured: Boolean(raw.is_featured || raw.isFeatured),
  };
}

export function extractProjectDescription(project) {
  const rawDescription = project?.description || "";
  const cleanDescription = rawDescription
    .replace(/<!--\s*HASHTAGS\s*-->[\s\S]*$/i, "")
    .replace(/(\n\s*#[a-zA-Z0-9_\u0600-\u06FF\s,#]+)+$/g, "")
    .trim();

  const shortOverview = project?.summary || cleanDescription;
  const detailedDescription =
    cleanDescription && cleanDescription !== project?.summary ? cleanDescription : null;

  return {
    cleanDescription,
    shortOverview,
    detailedDescription,
  };
}

export function extractProjectHashtags(project, maxTags = 8) {
  const rawHashtags = project?.hashtags || [];
  let tags = [];

  if (Array.isArray(rawHashtags)) {
    tags = rawHashtags.filter(Boolean);
  } else if (typeof rawHashtags === "string" && rawHashtags.trim()) {
    tags = rawHashtags.split(/[\s,]+/).filter(Boolean);
  }

  if (tags.length === 0) {
    const combinedText = `${project?.description || ""} ${project?.summary || ""}`;
    const foundTags = combinedText.match(/#[a-zA-Z0-9_]+/g);
    if (foundTags) {
      tags = Array.from(new Set(foundTags));
    }
  }

  return tags
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .slice(0, maxTags);
}

export function normalizeProjectGallery(project) {
  if (!project) return [];
  const coverImageUrl = getProjectCoverUrl(project);
  const rawGallery = Array.isArray(project.galleryImages)
    ? project.galleryImages
    : Array.isArray(project.gallery_images)
    ? project.gallery_images
    : Array.isArray(project.gallery)
    ? project.gallery
    : [];

  const rawList =
    coverImageUrl && !rawGallery.some((item) => (typeof item === "string" ? item : item?.url) === coverImageUrl)
      ? [coverImageUrl, ...rawGallery]
      : rawGallery;

  return rawList.map((item, idx) => {
    const rawUrl = typeof item === "string" ? item : item?.url || item?.src || item?.image || "";
    const isFirst = idx === 0;
    const viewLabel = isFirst ? "Main Elevation & Front Facade" : `Architectural Perspective ${idx + 1}`;
    const location = project.location || "Design District";
    const altText = `${project.title || "Project"} - ${viewLabel} | ${location}`;
    const captionText = isFirst
      ? `${project.title || "Project"} - Front elevation and architectural overview in ${location}.`
      : `${project.title || "Project"} - Architectural perspective and execution detail (${viewLabel}) in ${location}.`;
    return {
      url: rawUrl,
      label: viewLabel,
      alt: altText,
      title: `${project.title || "Project"} - ${viewLabel}`,
      caption: captionText,
    };
  });
}

export function formatProjectShare(project, origin = "") {
  if (!project) return { title: "", text: "", url: "" };
  const baseOrigin =
    origin || (typeof window !== "undefined" ? window.location.origin : "https://example.com");
  const projectSlug = project.slug || project.id;

  const coverUrl = getProjectCoverUrl(project);
  let coverHash = "";
  if (coverUrl) {
    let hash = 0;
    for (let i = 0; i < coverUrl.length; i++) {
      hash = (hash << 5) - hash + coverUrl.charCodeAt(i);
      hash |= 0;
    }
    coverHash = Math.abs(hash).toString(36).slice(0, 8);
  }

  const shareUrl = coverHash
    ? `${baseOrigin}/projects/${projectSlug}?v=${coverHash}`
    : `${baseOrigin}/projects/${projectSlug}`;

  const cleanTitle = (project.title || "Engineering Project").trim();
  const shareText = `${cleanTitle} — Structura Architecture & Construction`;

  return {
    title: `${cleanTitle} | Structura Architecture & Construction`,
    text: shareText,
    url: shareUrl,
  };
}

export function renderSmartCaseStudy(content, styles = {}) {
  if (!content) return null;

  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);

  return lines.map((line, idx) => {
    const cleanLine = line.replace(/^([0-9]+\s*[.)-]\s*|[-•*]\s*)/, "").trim();
    const colonIndex = cleanLine.indexOf(":");

    if (colonIndex !== -1 && colonIndex < 40 && !cleanLine.includes("http")) {
      const label = cleanLine.slice(0, colonIndex).trim();
      const value = cleanLine.slice(colonIndex + 1).trim();
      return React.createElement(
        "p",
        { key: idx, className: styles.caseStudyPara },
        React.createElement("strong", { className: styles.keyHighlight }, `${label}:`),
        ` ${value}`
      );
    }

    return React.createElement(
      "p",
      { key: idx, className: styles.caseStudyPara },
      cleanLine
    );
  });
}

let memoryProjectsCache = null;
let inFlightProjectsPromise = null;
let lastCacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000;

export async function fetchLiveProjects(options = { forceRefresh: false }) {
  const isFresh = Date.now() - lastCacheTimestamp < CACHE_TTL_MS;
  if (!options?.forceRefresh && isFresh && memoryProjectsCache && memoryProjectsCache.length > 0) {
    return memoryProjectsCache;
  }

  if (inFlightProjectsPromise) {
    return inFlightProjectsPromise;
  }

  inFlightProjectsPromise = (async () => {
    if (!options?.forceRefresh && typeof window !== "undefined" && window.sessionStorage) {
      try {
        const cached = sessionStorage.getItem("app_projects_cache_v1");
        if (cached) {
          const parsed = JSON.parse(cached);
          const dataList = Array.isArray(parsed) ? parsed : parsed?.data;
          const cachedTime = Array.isArray(parsed) ? 0 : parsed?.timestamp || 0;
          if (Array.isArray(dataList) && dataList.length > 0) {
            memoryProjectsCache = dataList.map(normalizeProject);
            lastCacheTimestamp = cachedTime;
            if (Date.now() - cachedTime < CACHE_TTL_MS) {
              return memoryProjectsCache;
            }
          }
        }
      } catch {
      }
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("display_order", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const normalized = data.map(normalizeProject);
          memoryProjectsCache = normalized;
          lastCacheTimestamp = Date.now();
          if (typeof window !== "undefined" && window.sessionStorage) {
            try {
              sessionStorage.setItem("app_projects_cache_v1", JSON.stringify({ timestamp: Date.now(), data }));
            } catch {
            }
          }
          return normalized;
        }
      } catch (sbErr) {
        console.warn("Supabase query failed, falling back to demo projects:", sbErr);
      }
    }

    if (import.meta.env?.VITE_API_URL) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(API_ENDPOINTS.PROJECTS, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const normalized = data.map(normalizeProject);
            memoryProjectsCache = normalized;
            return normalized;
          }
        }
      } catch {
      }
    }

    const demoNormalized = DEMO_PROJECTS.map(normalizeProject);
    memoryProjectsCache = demoNormalized;
    lastCacheTimestamp = Date.now();
    return demoNormalized;
  })();

  try {
    return await inFlightProjectsPromise;
  } finally {
    inFlightProjectsPromise = null;
  }
}
