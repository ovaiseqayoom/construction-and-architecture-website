// api/_shared.js
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

export const SITE_URL = (process.env.VITE_SITE_URL || process.env.SITE_URL || "https://example.com").replace(/\/$/, "");

let envLoaded = false;
let cachedSupabase = null;

export function safeInlineJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function cleanEnvVal(val) {
  if (!val) return "";
  let clean = String(val).trim();
  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'"))
  ) {
    clean = clean.slice(1, -1).trim();
  }
  return clean;
}

export function loadEnv() {
  if (envLoaded) return;
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      try {
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
      } catch {
      }
    }
  }
  envLoaded = true;
}

export function getSupabaseConfig() {
  loadEnv();
  const url = cleanEnvVal(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const key = cleanEnvVal(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY
  );
  return { url, key };
}

export function getSupabaseClient() {
  if (cachedSupabase) return cachedSupabase;
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  try {
    cachedSupabase = createClient(url, key, {
      auth: { persistSession: false },
    });
    return cachedSupabase;
  } catch (err) {
    console.error("[Supabase Client] Init error:", err);
    return null;
  }
}

export function escapeXml(unsafe = "") {
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

export function escapeHtml(unsafe = "") {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function cleanCdata(text = "") {
  return String(text || "").replace(/\]\]>/g, "]]&gt;").trim();
}

export function getMimeType(url = "") {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".svg")) return "image/svg+xml";
  return "image/webp";
}

export function extractCoverImageUrl(coverImage) {
  if (!coverImage) return "";
  if (typeof coverImage === "string") return coverImage;
  if (coverImage.url) return coverImage.url;
  return "";
}

export async function lookupProject(supabase, slug, selectFields = "*") {
  if (!supabase || !slug) return null;

  const cleanSlug = String(slug)
    .split("?")[0]
    .split("#")[0]
    .replace(/\.jpg$/i, "")
    .replace(/\.jpeg$/i, "")
    .replace(/\.png$/i, "")
    .replace(/\.webp$/i, "")
    .trim()
    .replace(/\/$/, "");

  let { data: project } = await supabase
    .from("projects")
    .select(selectFields)
    .eq("slug", cleanSlug)
    .maybeSingle();

  if (!project && cleanSlug.toLowerCase() !== cleanSlug) {
    const { data: byLower } = await supabase
      .from("projects")
      .select(selectFields)
      .eq("slug", cleanSlug.toLowerCase())
      .maybeSingle();
    project = byLower;
  }

  if (!project && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug)) {
    const { data: byId } = await supabase
      .from("projects")
      .select(selectFields)
      .eq("id", cleanSlug)
      .maybeSingle();
    project = byId;
  }

  if (!project) {
    const safePrefix = cleanSlug.replace(/[%_\\]/g, "\\$&");
    const { data: matches } = await supabase
      .from("projects")
      .select(selectFields)
      .ilike("slug", `${safePrefix}%`)
      .limit(1);
    if (matches && matches.length > 0) {
      project = matches[0];
    }
  }

  return project || null;
}

export async function lookupBlog(supabase, slug, selectFields = "*") {
  if (!supabase || !slug) return null;

  const cleanSlug = String(slug)
    .split("?")[0]
    .split("#")[0]
    .replace(/\.html$/i, "")
    .replace(/\.md$/i, "")
    .trim()
    .replace(/\/$/, "");

  let { data: blog } = await supabase
    .from("blogs")
    .select(selectFields)
    .eq("slug", cleanSlug)
    .eq("status", "published")
    .maybeSingle();

  if (!blog && cleanSlug.toLowerCase() !== cleanSlug) {
    const { data: byLower } = await supabase
      .from("blogs")
      .select(selectFields)
      .eq("slug", cleanSlug.toLowerCase())
      .eq("status", "published")
      .maybeSingle();
    blog = byLower;
  }

  if (!blog && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug)) {
    const { data: byId } = await supabase
      .from("blogs")
      .select(selectFields)
      .eq("id", cleanSlug)
      .eq("status", "published")
      .maybeSingle();
    blog = byId;
  }

  return blog || null;
}

export function getPinterestTopics(project = {}) {
  const cat = (project.category || "").toLowerCase();
  const title = (project.title || "").toLowerCase();

  const isInterior =
    cat.includes("interior") ||
    title.includes("kitchen") ||
    title.includes("interior") ||
    title.includes("wardrobe") ||
    title.includes("cabinetry");

  const topicSet = new Set();

  if (isInterior) {
    topicSet.add("Interior Design");
    topicSet.add("Modern Kitchen");
    topicSet.add("Modular Kitchen");
    topicSet.add("Home Decor");
    topicSet.add("Kitchen Cabinets");
    topicSet.add("Luxury Interiors");
  } else if (cat.includes("commercial")) {
    topicSet.add("Commercial Architecture");
    topicSet.add("Modern Building");
    topicSet.add("Turnkey Construction");
    topicSet.add("Structural Engineering");
  } else {
    topicSet.add("Architecture");
    topicSet.add("House Design");
    topicSet.add("Modern Home");
    topicSet.add("Home Exterior");
    topicSet.add("Villa Design");
    topicSet.add("Facade Design");
    topicSet.add("Residential Architecture");
  }

  return Array.from(topicSet);
}

export function getPinterestHashtags(project = {}) {
  const combined = `${project.description || ""} ${project.summary || ""} ${project.title || ""}`;
  const existingMatches = combined.match(/[#＃][a-zA-Z0-9_\u0600-\u06FF]+/g) || [];

  const seen = new Set();
  const tags = [];

  const addTag = (tag) => {
    if (!tag) return;
    const formatted = tag.startsWith("#") ? tag : `#${tag}`;
    const lower = formatted.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      tags.push(formatted);
    }
  };

  existingMatches.forEach(addTag);

  const cat = (project.category || "").toLowerCase();
  const title = (project.title || "").toLowerCase();
  const isInterior = cat.includes("interior") || title.includes("kitchen");

  if (isInterior) {
    [
      "#InteriorDesign",
      "#ModernKitchen",
      "#ModularKitchen",
      "#HomeDecor",
      "#KitchenInspiration",
      "#LuxuryInteriors",
      "#InteriorFitOut",
    ].forEach(addTag);
  } else {
    [
      "#Architecture",
      "#HouseDesign",
      "#ModernHome",
      "#VillaDesign",
      "#HomeElevation",
      "#FacadeDesign",
      "#AlpineArchitecture",
      "#ResidentialDesign",
    ].forEach(addTag);
  }

  addTag("#Structura");
  addTag("#ArchitecturalDesign");

  return tags.slice(0, 10);
}

export function buildPinterestDescription(project = {}) {
  let conceptOverview = (project.summary || "").trim();

  if (!conceptOverview && project.description) {
    const clean = project.description
      .replace(/<!--\s*HASHTAGS\s*-->[\s\S]*$/i, "")
      .replace(/(\n\s*#[a-zA-Z0-9_\u0600-\u06FF\s,#]+)+$/g, "")
      .trim();

    const paragraphs = clean.split(/\n\s*\n/);
    const conceptPara =
      paragraphs.find((p) => {
        const lower = p.toLowerCase();
        return (
          lower.includes("concept") ||
          lower.includes("architecture") ||
          lower.includes("design") ||
          lower.includes("vision") ||
          lower.includes("planning")
        );
      }) || paragraphs[0] || clean;

    conceptOverview = conceptPara.replace(/^([a-zA-Z\s&]+):\s*/, "");
  }

  if (!conceptOverview) {
    conceptOverview = `Architectural and structural engineering project in ${project.location || "Design District"} by Structura Architecture & Construction.`;
  }

  const topics = getPinterestTopics(project);
  const hashtags = getPinterestHashtags(project);

  const MAX_PINTEREST_CHARS = 800;

  const imageDescription = conceptOverview.slice(0, MAX_PINTEREST_CHARS).trim();

  let fullDescription = conceptOverview;
  if (hashtags.length > 0) {
    const combined = `${conceptOverview}\n\n${hashtags.join(" ")}`;
    if (combined.length <= MAX_PINTEREST_CHARS) {
      fullDescription = combined;
    } else {
      const room = MAX_PINTEREST_CHARS - conceptOverview.length - 2;
      if (room > 20) {
        let tagStr = "";
        for (const tag of hashtags) {
          if ((tagStr + " " + tag).trim().length <= room) {
            tagStr = (tagStr + " " + tag).trim();
          } else {
            break;
          }
        }
        fullDescription = tagStr ? `${conceptOverview}\n\n${tagStr}` : conceptOverview.slice(0, MAX_PINTEREST_CHARS).trim();
      } else {
        fullDescription = conceptOverview.slice(0, MAX_PINTEREST_CHARS).trim();
      }
    }
  } else if (fullDescription.length > MAX_PINTEREST_CHARS) {
    fullDescription = fullDescription.slice(0, MAX_PINTEREST_CHARS).trim();
  }

  return {
    fullDescription,
    conceptOverview,
    imageDescription,
    topics,
    hashtags,
  };
}

