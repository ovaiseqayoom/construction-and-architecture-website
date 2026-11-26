// api/project-seo.js
import fs from "node:fs";
import path from "node:path";
import {
  SITE_URL,
  getSupabaseClient,
  escapeHtml,
  safeInlineJson,
  lookupProject,
  extractCoverImageUrl,
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
    return res.redirect(302, "/projects");
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
    return res.status(200).send("<!DOCTYPE html><html><head><meta http-equiv='refresh' content='0;url=/projects'/></head></html>");
  }

  try {
    const project = await lookupProject(
      supabase,
      cleanSlug,
      "id, slug, title, summary, description, category, location, duration, cover_image, gallery_images, deliverables, created_at"
    );

    if (!project) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      const notFoundPath = path.join(process.cwd(), "dist", "404.html");
      if (fs.existsSync(notFoundPath)) {
        const notFoundHtml = fs.readFileSync(notFoundPath, "utf-8");
        return res.status(404).send(notFoundHtml);
      }
      return res.status(404).send(baseHtml);
    }

    const canonicalSlug = project.slug || project.id;
    const canonicalUrl = `${SITE_URL}/projects/${canonicalSlug}`;
    const pageTitle = `${project.title || "Project Detail"} | Projects | Structura Architecture & Construction`;
    const safeTitle = escapeHtml(project.title || "Project Detail");
    const safeCategory = escapeHtml(project.category || "Architecture & Engineering");
    const safeLocation = escapeHtml(project.location || "Design District");

    const rawSummary = project.summary || project.description || "";
    const cleanSummary = rawSummary
      .replace(/<!--\s*HASHTAGS\s*-->[\s\S]*$/i, "")
      .replace(/(\n\s*#[a-zA-Z0-9_\u0600-\u06FF\s,#]+)+$/g, "")
      .replace(/<[^>]*>?/gm, "")
      .trim();
    const metaDescription = escapeHtml(
      cleanSummary.slice(0, 160) ||
      `${project.title} - Architectural and structural engineering project by Structura Architecture & Construction.`
    );
    const imageAlt = `${safeTitle} - ${safeCategory} in ${safeLocation}`;

    let html = baseHtml;

    html = html.replace(/<title[\s\S]*?<\/title>/i, `<title data-rh="true">${escapeHtml(pageTitle)}</title>`);

    html = html.replace(/<meta[^>]*name="description"[\s\S]*?>/i, `<meta data-rh="true" name="description" content="${metaDescription}" />`);

    html = html.replace(/<link[^>]*rel="canonical"[\s\S]*?>/i, `<link data-rh="true" rel="canonical" href="${canonicalUrl}" />`);

    html = html.replace(/<meta[^>]*property="og:image[^"]*"[\s\S]*?>\r?\n?/gi, "");
    html = html.replace(/<meta[^>]*name="twitter:image[^"]*"[\s\S]*?>\r?\n?/gi, "");

    const pubDate = project.created_at ? new Date(project.created_at).toISOString() : new Date().toISOString();
    html = html.replace(/<meta[^>]*property="og:title"[\s\S]*?>/i, `<meta data-rh="true" property="og:title" content="${escapeHtml(pageTitle)}" />`);
    html = html.replace(/<meta[^>]*property="og:description"[\s\S]*?>/i, `<meta data-rh="true" property="og:description" content="${metaDescription}" />`);

    const liveCoverUrl = extractCoverImageUrl(project.cover_image);
    const fallbackLogo = `${SITE_URL}/studio-og-1200x630.png`;
    const isModernRaster = /\.(webp|avif)(\?|$)/i.test(liveCoverUrl);
    const ogImageUrl = liveCoverUrl
      ? isModernRaster
        ? `${SITE_URL}/api/og-image?slug=${encodeURIComponent(canonicalSlug)}`
        : liveCoverUrl
      : fallbackLogo;
    const mimeType = isModernRaster ? "image/jpeg" : getMimeType(ogImageUrl);

    const ogTags = `
  <meta data-rh="true" property="og:image" content="${ogImageUrl}" />
  <meta data-rh="true" property="og:image:secure_url" content="${ogImageUrl}" />
  <meta data-rh="true" property="og:image:type" content="${mimeType}" />
  <meta data-rh="true" property="og:image:width" content="1200" />
  <meta data-rh="true" property="og:image:height" content="630" />
  <meta data-rh="true" property="og:image:alt" content="${escapeHtml(imageAlt)}" />`;

    html = html.replace(/<meta[^>]*property="og:url"[\s\S]*?>/i, `${ogTags.trim()}\n  <meta data-rh="true" property="og:url" content="${canonicalUrl}" />`);
    html = html.replace(
      /<meta[^>]*property="og:type"[\s\S]*?>/i,
      `<meta data-rh="true" property="og:type" content="article" />\n  <meta property="article:published_time" content="${pubDate}" />\n  <meta property="article:section" content="${safeCategory}" />`
    );

    const siteDomain = (() => {
      try {
        return new URL(SITE_URL).hostname;
      } catch {
        return "example.com";
      }
    })();

    html = html.replace(/<meta[^>]*name="twitter:card"[\s\S]*?>/i, `<meta data-rh="true" name="twitter:card" content="summary_large_image" />`);
    html = html.replace(/<meta[^>]*name="twitter:title"[\s\S]*?>/i, `<meta data-rh="true" name="twitter:title" content="${escapeHtml(pageTitle)}" />`);
    html = html.replace(
      /<meta[^>]*name="twitter:description"[\s\S]*?>/i,
      `<meta data-rh="true" name="twitter:description" content="${metaDescription}" />\n  <meta data-rh="true" name="twitter:image" content="${ogImageUrl}" />\n  <meta name="twitter:image:src" content="${ogImageUrl}" />\n  <meta data-rh="true" name="twitter:image:alt" content="${escapeHtml(imageAlt)}" />\n  <meta name="twitter:url" content="${canonicalUrl}" />\n  <meta name="twitter:domain" content="${escapeHtml(siteDomain)}" />`
    );

    html = html.replace(/<!-- Structured Data:[\s\S]*?<\/script>/gi, "");
    html = html.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");

    const rawGallery = Array.isArray(project.gallery_images) ? project.gallery_images : [];
    const gallery = liveCoverUrl && !rawGallery.includes(liveCoverUrl) ? [liveCoverUrl, ...rawGallery] : rawGallery;

    const imageObjects = gallery.map((imgUrl, idx) => {
      const safeUrl = typeof imgUrl === "string" ? imgUrl : imgUrl?.url || "";
      const isFirst = idx === 0;
      const viewTitle = isFirst ? "Main Elevation & Front Facade" : `Architectural Perspective ${idx + 1}`;
      return {
        "@type": "ImageObject",
        "@id": `${safeUrl}#image`,
        "url": safeUrl,
        "contentUrl": safeUrl,
        "name": `${project.title || "Project"} - ${viewTitle}`,
        "caption": isFirst
          ? `${project.title} front elevation and architectural overview in ${project.location || "Design District"}.`
          : `${project.title} architectural perspective and site execution detail in ${project.location || "Design District"}.`,
        "description": `${project.title} - ${project.category || "Architecture"} project in ${project.location || "Design District"}`,
        "encodingFormat": "image/jpeg",
        "representativeOfPage": isFirst,
        "creator": {
          "@type": "Organization",
          "name": "Structura Architecture & Construction",
          "url": SITE_URL
        },
        "creditText": "Structura Architecture & Construction",
        "copyrightNotice": "© Structura Architecture & Construction",
        "license": `${SITE_URL}/terms`,
        "acquireLicensePage": `${SITE_URL}/contact`
      };
    });

    const projectSchema = {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "@id": `${canonicalUrl}#creativework`,
      "name": project.title,
      "headline": project.title,
      "description": cleanSummary || project.title,
      "url": canonicalUrl,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonicalUrl
      },
      "primaryImageOfPage": imageObjects[0] || undefined,
      "image": imageObjects,
      "author": {
        "@type": "Organization",
        "name": "Structura Architecture & Construction",
        "url": SITE_URL
      },
      "creator": {
        "@type": "Organization",
        "name": "Structura Architecture & Construction",
        "url": SITE_URL
      },
      "provider": {
        "@id": `${SITE_URL}/#organization`,
        "@type": "Organization",
        "name": "Structura Architecture & Construction",
        "url": SITE_URL
      },
      "copyrightHolder": {
        "@type": "Organization",
        "name": "Structura Architecture & Construction"
      },
      "copyrightYear": new Date().getFullYear(),
      "datePublished": pubDate,
      "dateModified": pubDate,
      "license": `${SITE_URL}/terms`,
      "acquireLicensePage": `${SITE_URL}/contact`
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "Projects", "item": `${SITE_URL}/projects` },
        { "@type": "ListItem", "position": 3, "name": project.title, "item": canonicalUrl }
      ]
    };

    const galleryHtml = gallery
      .filter((imgUrl) => {
        const u = typeof imgUrl === "string" ? imgUrl : imgUrl?.url || "";
        return u && u !== liveCoverUrl;
      })
      .map((imgUrl, idx) => {
        const safeUrl = escapeHtml(typeof imgUrl === "string" ? imgUrl : imgUrl?.url || "");
        const viewTitle = `Architectural Perspective ${idx + 2}`;
        const captionText = `${safeTitle} - Architectural perspective and site execution detail (${viewTitle}) in ${safeLocation}.`;
        return `
      <article style="margin-bottom:1.5rem;background:#111;border:1px solid #262626;border-radius:12px;overflow:hidden;" itemscope itemtype="https://schema.org/ImageObject">
        <div style="width:100%;">
          <img src="${safeUrl}" alt="${safeTitle} - ${viewTitle} in ${safeLocation} | Structura" title="${safeTitle} - ${viewTitle}" style="width:100%;max-height:500px;object-fit:cover;display:block;" loading="lazy" decoding="async" width="1200" height="750" itemprop="contentUrl" />
          <meta itemprop="name" content="${safeTitle} - ${viewTitle}" />
          <meta itemprop="caption" content="${captionText}" />
        </div>
        <div style="padding:1rem;">
          <h3 style="font-size:1.15rem;margin:0 0 0.5rem 0;color:#f3f4f6;">${viewTitle}</h3>
          <p style="color:#9ca3af;line-height:1.5;margin:0;font-size:0.9rem;" itemprop="description">${captionText}</p>
        </div>
      </article>`;
      })
      .join("");

    const deliverablesHtml = Array.isArray(project.deliverables) && project.deliverables.length > 0 ? `
      <section style="margin:2rem 0;background:#18181b;padding:1.5rem;border-radius:12px;border:1px solid #27272a;">
        <h2 style="font-size:1.25rem;font-weight:700;color:#f4f4f5;margin-top:0;margin-bottom:0.75rem;">Key Engineering Deliverables & Specifications</h2>
        <ul style="margin:0;padding-left:1.25rem;color:#d4d4d8;line-height:1.75;">
          ${project.deliverables.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}
        </ul>
      </section>
    ` : "";

    const projectMainHtml = `
    <main id="main" style="max-width:1200px;margin:0 auto;padding:2rem 1rem;color:#18181b;">
      <nav aria-label="Breadcrumbs" style="font-size:0.875rem;color:#52525b;margin-bottom:1.5rem;">
        <a href="/" style="color:inherit;text-decoration:none;">Home</a> / 
        <a href="/projects" style="color:inherit;text-decoration:none;">Projects</a> / 
        <strong style="color:#09090b;">${safeTitle}</strong>
      </nav>

      <header style="margin-bottom:2.5rem;">
        <span style="display:inline-block;padding:0.25rem 0.65rem;background:#1e293b;border:1px solid #334155;color:#38bdf8;border-radius:4px;font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.75rem;">${safeCategory}</span>
        <h1 style="font-size:clamp(2rem,4vw,3rem);font-weight:800;color:#09090b;line-height:1.2;margin:0 0 0.75rem 0;">${safeTitle}</h1>
        <p style="font-size:1.15rem;color:#52525b;max-width:850px;line-height:1.6;margin:0 0 1.5rem 0;">Location: ${safeLocation} ${project.duration ? `• Timeline: ${escapeHtml(project.duration)}` : ''}</p>
        
        <!-- Primary Featured Cover Image for Googlebot-Image with Full Microdata -->
        <figure style="margin:0 0 2rem 0;border-radius:12px;overflow:hidden;" itemscope itemtype="https://schema.org/ImageObject">
          <img src="${liveCoverUrl || fallbackLogo}" alt="${imageAlt}" title="${safeTitle} - Primary Architectural View" width="1200" height="750" style="width:100%;max-height:680px;object-fit:cover;border-radius:12px;display:block;" loading="eager" decoding="async" itemprop="contentUrl" />
          <figcaption style="margin-top:0.75rem;color:#52525b;font-size:0.875rem;font-style:italic;" itemprop="caption">${escapeHtml(cleanSummary.slice(0, 180))}</figcaption>
          <meta itemprop="name" content="${safeTitle} - Main Elevation &amp; Front Façade" />
          <meta itemprop="description" content="${safeTitle} - ${safeCategory} architecture and structural engineering in ${safeLocation}" />
        </figure>
      </header>

      <!-- Scope & Architectural Overview -->
      <section style="margin-bottom:2.5rem;">
        <h2 style="font-size:1.5rem;color:#09090b;margin-bottom:1rem;">Architecture &amp; Engineering Overview</h2>
        <p style="color:#27272a;line-height:1.7;font-size:1.05rem;">${escapeHtml(cleanSummary)}</p>
      </section>

      <!-- Key Engineering Deliverables -->
      ${deliverablesHtml}

      <!-- Complete Perspective Visuals & Field Execution Gallery -->
      <section aria-label="Visual Spotlights &amp; Field Execution Gallery" style="margin-bottom:3rem;">
        <h2 style="font-size:1.5rem;color:#09090b;margin-bottom:1.5rem;">Project Visual Perspectives &amp; Site Execution</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:1.5rem;">
          ${galleryHtml}
        </div>
      </section>

      <div style="margin:2.5rem 0;text-align:center;">
        <a href="/projects" style="display:inline-block;padding:0.75rem 1.5rem;background:#18181b;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">&larr; View All Completed Projects</a>
      </div>
    </main>`;

    if (html.includes('<div id="root">')) {
      html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">\n${projectMainHtml}\n</div>`);
    }

    const clientData = {
      id: project.id,
      title: project.title,
      slug: project.slug,
      category: project.category,
      location: project.location,
      duration: project.duration,
      summary: project.summary,
      description: project.description,
      deliverables: project.deliverables || [],
      coverImage: project.cover_image,
      cover_image: project.cover_image,
      galleryImages: project.gallery_images || [],
      gallery_images: project.gallery_images || [],
      created_at: project.created_at,
    };

    const schemaScript = `
  <!-- Structured Data: CreativeWork, Breadcrumbs & ImageObjects -->
  <script type="application/ld+json">
${safeInlineJson([projectSchema, breadcrumbSchema, ...imageObjects])}
  </script>
  <!-- Initial project data for zero-spin client hydration -->
  <script>
    window.__INITIAL_PROJECT_DATA__ = ${safeInlineJson(clientData)};
  </script>
</head>`;
    html = html.replace(/<\/head>/i, schemaScript);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");
    return res.status(200).send(html);
  } catch (err) {
    console.error("[Project SEO Handler Error]:", err);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(500).send(baseHtml);
  }
}
