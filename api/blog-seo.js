// api/blog-seo.js
import fs from "node:fs";
import path from "node:path";
import {
  SITE_URL,
  getSupabaseClient,
  escapeHtml,
  safeInlineJson,
  lookupBlog,
  getMimeType,
} from "./_shared.js";

let cachedTemplate = null;

function getBaseTemplate() {
  if (cachedTemplate) return cachedTemplate;

  const candidates = [
    path.join(process.cwd(), "dist", "template.html"),
    path.join(process.cwd(), "dist", "index.html"),
    path.join(process.cwd(), "index.html"),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        cachedTemplate = fs.readFileSync(candidate, "utf-8");
        return cachedTemplate;
      }
    } catch {
    }
  }

  return null;
}

export default async function handler(req, res) {
  const { slug } = req.query;

  if (!slug) {
    return res.redirect(302, "/blog");
  }

  const cleanSlug = String(slug).trim().replace(/\/$/, "");
  let baseHtml = getBaseTemplate();

  if (!baseHtml) {
    try {
      const resp = await fetch(SITE_URL, {
        headers: { "User-Agent": "Structura-SEO-Worker" },
        signal: AbortSignal.timeout(5000),
      });
      if (resp.ok) {
        baseHtml = await resp.text();
        cachedTemplate = baseHtml;
      }
    } catch {
    }
  }

  const supabase = getSupabaseClient();

  if (!supabase || !baseHtml) {
    if (baseHtml) {
      return res.status(200).setHeader("Content-Type", "text/html; charset=utf-8").send(baseHtml);
    }
    return res.status(200).send("<!DOCTYPE html><html><head><meta http-equiv='refresh' content='0;url=/blog'/></head></html>");
  }

  try {
    const blog = await lookupBlog(
      supabase,
      cleanSlug,
      "id, slug, title, category, excerpt, bluf_summary, content, cover_image_url, cover_image_alt, author_name, author_role, canonical_url, reading_time_minutes, published_at, content_updated_at, updated_at, status"
    );

    if (!blog) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      const notFoundPath = path.join(process.cwd(), "dist", "404.html");
      if (fs.existsSync(notFoundPath)) {
        const notFoundHtml = fs.readFileSync(notFoundPath, "utf-8");
        return res.status(404).send(notFoundHtml);
      }
      return res.status(404).send(baseHtml);
    }

    const canonicalSlug = blog.slug || blog.id;
    const canonicalUrl = blog.canonical_url || `${SITE_URL}/blog/${canonicalSlug}`;
    const pageTitle = `${blog.title || "Engineering Publication"} | Structura Architecture & Construction`;
    const safeTitle = escapeHtml(blog.title || "Engineering Publication");
    const safeCategory = escapeHtml(blog.category || "Civil & Structural Engineering");
    const safeAuthor = escapeHtml(blog.author_name || "Structura Editorial Team");

    const rawSummary = blog.excerpt || blog.bluf_summary || blog.content || "";
    const cleanSummary = String(rawSummary)
      .replace(/<[^>]*>?/gm, "")
      .replace(/#+\s*/g, "")
      .trim();
    const metaDescription = escapeHtml(
      cleanSummary.slice(0, 160) ||
      `${blog.title} - Engineering technical publication by Structura Architecture & Construction.`
    );
    const imageAlt = escapeHtml(blog.cover_image_alt || `${safeTitle} - ${safeCategory}`);

    let html = baseHtml;

    html = html.replace(/<!-- Structured Data:[\s\S]*?<\/script>/gi, "");
    html = html.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");
    html = html.replace(/<title[\s\S]*?<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`);
    html = html.replace(/<meta[^>]*name="description"[\s\S]*?>/i, `<meta name="description" content="${metaDescription}" />`);
    html = html.replace(/<link[^>]*rel="canonical"[\s\S]*?>/i, `<link rel="canonical" href="${canonicalUrl}" />`);

    html = html.replace(/<meta[^>]*property="og:(?:type|title|description|url|image[^"]*)"[\s\S]*?>\r?\n?/gi, "");
    html = html.replace(/<meta[^>]*name="twitter:(?:card|title|description|image[^"]*)"[\s\S]*?>\r?\n?/gi, "");

    const pubDate = blog.published_at ? new Date(blog.published_at).toISOString() : new Date().toISOString();
    const modDate = (blog.content_updated_at || blog.updated_at || blog.published_at)
      ? new Date(blog.content_updated_at || blog.updated_at || blog.published_at).toISOString()
      : pubDate;

    const liveCoverUrl = blog.cover_image_url || "";
    const fallbackOg = `${SITE_URL}/og/blog.jpg`;
    const isModernRaster = /\.(webp|avif)(\?|$)/i.test(liveCoverUrl);
    const ogImageUrl = liveCoverUrl
      ? isModernRaster
        ? `${SITE_URL}/api/og-image?type=blog&slug=${encodeURIComponent(canonicalSlug)}`
        : liveCoverUrl
      : fallbackOg;
    const mimeType = isModernRaster ? "image/jpeg" : getMimeType(ogImageUrl);

    const articleSchema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": ["TechArticle", "BlogPosting"],
          "@id": `${canonicalUrl}#article`,
          url: canonicalUrl,
          headline: blog.title || "Engineering Publication",
          description: cleanSummary.slice(0, 240),
          datePublished: pubDate.replace(/Z$/, "+05:30"),
          dateModified: modDate.replace(/Z$/, "+05:30"),
          author: {
            "@type": "Person",
            name: safeAuthor,
            ...(blog.author_role ? { jobTitle: blog.author_role } : {}),
            worksFor: { "@id": `${SITE_URL}/#organization` },
          },
          publisher: { "@id": `${SITE_URL}/#organization` },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
            { "@type": "ListItem", position: 3, name: blog.title || "Article", item: canonicalUrl },
          ],
        },
      ],
    };

    const headInjection = `
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(pageTitle)}" />
  <meta property="og:description" content="${metaDescription}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:image:secure_url" content="${ogImageUrl}" />
  <meta property="og:image:type" content="${mimeType}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${imageAlt}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
  <meta name="twitter:description" content="${metaDescription}" />
  <meta name="twitter:image" content="${ogImageUrl}" />
  <meta property="article:published_time" content="${pubDate}" />
  <script type="application/ld+json">${safeInlineJson(articleSchema)}</script>`;

    html = html.replace(/<\/head>/i, `${headInjection}\n</head>`);

    const plainBodyParagraphs = String(blog.content || "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[#*_`>]/g, "")
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, 12)
      .map((p) => `<p style="line-height:1.7;color:#1e293b;margin:0 0 1rem 0;">${escapeHtml(p)}</p>`)
      .join("\n");

    const articleMainHtml = `
    <main id="main" style="max-width:960px;margin:0 auto;padding:2.5rem 1.5rem;color:#09090b;">
      <article>
        <header style="margin-bottom:2rem;">
          <p style="font-size:0.85rem;color:#64748b;margin:0 0 0.75rem 0;">${safeCategory}</p>
          <h1 style="font-size:clamp(2rem,4vw,3rem);font-weight:800;line-height:1.2;margin:0 0 1rem 0;">${safeTitle}</h1>
          ${blog.bluf_summary ? `<p style="font-weight:600;color:#1e3a8a;margin:0 0 1rem 0;">${escapeHtml(blog.bluf_summary)}</p>` : ""}
          <p style="color:#475569;margin:0 0 1rem 0;">${escapeHtml(cleanSummary.slice(0, 320))}</p>
        </header>
        ${liveCoverUrl ? `<figure style="margin:0 0 2rem 0;"><img src="${escapeHtml(liveCoverUrl)}" alt="${imageAlt}" style="max-width:100%;height:auto;border-radius:10px;" /></figure>` : ""}
        <div>${plainBodyParagraphs}</div>
      </article>
    </main>`;

    if (html.includes('<div id="root">')) {
      html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">\n${articleMainHtml}\n</div>`);
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(html);
  } catch (err) {
    console.error("API blog-seo error:", err);
    return res.status(500).setHeader("Content-Type", "text/html; charset=utf-8").send(baseHtml || "Internal Server Error");
  }
}
