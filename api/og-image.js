// api/og-image.js
import sharp from "sharp";
import {
  SITE_URL,
  getSupabaseClient,
  extractCoverImageUrl,
  lookupProject,
  lookupBlog,
} from "./_shared.js";

const FALLBACK_OG_IMAGE = `${SITE_URL}/studio-og-1200x630.png`;
const SITE_HOST = (() => {
  try {
    return new URL(SITE_URL).hostname.toLowerCase();
  } catch {
    return "example.com";
  }
})();
const ALLOWED_IMAGE_HOSTS = [
  SITE_HOST,
  SITE_HOST.replace(/^www\./, ""),
  ...(SITE_HOST.startsWith("www.") ? [] : [`www.${SITE_HOST}`]),
];

function isAllowedCdnUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return (
      ALLOWED_IMAGE_HOSTS.includes(host) ||
      host.endsWith(".supabase.co")
    );
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  const { slug, type } = req.query;

  if (!slug) {
    return res.redirect(302, FALLBACK_OG_IMAGE);
  }

  const cleanSlug = String(slug)
    .split("?")[0]
    .split("#")[0]
    .replace(/\.jpg$/i, "")
    .replace(/\.jpeg$/i, "")
    .replace(/\.png$/i, "")
    .replace(/\.webp$/i, "")
    .trim()
    .replace(/\/$/, "");

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.redirect(302, FALLBACK_OG_IMAGE);
  }

  try {
    let coverUrl = "";
    if (type === "blog") {
      const blog = await lookupBlog(supabase, cleanSlug, "cover_image_url, title, slug");
      coverUrl = blog?.cover_image_url || "";
    } else {
      const project = await lookupProject(supabase, cleanSlug, "cover_image, title, slug");
      coverUrl = extractCoverImageUrl(project?.cover_image);
      if (!coverUrl && !project) {
        const blog = await lookupBlog(supabase, cleanSlug, "cover_image_url, title, slug");
        coverUrl = blog?.cover_image_url || "";
      }
    }

    if (!coverUrl || !isAllowedCdnUrl(coverUrl)) {
      return res.redirect(302, FALLBACK_OG_IMAGE);
    }

    const imgResp = await fetch(coverUrl, { signal: AbortSignal.timeout(6000) });
    if (!imgResp.ok) {
      return res.redirect(302, FALLBACK_OG_IMAGE);
    }

    const rawBuffer = Buffer.from(await imgResp.arrayBuffer());
    const jpegBuffer = await sharp(rawBuffer)
      .resize(1200, 630, { fit: "cover", position: "center" })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).send(jpegBuffer);
  } catch (err) {
    console.error("[OG Image Handler Error]:", err.message);
    return res.redirect(302, FALLBACK_OG_IMAGE);
  }
}
