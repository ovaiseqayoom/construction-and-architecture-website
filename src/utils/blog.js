import { supabase } from "../lib/supabaseClient";
import { API_ENDPOINTS } from "../config/api";
import { DEMO_BLOGS } from "../data/demoContent";

export { DEMO_BLOGS };

const CACHE_TTL_MS = 10 * 1000;
let memoryBlogsCache = null;
let lastCacheTimestamp = 0;
let inFlightBlogsPromise = null;

export function getCachedBlogsSync() {
  if (memoryBlogsCache && memoryBlogsCache.length > 0) {
    return memoryBlogsCache;
  }
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const cached = sessionStorage.getItem("app_blogs_cache_v1");
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < 10 * 60 * 1000 && Array.isArray(data) && data.length > 0) {
          const normalized = data.map(normalizeBlog);
          memoryBlogsCache = normalized;
          lastCacheTimestamp = timestamp;
          return normalized;
        }
      }
    } catch {}
  }
  if (!supabase && typeof import.meta !== "undefined" && !import.meta.env?.VITE_API_URL) {
    const demoNormalized = DEMO_BLOGS.map(normalizeBlog);
    memoryBlogsCache = demoNormalized;
    return demoNormalized;
  }
  return null;
}

export const BLOG_CATEGORIES = [
  "All",
  "Construction",
  "Architectural Design",
  "Structural Engineering",
  "Project Management",
  "Building Codes & Zoning",
  "Urban Infrastructure",
  "Building Materials & Tech",
  "Studio Insights",
];

export function normalizeBlog(raw) {
  if (!raw) return null;

  let faqs = [];
  if (Array.isArray(raw.faq_items) && raw.faq_items.length > 0) {
    faqs = raw.faq_items;
  } else if (typeof raw.faq_items === "string" && raw.faq_items.trim()) {
    try {
      const parsed = JSON.parse(raw.faq_items);
      if (Array.isArray(parsed) && parsed.length > 0) {
        faqs = parsed;
      }
    } catch {
      faqs = [];
    }
  }

  if (faqs.length === 0 && raw.content && /(?:^|\n)#{2,4}\s*(?:FAQ|Frequently Asked Questions)/i.test(raw.content)) {
    const faqRegex =
      /(?:^|\n)#{2,4}\s*(?:FAQ:?|Frequently Asked Questions:?)\s*([^\n\r]+)[\r\n]+([\s\S]*?)(?=(?:(?:^|\n)#{2,4}\s*(?:FAQ:?|Frequently Asked Questions:?))|$)/gi;
    let match;
    while ((match = faqRegex.exec(raw.content)) !== null) {
      const q = match[1].trim();
      const a = match[2].trim();
      if (q && a) {
        faqs.push({ question: q, answer: a });
      }
    }
  }

  const readingTime =
    raw.reading_time_minutes ||
    Math.max(
      1,
      Math.ceil(
        (raw.content || "")
          .replace(/```[\s\S]*?```/g, "")
          .replace(/<[^>]*>/g, "")
          .split(/\s+/)
          .filter(Boolean).length / 200
      )
    );

  return {
    id: raw.id,
    title: raw.title || "Engineering Publication",
    slug: raw.slug || (raw.id ? String(raw.id) : ""),
    category: raw.category || "Construction",
    excerpt: raw.excerpt || "",
    content: raw.content || "",
    coverImage: raw.cover_image_url || raw.coverImage || "",
    coverImageAlt: raw.cover_image_alt || raw.title || "Structura Engineering Journal",
    authorId: raw.author_id || "studio-0102",
    authorName: raw.author_name || "Elena Cho",
    authorRole: raw.author_role || "Structural Engineering Lead",
    authorAvatar: raw.author_avatar || "/images/team/avatar-02.svg",
    faqItems: faqs,
    blufSummary: raw.bluf_summary || raw.blufSummary || "",
    geoScope: raw.geo_scope || raw.geoScope || "global",
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    engineeringStandards: Array.isArray(raw.engineering_standards) ? raw.engineering_standards : [],
    isFeatured: Boolean(raw.is_featured ?? raw.isFeatured),
    canonicalUrl: raw.canonical_url || raw.canonicalUrl || null,
    relatedServiceUrl: raw.related_service_url || raw.relatedServiceUrl || "/services",
    reviewedBy: raw.reviewed_by || raw.reviewedBy || null,
    metaTitle: raw.meta_title || raw.title,
    metaDescription: raw.meta_description || raw.excerpt || raw.title,
    readingTime,
    viewsCount: Number(raw.views_count || raw.viewsCount || 0),
    likesCount: Number(raw.likes_count || raw.likesCount || 0),
    status: raw.status || "published",
    publishedAt: raw.published_at || raw.created_at || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.published_at || new Date().toISOString(),
  };
}

export async function fetchLiveBlogs(options = { forceRefresh: false }) {
  const isFresh = Date.now() - lastCacheTimestamp < CACHE_TTL_MS;
  if (!options?.forceRefresh && isFresh && memoryBlogsCache && memoryBlogsCache.length > 0) {
    return memoryBlogsCache;
  }

  if (inFlightBlogsPromise) {
    return inFlightBlogsPromise;
  }

  inFlightBlogsPromise = (async () => {
    if (!options?.forceRefresh && typeof window !== "undefined" && window.sessionStorage) {
      try {
        const cached = sessionStorage.getItem("app_blogs_cache_v1");
        if (cached) {
          const parsed = JSON.parse(cached);
          const dataList = Array.isArray(parsed) ? parsed : parsed?.data;
          const cachedTime = Array.isArray(parsed) ? 0 : parsed?.timestamp || 0;
          if (Array.isArray(dataList) && dataList.length > 0) {
            memoryBlogsCache = dataList.map(normalizeBlog);
            lastCacheTimestamp = cachedTime;
            if (Date.now() - cachedTime < CACHE_TTL_MS) {
              return memoryBlogsCache;
            }
          }
        }
      } catch {}
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("blogs")
          .select("*")
          .eq("status", "published")
          .order("published_at", { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const normalized = data.map(normalizeBlog);
          memoryBlogsCache = normalized;
          lastCacheTimestamp = Date.now();
          if (typeof window !== "undefined" && window.sessionStorage) {
            try {
              sessionStorage.setItem(
                "app_blogs_cache_v1",
                JSON.stringify({ timestamp: Date.now(), data })
              );
            } catch {}
          }
          return normalized;
        }
      } catch (err) {
        console.warn("[Blogs] Supabase query notice, falling back to demo data:", err.message);
      }
    }

    if (import.meta.env?.VITE_API_URL) {
      try {
        const res = await fetch(API_ENDPOINTS.BLOGS || "/api/blogs", {
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : json?.blogs || [];
          if (list.length > 0) {
            const normalized = list.map(normalizeBlog);
            memoryBlogsCache = normalized;
            lastCacheTimestamp = Date.now();
            return normalized;
          }
        }
      } catch (err) {
        console.warn("[Blogs] API fallback notice:", err.message);
      }
    }

    const demoNormalized = DEMO_BLOGS.map(normalizeBlog);
    memoryBlogsCache = demoNormalized;
    lastCacheTimestamp = Date.now();
    return demoNormalized;
  })();

  try {
    return await inFlightBlogsPromise;
  } finally {
    inFlightBlogsPromise = null;
  }
}

export async function fetchSingleBlog(slug) {
  if (!slug) return null;

  const target = slug.toLowerCase().trim();

  if (memoryBlogsCache && memoryBlogsCache.length > 0) {
    const found = memoryBlogsCache.find(
      (b) => (b.slug || "").toLowerCase().trim() === target || (b.id || "").toLowerCase().trim() === target
    );
    if (found) return found;
  }

  if (supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      let query = supabase.from("blogs").select("*").eq("status", "published");
      if (isUuid) {
        query = query.or(`id.eq.${slug},slug.eq.${target}`);
      } else {
        query = query.eq("slug", target);
      }

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        return normalizeBlog(data);
      }
    } catch (err) {
      console.warn("[BlogDetail] Supabase query notice:", err.message);
    }
  }

  if (typeof window !== "undefined" && window["__INITIAL_BLOG_DATA__"]) {
    const init = window["__INITIAL_BLOG_DATA__"];
    const initSlug = (init.slug || "").toLowerCase().trim();
    const initId = (init.id || "").toLowerCase().trim();

    if (initSlug === target || initId === target) {
      return normalizeBlog(init);
    }
  }

  if (import.meta.env?.VITE_API_URL) {
    try {
      const res = await fetch(`${API_ENDPOINTS.BLOG_DETAIL || "/api/blogs"}/${encodeURIComponent(target)}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data) return normalizeBlog(data);
      }
    } catch (err) {
      console.warn("[BlogDetail] API fallback notice:", err.message);
    }
  }

  const demoMatch = DEMO_BLOGS.find(
    (b) => (b.slug || "").toLowerCase() === target || (b.id || "").toLowerCase() === target
  );
  return demoMatch ? normalizeBlog(demoMatch) : null;
}

export function slugifyHeading(text = "") {
  return text
    .toLowerCase()
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractTableOfContents(markdown = "") {
  if (!markdown) return [];

  const cleanMarkdown = markdown.replace(/(?:^|\n)#{2,4}\s*(?:FAQ|Frequently Asked Questions)[\s\S]*$/i, "");
  const lines = cleanMarkdown.split(/\r?\n/);
  const headings = [];
  const seenIds = new Set();

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length;
    const rawText = match[2].trim();

    const text = rawText
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/`.*?`/g, "")
      .trim();

    if (/^faq\b/i.test(text) || /^frequently asked questions/i.test(text)) continue;

    let baseId = slugifyHeading(text);
    if (!baseId) baseId = `section-${headings.length + 1}`;

    let uniqueId = baseId;
    let counter = 1;
    while (seenIds.has(uniqueId)) {
      uniqueId = `${baseId}-${counter}`;
      counter++;
    }
    seenIds.add(uniqueId);

    headings.push({
      id: uniqueId,
      text,
      level,
    });
  }

  return headings;
}

export function formatBlogShare(blog, origin = "") {
  if (!blog) return { title: "", text: "", url: "" };
  const baseOrigin =
    origin ||
    (typeof window !== "undefined" ? window.location.origin : "https://example.com");

  const url = `${baseOrigin}/blog/${blog.slug}`;
  const title = `${blog.title} — Structura Architecture & Construction`;
  const text = blog.excerpt || blog.title;

  return {
    title,
    text,
    url,
    whatsappUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title}\n${url}`)}`,
    twitterUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    linkedinUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  };
}
