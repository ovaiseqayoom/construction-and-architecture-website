// blogs.js
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { marked } from "marked";
import { getAuthorProfile } from "../src/utils/authors.js";
import { DEMO_BLOGS } from "../src/data/demoContent.js";

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

function formatToIstOffset(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return new Date().toISOString().replace(/Z$/, "+05:30");
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(d.getTime() + istOffsetMs);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  const hours = String(istDate.getUTCHours()).padStart(2, "0");
  const minutes = String(istDate.getUTCMinutes()).padStart(2, "0");
  const seconds = String(istDate.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+05:30`;
}

function renderChartSsrHtml(rawChartBlock) {
  const cleanJson = rawChartBlock.replace(/^```(?:chart)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    const spec = JSON.parse(cleanJson);
    const title = escapeHtml(spec.title || "Engineering Analytics Visual");
    const subtitle = spec.subtitle ? `<p style="margin:4px 0 0;font-size:0.875rem;color:#52525B;">${escapeHtml(spec.subtitle)}</p>` : "";
    const caption = spec.caption ? `<figcaption style="margin-top:10px;font-size:0.75rem;color:#71717A;">${escapeHtml(spec.caption)}</figcaption>` : "";
    const unit = spec.unit ? ` (${escapeHtml(spec.unit)})` : "";
    let bodySummary = "";

    if (Array.isArray(spec.groups)) {
      const items = spec.groups
        .map((g) => `<li><strong>${escapeHtml(g.label || "")}</strong>: ${(g.bars || []).map((b) => `${escapeHtml(b.series || "")}: ${escapeHtml(String(b.value ?? ""))}${unit}`).join(", ")}</li>`)
        .join("");
      bodySummary = `<ul style="margin:10px 0 0;padding-left:18px;font-size:0.875rem;color:#27272A;">${items}</ul>`;
    } else if (Array.isArray(spec.items)) {
      const items = spec.items
        .map((it) => `<li><strong>${escapeHtml(it.label || "")}</strong>: ${escapeHtml(String(it.low ?? ""))} – ${escapeHtml(String(it.high ?? ""))}${unit}</li>`)
        .join("");
      bodySummary = `<ul style="margin:10px 0 0;padding-left:18px;font-size:0.875rem;color:#27272A;">${items}</ul>`;
    } else if (String(spec.type || "").toLowerCase() === "composite" && Array.isArray(spec.panels)) {
      const items = spec.panels
        .map((p) => `<li><strong>${escapeHtml(p.title || p.eyebrow || "")}</strong></li>`)
        .join("");
      bodySummary = `<ul style="margin:10px 0 0;padding-left:18px;font-size:0.875rem;color:#27272A;">${items}</ul>`;
    } else if (Array.isArray(spec.panels)) {
      const items = spec.panels
        .map((p) => `<li><strong>${escapeHtml(p.label || "")}</strong>: ${escapeHtml(String(p.value ?? ""))}${p.delta ? ` (${escapeHtml(p.delta)})` : ""}</li>`)
        .join("");
      bodySummary = `<ul style="margin:10px 0 0;padding-left:18px;font-size:0.875rem;color:#27272A;">${items}</ul>`;
    } else if (Array.isArray(spec.series) && Array.isArray(spec.labels)) {
      const items = spec.series
        .map((s) => `<li><strong>${escapeHtml(s.name || "")}</strong>: ${(s.data || []).map((v, i) => `${escapeHtml(String(spec.labels[i] ?? i + 1))}: ${escapeHtml(String(v))}${unit}`).join(", ")}</li>`)
        .join("");
      bodySummary = `<ul style="margin:10px 0 0;padding-left:18px;font-size:0.875rem;color:#27272A;">${items}</ul>`;
    }

    return `<figure class="app-chart-ssr" style="margin:24px 0;padding:16px;border:1px solid #E4E4E7;border-radius:10px;background:#FAFAFA;"><div style="font-weight:600;color:#111113;">${title}</div>${subtitle}${bodySummary}${caption}</figure>`;
  } catch {
    return "";
  }
}

function renderMermaidSvg(rawMermaid, diagramId, contextTitle = "Engineering Flowchart") {
  const cleanRaw = rawMermaid.replace(/```mermaid\s*/i, "").replace(/```$/, "").trim();
  const lines = cleanRaw.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("%%"));

  const subgraphs = [];
  let currentSubgraph = null;
  const nodes = new Map();
  const edges = [];

  const edgeRegex = /([a-zA-Z0-9_-]+)(?:\["[^"]+"\]|\[[^\]]+\]|\{"[^"]+"\}|\{[^}]+\}|\(\["[^"]+"\]\)|\(\[[^\]]+\]\))?\s*(?:-->|---|==>|\.->|-\.->)\s*(?:\|"([^"]+)"\||\|([^|]+)\|)?\s*([a-zA-Z0-9_-]+)/;
  const nodeRegex = /([a-zA-Z0-9_-]+)\s*(?:\["([^"]+)"\]|\[([^\]]+)\]|\{"([^"]+)"\}|\{([^}]+)\}|\(\["([^"]+)"\]\)|\(\[[^\]]+\]\))/;

  for (const line of lines) {
    if (line.startsWith("subgraph")) {
      const match = line.match(/subgraph\s+([a-zA-Z0-9_-]+)(?:\s*\["([^"]+)"\]|\s*\[([^\]]+)\]|\s+"([^"]+)"|\s+(.*))?/);
      if (match) {
        currentSubgraph = {
          id: match[1],
          title: (match[2] || match[3] || match[4] || match[5] || match[1]).trim(),
          nodeIds: []
        };
        subgraphs.push(currentSubgraph);
      }
      continue;
    }
    if (line === "end") {
      currentSubgraph = null;
      continue;
    }

    const edgeMatch = line.match(edgeRegex);
    if (edgeMatch) {
      edges.push({
        from: edgeMatch[1],
        to: edgeMatch[3],
        label: (edgeMatch[1] ? (edgeMatch[2] || "") : "").trim()
      });
    }

    let remaining = line;
    let nMatch;
    while ((nMatch = remaining.match(nodeRegex)) !== null) {
      const id = nMatch[1];
      const isDecision = nMatch[0].includes("{");
      const label = (nMatch[2] || nMatch[3] || nMatch[4] || nMatch[5] || nMatch[6] || nMatch[7] || id).trim();
      nodes.set(id, { id, label, isDecision });
      if (currentSubgraph && !currentSubgraph.nodeIds.includes(id)) {
        currentSubgraph.nodeIds.push(id);
      }
      remaining = remaining.substring(nMatch.index + nMatch[0].length);
    }
  }

  const titleId = `title-${diagramId}`;
  const descId = `desc-${diagramId}`;
  const diagramTitle = subgraphs.length > 0
    ? `${contextTitle}: Process Stages & Engineering Specification`
    : `${contextTitle}: Structural Engineering Workflow`;
  const diagramDesc = `Technical schematic illustrating sequential engineering steps, standards, and decision logic: ${Array.from(nodes.values()).map(n => n.label).join(" -> ")}`;

  let svgContent = "";
  let totalWidth = 900;
  let totalHeight = 320;

  if (subgraphs.length > 0) {
    const colWidth = Math.floor((totalWidth - 40 - (subgraphs.length - 1) * 24) / subgraphs.length);
    const colGap = 24;
    const startX = 20;
    const startY = 40;
    const maxNodesInCol = Math.max(...subgraphs.map(s => s.nodeIds.length), 1);
    totalHeight = Math.max(300, 100 + maxNodesInCol * 95);

    const nodePositions = new Map();

    // Render Subgraph Containers
    subgraphs.forEach((sg, colIdx) => {
      const sgX = startX + colIdx * (colWidth + colGap);
      const sgY = startY;
      const sgH = totalHeight - startY - 30;

      svgContent += `
<g class="subgraph-group" data-stage="${escapeHtml(sg.id)}">
  <rect x="${sgX}" y="${sgY}" width="${colWidth}" height="${sgH}" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="4 3"/>
  <rect x="${sgX + 8}" y="${sgY + 8}" width="${colWidth - 16}" height="28" rx="6" fill="#0F172A"/>
  <text x="${sgX + colWidth / 2}" y="${sgY + 26}" text-anchor="middle" fill="#F8FAFC" font-size="11.5" font-weight="700" letter-spacing="0.02em">${escapeHtml(sg.title)}</text>
</g>`;

      sg.nodeIds.forEach((nId, nIdx) => {
        const node = nodes.get(nId) || { id: nId, label: nId, isDecision: false };
        const nW = colWidth - 28;
        const nH = 52;
        const nX = sgX + 14;
        const nY = sgY + 48 + nIdx * 76;
        nodePositions.set(nId, { x: nX + nW / 2, y: nY + nH / 2, top: nY, bottom: nY + nH, left: nX, right: nX + nW, w: nW, h: nH, col: colIdx });

        svgContent += `
<g class="node-box" id="node-${diagramId}-${escapeHtml(nId)}">
  <rect x="${nX}" y="${nY}" width="${nW}" height="${nH}" rx="8" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5"/>
  <text x="${nX + nW / 2}" y="${nY + 30}" text-anchor="middle" fill="#0F172A" font-size="11" font-weight="600">${escapeHtml(node.label)}</text>
</g>`;
      });
    });

    // Render inter-stage connectors
    for (let c = 0; c < subgraphs.length - 1; c++) {
      const currentSg = subgraphs[c];
      const nextSg = subgraphs[c + 1];
      const lastNodeCurr = currentSg.nodeIds[currentSg.nodeIds.length - 1];
      const firstNodeNext = nextSg.nodeIds[0];
      const pos1 = nodePositions.get(lastNodeCurr);
      const pos2 = nodePositions.get(firstNodeNext);

      if (pos1 && pos2) {
        svgContent += `
<path d="M ${pos1.right} ${pos1.y} L ${pos2.left} ${pos2.y}" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" marker-end="url(#arrow-${diagramId})"/>`;
      }
    }
  } else {
    // Flowchart without subgraphs (e.g. Linear, Mass Timber)
    const inDegree = new Map();
    const adj = new Map();
    nodes.forEach((_, id) => {
      inDegree.set(id, 0);
      adj.set(id, []);
    });
    edges.forEach(e => {
      if (adj.has(e.from)) adj.get(e.from).push(e.to);
      if (inDegree.has(e.to)) inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
    });

    const levels = new Map();
    const queue = [];
    nodes.forEach((_, id) => {
      if ((inDegree.get(id) || 0) === 0) {
        queue.push(id);
        levels.set(id, 0);
      }
    });
    if (queue.length === 0 && nodes.size > 0) {
      const first = nodes.keys().next().value;
      queue.push(first);
      levels.set(first, 0);
    }

    while (queue.length > 0) {
      const u = queue.shift();
      const uL = levels.get(u) || 0;
      const neighbors = adj.get(u) || [];
      for (const v of neighbors) {
        const currVL = levels.get(v);
        if (currVL === undefined || currVL < uL + 1) {
          levels.set(v, uL + 1);
          queue.push(v);
        }
      }
    }

    nodes.forEach((_, id) => {
      if (!levels.has(id)) levels.set(id, 0);
    });

    const maxLevel = Math.max(...levels.values(), 0);
    const levelNodes = Array.from({ length: maxLevel + 1 }, () => []);
    levels.forEach((lvl, id) => {
      levelNodes[lvl].push(id);
    });

    totalWidth = Math.max(900, (maxLevel + 1) * 160 + 60);
    const maxNodesAtLevel = Math.max(...levelNodes.map(ln => ln.length), 1);
    totalHeight = Math.max(260, 60 + maxNodesAtLevel * 90);

    const nodePositions = new Map();
    levelNodes.forEach((lnList, lvl) => {
      const colX = 30 + lvl * Math.floor((totalWidth - 60) / (maxLevel + 1));
      const colW = Math.floor((totalWidth - 60) / (maxLevel + 1)) - 20;
      const availableH = totalHeight - 60;
      const stepY = availableH / (lnList.length + 1);

      lnList.forEach((nId, idx) => {
        const node = nodes.get(nId) || { id: nId, label: nId, isDecision: false };
        const nW = colW;
        const nH = 48;
        const nX = colX;
        const nY = 30 + (idx + 1) * stepY - nH / 2;
        nodePositions.set(nId, { x: nX + nW / 2, y: nY + nH / 2, left: nX, right: nX + nW, top: nY, bottom: nY + nH });

        if (node.isDecision) {
          svgContent += `
<g class="node-decision" id="node-${diagramId}-${escapeHtml(nId)}">
  <polygon points="${nX + nW / 2},${nY} ${nX + nW},${nY + nH / 2} ${nX + nW / 2},${nY + nH} ${nX},${nY + nH / 2}" fill="#FEF3C7" stroke="#D97706" stroke-width="1.5"/>
  <text x="${nX + nW / 2}" y="${nY + nH / 2 + 4}" text-anchor="middle" fill="#92400E" font-size="10" font-weight="700">${escapeHtml(node.label)}</text>
</g>`;
        } else {
          svgContent += `
<g class="node-box" id="node-${diagramId}-${escapeHtml(nId)}">
  <rect x="${nX}" y="${nY}" width="${nW}" height="${nH}" rx="6" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5"/>
  <text x="${nX + nW / 2}" y="${nY + nH / 2 + 4}" text-anchor="middle" fill="#0F172A" font-size="10.5" font-weight="600">${escapeHtml(node.label)}</text>
</g>`;
        }
      });
    });

    edges.forEach(e => {
      const pos1 = nodePositions.get(e.from);
      const pos2 = nodePositions.get(e.to);
      if (pos1 && pos2) {
        svgContent += `
<path d="M ${pos1.right} ${pos1.y} C ${(pos1.right + pos2.left) / 2} ${pos1.y}, ${(pos1.right + pos2.left) / 2} ${pos2.y}, ${pos2.left} ${pos2.y}" fill="none" stroke="#2563EB" stroke-width="1.75" stroke-linecap="round" marker-end="url(#arrow-${diagramId})"/>`;
      }
    });
  }

  return `<figure class="engineering-schematic-figure" style="margin:2rem 0;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:1.5rem 1rem;overflow-x:auto;">
<svg role="img" aria-labelledby="${titleId} ${descId}" viewBox="0 0 ${totalWidth} ${totalHeight}" style="width:100%;max-width:${totalWidth}px;height:auto;display:block;margin:0 auto;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<title id="${titleId}">${escapeHtml(diagramTitle)}</title>
<desc id="${descId}">${escapeHtml(diagramDesc)}</desc>
<defs>
<marker id="arrow-${diagramId}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
<path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2563EB"/>
</marker>
</defs>
${svgContent}
</svg>
<figcaption style="margin-top:1rem;font-size:0.85rem;color:#475569;text-align:center;font-weight:500;">
<strong>Figure:</strong> ${escapeHtml(diagramTitle)}
</figcaption>
</figure>`;
}

async function generateBlogOgImage(coverUrl, slug) {
  if (!coverUrl) return null;
  const ogDistDir = path.resolve(process.cwd(), "dist", "og", "blogs");
  if (!fs.existsSync(ogDistDir)) fs.mkdirSync(ogDistDir, { recursive: true });

  const distFile = path.join(ogDistDir, `${slug}.jpg`);

  try {
    if (fs.existsSync(distFile) && fs.statSync(distFile).size > 1000) {
      return `${SITE_URL}/og/blogs/${slug}.jpg`;
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
    return `${SITE_URL}/og/blogs/${slug}.jpg`;
  } catch (err) {
    console.warn(`Failed to generate OG image for blog ${slug}:`, err.message);
    return null;
  }
}

export async function prerenderBlogs() {
  const distDir = path.resolve(process.cwd(), "dist");
  const templatePath = fs.existsSync(path.join(distDir, "template.html"))
    ? path.join(distDir, "template.html")
    : path.join(distDir, "index.html");

  if (!fs.existsSync(templatePath)) {
    console.warn("️ [SSG Prerender Blogs] dist/index.html not found. Run 'vite build' first.");
    return;
  }

  const baseHtml = fs.readFileSync(templatePath, "utf-8");

  let blogs = DEMO_BLOGS;

  if (SUPABASE_URL && SUPABASE_KEY) {
    console.log("[SSG Prerender Blogs] Fetching live published blogs from Supabase for static HTML generation...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase
      .from("blogs")
      .select("id, slug, title, category, excerpt, content, cover_image_url, cover_image_alt, author_id, author_name, author_role, author_avatar, faq_items, bluf_summary, geo_scope, tags, engineering_standards, is_featured, canonical_url, related_service_url, reviewed_by, meta_title, meta_description, reading_time_minutes, status, published_at, updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      blogs = data;
    } else if (error) {
      console.warn("[SSG Prerender Blogs] Supabase fetch notice, using built-in demo articles:", error.message);
    }
  } else {
    console.log("[SSG Prerender Blogs] No Supabase env found; prerendering built-in demo engineering articles.");
  }

  console.log(`[SSG Prerender Blogs] Found ${blogs.length} published blogs. Generating static pages...`);

  const ogImageMap = new Map();
  await Promise.all(
    blogs.map(async (blog) => {
      const coverUrl = blog.cover_image_url || "";
      const ogUrl = await generateBlogOgImage(coverUrl, blog.slug);
      ogImageMap.set(blog.slug, ogUrl || `${SITE_URL}/og/blog.jpg`);
    })
  );

  const hubTitle = "Engineering Blog & Technical Publications | Structura Studio";
  const hubDesc = "Technical structural engineering whitepapers, ductile detailing rules, transparent BOQ benchmarks, and building envelope insights by Structura Architecture & Construction.";
  const hubCanonical = `${SITE_URL}/blog`;
  const hubOgImage = `${SITE_URL}/og/blog.jpg`;

  let hubHtml = baseHtml;
  hubHtml = hubHtml.replace(/<!-- Structured Data:[\s\S]*?<\/script>/gi, "");
  hubHtml = hubHtml.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");
  hubHtml = hubHtml.replace(/<title[\s\S]*?<\/title>/i, `<title data-rh="true">${escapeHtml(hubTitle)}</title>`);
  hubHtml = hubHtml.replace(/<meta[^>]*name="description"[\s\S]*?>/i, `<meta data-rh="true" name="description" content="${escapeHtml(hubDesc)}" />`);

  const hubHreflangTags = `
  <link data-rh="true" rel="canonical" href="${hubCanonical}" />`;
  hubHtml = hubHtml.replace(/<link[^>]*rel="canonical"[\s\S]*?>/i, hubHreflangTags.trim());

  hubHtml = hubHtml.replace(/<meta[^>]*property="og:title"[\s\S]*?>/i, `<meta data-rh="true" property="og:title" content="${escapeHtml(hubTitle)}" />`);
  hubHtml = hubHtml.replace(/<meta[^>]*property="og:description"[\s\S]*?>/i, `<meta data-rh="true" property="og:description" content="${escapeHtml(hubDesc)}" />`);

  hubHtml = hubHtml.replace(/<meta[^>]*property="og:image[^"]*"[\s\S]*?>\r?\n?/gi, "");
  hubHtml = hubHtml.replace(/<meta[^>]*name="twitter:image[^"]*"[\s\S]*?>\r?\n?/gi, "");

  const hubOgTags = `
  <meta data-rh="true" property="og:image" content="${hubOgImage}" />
  <meta data-rh="true" property="og:image:secure_url" content="${hubOgImage}" />
  <meta data-rh="true" property="og:image:type" content="image/jpeg" />
  <meta data-rh="true" property="og:image:width" content="1200" />
  <meta data-rh="true" property="og:image:height" content="630" />
  <meta data-rh="true" property="og:image:alt" content="Structura Engineering Publications and Technical Guides" />`;

  hubHtml = hubHtml.replace(/<meta[^>]*property="og:url"[\s\S]*?>/i, `${hubOgTags.trim()}\n  <meta data-rh="true" property="og:url" content="${hubCanonical}" />`);
  hubHtml = hubHtml.replace(/<meta[^>]*property="og:type"[\s\S]*?>/i, `<meta data-rh="true" property="og:type" content="website" />`);
  hubHtml = hubHtml.replace(/<meta[^>]*name="twitter:title"[\s\S]*?>/i, `<meta data-rh="true" name="twitter:title" content="${escapeHtml(hubTitle)}" />`);
  hubHtml = hubHtml.replace(/<meta[^>]*name="twitter:description"[\s\S]*?>/i, `<meta data-rh="true" name="twitter:description" content="${escapeHtml(hubDesc)}" />\n  <meta data-rh="true" name="twitter:image" content="${hubOgImage}" />`);

  const hubBlogItemsSchema = blogs.map((b, idx) => ({
    "@type": "BlogPosting",
    "position": idx + 1,
    "headline": b.title,
    "description": b.excerpt || b.meta_description || b.title,
    "url": b.canonical_url || `${SITE_URL}/blog/${b.slug}`,
    "datePublished": formatToIstOffset(b.published_at),
    "dateModified": formatToIstOffset(b.updated_at || b.published_at),
    "image": b.cover_image_url || hubOgImage,
    "author": {
      "@type": "Person",
      "name": b.author_name || "Structura Engineering Team",
      "jobTitle": b.author_role || "Engineering Leadership",
      "worksFor": {
        "@type": "Organization",
        "name": "Structura Architecture & Construction"
      }
    }
  }));

  const hubGraphSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${hubCanonical}#webpage`,
        "url": hubCanonical,
        "name": hubTitle,
        "description": hubDesc,
        "isPartOf": {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          "name": "Structura Architecture & Construction",
          "url": SITE_URL
        },
        "about": {
          "@type": "Thing",
          "name": "Architecture, Structural and Construction Engineering Publications"
        }
      },
      {
        "@type": "ItemList",
        "@id": `${hubCanonical}#itemlist`,
        "name": "Structura Engineering Publications",
        "itemListElement": hubBlogItemsSchema
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${hubCanonical}#breadcrumbs`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
          { "@type": "ListItem", "position": 2, "name": "Articles", "item": hubCanonical }
        ]
      }
    ]
  };

  const hubSchemaScript = `
  <!-- Structured Data: Blog Hub Collection & Knowledge Graph -->
  <script type="application/ld+json">
${JSON.stringify(hubGraphSchema, null, 2)}
  </script>
</head>`;
  hubHtml = hubHtml.replace(/<\/head>/i, hubSchemaScript);

  const hubMainHtml = `
  <main id="main" style="max-width:1200px;margin:0 auto;padding:2rem 1.5rem;color:#09090B;">
    <header style="margin-bottom:3rem;text-align:center;">
      <h1 style="font-size:2.5rem;font-weight:800;letter-spacing:-0.03em;margin-bottom:1rem;color:#09090B;">Engineering Knowledge Base &amp; Publications</h1>
      <p style="font-size:1.15rem;color:#475569;max-width:720px;margin:0 auto;line-height:1.6;">${escapeHtml(hubDesc)}</p>
    </header>

    <section aria-label="Published Technical Guides" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:2rem;">
      ${blogs.map((b) => `
        <article style="border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;background:#FFFFFF;display:flex;flex-direction:column;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          ${b.cover_image_url ? `
          <div style="aspect-ratio:16/9;overflow:hidden;background:#F1F5F9;">
            <img src="${escapeHtml(b.cover_image_url)}" alt="${escapeHtml(b.cover_image_alt || b.title)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" />
          </div>
          ` : ""}
          <div style="padding:1.5rem;display:flex;flex-direction:column;flex:1;">
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;">
              <span style="font-size:0.75rem;font-weight:700;text-transform:uppercase;padding:0.2rem 0.5rem;background:#F1F5F9;color:#0F172A;border-radius:4px;">${escapeHtml(b.category)}</span>
              <span style="font-size:0.8rem;color:#64748B;">${b.reading_time_minutes || 3} min read</span>
            </div>
            <h2 style="font-size:1.25rem;font-weight:700;line-height:1.35;margin:0 0 0.75rem 0;">
              <a href="/blog/${escapeHtml(b.slug)}" style="color:#09090B;text-decoration:none;">${escapeHtml(b.title)}</a>
            </h2>
            <p style="font-size:0.95rem;color:#475569;line-height:1.55;margin:0 0 1.25rem 0;flex:1;">${escapeHtml((b.excerpt || b.meta_description || "").slice(0, 140))}...</p>
            <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid #F1F5F9;padding-top:1rem;margin-top:auto;font-size:0.85rem;color:#64748B;">
              <span>By ${escapeHtml(b.author_name)}</span>
              <a href="/blog/${escapeHtml(b.slug)}" style="color:#09090B;font-weight:600;text-decoration:none;">Read Guide &rarr;</a>
            </div>
          </div>
        </article>
      `).join("")}
    </section>
  </main>`;

  if (hubHtml.includes('<div id="root">')) {
    hubHtml = hubHtml.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">\n${hubMainHtml}\n</div>`);
  }
  if (hubHtml.includes("<noscript>")) {
    hubHtml = hubHtml.replace(/<noscript>[\s\S]*?<\/noscript>/i, "");
  }

  const hubTargetDir = path.join(distDir, "blog");
  if (!fs.existsSync(hubTargetDir)) fs.mkdirSync(hubTargetDir, { recursive: true });
  fs.writeFileSync(path.join(hubTargetDir, "index.html"), hubHtml, "utf-8");
  console.log("[SSG Prerender Blogs] Pre-rendered /blog/index.html (Blog Directory Hub)");

  let generatedPostCount = 0;

  for (const blog of blogs) {
    const slug = blog.slug || blog.id;
    const safeTitle = escapeHtml(blog.title || "Engineering Guide");
    const pageTitle = blog.meta_title ? escapeHtml(blog.meta_title) : `${blog.title} | Structura Journal`;
    const safeCategory = escapeHtml(blog.category || "Construction");
    const rawExcerpt = blog.meta_description || blog.excerpt || blog.title;
    const cleanExcerpt = rawExcerpt.replace(/<[^>]*>?/gm, "").trim();
    const metaDescription = escapeHtml(cleanExcerpt.slice(0, 160));
    const canonicalUrl = blog.canonical_url || `${SITE_URL}/blog/${slug}`;
    const markdownTwinUrl = `${SITE_URL}/blog/${slug}.md`;
    const safeCover = blog.cover_image_url || `${SITE_URL}/og/blog.jpg`;
    const imageAlt = escapeHtml(blog.cover_image_alt || `${safeTitle} - Structura Studio`);
    let ogImageUrl = ogImageMap.get(slug) || safeCover;
    if (ogImageUrl.endsWith(".webp") || ogImageUrl.includes(".webp?")) {
      ogImageUrl = `${SITE_URL}/og/blog.jpg`;
    }
    const pubDate = formatToIstOffset(blog.published_at);
    const modDate = formatToIstOffset(blog.updated_at || blog.published_at);

    const authorProfile = getAuthorProfile(blog.author_id || blog.author_name);
    const reviewerProfile = blog.reviewed_by ? getAuthorProfile(blog.reviewed_by) : null;
    const tags = Array.isArray(blog.tags) ? blog.tags : [];
    const standards = Array.isArray(blog.engineering_standards) ? blog.engineering_standards : [];
    const mergedKeywords = [...tags, ...standards].filter(Boolean);
    const geoScope = blog.geo_scope || "global";

    let rawFaq = [];
    if (Array.isArray(blog.faq_items)) {
      rawFaq = blog.faq_items;
    } else if (typeof blog.faq_items === "string") {
      try {
        rawFaq = JSON.parse(blog.faq_items);
      } catch {
        rawFaq = [];
      }
    }
    let validFaq = Array.isArray(rawFaq) ? rawFaq.filter((f) => f && f.question && f.answer) : [];

    if (validFaq.length === 0 && blog.content && /(?:^|\n)#{2,4}\s*(?:FAQ|Frequently Asked Questions)/i.test(blog.content)) {
      const faqRegex = /(?:^|\n)#{2,4}\s*(?:FAQ:?|Frequently Asked Questions:?)\s*([^\n\r]+)[\r\n]+([\s\S]*?)(?=(?:(?:^|\n)#{2,4}\s*(?:FAQ:?|Frequently Asked Questions:?))|$)/gi;
      let match;
      while ((match = faqRegex.exec(blog.content)) !== null) {
        const q = match[1].trim();
        const a = match[2].trim();
        if (q && a) {
          validFaq.push({ question: q, answer: a });
        }
      }
    }

    const bodyMarkdown = (blog.content || "")
      .replace(/(?:^|\n)#{2,4}\s*(?:FAQ:?|Frequently Asked Questions:?)\s*[^\n\r]*[\r\n]+[\s\S]*?(?=(?:^|\n)#{2,3}\s+(?!(?:FAQ|Frequently Asked Questions))|$)/gi, "")
      .trim();

    let parsedBodyHtml = "";
    try {
      const diagramMap = new Map();
      let diagramIdx = 0;
      const crawlerMarkdown = bodyMarkdown
        .replace(/```mermaid[\s\S]*?```/gi, (match) => {
          diagramIdx++;
          const placeholder = `<!-- NEI_MERMAID_DIAGRAM_PLACEHOLDER_${diagramIdx} -->`;
          const renderedSvg = renderMermaidSvg(match, `${slug}-${diagramIdx}`, blog.title);
          diagramMap.set(placeholder, renderedSvg);
          return `\n\n${placeholder}\n\n`;
        })
        .replace(/```chart[\s\S]*?```/gi, (match) => {
          diagramIdx++;
          const placeholder = `<!-- NEI_CHART_PLACEHOLDER_${diagramIdx} -->`;
          const renderedChart = renderChartSsrHtml(match);
          diagramMap.set(placeholder, renderedChart);
          return `\n\n${placeholder}\n\n`;
        });

      parsedBodyHtml = marked.parse(crawlerMarkdown);

      for (const [placeholder, svgMarkup] of diagramMap.entries()) {
        parsedBodyHtml = parsedBodyHtml
          .replace(`<p>${placeholder}</p>`, svgMarkup)
          .replace(placeholder, svgMarkup);
      }
    } catch {
      parsedBodyHtml = `<p>${escapeHtml(blog.content || "")}</p>`;
    }

    let inLanguage = "en";
    let spatialCoverage = undefined;

    if (geoScope === "regional") {
      inLanguage = "en-US";
      spatialCoverage = [{ "@type": "City", "name": "Design District" }];
    } else {
      inLanguage = "en-US";
    }

    const graphElements = [
      {
        "@type": ["TechArticle", "BlogPosting"],
        "@id": `${canonicalUrl}#article`,
        "url": canonicalUrl,
        "headline": blog.title,
        "description": cleanExcerpt,
        "abstract": blog.bluf_summary || cleanExcerpt,
        "datePublished": pubDate,
        "dateModified": modDate,
        "inLanguage": inLanguage,
        "articleSection": blog.category,
        "proficiencyLevel": "Expert",
        "isAccessibleForFree": true,
        "wordCount": (blog.content || "").split(/\s+/).filter(Boolean).length,
        "timeRequired": `PT${blog.reading_time_minutes || 3}M`,
        "license": `${SITE_URL}/terms`,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": canonicalUrl,
          "primaryImageOfPage": {
            "@type": "ImageObject",
            "@id": `${canonicalUrl}#primaryimage`,
            "url": blog.cover_image_url || ogImageUrl,
            "contentUrl": blog.cover_image_url || ogImageUrl,
            "caption": imageAlt,
            "width": 1200,
            "height": 675
          }
        },
        "image": [
          blog.cover_image_url,
          ogImageUrl
        ].filter(Boolean),
        ...(spatialCoverage ? { spatialCoverage } : {}),
        ...(mergedKeywords.length > 0 ? { "keywords": mergedKeywords.join(", ") } : {}),
        ...(standards.length > 0
          ? {
            "about": standards.map((std) => ({
              "@type": "Thing",
              "name": std
            }))
          }
          : {}),
        ...(tags.length > 0
          ? {
            "mentions": tags.map((t) => ({
              "@type": "Thing",
              "name": t
            }))
          }
          : {}),
        "speakable": {
          "@type": "SpeakableSpecification",
          "cssSelector": ["h1", ".app-bluf-summary", "article > header > p"]
        },
        "author": {
          "@type": "Person",
          "@id": `${SITE_URL}/about#${authorProfile.id}`,
          "name": (authorProfile.name || "").replace(/^Er\.\s+/i, ""),
          "jobTitle": authorProfile.role,
          "description": authorProfile.bio,
          "image": authorProfile.avatar,
          "worksFor": {
            "@type": "Organization",
            "@id": `${SITE_URL}/#organization`,
            "name": "Structura Architecture & Construction"
          }
        },
        ...(reviewerProfile
          ? {
            "reviewedBy": {
              "@type": "Person",
              "@id": `${SITE_URL}/about#${reviewerProfile.id}`,
              "name": reviewerProfile.name,
              "jobTitle": reviewerProfile.role,
              "description": reviewerProfile.bio,
              "image": reviewerProfile.avatar,
              "worksFor": {
                "@type": "Organization",
                "@id": `${SITE_URL}/#organization`,
                "name": "Structura Architecture & Construction"
              }
            }
          }
          : {}),
        "publisher": {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          "name": "Structura Architecture & Construction",
          "url": SITE_URL,
          "logo": {
            "@type": "ImageObject",
            "url": `${SITE_URL}/logo.svg`
          }
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumbs`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
          { "@type": "ListItem", "position": 2, "name": "Articles", "item": `${SITE_URL}/blog` },
          { "@type": "ListItem", "position": 3, "name": blog.title, "item": canonicalUrl }
        ]
      }
    ];

    // 2026 Schema rules: FAQPage rich results deprecated by Google; omit FAQPage schema

    const postSchema = {
      "@context": "https://schema.org",
      "@graph": graphElements
    };

    let postHtml = baseHtml;
    postHtml = postHtml.replace(/<!-- Structured Data:[\s\S]*?<\/script>/gi, "");
    postHtml = postHtml.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");

    postHtml = postHtml.replace(/<title[\s\S]*?<\/title>/i, `<title data-rh="true">${pageTitle}</title>`);
    postHtml = postHtml.replace(/<meta[^>]*name="description"[\s\S]*?>/i, `<meta data-rh="true" name="description" content="${metaDescription}" />`);

    const hreflangTags = `
  <link data-rh="true" rel="canonical" href="${canonicalUrl}" />
  <link rel="alternate" type="text/markdown" href="${markdownTwinUrl}" title="${safeTitle} (Markdown)" />`;

    postHtml = postHtml.replace(/<link[^>]*rel="canonical"[\s\S]*?>/i, hreflangTags.trim());

    postHtml = postHtml.replace(/<meta[^>]*property="og:image[^"]*"[\s\S]*?>\r?\n?/gi, "");
    postHtml = postHtml.replace(/<meta[^>]*name="twitter:image[^"]*"[\s\S]*?>\r?\n?/gi, "");

    postHtml = postHtml.replace(/<meta[^>]*property="og:title"[\s\S]*?>/i, `<meta data-rh="true" property="og:title" content="${pageTitle}" />`);
    postHtml = postHtml.replace(/<meta[^>]*property="og:description"[\s\S]*?>/i, `<meta data-rh="true" property="og:description" content="${metaDescription}" />`);

    let cleanOgUrl = ogImageUrl;
    if (cleanOgUrl.endsWith(".webp") || cleanOgUrl.includes(".webp?")) {
      cleanOgUrl = `${SITE_URL}/og/blog.jpg`;
    }
    const isPng = cleanOgUrl.endsWith(".png");
    const ogMime = isPng ? "image/png" : "image/jpeg";
    const ogImageTags = `
  <meta data-rh="true" property="og:image" content="${cleanOgUrl}" />
  <meta data-rh="true" property="og:image:secure_url" content="${cleanOgUrl}" />
  <meta data-rh="true" property="og:image:type" content="${ogMime}" />
  <meta data-rh="true" property="og:image:width" content="1200" />
  <meta data-rh="true" property="og:image:height" content="630" />
  <meta data-rh="true" property="og:image:alt" content="${imageAlt}" />`;

    postHtml = postHtml.replace(/<meta[^>]*property="og:url"[\s\S]*?>/i, `${ogImageTags.trim()}\n  <meta data-rh="true" property="og:url" content="${canonicalUrl}" />`);
    postHtml = postHtml.replace(/<meta[^>]*property="og:type"[\s\S]*?>/i, `<meta data-rh="true" property="og:type" content="article" />\n  <meta property="article:published_time" content="${pubDate}" />\n  <meta property="article:modified_time" content="${modDate}" />\n  <meta property="article:section" content="${safeCategory}" />\n  <meta property="article:author" content="${escapeHtml(authorProfile.name)}" />`);

    postHtml = postHtml.replace(/<meta[^>]*name="twitter:card"[\s\S]*?>/i, `<meta data-rh="true" name="twitter:card" content="summary_large_image" />`);
    postHtml = postHtml.replace(/<meta[^>]*name="twitter:title"[\s\S]*?>/i, `<meta data-rh="true" name="twitter:title" content="${pageTitle}" />`);
    postHtml = postHtml.replace(/<meta[^>]*name="twitter:description"[\s\S]*?>/i, `<meta data-rh="true" name="twitter:description" content="${metaDescription}" />\n  <meta data-rh="true" name="twitter:image" content="${cleanOgUrl}" />\n  <meta data-rh="true" name="twitter:image:alt" content="${imageAlt}" />`);

    const hydrationData = {
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      category: blog.category,
      excerpt: blog.excerpt,
      content: blog.content,
      cover_image_url: blog.cover_image_url,
      cover_image_alt: blog.cover_image_alt,
      author_id: authorProfile.id,
      author_name: authorProfile.name,
      author_role: authorProfile.role,
      author_avatar: authorProfile.avatar,
      faq_items: validFaq,
      bluf_summary: blog.bluf_summary || "",
      geo_scope: geoScope,
      tags: tags,
      engineering_standards: standards,
      is_featured: Boolean(blog.is_featured),
      canonical_url: canonicalUrl,
      related_service_url: blog.related_service_url || "/services",
      reviewed_by: blog.reviewed_by || null,
      meta_title: blog.meta_title,
      meta_description: blog.meta_description,
      reading_time_minutes: blog.reading_time_minutes || 3,
      published_at: blog.published_at,
      updated_at: blog.updated_at,
    };

    const schemaScript = `
  <!-- Structured Data: TechArticle Knowledge Graph & FAQ -->
  <script type="application/ld+json">
${JSON.stringify(postSchema, null, 2)}
  </script>
  <!-- Pre-hydrated Blog Post Data for Zero-Latency React Mounting -->
  <script>
    window.__INITIAL_BLOG_DATA__ = ${JSON.stringify(hydrationData)};
  </script>
</head>`;
    postHtml = postHtml.replace(/<\/head>/i, schemaScript);

    const faqSectionHtml = validFaq.length > 0 ? `
      <section style="margin:2.5rem 0;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:1.5rem;">
        <h2 style="font-size:1.35rem;font-weight:700;color:#09090B;margin-top:0;margin-bottom:1rem;">Frequently Asked Technical Questions</h2>
        ${validFaq.map((f) => `
          <div style="margin-bottom:1.25rem;border-bottom:1px solid #E2E8F0;padding-bottom:1rem;">
            <h3 style="font-size:1.05rem;font-weight:700;color:#0F172A;margin:0 0 0.4rem 0;">${escapeHtml(f.question)}</h3>
            <p style="color:#475569;margin:0;line-height:1.6;">${escapeHtml(f.answer)}</p>
          </div>
        `).join("")}
      </section>
    ` : "";

    const postMainHtml = `
    <main id="main" style="max-width:960px;margin:0 auto;padding:2.5rem 1.5rem;color:#09090B;">
      <article>
        <nav aria-label="Breadcrumb" style="font-size:0.875rem;color:#64748B;margin-bottom:1.5rem;">
        <a href="/" style="color:inherit;text-decoration:none;">Home</a> / 
        <a href="/blog" style="color:inherit;text-decoration:none;">Blog</a> / 
        <strong style="color:#09090B;">${safeTitle}</strong>
      </nav>

      <header style="margin-bottom:2.5rem;">
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
          <span style="display:inline-block;padding:0.25rem 0.65rem;background:#0F172A;color:#FFFFFF;border-radius:4px;font-size:0.75rem;font-weight:700;text-transform:uppercase;">${safeCategory}</span>
          <span style="font-size:0.85rem;color:#64748B;">${blog.reading_time_minutes || 3} min read</span>
          ${geoScope !== "global" ? `<span style="font-size:0.75rem;font-weight:700;text-transform:uppercase;padding:0.2rem 0.5rem;background:#FEF3C7;color:#92400E;border-radius:4px;">${geoScope}</span>` : ""}
        </div>
        <h1 style="font-size:clamp(2rem, 4vw, 3rem);font-weight:800;letter-spacing:-0.03em;line-height:1.2;margin:0 0 1rem 0;color:#09090B;">${safeTitle}</h1>
        ${blog.bluf_summary ? `<div class="app-bluf-summary" style="padding:1rem 1.25rem;background:#EFF6FF;border-left:4px solid #2563EB;border-radius:6px;margin-bottom:1.5rem;color:#1E3A8A;font-weight:500;line-height:1.6;"><strong>BLUF Summary:</strong> ${escapeHtml(blog.bluf_summary)}</div>` : ""}
        <p style="font-size:1.15rem;color:#475569;line-height:1.6;margin:0 0 1.5rem 0;">${escapeHtml(cleanExcerpt)}</p>

        <div style="display:flex;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #E2E8F0;border-bottom:1px solid #E2E8F0;">
          <img src="${authorProfile.avatar || `${SITE_URL}/logo.svg`}" alt="${escapeHtml(authorProfile.name)}" width="48" height="48" style="border-radius:50%;object-fit:cover;border:1px solid #CBD5E1;" />
          <div>
            <div style="font-weight:700;color:#09090B;">${escapeHtml(authorProfile.name)}</div>
            <div style="font-size:0.85rem;color:#64748B;">${escapeHtml(authorProfile.role)} • Published <time datetime="${pubDate}">${new Date(pubDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</time></div>
          </div>
        </div>

        ${blog.cover_image_url ? `
        <figure style="margin:2rem 0;border-radius:10px;overflow:hidden;border:1px solid #E2E8F0;">
          <img src="${escapeHtml(blog.cover_image_url)}" alt="${imageAlt}" width="1200" height="675" style="width:100%;max-height:600px;object-fit:cover;display:block;" loading="eager" decoding="async" />
          ${blog.cover_image_alt ? `<figcaption style="padding:0.6rem 1rem;background:#F8FAFC;color:#64748B;font-size:0.85rem;font-style:italic;">${imageAlt}</figcaption>` : ""}
        </figure>
        ` : ""}
      </header>

      <section class="app-article-body" style="line-height:1.8;font-size:1.05rem;color:#18181B;">
        ${parsedBodyHtml}
      </section>

      ${faqSectionHtml}

      <div style="margin:2.5rem 0;padding:1.5rem;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;">
        <h3 style="margin-top:0;font-size:1.15rem;font-weight:700;color:#09090B;">Reviewed by Technical Engineering Leadership</h3>
        <p style="color:#475569;margin-bottom:0;line-height:1.6;font-size:0.95rem;">
          This technical publication is authored by <strong>${escapeHtml(authorProfile.name)}</strong> (${escapeHtml(authorProfile.role)})${reviewerProfile ? ` and reviewed by <strong>${escapeHtml(reviewerProfile.name)}</strong> (${escapeHtml(reviewerProfile.role)})` : ""}, adhering to ${standards.length > 0 ? standards.join(", ") : "modern structural and energy building codes"}.
        </p>
      </div>

      <div style="margin:2.5rem 0;text-align:center;">
        <a href="/blog" style="display:inline-block;padding:0.75rem 1.5rem;background:#09090B;color:#FFFFFF;border-radius:6px;text-decoration:none;font-weight:600;font-size:0.95rem;">&larr; Back to All Engineering Guides</a>
      </div>
    </article>
  </main>`;

    if (postHtml.includes('<div id="root">')) {
      postHtml = postHtml.replace(
        /<div id="root">[\s\S]*?<\/div>/i,
        `<div id="root">\n${postMainHtml}\n</div>`
      );
    }
    if (postHtml.includes("<noscript>")) {
      postHtml = postHtml.replace(/<noscript>[\s\S]*?<\/noscript>/i, "");
    }

    const postTargetDir = path.join(distDir, "blog", slug);
    if (!fs.existsSync(postTargetDir)) fs.mkdirSync(postTargetDir, { recursive: true });
    fs.writeFileSync(path.join(postTargetDir, "index.html"), postHtml, "utf-8");

    if (blog.id && blog.id !== slug) {
      const idDir = path.join(distDir, "blog", blog.id);
      if (!fs.existsSync(idDir)) fs.mkdirSync(idDir, { recursive: true });
      fs.writeFileSync(path.join(idDir, "index.html"), postHtml, "utf-8");
    }

    const reviewerName = reviewerProfile ? `${reviewerProfile.name} (${reviewerProfile.role})` : "Marcus Patel (Director of Construction & Field QA)";
    const engineeringCodes = standards.length > 0 ? standards.join(", ") : "ACI 318, Eurocode 8, ASHRAE 90.1";
    const tagsList = tags.length > 0 ? tags.join(", ") : blog.category;

    const markdownTwinContent = `# ${blog.title}

> **BLUF (Bottom Line Up Front) Executive Summary:**
> ${blog.bluf_summary || cleanExcerpt}

---
- **Canonical Publication URL:** ${canonicalUrl}
- **Published Date:** ${new Date(pubDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
- **Last Modified:** ${new Date(modDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
- **Primary Domain & Category:** ${blog.category}
- **Target Scope:** ${geoScope.toUpperCase()}
- **Lead Author:** ${authorProfile.name} (${authorProfile.role})
- **Technical Reviewer:** ${reviewerName}
- **Engineering Standards Cited:** ${engineeringCodes}
- **Technical Keywords & Entities:** ${tagsList}
- **Related Service:** ${SITE_URL}${blog.related_service_url || "/services"}
- **Publisher:** Structura Architecture & Construction (${SITE_URL})
---

${bodyMarkdown}

${validFaq.length > 0 ? `## Frequently Asked Technical Questions\n\n` + validFaq.map((f) => `### Q: ${f.question}\n**A:** ${f.answer}\n`).join("\n") : ""}
`;

    fs.writeFileSync(path.join(distDir, "blog", `${slug}.md`), markdownTwinContent, "utf-8");
    if (blog.id && blog.id !== slug) {
      fs.writeFileSync(path.join(distDir, "blog", `${blog.id}.md`), markdownTwinContent, "utf-8");
    }

    generatedPostCount++;
  }

  console.log(`[SSG Prerender Blogs] Pre-rendered ${generatedPostCount} static HTML pages and .md twins in dist/blog/`);

  const publicDir = path.resolve(process.cwd(), "public");
  for (const dirPath of [distDir, publicDir]) {
    for (const staleFile of ["llms.txt", "llms-full.txt"]) {
      const target = path.join(dirPath, staleFile);
      if (fs.existsSync(target)) {
        try { fs.unlinkSync(target); } catch { }
      }
    }
  }

  const indexNowKey = process.env.INDEXNOW_KEY?.trim();
  if (indexNowKey && process.env.VITE_SITE_URL) {
    try {
      fs.writeFileSync(path.join(distDir, `${indexNowKey}.txt`), indexNowKey, "utf-8");
      console.log(`[IndexNow] Generated key verification file at dist/${indexNowKey}.txt`);
    } catch (err) {
      console.warn("[IndexNow] Key file generation notice:", err.message);
    }
  }
}

prerenderBlogs();
