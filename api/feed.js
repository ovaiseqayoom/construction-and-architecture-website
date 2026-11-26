// api/feed.js
import fs from "node:fs";
import path from "node:path";
import {
  SITE_URL,
  getSupabaseClient,
  escapeXml,
  cleanCdata,
  getMimeType,
  extractCoverImageUrl,
  buildPinterestDescription,
} from "./_shared.js";

function buildRssXml(projects = []) {
  const now = new Date().toUTCString();

  const itemsXml = projects.map((project) => {
    const slug = project.slug || `project-${project.id}`;
    const projectUrl = `${SITE_URL}/projects/${slug}`;
    const title = project.title || "Turnkey Engineering Project";

    const { fullDescription, imageDescription, conceptOverview, topics, hashtags } = buildPinterestDescription(project);

    let coverUrl = extractCoverImageUrl(project.cover_image);
    if (!coverUrl) {
      coverUrl = `${SITE_URL}/studio-og-1200x630.png`;
    }

    const pubDate = project.created_at ? new Date(project.created_at).toUTCString() : now;
    const mimeType = getMimeType(coverUrl);
    const category = project.category || "Architecture";

    const categoriesXml = [
      `<category>${escapeXml(category)}</category>`,
      ...topics.map((t) => `<category>${escapeXml(t)}</category>`),
    ].join("\n      ");

    return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${projectUrl}</link>
      <guid isPermaLink="true">${projectUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      ${categoriesXml}
      <description><![CDATA[${cleanCdata(fullDescription)}]]></description>
      <enclosure url="${coverUrl}" length="0" type="${mimeType}" />
      <media:content url="${coverUrl}" medium="image" type="${mimeType}">
        <media:title><![CDATA[${cleanCdata(title)}]]></media:title>
        <media:description><![CDATA[${cleanCdata(imageDescription)}]]></media:description>
      </media:content>
      <content:encoded><![CDATA[<p>${escapeXml(conceptOverview)}</p><p><img src="${coverUrl}" alt="${escapeXml(title)}" /></p>${hashtags.length > 0 ? `<p>${escapeXml(hashtags.join(" "))}</p>` : ""}]]></content:encoded>
    </item>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Structura Architecture &amp; Construction - Projects &amp; Architecture</title>
    <link>${SITE_URL}/projects</link>
    <description>Latest structural engineering, architectural design, turnkey construction, and commercial developments by Structura Architecture &amp; Construction.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
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

function getFallbackXml() {
  try {
    const staticFeedPath = path.resolve(process.cwd(), "public", "feed.xml");
    if (fs.existsSync(staticFeedPath)) {
      return fs.readFileSync(staticFeedPath, "utf-8");
    }
  } catch (err) {
    console.error("[Feed API] Failed to read static fallback feed:", err.message);
  }
  return buildRssXml([]);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).send("Method Not Allowed");
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const fetchPromise = supabase
        .from("projects")
        .select("id, slug, title, summary, description, location, category, cover_image, created_at")
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Supabase query timeout")), 5000)
      );

      const { data: projects, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) throw error;

      if (projects && projects.length > 0) {
        const xml = buildRssXml(projects);
        return res.status(200).send(xml);
      }
    } catch (err) {
      console.warn("[Feed API] Supabase query failed, falling back to static feed:", err.message);
    }
  }

  const fallbackXml = getFallbackXml();
  return res.status(200).send(fallbackXml);
}
