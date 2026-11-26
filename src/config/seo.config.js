const envSiteUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL) ||
  (typeof process !== "undefined" && process.env?.VITE_SITE_URL) ||
  "https://example.com";

const CLEAN_SITE_URL = envSiteUrl.replace(/\/+$/, "");

export const SEO_ENTITY = {
  brandName: "Structura Architecture & Construction",
  legalName: "Structura Architecture & Construction",
  shortName: "Structura",
  alternateName: "Structura Studio",
  siteUrl: CLEAN_SITE_URL,
  logoUrl: `${CLEAN_SITE_URL}/logo.svg`,
  logoWidth: 240,
  logoHeight: 48,
  ogDefaultImage: `${CLEAN_SITE_URL}/studio-og-1200x630.png`,
  defaultOgImage: `${CLEAN_SITE_URL}/studio-og-1200x630.png`,
  description:
    "Full-service architecture, structural engineering, and turnkey construction practice specializing in residential villas, commercial spaces, and timber-and-concrete design.",
  foundingDate: "2018-04-01",
  primaryPhone: "+1 (555) 010-0000",
  secondaryPhone: "+1 (555) 010-0100",
  whatsappNumber: "15550100000",
  whatsappPhone: "15550100000",
  primaryEmail: "hello@example.com",
  address: {
    streetAddress: "123 Architecture Ave, Design District",
    locality: "Design District",
    region: "Metro Area",
    postalCode: "10001",
    countryCode: "US",
    countryName: "United States",
    fullFormatted: "123 Architecture Ave, Design District, Metro Area 10001",
  },
  legalAddress: {
    streetAddress: "123 Architecture Ave, Design District",
    locality: "Design District",
    region: "Metro Area",
    postalCode: "10001",
    countryCode: "US",
  },
  geo: {
    latitude: 40.7128,
    longitude: -74.006,
  },
  serviceAreas: [
    "Design District",
    "Northside",
    "Riverfront",
    "Harborview",
    "Westbridge",
  ],
  founders: [
    {
      name: "Daniel Reyes",
      jobTitle: "Principal Architect",
      url: `${CLEAN_SITE_URL}/about`,
      id: "studio-0101",
    },
    {
      name: "Elena Cho",
      jobTitle: "Structural Engineering Lead",
      url: `${CLEAN_SITE_URL}/about`,
      id: "studio-0102",
    },
  ],
  directors: [
    {
      name: "Daniel Reyes",
      jobTitle: "Principal Architect",
      url: `${CLEAN_SITE_URL}/about`,
      id: "studio-0101",
    },
    {
      name: "Elena Cho",
      jobTitle: "Structural Engineering Lead",
      url: `${CLEAN_SITE_URL}/about`,
      id: "studio-0102",
    },
    {
      name: "Marcus Patel",
      jobTitle: "Director – Construction & Field QA",
      url: `${CLEAN_SITE_URL}/about`,
      id: "studio-0103",
    },
    {
      name: "Sophia Laurent",
      jobTitle: "Director – Interior & Envelope Systems",
      url: `${CLEAN_SITE_URL}/about`,
      id: "studio-0104",
    },
  ],
  knowsAbout: [
    "Architectural Design",
    "Structural Engineering",
    "Seismic-Resistant Engineering",
    "Turnkey Construction",
    "Interior & Modular Joinery",
    "Bill of Quantities (BOQ) & Cost Estimation",
    "Building Permitting & Site Surveys",
  ],
  sameAs: [
    "https://example.com",
    "https://github.com",
  ],
};

export function getCorporateKnowledgeGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "ProfessionalService"],
        "@id": `${SEO_ENTITY.siteUrl}/#organization`,
        name: SEO_ENTITY.brandName,
        alternateName: [SEO_ENTITY.shortName, SEO_ENTITY.alternateName],
        url: `${SEO_ENTITY.siteUrl}/`,
        logo: {
          "@type": "ImageObject",
          url: SEO_ENTITY.logoUrl,
          width: 240,
          height: 48,
        },
        image: SEO_ENTITY.ogDefaultImage,
        description: SEO_ENTITY.description,
        foundingDate: SEO_ENTITY.foundingDate,
        email: SEO_ENTITY.primaryEmail,
        telephone: SEO_ENTITY.primaryPhone,
        address: {
          "@type": "PostalAddress",
          streetAddress: SEO_ENTITY.address.streetAddress,
          addressLocality: SEO_ENTITY.address.locality,
          addressRegion: SEO_ENTITY.address.region,
          postalCode: SEO_ENTITY.address.postalCode,
          addressCountry: SEO_ENTITY.address.countryCode,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: SEO_ENTITY.geo.latitude,
          longitude: SEO_ENTITY.geo.longitude,
        },
        areaServed: SEO_ENTITY.serviceAreas.map((city) => ({
          "@type": "City",
          name: city,
        })),
        sameAs: SEO_ENTITY.sameAs,
        knowsAbout: [
          "Architectural Design",
          "Structural Engineering",
          "Seismic-Resistant Engineering",
          "Turnkey Construction",
          "Interior & Modular Joinery",
          "Bill of Quantities (BOQ) & Cost Estimation",
          "Building Permitting & Site Surveys",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SEO_ENTITY.siteUrl}/#website`,
        url: `${SEO_ENTITY.siteUrl}/`,
        name: SEO_ENTITY.brandName,
        publisher: { "@id": `${SEO_ENTITY.siteUrl}/#organization` },
        inLanguage: "en-US",
      },
    ],
  };
}

export function getBreadcrumbSchema(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith("http")
        ? item.url
        : `${SEO_ENTITY.siteUrl}${item.url.startsWith("/") ? "" : "/"}${item.url}`,
    })),
  };
}

export function getFaqSchema(faqs = []) {
  if (!faqs || faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };
}

export const PAGE_SEO = {
  home: {
    title: "Structura | Architecture, Structural Engineering & Turnkey Build",
    description:
      "Architecture studio and construction engineering practice delivering residential villas, commercial spaces, and turnkey projects with transparent BOQ workflows.",
    path: "/",
    keywords:
      "architecture studio, structural engineering, turnkey construction, building design, BIM modeling, construction cost estimator",
  },
  about: {
    title: "About Us | Structura Architecture & Construction",
    description:
      "Meet the licensed architects, structural engineers, and site managers behind Structura Architecture & Construction.",
    path: "/about",
    keywords:
      "architecture studio leadership, structural engineers, construction team, integrated design build",
  },
  services: {
    title: "Services | Architecture, Engineering & Turnkey Construction",
    description:
      "Explore architectural 3D design, seismic structural engineering, turnkey construction, modular interiors, and permitting services.",
    path: "/services",
    keywords:
      "architectural design, structural engineering, turnkey contracting, modular interior fit-out, building permits",
  },
  projects: {
    title: "Built Portfolio & Case Studies | Structura",
    description:
      "Browse completed architectural designs, structural frameworks, commercial spaces, and turnkey construction case studies.",
    path: "/projects",
    keywords:
      "architecture portfolio, residential villas, commercial architecture, structural case studies",
  },
  blog: {
    title: "Engineering Journal & Design Guides | Structura",
    description:
      "Technical guides on structural engineering, seismic detailing, construction economics, BIM workflows, and building physics.",
    path: "/blog",
    keywords:
      "architecture blog, structural engineering guides, construction cost breakdown, BIM coordination",
  },
  careers: {
    title: "Careers | Join Structura Architecture & Construction",
    description:
      "Explore open roles in architectural design, BIM coordination, structural engineering, and site project management.",
    path: "/careers",
    keywords:
      "architecture jobs, civil engineering careers, site engineer openings, CAD drafter positions",
  },
  contact: {
    title: "Contact & Project Consultation | Structura",
    description:
      "Connect with our architectural and engineering studio for project feasibility reviews, BOQ estimates, and turnkey construction consultations.",
    path: "/contact",
    canonical: `${CLEAN_SITE_URL}/contact`,
    keywords:
      "architecture consultation, construction quote, structural audit, project inquiry",
  },
  privacy: {
    title: "Privacy Policy | Structura Architecture & Construction",
    description: "Privacy practices and data handling guidelines for Structura Architecture & Construction.",
    path: "/privacy",
    canonical: `${CLEAN_SITE_URL}/privacy`,
  },
  terms: {
    title: "Terms & Conditions | Structura Architecture & Construction",
    description: "Project engagement terms and studio conditions for Structura Architecture & Construction.",
    path: "/terms",
    canonical: `${CLEAN_SITE_URL}/terms`,
  },
  notFound: {
    title: "404 - Page Not Found | Structura Architecture & Construction",
    description: "The requested page could not be found.",
    path: "/404",
    canonical: `${CLEAN_SITE_URL}/404`,
  },
};
