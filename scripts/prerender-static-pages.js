import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { SEO_ENTITY, PAGE_SEO, getCorporateKnowledgeGraph, getBreadcrumbSchema, getFaqSchema } from "../src/config/seo.config.js";
import { teamMembers } from "../src/data/team.js";
import { DEMO_PROJECTS } from "../src/data/demoContent.js";

const SITE_URL = (process.env.VITE_SITE_URL || "https://example.com").replace(/\/+$/, "");

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(envPath)) continue;
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}
loadEnv();

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

export async function prerenderStaticPages() {
  const distDir = path.resolve(process.cwd(), "dist");
  const templatePath = path.join(distDir, "index.html");

  if (!fs.existsSync(templatePath)) {
    console.warn("[SSG Prerender Static] dist/index.html not found. Run 'vite build' first.");
    return;
  }

  const baseHtml = fs.readFileSync(templatePath, "utf-8");
  fs.writeFileSync(path.join(distDir, "template.html"), baseHtml, "utf-8");

  let liveProjects = DEMO_PROJECTS;
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data } = await supabase
        .from("projects")
        .select("id, slug, title, category, location, cover_image, summary, is_featured")
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (Array.isArray(data) && data.length > 0) {
        liveProjects = data;
      }
    } catch (err) {
      console.warn("[SSG Prerender Static] Using demo projects fallback:", err.message);
    }
  }

  function injectPage({
    title,
    description,
    canonical,
    ogImage,
    ogImageAlt,
    ogType = "website",
    schemas = [],
    bodyContent,
    noindex = false,
  }) {
    let html = baseHtml;

    if (noindex) {
      html = html.replace(/<meta[^>]*name="robots"[\s\S]*?>/i, '<meta name="robots" content="noindex, follow" />');
    }

    html = html.replace(/<!-- Structured Data:[\s\S]*?<\/script>/gi, "");
    html = html.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");

    html = html.replace(/<title[\s\S]*?<\/title>/i, `<title data-rh="true">${escapeHtml(title)}</title>`);
    html = html.replace(/<meta[^>]*name="description"[\s\S]*?>/i, `<meta data-rh="true" name="description" content="${escapeHtml(description)}" />`);
    html = html.replace(/<link[^>]*rel="canonical"[\s\S]*?>/i, `<link data-rh="true" rel="canonical" href="${canonical}" />`);
    html = html.replace(/<meta[^>]*property="og:title"[\s\S]*?>/i, `<meta data-rh="true" property="og:title" content="${escapeHtml(title)}" />`);
    html = html.replace(/<meta[^>]*property="og:description"[\s\S]*?>/i, `<meta data-rh="true" property="og:description" content="${escapeHtml(description)}" />`);
    html = html.replace(/<meta[^>]*property="og:type"[\s\S]*?>/i, `<meta data-rh="true" property="og:type" content="${ogType}" />\n  <meta data-rh="true" property="og:locale" content="en_US" />`);

    let finalOgImage = ogImage || `${SITE_URL}/studio-og-1200x630.png`;
    if (finalOgImage.endsWith(".svg")) {
      finalOgImage = `${SITE_URL}/studio-og-1200x630.png`;
    }
    const isPng = finalOgImage.endsWith(".png");
    const ogMime = isPng ? "image/png" : "image/jpeg";

    html = html.replace(/<meta[^>]*property="og:image[^"]*"[\s\S]*?>\r?\n?/gi, "");
    html = html.replace(/<meta[^>]*name="twitter:image[^"]*"[\s\S]*?>\r?\n?/gi, "");

    const ogImageTags = `
  <meta data-rh="true" property="og:image" content="${finalOgImage}" />
  <meta data-rh="true" property="og:image:secure_url" content="${finalOgImage}" />
  <meta data-rh="true" property="og:image:type" content="${ogMime}" />
  <meta data-rh="true" property="og:image:width" content="1200" />
  <meta data-rh="true" property="og:image:height" content="630" />
  <meta data-rh="true" property="og:image:alt" content="${escapeHtml(ogImageAlt || title)}" />`;

    html = html.replace(/<meta[^>]*property="og:url"[\s\S]*?>/i, `${ogImageTags.trim()}\n  <meta data-rh="true" property="og:url" content="${canonical}" />`);
    html = html.replace(/<meta[^>]*name="twitter:title"[\s\S]*?>/i, `<meta data-rh="true" name="twitter:title" content="${escapeHtml(title)}" />`);
    html = html.replace(/<meta[^>]*name="twitter:description"[\s\S]*?>/i, `<meta data-rh="true" name="twitter:description" content="${escapeHtml(description)}" />\n  <meta data-rh="true" name="twitter:image" content="${finalOgImage}" />\n  <meta data-rh="true" name="twitter:image:alt" content="${escapeHtml(ogImageAlt || title)}" />`);

    if (schemas && schemas.length > 0) {
      const graphNodes = [];
      const seenIds = new Set();

      const addNode = (node) => {
        if (!node || typeof node !== "object") return;
        if (Array.isArray(node)) return node.forEach(addNode);
        if (Array.isArray(node["@graph"])) return node["@graph"].forEach(addNode);
        const cleanNode = { ...node };
        delete cleanNode["@context"];
        if (cleanNode["@id"]) {
          if (seenIds.has(cleanNode["@id"])) return;
          seenIds.add(cleanNode["@id"]);
        }
        graphNodes.push(cleanNode);
      };

      schemas.filter(Boolean).forEach(addNode);
      const schemaScript = `
  <script type="application/ld+json">
${JSON.stringify({ "@context": "https://schema.org", "@graph": graphNodes }, null, 2)}
  </script>
</head>`;
      html = html.replace(/<\/head>/i, schemaScript);
    }

    if (bodyContent && html.includes('<div id="root">')) {
      html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">\n${bodyContent}\n</div>`);
    }

    return html;
  }

  const featuredProjects = (
    liveProjects.filter((p) => Boolean(p.is_featured)).length > 0
      ? liveProjects.filter((p) => Boolean(p.is_featured))
      : liveProjects
  ).slice(0, 4);

  const homeFeaturedCardsHtml = featuredProjects
    .map((p) => {
      const pSlug = p.slug || p.id;
      const pCover = typeof p.cover_image === "string" ? p.cover_image : p.cover_image?.url || "/images/projects-hero.svg";
      const pTitle = escapeHtml(p.title || "Architectural Project");
      const pCat = escapeHtml(p.category || "Architecture");
      const pLoc = escapeHtml(p.location || "Design District");
      const pSummary = escapeHtml((p.summary || "").slice(0, 140));
      return `
      <article style="background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
        <a href="/projects/${pSlug}" style="display:block;text-decoration:none;color:inherit;">
          <img src="${pCover}" alt="${pTitle} - ${pCat} in ${pLoc}" style="width:100%;height:240px;object-fit:cover;display:block;" loading="lazy" decoding="async" width="600" height="400" />
          <div style="padding:1.25rem;">
            <span style="display:inline-block;font-size:0.75rem;font-weight:700;color:#0284c7;text-transform:uppercase;margin-bottom:0.4rem;">${pCat} &bull; ${pLoc}</span>
            <h3 style="font-size:1.2rem;font-weight:700;color:#09090b;margin:0 0 0.5rem 0;">${pTitle}</h3>
            <p style="font-size:0.9rem;color:#52525b;line-height:1.5;margin:0;">${pSummary}</p>
          </div>
        </a>
      </article>`;
    })
    .join("");

  const homeBody = `
    <main id="main" style="max-width:1200px;margin:0 auto;padding:2rem 1rem;color:#18181b;">
      <section style="margin-bottom:3.5rem;">
        <span style="display:inline-block;padding:0.25rem 0.65rem;background:#1e293b;color:#38bdf8;border-radius:4px;font-size:0.8rem;font-weight:600;text-transform:uppercase;margin-bottom:0.75rem;">Structura Architecture &amp; Construction</span>
        <h1 style="font-size:clamp(2.25rem,5vw,3.5rem);font-weight:800;color:#09090b;line-height:1.15;margin:0 0 1rem 0;">Modern Architecture, Precision Construction</h1>
        <p style="font-size:1.15rem;color:#52525b;max-width:780px;line-height:1.6;margin:0 0 1.5rem 0;">Integrated architectural planning, ductile structural engineering, and transparent turnkey execution.</p>
        <img src="/images/hero-desktop.svg" alt="Structura Architecture and Construction" width="1600" height="900" fetchpriority="high" style="width:100%;max-height:540px;object-fit:cover;border-radius:12px;display:block;" loading="eager" decoding="async" />
      </section>
      <section style="margin-bottom:3.5rem;">
        <h2 style="font-size:1.85rem;font-weight:700;color:#09090b;margin-bottom:1.25rem;">Featured Projects</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:1.5rem;">
          ${homeFeaturedCardsHtml}
        </div>
      </section>
    </main>`;

  fs.writeFileSync(
    path.join(distDir, "index.html"),
    injectPage({
      title: PAGE_SEO.home.title,
      description: PAGE_SEO.home.description,
      canonical: `${SITE_URL}/`,
      ogImage: `${SITE_URL}/og/home.jpg`,
      ogImageAlt: SEO_ENTITY.brandName,
      schemas: [getCorporateKnowledgeGraph()],
      bodyContent: homeBody,
    }),
    "utf-8"
  );

  const staticRoutes = [
    {
      dir: "projects",
      title: PAGE_SEO.projects.title,
      description: PAGE_SEO.projects.description,
      canonical: `${SITE_URL}/projects`,
      ogImage: `${SITE_URL}/og/projects.jpg`,
      bodyContent: `<main id="main" style="max-width:1200px;margin:0 auto;padding:2rem 1rem;"><h1 style="font-size:2.5rem;font-weight:800;color:#09090b;">Completed Portfolio</h1><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;">${homeFeaturedCardsHtml}</div></main>`,
      schemas: [getCorporateKnowledgeGraph(), getBreadcrumbSchema([{ name: "Home", url: "/" }, { name: "Projects", url: "/projects" }])],
    },
    {
      dir: "about",
      title: PAGE_SEO.about.title,
      description: PAGE_SEO.about.description,
      canonical: `${SITE_URL}/about`,
      ogImage: `${SITE_URL}/og/about.jpg`,
      bodyContent: `<main id="main" style="max-width:1200px;margin:0 auto;padding:2rem 1rem;"><h1 style="font-size:2.5rem;font-weight:800;color:#09090b;">About Structura Architecture &amp; Construction</h1><p style="color:#52525b;line-height:1.6;">Licensed architectural design, structural analysis, and transparent turnkey delivery.</p>${teamMembers.slice(0, 4).map((m) => `<article style="margin:1rem 0;"><h2>${escapeHtml(m.name)} — ${escapeHtml(m.designation)}</h2><p>${escapeHtml(m.bio)}</p></article>`).join("")}</main>`,
      schemas: [getCorporateKnowledgeGraph(), getBreadcrumbSchema([{ name: "Home", url: "/" }, { name: "About Us", url: "/about" }])],
    },
    {
      dir: "careers",
      title: PAGE_SEO.careers.title,
      description: PAGE_SEO.careers.description,
      canonical: `${SITE_URL}/careers`,
      ogImage: `${SITE_URL}/og/careers.jpg`,
      bodyContent: `<main id="main" style="max-width:1000px;margin:0 auto;padding:2rem 1rem;"><h1 style="font-size:2.5rem;font-weight:800;color:#09090b;">Careers at Structura</h1><p style="color:#52525b;">Join our architects, BIM coordinators, structural engineers, and field superintendents.</p></main>`,
      schemas: [getCorporateKnowledgeGraph(), getBreadcrumbSchema([{ name: "Home", url: "/" }, { name: "Careers", url: "/careers" }])],
    },
    {
      dir: "contact",
      title: PAGE_SEO.contact.title,
      description: PAGE_SEO.contact.description,
      canonical: `${SITE_URL}/contact`,
      ogImage: `${SITE_URL}/og/contact.jpg`,
      bodyContent: `<main id="main" style="max-width:1000px;margin:0 auto;padding:2rem 1rem;"><h1 style="font-size:2.5rem;font-weight:800;color:#09090b;">Contact &amp; Project Consultation</h1><p style="color:#52525b;">${escapeHtml(SEO_ENTITY.address.streetAddress)} &bull; ${escapeHtml(SEO_ENTITY.primaryEmail)}</p><form method="post" action="/contact"><input name="name" type="text" required /><input name="email" type="email" required /><button type="submit">Send Inquiry</button></form></main>`,
      schemas: [getCorporateKnowledgeGraph(), getBreadcrumbSchema([{ name: "Home", url: "/" }, { name: "Contact", url: "/contact" }]), getFaqSchema([])].filter(Boolean),
    },
    {
      dir: "privacy",
      title: PAGE_SEO.privacy.title,
      description: PAGE_SEO.privacy.description,
      canonical: `${SITE_URL}/privacy`,
      ogImage: `${SITE_URL}/studio-og-1200x630.png`,
      bodyContent: `<main id="main" style="max-width:900px;margin:0 auto;padding:2rem 1rem;"><h1>Privacy Policy</h1><p>How Structura Architecture &amp; Construction handles project inquiries and client documents.</p></main>`,
      schemas: [getBreadcrumbSchema([{ name: "Home", url: "/" }, { name: "Privacy Policy", url: "/privacy" }])],
    },
    {
      dir: "terms",
      title: PAGE_SEO.terms.title,
      description: PAGE_SEO.terms.description,
      canonical: `${SITE_URL}/terms`,
      ogImage: `${SITE_URL}/studio-og-1200x630.png`,
      bodyContent: `<main id="main" style="max-width:900px;margin:0 auto;padding:2rem 1rem;"><h1>Terms &amp; Conditions</h1><p>Terms governing architectural and construction services by Structura Architecture &amp; Construction.</p></main>`,
      schemas: [getBreadcrumbSchema([{ name: "Home", url: "/" }, { name: "Terms & Conditions", url: "/terms" }])],
    },
  ];

  for (const route of staticRoutes) {
    const targetDir = path.join(distDir, route.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, "index.html"), injectPage(route), "utf-8");
  }

  for (const member of teamMembers.filter((m) => m.teamSection === "leadership")) {
    const slug = member.slug || member.employeeId;
    const html = injectPage({
      title: `${member.name} | Structura Studio`,
      description: `${member.name} — ${member.designation} at Structura Architecture & Construction.`,
      canonical: `${SITE_URL}/team/${slug}`,
      ogType: "profile",
      schemas: [getCorporateKnowledgeGraph()],
      bodyContent: `<main id="main" style="max-width:900px;margin:0 auto;padding:2rem 1rem;"><h1>${escapeHtml(member.name)}</h1><p>${escapeHtml(member.designation)}</p><p>${escapeHtml(member.bio)}</p></main>`,
      noindex: true,
    });
    const slugDir = path.join(distDir, "team", slug);
    fs.mkdirSync(slugDir, { recursive: true });
    fs.writeFileSync(path.join(slugDir, "index.html"), html, "utf-8");
  }

  const notFoundHtml = injectPage({
    title: PAGE_SEO.notFound.title,
    description: PAGE_SEO.notFound.description,
    canonical: `${SITE_URL}/404`,
    ogImage: `${SITE_URL}/studio-og-1200x630.png`,
    bodyContent: `<main id="main" style="max-width:800px;margin:0 auto;padding:3rem 1rem;text-align:center;"><h1>404 - Page Not Found</h1><p>The page you requested could not be found.</p><a href="/">Return Home</a></main>`,
    noindex: true,
  });
  fs.writeFileSync(path.join(distDir, "404.html"), notFoundHtml, "utf-8");

  console.log("[SSG Prerender Static] Successfully prerendered static pages into dist/.");
}

if (process.argv[1] && process.argv[1].includes("prerender-static-pages.js")) {
  await prerenderStaticPages();
}
