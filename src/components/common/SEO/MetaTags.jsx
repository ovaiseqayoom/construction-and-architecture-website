import React from "react";
import { Helmet } from "react-helmet-async";
import { SEO_ENTITY, getBreadcrumbSchema } from "../../../config/seo.config";

export default function MetaTags({
  title,
  description,
  keywords,
  canonical,
  ogType = "website",
  ogImage,
  ogImageAlt,
  schema,
  breadcrumbs,
  noindex = false,
  children,
}) {
  const finalTitle = title || `${SEO_ENTITY.brandName} | Architectural & Structural Engineering`;
  const finalDesc = description || "Structura Architecture & Construction provides turnkey construction, 3D architectural design, and structural engineering.";
  const finalCanonical = canonical || SEO_ENTITY.siteUrl;
  const finalImage = ogImage || SEO_ENTITY.ogDefaultImage || SEO_ENTITY.defaultOgImage;
  const finalImageAlt = ogImageAlt || `${SEO_ENTITY.brandName} Logo`;
  const finalKeywords = keywords
    ? Array.isArray(keywords)
      ? keywords.join(", ")
      : String(keywords)
    : null;

  const schemasToRender = [];
  if (schema) {
    if (Array.isArray(schema)) {
      schemasToRender.push(...schema);
    } else {
      schemasToRender.push(schema);
    }
  }

  if (breadcrumbs && Array.isArray(breadcrumbs) && breadcrumbs.length > 0) {
    schemasToRender.push(getBreadcrumbSchema(breadcrumbs));
  }

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDesc} />
      {finalKeywords && <meta name="keywords" content={finalKeywords} />}
      <link rel="canonical" href={finalCanonical} />
      {noindex ? (
        <meta name="robots" content="noindex, follow" />
      ) : (
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      )}

      <meta property="og:type" content={ogType} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:site_name" content={SEO_ENTITY.brandName} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDesc} />
      <meta property="og:url" content={finalCanonical} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:image:secure_url" content={finalImage} />
      <meta
        property="og:image:type"
        content={
          finalImage.endsWith(".png")
            ? "image/png"
            : finalImage.endsWith(".jpg") || finalImage.endsWith(".jpeg")
            ? "image/jpeg"
            : "image/webp"
        }
      />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={finalImageAlt} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDesc} />
      <meta name="twitter:image" content={finalImage} />
      <meta name="twitter:image:src" content={finalImage} />
      <meta name="twitter:image:alt" content={finalImageAlt} />
      <meta name="twitter:url" content={finalCanonical} />
      <meta name="twitter:domain" content="example.com" />

      {schemasToRender.map((s, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}

      {children}
    </Helmet>
  );
}
