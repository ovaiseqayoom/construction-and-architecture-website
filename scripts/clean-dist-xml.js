// dist-xml.js
import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve(process.cwd(), "dist");
const publicDir = path.resolve(process.cwd(), "public");

const sitemapFiles = [
  "sitemap.xml",
  "sitemap-pages.xml",
  "sitemap-projects.xml",
  "sitemap-blog.xml",
];

// Ensure all 4 sitemap XML files are present and up-to-date in dist/
if (fs.existsSync(publicDir)) {
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  for (const sitemapFile of sitemapFiles) {
    const srcPath = path.join(publicDir, sitemapFile);
    const destPath = path.join(distDir, sitemapFile);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`[Sitemap Sync] Preserved and verified dist/${sitemapFile}`);
    } else {
      console.warn(`[Sitemap Sync] Warning: public/${sitemapFile} not found to copy to dist/`);
    }
  }
}

// Remove feed/rss if present in dist so Serverless API handles real-time updates
const feedFiles = [
  path.resolve(distDir, "feed.xml"),
  path.resolve(distDir, "rss.xml"),
];

for (const file of feedFiles) {
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file);
      console.log(`[Dynamic Sync] Removed static ${path.basename(file)} from dist/ so dynamic Serverless API serves real-time updates.`);
    } catch (err) {
      console.warn(`Could not remove ${file}:`, err.message);
    }
  }
}

// Clean up intermediate build artifacts (e.g. dist/template.html) so internal template skeletons are not publicly served
const intermediateArtifacts = [
  path.resolve(distDir, "template.html"),
];

for (const artifact of intermediateArtifacts) {
  if (fs.existsSync(artifact)) {
    try {
      fs.unlinkSync(artifact);
      console.log(`[Build Cleanup] Successfully unlinked intermediate build artifact: ${path.basename(artifact)}`);
    } catch (err) {
      console.warn(`Could not remove ${artifact}:`, err.message);
    }
  }
}

