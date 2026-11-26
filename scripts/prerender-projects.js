import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { DEMO_PROJECTS } from "../src/data/demoContent.js";

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
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

function escapeHtml(unsafe = "") {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeProjectTitle(title) {
  if (!title || typeof title !== "string") return title || "";
  return title.trim();
}

async function generateOgImage(coverUrl, slug, id) {
  if (!coverUrl) return null;
  const ogDistDir = path.resolve(process.cwd(), "dist", "og", "projects");
  if (!fs.existsSync(ogDistDir)) fs.mkdirSync(ogDistDir, { recursive: true });

  const distFile = path.join(ogDistDir, `${slug}.jpg`);

  try {
    if (fs.existsSync(distFile) && fs.statSync(distFile).size > 1000) {
      return `${SITE_URL}/og/projects/${slug}.jpg`;
    }

    let buffer;
    if (coverUrl.startsWith("/")) {
      const localPath = path.resolve(process.cwd(), "public", coverUrl.slice(1));
      if (!fs.existsSync(localPath)) return null;
      buffer = fs.readFileSync(localPath);
    } else {
      const res = await fetch(coverUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      buffer = Buffer.from(await res.arrayBuffer());
    }

    const jpegBuffer = await sharp(buffer)
      .resize(1200, 630, { fit: "cover", position: "center" })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();

    fs.writeFileSync(distFile, jpegBuffer);

    if (id && id !== slug) {
      const distIdFile = path.join(ogDistDir, `${id}.jpg`);
      fs.writeFileSync(distIdFile, jpegBuffer);
    }

    return `${SITE_URL}/og/projects/${slug}.jpg`;
  } catch (err) {
    console.warn(`️ Failed to generate OG image for ${slug}:`, err.message);
    return null;
  }
}

async function prerenderProjects() {
  const distDir = path.resolve(process.cwd(), "dist");
  const templatePath = fs.existsSync(path.join(distDir, "template.html"))
    ? path.join(distDir, "template.html")
    : path.join(distDir, "index.html");

  if (!fs.existsSync(templatePath)) {
    console.warn("️ [SSG Prerender] dist/index.html not found. Run 'vite build' first.");
    return;
  }

  const baseHtml = fs.readFileSync(templatePath, "utf-8");

  let projects = DEMO_PROJECTS;

  if (SUPABASE_URL && SUPABASE_KEY) {
    console.log("[SSG Prerender] Fetching live projects from Supabase for static HTML generation...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase
      .from("projects")
      .select("id, slug, title, summary, description, category, location, duration, cover_image, gallery_images, deliverables, created_at")
      .order("display_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      projects = data;
    } else if (error) {
      console.warn("[SSG Prerender] Supabase fetch warning, falling back to demo projects:", error.message);
    }
  } else {
    console.log("[SSG Prerender] No Supabase env found; prerendering built-in demo projects.");
  }

  let generatedCount = 0;

  const ogImageMap = new Map();
  await Promise.all(
    projects.map(async (project) => {
      const slug = project.slug || project.id;
      let coverUrl = "";
      if (project.cover_image) {
        if (typeof project.cover_image === "string") {
          coverUrl = project.cover_image;
        } else if (project.cover_image.url) {
          coverUrl = project.cover_image.url;
        }
      }
      const ogUrl = await generateOgImage(coverUrl, slug, project.id);
      ogImageMap.set(slug, ogUrl || `${SITE_URL}/og/projects.jpg`);
    })
  );

  for (const project of projects) {
    const slug = project.slug || project.id;
    let coverUrl = "";
    if (project.cover_image) {
      if (typeof project.cover_image === "string") {
        coverUrl = project.cover_image;
      } else if (project.cover_image.url) {
        coverUrl = project.cover_image.url;
      }
    }
    const cover = coverUrl;
    const rawGallery = project.gallery_images || [];
    const gallery = cover && !rawGallery.includes(cover) ? [cover, ...rawGallery] : rawGallery;

    const sanitizedTitle = sanitizeProjectTitle(project.title || "Engineering Project");
    const safeTitle = escapeHtml(sanitizedTitle);
    const pageTitle = `${sanitizedTitle} | Projects | Structura Architecture & Construction`;
    const safeCategory = escapeHtml(project.category || "Architecture & Engineering");
    const safeLocation = escapeHtml(project.location || "Design District");
    const safeDuration = escapeHtml(project.duration || "");
    const rawSummary = project.summary || project.description || "";
    const cleanSummary = rawSummary
      .replace(/<!--\s*HASHTAGS\s*-->[\s\S]*$/i, "")
      .replace(/(\n\s*#[a-zA-Z0-9_\u0600-\u06FF\s,#]+)+$/g, "")
      .replace(/<[^>]*>?/gm, "")
      .trim();
    const metaDescription = escapeHtml(cleanSummary.slice(0, 155) || `${sanitizedTitle} - Architectural and structural engineering project by Structura Studio.`);
    const canonicalUrl = `${SITE_URL}/projects/${slug}`;
    const safeCover = cover || `${SITE_URL}/studio-og-1200x630.png`;
    const imageAlt = `${safeTitle} - ${safeCategory} in ${safeLocation}`;
    const ogImageUrl = ogImageMap.get(slug) || safeCover;

    const imageObjects = gallery.map((imgUrl, idx) => {
      const safeUrl = typeof imgUrl === "string" ? imgUrl : imgUrl?.url || "";
      const isFirst = idx === 0;
      return {
        "@type": "ImageObject",
        "@id": `${safeUrl}#image`,
        "url": safeUrl,
        "contentUrl": safeUrl,
        "name": isFirst ? `${project.title} - Main Facade & Front Elevation` : `${project.title} - Architectural View ${idx + 1}`,
        "caption": isFirst ? `${project.title} architectural overview in ${project.location || "Design District"}` : `${project.title} structural detail perspective ${idx + 1}`,
        "description": `${project.title} - ${project.category || "Engineering"} project in ${project.location || "Design District"}`,
        "encodingFormat": "image/svg+xml",
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
      "name": sanitizedTitle,
      "headline": sanitizedTitle,
      "description": cleanSummary || sanitizedTitle,
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
      "license": `${SITE_URL}/terms`,
      "acquireLicensePage": `${SITE_URL}/contact`
    };

    const galleryHtml = gallery
      .filter((imgUrl) => {
        const u = typeof imgUrl === "string" ? imgUrl : imgUrl?.url || "";
        return u && u !== cover;
      })
      .map((imgUrl, idx) => {
        const safeUrl = escapeHtml(typeof imgUrl === "string" ? imgUrl : imgUrl?.url || "");
        const viewTitle = `Architectural Perspective ${idx + 2}`;
        const captionText = `${safeTitle} - Architectural perspective and site execution detail (${viewTitle}) in ${safeLocation}.`;
        return `
      <article style="margin-bottom:1.5rem;background:#111;border:1px solid #262626;border-radius:12px;overflow:hidden;" itemscope itemtype="https://schema.org/ImageObject">
        <div style="width:100%;">
          <img src="${safeUrl}" alt="${safeTitle} - ${viewTitle} in ${safeLocation} | Structura Studio" title="${safeTitle} - ${viewTitle}" style="width:100%;max-height:500px;object-fit:cover;display:block;" loading="lazy" decoding="async" width="1200" height="750" itemprop="contentUrl" />
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

    const clientHydrationData = {
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
      galleryImages: project.gallery_images || [],
    };

    let html = baseHtml;

    html = html.replace(/<!-- Structured Data:[\s\S]*?<\/script>/gi, "");
    html = html.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");

    html = html.replace(/<title[\s\S]*?<\/title>/i, `<title data-rh="true">${escapeHtml(pageTitle)}</title>`);

    html = html.replace(/<meta[^>]*name="description"[\s\S]*?>/i, `<meta data-rh="true" name="description" content="${metaDescription}" />`);

    html = html.replace(/<link[^>]*rel="canonical"[\s\S]*?>/i, `<link data-rh="true" rel="canonical" href="${canonicalUrl}" />`);

    html = html.replace(/<meta[^>]*property="og:image[^"]*"[\s\S]*?>\r?\n?/gi, "");
    html = html.replace(/<meta[^>]*name="twitter:image[^"]*"[\s\S]*?>\r?\n?/gi, "");

    const pubDate = project.created_at ? new Date(project.created_at).toISOString() : new Date().toISOString();
    html = html.replace(/<meta[^>]*property="og:title"[\s\S]*?>/i, `<meta data-rh="true" property="og:title" content="${escapeHtml(pageTitle)}" />`);
    html = html.replace(/<meta[^>]*property="og:description"[\s\S]*?>/i, `<meta data-rh="true" property="og:description" content="${metaDescription}" />`);

    let cleanOgUrl = ogImageUrl;
    if (cleanOgUrl.endsWith(".webp") || cleanOgUrl.includes(".webp?")) {
      cleanOgUrl = `${SITE_URL}/og/projects.jpg`;
    }
    const isPng = cleanOgUrl.endsWith(".png");
    const ogMime = isPng ? "image/png" : "image/jpeg";
    const ogImageTags = `
  <meta data-rh="true" property="og:image" content="${cleanOgUrl}" />
  <meta data-rh="true" property="og:image:secure_url" content="${cleanOgUrl}" />
  <meta data-rh="true" property="og:image:type" content="${ogMime}" />
  <meta data-rh="true" property="og:image:width" content="1200" />
  <meta data-rh="true" property="og:image:height" content="630" />
  <meta data-rh="true" property="og:image:alt" content="${escapeHtml(imageAlt)}" />`;

    html = html.replace(/<meta[^>]*property="og:url"[\s\S]*?>/i, `${ogImageTags.trim()}\n  <meta data-rh="true" property="og:url" content="${canonicalUrl}" />`);
    html = html.replace(/<meta[^>]*property="og:type"[\s\S]*?>/i, `<meta data-rh="true" property="og:type" content="article" />\n  <meta data-rh="true" property="og:locale" content="en_US" />\n  <meta property="article:published_time" content="${pubDate}" />\n  <meta property="article:section" content="${safeCategory}" />`);

    html = html.replace(/<meta[^>]*name="twitter:card"[\s\S]*?>/i, `<meta data-rh="true" name="twitter:card" content="summary_large_image" />`);
    html = html.replace(/<meta[^>]*name="twitter:title"[\s\S]*?>/i, `<meta data-rh="true" name="twitter:title" content="${escapeHtml(pageTitle)}" />`);
    html = html.replace(/<meta[^>]*name="twitter:description"[\s\S]*?>/i, `<meta data-rh="true" name="twitter:description" content="${metaDescription}" />\n  <meta data-rh="true" name="twitter:image" content="${cleanOgUrl}" />\n  <meta name="twitter:image:src" content="${cleanOgUrl}" />\n  <meta data-rh="true" name="twitter:image:alt" content="${escapeHtml(imageAlt)}" />\n  <meta name="twitter:url" content="${canonicalUrl}" />\n  <meta name="twitter:domain" content="example.com" />`);

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "Projects", "item": `${SITE_URL}/projects` },
        { "@type": "ListItem", "position": 3, "name": sanitizedTitle, "item": canonicalUrl }
      ]
    };

    const projectGraphElements = [
      projectSchema,
      breadcrumbSchema,
      ...imageObjects
    ].filter(Boolean).map((node) => {
      const clean = { ...node };
      delete clean["@context"];
      return clean;
    });

    const projectGraphSchema = {
      "@context": "https://schema.org",
      "@graph": projectGraphElements
    };

    const safeJson = (val) =>
      JSON.stringify(val, null, 2)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026");

    const schemaScript = `
  <!-- Structured Data: Google Images & CreativeWork Knowledge Graph -->
  <script type="application/ld+json">
${safeJson(projectGraphSchema)}
  </script>
  <!-- Pre-hydrated Project Data for Zero-Latency React Mounting -->
  <script>
    window.__INITIAL_PROJECT_DATA__ = ${JSON.stringify(clientHydrationData).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")};
  </script>
</head>`;

    html = html.replace(/<\/head>/i, schemaScript);

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
        <p style="font-size:1.15rem;color:#52525b;max-width:850px;line-height:1.6;margin:0 0 1.5rem 0;">Location: ${safeLocation} ${safeDuration ? `• Timeline: ${safeDuration}` : ''}</p>
        
        <!-- Primary Featured Cover Image for Googlebot-Image with Full Microdata -->
        <figure style="margin:0 0 2rem 0;border-radius:12px;overflow:hidden;" itemscope itemtype="https://schema.org/ImageObject">
          <img src="${safeCover}" alt="${safeTitle} - Primary Architectural View in ${safeLocation} | Structura Studio" title="${safeTitle} - Primary Architectural Elevation" width="1200" height="750" style="width:100%;max-height:680px;object-fit:cover;border-radius:12px;display:block;" loading="eager" decoding="async" itemprop="contentUrl" />
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

    const targetDir = path.join(distDir, "projects", slug);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(path.join(targetDir, "index.html"), html, "utf-8");

    if (project.id && project.id !== slug) {
      const idDir = path.join(distDir, "projects", project.id);
      if (!fs.existsSync(idDir)) {
        fs.mkdirSync(idDir, { recursive: true });
      }
      fs.writeFileSync(path.join(idDir, "index.html"), html, "utf-8");
    }

    const unnumberedSlug = slug.replace(/-\d{4}$/, "");
    if (unnumberedSlug !== slug) {
      const unnumberedDir = path.join(distDir, "projects", unnumberedSlug);
      if (!fs.existsSync(unnumberedDir)) {
        fs.mkdirSync(unnumberedDir, { recursive: true });
      }
      fs.writeFileSync(path.join(unnumberedDir, "index.html"), html, "utf-8");
    }

    generatedCount++;
  }

  console.log(`[SSG Prerender] Successfully generated ${generatedCount} static project pages in dist/projects/ with full image SEO!`);
}

prerenderProjects();
