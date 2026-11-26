// services.js
import fs from "node:fs";
import path from "node:path";
import { SERVICES_DATA } from "../src/data/services.js";

const SITE_URL = (process.env.VITE_SITE_URL || "https://example.com").replace(/\/+$/, "");

function escapeHtml(unsafe = "") {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function prerenderServices() {
  const distDir = path.resolve(process.cwd(), "dist");
  const templatePath = path.join(distDir, "index.html");

  if (!fs.existsSync(templatePath)) {
    console.warn("️ [SSG Prerender Services] dist/index.html not found.");
    return;
  }

  const baseHtml = fs.readFileSync(templatePath, "utf-8");

  const catalogDir = path.join(distDir, "services");
  if (!fs.existsSync(catalogDir)) {
    fs.mkdirSync(catalogDir, { recursive: true });
  }

  const catalogTitle = "Architecture, Structural Engineering & Turnkey Services | Structura";
  const catalogDesc = "Explore Structura's core disciplines: architectural design, ductile structural engineering, turnkey construction, modular interiors, and building permits.";
  const catalogCanonical = `${SITE_URL}/services`;
  const catalogCover = "/images/services/architectural-design.svg";

  const catalogItemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": catalogTitle,
    "description": catalogDesc,
    "numberOfItems": SERVICES_DATA.length,
    "itemListElement": SERVICES_DATA.map((service, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "item": {
        "@type": "Service",
        "name": service.title,
        "description": service.shortDesc || service.metaDescription,
        "url": `${SITE_URL}/services/${service.slug}`,
        "image": service.coverImage,
        "provider": {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          "name": "Structura Architecture & Construction",
          "url": SITE_URL
        },
        "areaServed": {
          "@type": "Place",
          "name": "Design District"
        }
      }
    }))
  };

  const catalogImageSchemas = SERVICES_DATA.map((service) => ({
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "@id": `${service.coverImage}#image`,
    "url": service.coverImage,
    "contentUrl": service.coverImage,
    "name": `${service.title} - Structura Architecture & Construction`,
    "caption": service.imageAlt || service.shortDesc,
    "description": `${service.title} - Architectural and structural engineering service`,
    "encodingFormat": "image/svg+xml",
    "creator": {
      "@type": "Organization",
      "name": "Structura Architecture & Construction",
      "url": SITE_URL
    },
    "copyrightHolder": {
      "@type": "Organization",
      "name": "Structura Architecture & Construction"
    },
    "license": `${SITE_URL}/terms`
  }));

  const catalogBreadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
      { "@type": "ListItem", "position": 2, "name": "Services", "item": catalogCanonical }
    ]
  };

  let catalogHtml = baseHtml;
  catalogHtml = catalogHtml.replace(/<!-- Structured Data:[\s\S]*?<\/script>/gi, "");
  catalogHtml = catalogHtml.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");

  catalogHtml = catalogHtml.replace(/<title[\s\S]*?<\/title>/i, `<title data-rh="true">${escapeHtml(catalogTitle)}</title>`);
  catalogHtml = catalogHtml.replace(/<meta[^>]*name="description"[\s\S]*?>/i, `<meta data-rh="true" name="description" content="${escapeHtml(catalogDesc)}" />`);
  catalogHtml = catalogHtml.replace(/<link[^>]*rel="canonical"[\s\S]*?>/i, `<link data-rh="true" rel="canonical" href="${catalogCanonical}" />`);

  catalogHtml = catalogHtml.replace(/<meta[^>]*property="og:title"[\s\S]*?>/i, `<meta data-rh="true" property="og:title" content="${escapeHtml(catalogTitle)}" />`);
  catalogHtml = catalogHtml.replace(/<meta[^>]*property="og:description"[\s\S]*?>/i, `<meta data-rh="true" property="og:description" content="${escapeHtml(catalogDesc)}" />`);

  const catalogOgUrl = `${SITE_URL}/og/services.jpg`;
  catalogHtml = catalogHtml.replace(/<meta[^>]*property="og:image[^"]*"[\s\S]*?>\r?\n?/gi, "");
  catalogHtml = catalogHtml.replace(/<meta[^>]*name="twitter:image[^"]*"[\s\S]*?>\r?\n?/gi, "");

  const catalogOgTags = `
  <meta data-rh="true" property="og:image" content="${catalogOgUrl}" />
  <meta data-rh="true" property="og:image:secure_url" content="${catalogOgUrl}" />
  <meta data-rh="true" property="og:image:type" content="image/jpeg" />
  <meta data-rh="true" property="og:image:width" content="1200" />
  <meta data-rh="true" property="og:image:height" content="630" />
  <meta data-rh="true" property="og:image:alt" content="Engineering and Architectural Services - Structura Studio" />`;

  catalogHtml = catalogHtml.replace(/<meta[^>]*property="og:url"[\s\S]*?>/i, `${catalogOgTags.trim()}\n  <meta data-rh="true" property="og:url" content="${catalogCanonical}" />`);
  catalogHtml = catalogHtml.replace(/<meta[^>]*property="og:type"[\s\S]*?>/i, `<meta data-rh="true" property="og:type" content="website" />`);

  catalogHtml = catalogHtml.replace(/<meta[^>]*name="twitter:title"[\s\S]*?>/i, `<meta data-rh="true" name="twitter:title" content="${escapeHtml(catalogTitle)}" />`);
  catalogHtml = catalogHtml.replace(/<meta[^>]*name="twitter:description"[\s\S]*?>/i, `<meta data-rh="true" name="twitter:description" content="${escapeHtml(catalogDesc)}" />\n  <meta data-rh="true" name="twitter:image" content="${catalogOgUrl}" />`);

  const catalogWebPageSchema = {
    "@type": "CollectionPage",
    "@id": `${catalogCanonical}#webpage`,
    "url": catalogCanonical,
    "name": catalogTitle,
    "description": catalogDesc,
    "isPartOf": {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      "name": "Structura Architecture & Construction",
      "url": `${SITE_URL}/`
    }
  };

  const catalogGraphElements = [
    catalogWebPageSchema,
    catalogItemListSchema,
    catalogBreadcrumbSchema,
    ...catalogImageSchemas
  ].map((node) => {
    const clean = { ...node };
    delete clean["@context"];
    return clean;
  });

  const catalogGraphSchema = {
    "@context": "https://schema.org",
    "@graph": catalogGraphElements
  };

  const catalogSchemaScript = `
  <!-- Structured Data: Services Catalog Knowledge Graph -->
  <script type="application/ld+json">
${JSON.stringify(catalogGraphSchema, null, 2)}
  </script>
</head>`;
  catalogHtml = catalogHtml.replace(/<\/head>/i, catalogSchemaScript);

  const catalogServicesListHtml = SERVICES_DATA.map((srv, sIdx) => `
    <article style="margin-bottom:2.5rem;padding:1.5rem;border:1px solid #222;border-radius:12px;background:#0d0d0d;">
      <span style="font-size:0.85rem;color:#888;text-transform:uppercase;letter-spacing:0.05em;">Discipline 0${sIdx + 1}</span>
      <h2 style="font-size:1.75rem;margin:0.5rem 0 0.75rem 0;color:#f3f4f6;"><a href="/services/${srv.slug}" style="color:inherit;text-decoration:none;">${escapeHtml(srv.title)}</a></h2>
      <p style="color:#9ca3af;line-height:1.6;margin-bottom:1rem;">${escapeHtml(srv.shortDesc)}</p>
      <div style="margin:1rem 0;">
        <a href="/services/${srv.slug}" aria-label="Explore ${escapeHtml(srv.title)}">
          <img src="${srv.coverImage}" alt="${escapeHtml(srv.imageAlt || srv.title)}" title="${escapeHtml(srv.title)}" style="width:100%;max-height:480px;object-fit:cover;border-radius:8px;display:block;" loading="${sIdx === 0 ? 'eager' : 'lazy'}" decoding="async" width="800" height="500" />
        </a>
      </div>
      <a href="/services/${srv.slug}" style="display:inline-block;margin-top:0.75rem;padding:0.6rem 1.25rem;background:#171717;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Read More &rarr;</a>
    </article>
  `).join("");

  const catalogPrerenderBody = `
    <main id="main" style="max-width:1200px;margin:0 auto;padding:2rem 1rem;color:#18181b;">
      <nav aria-label="Breadcrumb" style="font-size:0.875rem;color:#52525b;margin-bottom:1.5rem;">
        <a href="/" style="color:inherit;text-decoration:none;">Home</a> / <strong style="color:#09090b;">Services</strong>
      </nav>
      <header style="margin-bottom:3rem;">
        <span style="display:inline-block;padding:0.25rem 0.65rem;background:#1e293b;color:#38bdf8;border-radius:4px;font-size:0.8rem;font-weight:600;text-transform:uppercase;margin-bottom:0.75rem;">Discipline Catalog &amp; Capabilities</span>
        <h1 style="font-size:clamp(2rem,4vw,3rem);font-weight:800;color:#09090b;line-height:1.2;margin:0 0 1rem 0;">Architecture, Structural Engineering &amp; Turnkey Services</h1>
        <p style="font-size:1.1rem;color:#52525b;max-width:800px;line-height:1.6;">Turnkey construction, ductile seismic structural engineering, 3D architectural visualization, modular interior millwork, and permitting site surveys.</p>
      </header>
      <section aria-label="Engineering Services Catalog">
        ${catalogServicesListHtml}
      </section>
      <section style="margin-top:3rem;padding:2rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;text-align:center;">
        <h2 style="font-size:1.5rem;color:#09090b;margin-bottom:0.5rem;">Looking for Turnkey Construction or Structural Engineering?</h2>
        <p style="color:#52525b;margin-bottom:1.5rem;">Contact our studio to request a preliminary structural audit and transparent BOQ consultation.</p>
        <a href="/contact" style="display:inline-block;padding:0.75rem 1.75rem;background:#ffbb0f;color:#09090b;font-weight:700;border-radius:8px;text-decoration:none;">Schedule Engineering Consultation</a>
      </section>
    </main>`;

  if (catalogHtml.includes('<div id="root">')) {
    catalogHtml = catalogHtml.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">\n${catalogPrerenderBody}\n</div>`);
  }

  fs.writeFileSync(path.join(catalogDir, "index.html"), catalogHtml, "utf-8");
  console.log("[SSG Prerender Services] Generated /services/index.html");

  for (const service of SERVICES_DATA) {
    const srvDir = path.join(catalogDir, service.slug);
    if (!fs.existsSync(srvDir)) {
      fs.mkdirSync(srvDir, { recursive: true });
    }

    const srvTitle = service.seoTitle || `${service.title} | Structura Architecture & Construction`;
    const srvDesc = service.metaDescription || service.shortDesc || service.fullDesc;
    const srvCanonical = `${SITE_URL}/services/${service.slug}`;
    const srvCover = service.coverImage || catalogCover;
    const srvAlt = service.imageAlt || service.title;
    const srvKeywords = (service.keywords || []).join(", ");

    const srvDetailSchema = {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${srvCanonical}#service`,
      "name": service.title,
      "serviceType": service.title,
      "description": srvDesc,
      "url": srvCanonical,
      "image": [
        srvCover,
        ...(service.gallery || []).map((img) => img.url)
      ],
      "provider": {
        "@id": `${SITE_URL}/#organization`,
        "@type": "Organization",
        "name": "Structura Architecture & Construction",
        "url": SITE_URL,
        "telephone": "+1 (555) 010-0000",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "123 Architecture Ave, Design District",
          "addressLocality": "Design District",
          "addressRegion": "Metro Area",
          "postalCode": "10001",
          "addressCountry": "US"
        }
      },
      "areaServed": [
        { "@type": "Place", "name": "Design District" },
        { "@type": "Place", "name": "Northside" }
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": service.title,
        "itemListElement": (service.features || []).map((feat) => ({
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": feat
          }
        }))
      }
    };

    const srvBreadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
        { "@type": "ListItem", "position": 2, "name": "Services", "item": `${SITE_URL}/services` },
        { "@type": "ListItem", "position": 3, "name": service.title, "item": srvCanonical }
      ]
    };

    const coverImageSchema = {
      "@context": "https://schema.org",
      "@type": "ImageObject",
      "@id": `${srvCover}#image`,
      "url": srvCover,
      "contentUrl": srvCover,
      "name": `${service.title} - Engineering & Architectural Overview`,
      "caption": srvAlt,
      "description": `${service.title} service visual by Structura Architecture & Construction`,
      "encodingFormat": "image/svg+xml",
      "representativeOfPage": true,
      "creator": {
        "@type": "Organization",
        "name": "Structura Architecture & Construction",
        "url": SITE_URL
      },
      "copyrightHolder": {
        "@type": "Organization",
        "name": "Structura Architecture & Construction"
      },
      "license": `${SITE_URL}/terms`,
      "acquireLicensePage": `${SITE_URL}/contact`
    };

    const galleryImageSchemas = (service.gallery || []).map((img) => ({
      "@context": "https://schema.org",
      "@type": "ImageObject",
      "@id": `${img.url}#image`,
      "url": img.url,
      "contentUrl": img.url,
      "name": `${img.title} - ${service.title}`,
      "caption": img.caption,
      "description": `${img.title}: ${img.caption} (${service.title} - Structura Studio)`,
      "encodingFormat": "image/svg+xml",
      "representativeOfPage": false,
      "keywords": `${service.title}, ${img.tag || ""}, architecture, construction`,
      "creator": {
        "@type": "Organization",
        "name": "Structura Architecture & Construction",
        "url": SITE_URL
      },
      "copyrightHolder": {
        "@type": "Organization",
        "name": "Structura Architecture & Construction"
      },
      "license": `${SITE_URL}/terms`,
      "acquireLicensePage": `${SITE_URL}/contact`
    }));

    let srvHtml = baseHtml;
    srvHtml = srvHtml.replace(/<!-- Structured Data:[\s\S]*?<\/script>/gi, "");
    srvHtml = srvHtml.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");

    srvHtml = srvHtml.replace(/<title[\s\S]*?<\/title>/i, `<title data-rh="true">${escapeHtml(srvTitle)}</title>`);
    srvHtml = srvHtml.replace(/<meta[^>]*name="description"[\s\S]*?>/i, `<meta data-rh="true" name="description" content="${escapeHtml(srvDesc)}" />`);
    if (srvKeywords) {
      srvHtml = srvHtml.replace(/<meta[^>]*name="description"/i, `<meta name="keywords" content="${escapeHtml(srvKeywords)}" />\n  <meta data-rh="true" name="description"`);
    }
    srvHtml = srvHtml.replace(/<link[^>]*rel="canonical"[\s\S]*?>/i, `<link data-rh="true" rel="canonical" href="${srvCanonical}" />`);

    srvHtml = srvHtml.replace(/<meta[^>]*property="og:title"[\s\S]*?>/i, `<meta data-rh="true" property="og:title" content="${escapeHtml(srvTitle)}" />`);
    srvHtml = srvHtml.replace(/<meta[^>]*property="og:description"[\s\S]*?>/i, `<meta data-rh="true" property="og:description" content="${escapeHtml(srvDesc)}" />`);

    const srvOgUrl = fs.existsSync(path.resolve(process.cwd(), "public", "og", `services-${service.slug}.jpg`))
      ? `${SITE_URL}/og/services-${service.slug}.jpg`
      : `${SITE_URL}/og/services.jpg`;

    srvHtml = srvHtml.replace(/<meta[^>]*property="og:image[^"]*"[\s\S]*?>\r?\n?/gi, "");
    srvHtml = srvHtml.replace(/<meta[^>]*name="twitter:image[^"]*"[\s\S]*?>\r?\n?/gi, "");

    const srvOgTags = `
  <meta data-rh="true" property="og:image" content="${srvOgUrl}" />
  <meta data-rh="true" property="og:image:secure_url" content="${srvOgUrl}" />
  <meta data-rh="true" property="og:image:type" content="image/jpeg" />
  <meta data-rh="true" property="og:image:width" content="1200" />
  <meta data-rh="true" property="og:image:height" content="630" />
  <meta data-rh="true" property="og:image:alt" content="${escapeHtml(srvAlt)}" />`;

    srvHtml = srvHtml.replace(/<meta[^>]*property="og:url"[\s\S]*?>/i, `${srvOgTags.trim()}\n  <meta data-rh="true" property="og:url" content="${srvCanonical}" />`);
    srvHtml = srvHtml.replace(/<meta[^>]*property="og:type"[\s\S]*?>/i, `<meta data-rh="true" property="og:type" content="article" />\n  <meta data-rh="true" property="og:locale" content="en_US" />\n  <meta property="article:section" content="Engineering Disciplines" />`);

    srvHtml = srvHtml.replace(/<meta[^>]*name="twitter:title"[\s\S]*?>/i, `<meta data-rh="true" name="twitter:title" content="${escapeHtml(srvTitle)}" />`);
    srvHtml = srvHtml.replace(/<meta[^>]*name="twitter:description"[\s\S]*?>/i, `<meta data-rh="true" name="twitter:description" content="${escapeHtml(srvDesc)}" />\n  <meta data-rh="true" name="twitter:image" content="${srvOgUrl}" />\n  <meta data-rh="true" name="twitter:image:alt" content="${escapeHtml(srvAlt)}" />`);

    const srvWebPageSchema = {
      "@type": "WebPage",
      "@id": `${srvCanonical}#webpage`,
      "url": srvCanonical,
      "name": srvTitle,
      "description": srvDesc,
      "isPartOf": {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        "name": "Structura Architecture & Construction",
        "url": `${SITE_URL}/`
      }
    };

    const srvGraphElements = [
      srvWebPageSchema,
      srvDetailSchema,
      srvBreadcrumbSchema,
      coverImageSchema,
      ...galleryImageSchemas
    ].filter(Boolean).map((node) => {
      const clean = { ...node };
      delete clean["@context"];
      return clean;
    });

    const srvGraphSchema = {
      "@context": "https://schema.org",
      "@graph": srvGraphElements
    };

    const srvSchemaScript = `
  <!-- Structured Data: Service Detail Knowledge Graph -->
  <script type="application/ld+json">
${JSON.stringify(srvGraphSchema, null, 2)}
  </script>
</head>`;
    srvHtml = srvHtml.replace(/<\/head>/i, srvSchemaScript);

    const galleryHtml = (service.gallery || []).map((img, idx) => `
      <article style="margin-bottom:2.5rem;background:#111;border:1px solid #262626;border-radius:12px;overflow:hidden;" itemscope itemtype="https://schema.org/ImageObject">
        <div style="width:100%;">
          <img src="${img.url}" alt="${escapeHtml(img.title)} - ${escapeHtml(service.title)} | Structura Studio" title="${escapeHtml(img.title)} - ${escapeHtml(service.title)}" style="width:100%;max-height:540px;object-fit:cover;display:block;" loading="lazy" decoding="async" width="800" height="500" itemprop="contentUrl" />
          <meta itemprop="name" content="${escapeHtml(img.title)} - ${escapeHtml(service.title)}" />
          <meta itemprop="caption" content="${escapeHtml(img.caption)}" />
        </div>
        <div style="padding:1.5rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
            ${img.tag ? `<span style="display:inline-block;padding:0.25rem 0.65rem;background:#1e293b;color:#38bdf8;border-radius:4px;font-size:0.8rem;font-weight:600;text-transform:uppercase;">${escapeHtml(img.tag)}</span>` : ''}
            <span style="color:#6b7280;font-size:0.85rem;font-family:monospace;">0${idx + 1} / 04</span>
          </div>
          <h3 style="font-size:1.35rem;margin:0 0 0.5rem 0;color:#f3f4f6;">${escapeHtml(img.title)}</h3>
          <p style="color:#9ca3af;line-height:1.6;margin:0;" itemprop="description">${escapeHtml(img.caption)}</p>
        </div>
      </article>
    `).join("");

    const specsHtml = (service.specs || []).map((spec) => `
      <div style="padding:1rem;background:#171717;border:1px solid #262626;border-radius:8px;">
        <div style="font-size:0.8rem;color:#9ca3af;text-transform:uppercase;margin-bottom:0.25rem;">${escapeHtml(spec.label)}</div>
        <div style="font-size:0.95rem;font-weight:600;color:#f3f4f6;">${escapeHtml(spec.value)}</div>
      </div>
    `).join("");

    const techParamsHtml = (service.technicalParameters || []).map((tp) => `
      <tr style="border-bottom:1px solid #27272a;">
        <th style="text-align:left;padding:0.75rem 1rem;color:#a1a1aa;font-weight:600;font-size:0.9rem;width:35%;">${escapeHtml(tp.label)}</th>
        <td style="padding:0.75rem 1rem;color:#f4f4f5;font-size:0.95rem;">${escapeHtml(tp.value)}</td>
      </tr>
    `).join("");

    const complianceListHtml = service.complianceInfo?.list ? service.complianceInfo.list.map((item) => `
      <li style="margin-bottom:0.75rem;color:#d4d4d8;line-height:1.6;">
        <strong style="color:#38bdf8;">&bull;</strong> ${escapeHtml(item)}
      </li>
    `).join("") : "";

    const workflowHtml = (service.workflow || []).map((wf) => `
      <div style="padding:1.25rem;background:#18181b;border:1px solid #27272a;border-radius:8px;">
        <div style="font-size:0.85rem;color:#38bdf8;font-weight:700;letter-spacing:0.05em;margin-bottom:0.25rem;">STAGE ${escapeHtml(wf.step)}</div>
        <h3 style="font-size:1.15rem;color:#f4f4f5;margin:0 0 0.5rem 0;">${escapeHtml(wf.title)}</h3>
        <p style="font-size:0.9rem;color:#a1a1aa;line-height:1.6;margin:0;">${escapeHtml(wf.desc)}</p>
      </div>
    `).join("");

    const featuresHtml = (service.features || []).map((feat) => `
      <li style="margin-bottom:0.6rem;color:#d1d5db;display:flex;align-items:center;">
        <span style="color:#22c55e;margin-right:0.5rem;font-weight:bold;">&check;</span>
        <span>${escapeHtml(feat)}</span>
      </li>
    `).join("");

    const faqsHtml = (service.faqs || []).map((faq) => `
      <div style="margin-bottom:1rem;padding:1.25rem;background:#141414;border:1px solid #262626;border-radius:8px;">
        <h3 style="font-size:1.1rem;margin:0 0 0.5rem 0;color:#f3f4f6;">${escapeHtml(faq.q)}</h3>
        <p style="margin:0;color:#9ca3af;line-height:1.6;">${escapeHtml(faq.a)}</p>
      </div>
    `).join("");

    const srvMainHtml = `
    <main id="main" style="max-width:1200px;margin:0 auto;padding:2rem 1rem;color:#18181b;">
      <nav aria-label="Breadcrumb" style="font-size:0.875rem;color:#52525b;margin-bottom:1.5rem;">
        <a href="/" style="color:inherit;text-decoration:none;">Home</a> / 
        <a href="/services" style="color:inherit;text-decoration:none;">Services</a> / 
        <strong style="color:#09090b;">${escapeHtml(service.title)}</strong>
      </nav>

      <header style="margin-bottom:2.5rem;">
        <span style="display:inline-block;padding:0.25rem 0.65rem;background:#1e293b;color:#38bdf8;border-radius:4px;font-size:0.8rem;font-weight:600;text-transform:uppercase;margin-bottom:0.75rem;">Engineering Discipline</span>
        <h1 style="font-size:clamp(2rem,4vw,3rem);font-weight:800;color:#09090b;line-height:1.2;margin:0 0 0.75rem 0;">${escapeHtml(service.title)}</h1>
        <p style="font-size:1.15rem;color:#52525b;max-width:850px;line-height:1.6;margin:0 0 1.5rem 0;">${escapeHtml(service.shortDesc)}</p>
        
        <!-- Hero Cover Visual for Googlebot-Image -->
        <figure style="margin:0;border-radius:12px;overflow:hidden;" itemscope itemtype="https://schema.org/ImageObject">
          <img src="${srvCover}" alt="${escapeHtml(srvAlt)}" title="${escapeHtml(service.title)} - Architecture &amp; Engineering" style="width:100%;max-height:600px;object-fit:cover;display:block;" loading="eager" decoding="async" width="800" height="500" itemprop="contentUrl" />
          <figcaption style="margin-top:0.75rem;color:#52525b;font-size:0.875rem;font-style:italic;">${escapeHtml(service.fullDesc.slice(0, 180))}...</figcaption>
          <meta itemprop="name" content="${escapeHtml(service.title)}" />
          <meta itemprop="caption" content="${escapeHtml(srvAlt)}" />
        </figure>
      </header>

      <!-- Scope of Work -->
      <section style="margin-bottom:2.5rem;">
        <h2 style="font-size:1.75rem;color:#09090b;margin-bottom:1rem;">Scope of Work &amp; Engineering Approach</h2>
        <p style="color:#27272a;line-height:1.7;font-size:1.05rem;">${escapeHtml(service.fullDesc)}</p>
      </section>

      <!-- Specifications Grid -->
      ${service.specs && service.specs.length > 0 ? `
      <section style="margin-bottom:2.5rem;">
        <h2 style="font-size:1.5rem;color:#09090b;margin-bottom:1rem;">Technical Specifications &amp; Standards</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:1rem;">
          ${specsHtml}
        </div>
      </section>` : ''}

      <!-- Technical Engineering Parameters Table -->
      ${service.technicalParameters && service.technicalParameters.length > 0 ? `
      <section style="margin-bottom:2.5rem;">
        <h2 style="font-size:1.5rem;color:#09090b;margin-bottom:1rem;">Engineering Design Criteria &amp; Parameters</h2>
        <div style="overflow-x:auto;background:#18181b;border:1px solid #27272a;border-radius:10px;">
          <table style="width:100%;border-collapse:collapse;text-align:left;">
            <tbody>
              ${techParamsHtml}
            </tbody>
          </table>
        </div>
      </section>` : ''}

      <!-- Compliance & Alpine Climate Adaptation -->
      ${service.complianceInfo ? `
      <section style="margin-bottom:2.5rem;background:#f8fafc;padding:1.5rem;border-radius:12px;border:1px solid #e2e8f0;">
        <h2 style="font-size:1.5rem;color:#09090b;margin-top:0;margin-bottom:0.5rem;">${escapeHtml(service.complianceInfo.title)}</h2>
        <p style="color:#64748b;margin-top:0;margin-bottom:1rem;font-size:0.95rem;">${escapeHtml(service.complianceInfo.subtitle)}</p>
        <ul style="padding-left:1.25rem;margin:0;">
          ${complianceListHtml}
        </ul>
      </section>` : ''}

      <!-- Key Deliverables -->
      ${service.features && service.features.length > 0 ? `
      <section style="margin-bottom:2.5rem;">
        <h2 style="font-size:1.5rem;color:#09090b;margin-bottom:1rem;">Key Capabilities &amp; Engineering Deliverables</h2>
        <ul style="list-style:none;padding:0;margin:0;">
          ${featuresHtml}
        </ul>
      </section>` : ''}

      <!-- Workflow Stages -->
      ${service.workflow && service.workflow.length > 0 ? `
      <section style="margin-bottom:2.5rem;">
        <h2 style="font-size:1.5rem;color:#09090b;margin-bottom:1rem;">Execution Methodology &amp; Workflow</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:1rem;">
          ${workflowHtml}
        </div>
      </section>` : ''}

      <!-- Complete Perspective Visuals (All 4 Images Indexed in Google Images) -->
      <section aria-label="Visual Spotlights &amp; Field Execution Gallery" style="margin-bottom:3rem;">
        <h2 style="font-size:1.75rem;color:#09090b;margin-bottom:1.5rem;">Visual Spotlights &amp; Engineering Execution</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:1.5rem;">
          ${galleryHtml}
        </div>
      </section>

      <!-- FAQs -->
      ${service.faqs && service.faqs.length > 0 ? `
      <section style="margin-bottom:3rem;" aria-label="Frequently Asked Questions">
        <h2 style="font-size:1.75rem;color:#09090b;margin-bottom:1.25rem;">Frequently Asked Questions</h2>
        <div>
          ${faqsHtml}
        </div>
      </section>` : ''}

      <!-- Contextual Internal Navigation Links -->
      <nav aria-label="Explore other engineering disciplines" style="margin-bottom:3rem;padding:1.5rem;background:#18181b;border-radius:12px;border:1px solid #27272a;">
        <h3 style="font-size:1.15rem;color:#f4f4f5;margin-top:0;margin-bottom:1rem;">Other Practices at Structura Studio:</h3>
        <div style="display:flex;flex-wrap:wrap;gap:0.75rem;">
          <a href="/services/architectural-design" style="padding:0.4rem 0.85rem;background:#27272a;color:#e4e4e7;border-radius:6px;text-decoration:none;font-size:0.9rem;">Architectural Design</a>
          <a href="/services/structural-engineering" style="padding:0.4rem 0.85rem;background:#27272a;color:#e4e4e7;border-radius:6px;text-decoration:none;font-size:0.9rem;">Structural Engineering</a>
          <a href="/services/turnkey-construction" style="padding:0.4rem 0.85rem;background:#27272a;color:#e4e4e7;border-radius:6px;text-decoration:none;font-size:0.9rem;">Turnkey Construction</a>
          <a href="/services/interior-modular-design" style="padding:0.4rem 0.85rem;background:#27272a;color:#e4e4e7;border-radius:6px;text-decoration:none;font-size:0.9rem;">Interior &amp; Modular</a>
          <a href="/services/regulatory-approvals" style="padding:0.4rem 0.85rem;background:#27272a;color:#e4e4e7;border-radius:6px;text-decoration:none;font-size:0.9rem;">Permits &amp; Site Surveys</a>
          <a href="/projects" style="padding:0.4rem 0.85rem;background:#0284c7;color:#fff;border-radius:6px;text-decoration:none;font-size:0.9rem;font-weight:600;">Browse Realized Projects &rarr;</a>
        </div>
      </nav>

      <!-- Bottom Consultation CTA -->
      <section style="padding:2rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;text-align:center;">
        <h2 style="font-size:1.5rem;color:#09090b;margin-bottom:0.5rem;">Need ${escapeHtml(service.title)}?</h2>
        <p style="color:#52525b;margin-bottom:1.5rem;">Schedule a direct engineering consultation or site walkthrough with our studio team.</p>
        <a href="/contact" style="display:inline-block;padding:0.75rem 1.75rem;background:#ffbb0f;color:#09090b;font-weight:700;border-radius:8px;text-decoration:none;">Request Technical Consultation</a>
      </section>
    </main>`;

    if (srvHtml.includes('<div id="root">')) {
      srvHtml = srvHtml.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">\n${srvMainHtml}\n</div>`);
    }
    fs.writeFileSync(path.join(srvDir, "index.html"), srvHtml, "utf-8");
    console.log(`[SSG Prerender Services] Generated /services/${service.slug}/index.html`);
  }

  console.log("[SSG Prerender Services] All 5 service pages successfully prerendered!");
}

if (process.argv[1] && process.argv[1].includes("prerender-services.js")) {
  prerenderServices();
}
