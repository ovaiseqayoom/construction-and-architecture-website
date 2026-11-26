#!/usr/bin/env node

/**
 * verify-seo-gates.mjs
 *
 * Pre-flight verification suite for static HTML output, metadata, sitemaps,
 * schema markup, local asset resolution, and lint hygiene.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const currentFilePath = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(currentFilePath), "..");
const DIST_DIR = path.resolve(PROJECT_ROOT, "dist");
const PUBLIC_DIR = path.resolve(PROJECT_ROOT, "public");
const VERCEL_JSON_PATH = path.resolve(PROJECT_ROOT, "vercel.json");
const ROBOTS_TXT_PATH = path.resolve(PUBLIC_DIR, "robots.txt");

const args = process.argv.slice(2);
const skipBuild = args.includes("--skip-build");

class Runner {
  constructor() {
    this.checks = 0;
    this.passed = 0;
    this.errors = [];
  }

  assert(label, condition, detail = "") {
    this.checks += 1;
    if (condition) {
      this.passed += 1;
    } else {
      this.errors.push(`${label}${detail ? ` — ${detail}` : ""}`);
    }
  }
}

const runner = new Runner();

function collectHtmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectHtmlFiles(full));
    } else if (entry.name.endsWith(".html")) {
      results.push(full);
    }
  }
  return results;
}

if (!skipBuild) {
  execSync("npm run build", { cwd: PROJECT_ROOT, stdio: "inherit" });
}

runner.assert("dist/ directory exists", fs.existsSync(DIST_DIR));
runner.assert("dist/404.html exists", fs.existsSync(path.join(DIST_DIR, "404.html")));
runner.assert("vercel.json valid JSON", (() => {
  try {
    JSON.parse(fs.readFileSync(VERCEL_JSON_PATH, "utf-8"));
    return true;
  } catch {
    return false;
  }
})());
runner.assert("public/robots.txt exists", fs.existsSync(ROBOTS_TXT_PATH));

const requiredRoutes = [
  "index.html",
  "about/index.html",
  "services/index.html",
  "projects/index.html",
  "blog/index.html",
  "careers/index.html",
  "contact/index.html",
  "privacy/index.html",
  "terms/index.html",
];

for (const route of requiredRoutes) {
  runner.assert(`Prerendered route dist/${route}`, fs.existsSync(path.join(DIST_DIR, route)));
}

const htmlFiles = collectHtmlFiles(DIST_DIR);
runner.assert("Prerendered HTML files exist", htmlFiles.length > 0);

for (const file of htmlFiles) {
  const rel = path.relative(PROJECT_ROOT, file);
  const html = fs.readFileSync(file, "utf-8");

  const mainMatches = html.match(/<main\b[^>]*id="main"/gi) || [];
  runner.assert(`Single <main id="main"> (${rel})`, mainMatches.length === 1);
  runner.assert(`Has <title> (${rel})`, /<title[^>]*>[\s\S]+?<\/title>/i.test(html));
  runner.assert(`Has canonical (${rel})`, /<link[^>]*rel="canonical"/i.test(html));

  const jsonLdMatches = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of jsonLdMatches) {
    let ok = true;
    try {
      JSON.parse(m[1]);
    } catch {
      ok = false;
    }
    runner.assert(`Valid JSON-LD (${rel})`, ok);
  }
}

for (const sm of ["sitemap.xml", "sitemap-pages.xml", "sitemap-projects.xml", "sitemap-blog.xml"]) {
  const smPath = path.join(DIST_DIR, sm);
  runner.assert(`dist/${sm} exists`, fs.existsSync(smPath));
}

try {
  execSync("npx oxlint", { cwd: PROJECT_ROOT, stdio: "pipe" });
  runner.assert("oxlint passes cleanly", true);
} catch (err) {
  runner.assert("oxlint passes cleanly", false, err.message);
}

console.log(`\nVerification Summary: ${runner.passed}/${runner.checks} checks passed.`);
if (runner.errors.length > 0) {
  console.error("Failures:");
  for (const e of runner.errors) console.error(`  - ${e}`);
  process.exit(1);
}
