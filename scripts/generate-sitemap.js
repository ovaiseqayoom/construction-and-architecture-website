import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { DEMO_PROJECTS, DEMO_BLOGS } from "../src/data/demoContent.js";

function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const SITE_URL = (process.env.VITE_SITE_URL || "https://example.com").replace(/\/+$/, "");
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

function escapeXml(unsafe = "") {
  return String(unsafe)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateSitemapIndexXml(currentDate) {
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

function generatePagesSitemapXml(currentDate) {
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
${urlNodes}
</urlset>
`;
}

function generateProjectsSitemapXml(projects = [], currentDate) {
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
          rawGallery = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
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

      const imageTags = uniqueImages
        .map((imgUrl) => {
          const raw = typeof imgUrl === "string" ? imgUrl : imgUrl?.url || "";
          const resolved = raw.startsWith("/") ? `${SITE_URL}${raw}` : raw;
          const safe = escapeXml(resolved);
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
${urlNodes}
</urlset>
`;
}

function generateBlogSitemapXml(blogs = [], currentDate) {
  const urlNodes = blogs
    .map((blog) => {
      const blogDate = (blog.content_updated_at || blog.updated_at || blog.published_at)
        ? new Date(blog.content_updated_at || blog.updated_at || blog.published_at).toISOString().split("T")[0]
        : currentDate;

      const canonicalUrl = blog.canonical_url || `${SITE_URL}/blog/${escapeXml(blog.slug || blog.id)}`;

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
${urlNodes}
</urlset>
`;
}

function writeSitemapFiles(files) {
  const publicDir = path.resolve(process.cwd(), "public");
  const distDir = path.resolve(process.cwd(), "dist");

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  for (const [filename, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(publicDir, filename), content.trim() + "\n", "utf-8");
    console.log(`[Sitemap] Generated public/${filename}`);

    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.join(distDir, filename), content.trim() + "\n", "utf-8");
    }
  }
}

async function generateAllSitemaps() {
  const currentDate = new Date().toISOString().split("T")[0];
  let projects = DEMO_PROJECTS;
  let blogs = DEMO_BLOGS;

  if (SUPABASE_URL && SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
      });

      const fetchProjects = supabase
        .from("projects")
        .select("id, slug, title, summary, description, location, category, cover_image, gallery_images, created_at")
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      const fetchBlogs = supabase
        .from("blogs")
        .select("id, slug, title, category, canonical_url, published_at, updated_at")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Supabase query timed out")), 6000)
      );

      const [projRes, blogRes] = await Promise.race([
        Promise.all([fetchProjects, fetchBlogs]),
        timeoutPromise,
      ]);

      if (projRes.data?.length) projects = projRes.data;
      if (blogRes.data?.length) blogs = blogRes.data;
    } catch (err) {
      console.warn(`[Sitemap] Using demo dataset fallback: ${err.message}`);
    }
  } else {
    console.log("[Sitemap] No Supabase env configured; using built-in demo projects & blog posts.");
  }

  writeSitemapFiles({
    "sitemap.xml": generateSitemapIndexXml(currentDate),
    "sitemap-pages.xml": generatePagesSitemapXml(currentDate),
    "sitemap-projects.xml": generateProjectsSitemapXml(projects, currentDate),
    "sitemap-blog.xml": generateBlogSitemapXml(blogs, currentDate),
  });
}

generateAllSitemaps();
