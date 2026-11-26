// api/sitemap.js
import fs from "node:fs";
import path from "node:path";
import {
  SITE_URL,
  getSupabaseClient,
  escapeXml,
} from "./_shared.js";

function getStaticPagesXml(currentDate) {
  const pages = [
    { path: "/", priority: "1.00", changefreq: "weekly" },
    { path: "/projects", priority: "0.95", changefreq: "daily" },
    { path: "/services", priority: "0.90", changefreq: "monthly" },
    { path: "/about", priority: "0.85", changefreq: "monthly" },
    { path: "/careers", priority: "0.85", changefreq: "weekly" },
    { path: "/contact", priority: "0.85", changefreq: "monthly" },
    { path: "/blog", priority: "0.90", changefreq: "daily" },
    { path: "/terms", priority: "0.30", changefreq: "yearly" },
    { path: "/privacy", priority: "0.30", changefreq: "yearly" },

    { path: "/services/architectural-design", priority: "0.85", changefreq: "monthly" },
    { path: "/services/structural-engineering", priority: "0.85", changefreq: "monthly" },
    { path: "/services/turnkey-construction", priority: "0.85", changefreq: "monthly" },
    { path: "/services/interior-modular-design", priority: "0.85", changefreq: "monthly" },
    { path: "/services/regulatory-approvals", priority: "0.85", changefreq: "monthly" },
  ];

  const urlNodes = pages
    .map(
      (p) => `  <url>
    <loc>${SITE_URL}${p.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
    )
    .join("\n\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Core Static Marketing, Service & Team Profile Pages -->
${urlNodes}
</urlset>
`;
}

function getProjectsSitemapXml(projects = [], currentDate) {
  const urlNodes = projects
    .map((project) => {
      const cover = project.cover_image
        ? typeof project.cover_image === "string"
          ? project.cover_image
          : project.cover_image?.url || ""
        : "";

      let rawGallery = [];
      if (Array.isArray(project.gallery_images)) {
        rawGallery = project.gallery_images;
      } else if (typeof project.gallery_images === "string") {
        try {
          const parsed = JSON.parse(project.gallery_images);
          if (Array.isArray(parsed)) {
            rawGallery = parsed;
          } else if (parsed) {
            rawGallery = [parsed];
          }
        } catch {
          rawGallery = [project.gallery_images];
        }
      }

      const uniqueImages = [];
      if (cover) uniqueImages.push(cover);
      for (const item of rawGallery) {
        const u = typeof item === "string" ? item : item?.url || "";
        if (u && !uniqueImages.includes(u)) {
          uniqueImages.push(u);
        }
      }

      // Valid 2026 Google Image tags: only <image:image><image:loc>
      const imageTags = uniqueImages
        .map((imgUrl) => {
          const raw = typeof imgUrl === "string" ? imgUrl : imgUrl?.url || "";
          const safe = escapeXml(raw);
          if (!safe) return "";
          return `
    <image:image>
      <image:loc>${safe}</image:loc>
    </image:image>`;
        })
        .filter(Boolean)
        .join("");

      const projectDate = project.created_at
        ? new Date(project.created_at).toISOString().split("T")[0]
        : currentDate;

      const slug = escapeXml(project.slug || project.id);

      return `  <url>
    <loc>${SITE_URL}/projects/${slug}</loc>
    <lastmod>${projectDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.85</priority>${imageTags}
  </url>`;
    })
    .join("\n\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Published Portfolio Projects with Google Image Sitemap Extension -->
${urlNodes}
</urlset>
`;
}

function getBlogSitemapXml(blogs = [], currentDate) {
  const urlNodes = blogs
    .map((blog) => {
      const blogDate = (blog.content_updated_at || blog.updated_at || blog.published_at)
        ? new Date(blog.content_updated_at || blog.updated_at || blog.published_at).toISOString().split("T")[0]
        : currentDate;

      const canonicalUrl = blog.canonical_url ? escapeXml(blog.canonical_url) : `${SITE_URL}/blog/${escapeXml(blog.slug || blog.id)}`;

      return `  <url>
    <loc>${canonicalUrl}</loc>
    <lastmod>${blogDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`;
    })
    .join("\n\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Published Technical Engineering Publications & Knowledge Hub Guides -->
${urlNodes}
</urlset>
`;
}

function getSitemapIndexXml(currentDate) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-pages.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-projects.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-blog.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
</sitemapindex>
`;
}

function tryReadStaticSitemap(filename) {
  const candidates = [
    path.join(process.cwd(), "dist", filename),
    path.join(process.cwd(), "public", filename),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        return fs.readFileSync(candidate, "utf-8");
      } catch {
      }
    }
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).send("Method Not Allowed");
  }

  const currentDate = new Date().toISOString().split("T")[0];
  const urlPath = req.url || "";
  const queryType = req.query?.type || "";

  // Determine which sitemap is requested
  const isPages = queryType === "pages" || urlPath.includes("sitemap-pages");
  const isProjects = queryType === "projects" || urlPath.includes("sitemap-projects");
  const isBlog = queryType === "blog" || urlPath.includes("sitemap-blog");

  // 1. Pages Sitemap
  if (isPages) {
    const staticContent = tryReadStaticSitemap("sitemap-pages.xml");
    if (staticContent) {
      return res.status(200).send(staticContent);
    }
    const xml = getStaticPagesXml(currentDate);
    return res.status(200).send(xml);
  }

  // 2. Projects Sitemap
  if (isProjects) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: projects } = await supabase
          .from("projects")
          .select("id, slug, title, summary, description, location, category, cover_image, gallery_images, created_at")
          .order("display_order", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(1000);

        if (projects && projects.length > 0) {
          const xml = getProjectsSitemapXml(projects, currentDate);
          return res.status(200).send(xml);
        }
      } catch (err) {
        console.warn("[Sitemap API] Supabase projects fetch failed:", err.message);
      }
    }

    const staticContent = tryReadStaticSitemap("sitemap-projects.xml");
    if (staticContent) {
      return res.status(200).send(staticContent);
    }
    return res.status(200).send(getProjectsSitemapXml([], currentDate));
  }

  // 3. Blog Sitemap
  if (isBlog) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: blogs } = await supabase
          .from("blogs")
          .select("id, slug, title, category, canonical_url, content_updated_at, published_at, updated_at")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(1000);

        if (blogs && blogs.length > 0) {
          const xml = getBlogSitemapXml(blogs, currentDate);
          return res.status(200).send(xml);
        }
      } catch (err) {
        console.warn("[Sitemap API] Supabase blogs fetch failed:", err.message);
      }
    }

    const staticContent = tryReadStaticSitemap("sitemap-blog.xml");
    if (staticContent) {
      return res.status(200).send(staticContent);
    }
    return res.status(200).send(getBlogSitemapXml([], currentDate));
  }

  // 4. Root Sitemap Index
  const indexXml = getSitemapIndexXml(currentDate);
  return res.status(200).send(indexXml);
}
