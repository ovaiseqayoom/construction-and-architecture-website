import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
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

function cleanCdata(text = "") {
  return String(text || "").replace(/\]\]>/g, "]]&gt;").trim();
}

function getMimeType(url = "") {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".svg")) return "image/svg+xml";
  return "image/webp";
}

export function buildRssXml(projects = []) {
  const now = new Date().toUTCString();

  const itemsXml = projects
    .map((project) => {
      const slug = project.slug || `project-${project.id}`;
      const projectUrl = `${SITE_URL}/projects/${slug}`;
      const title = project.title || "Architectural Project";

      let coverUrl = "";
      if (project.cover_image) {
        coverUrl = typeof project.cover_image === "string" ? project.cover_image : project.cover_image.url || "";
      }
      if (!coverUrl) coverUrl = "/images/projects-hero.svg";
      if (coverUrl.startsWith("/")) coverUrl = `${SITE_URL}${coverUrl}`;

      const pubDate = project.created_at ? new Date(project.created_at).toUTCString() : now;
      const mimeType = getMimeType(coverUrl);
      const category = project.category || "Architecture";
      const summary = (project.summary || project.description || "").replace(/<[^>]*>/g, "").trim();
      const hashtags = Array.isArray(project.hashtags) ? project.hashtags : [];

      return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${projectUrl}</link>
      <guid isPermaLink="true">${projectUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(category)}</category>
      <description><![CDATA[${cleanCdata(summary)}]]></description>
      <enclosure url="${escapeXml(coverUrl)}" length="0" type="${mimeType}" />
      <media:content url="${escapeXml(coverUrl)}" medium="image" type="${mimeType}">
        <media:title><![CDATA[${cleanCdata(title)}]]></media:title>
        <media:description><![CDATA[${cleanCdata(summary)}]]></media:description>
      </media:content>
      <content:encoded><![CDATA[<p>${escapeXml(summary)}</p><p><img src="${escapeXml(coverUrl)}" alt="${escapeXml(title)}" /></p>${hashtags.length > 0 ? `<p>${escapeXml(hashtags.join(" "))}</p>` : ""}]]></content:encoded>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Structura Architecture &amp; Construction - Portfolio Feed</title>
    <link>${SITE_URL}/projects</link>
    <description>Architectural design, structural engineering, and turnkey construction case studies.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/studio-og-1200x630.png</url>
      <title>Structura Architecture &amp; Construction</title>
      <link>${SITE_URL}/projects</link>
    </image>
${itemsXml}
  </channel>
</rss>
`;
}

async function run() {
  const publicDir = path.resolve(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const outputPath = path.join(publicDir, "feed.xml");

  let projects = DEMO_PROJECTS;

  if (SUPABASE_URL && SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
      });

      const { data, error } = await supabase
        .from("projects")
        .select("id, slug, title, summary, description, location, category, cover_image, hashtags, created_at")
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (!error && data?.length) {
        projects = data;
      }
    } catch (err) {
      console.warn("[RSS] Falling back to demo projects:", err.message);
    }
  }

  fs.writeFileSync(outputPath, buildRssXml(projects), "utf-8");
  console.log(`[RSS] Generated public/feed.xml with ${projects.length} items.`);
}

run();
