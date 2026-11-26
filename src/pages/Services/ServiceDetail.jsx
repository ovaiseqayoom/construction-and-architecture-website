// Page: ServiceDetail — src/pages/Services/ServiceDetail.jsx
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import MetaTags from "../../components/common/SEO/MetaTags";
import { SEO_ENTITY } from "../../config/seo.config";
import {
  FaCheckCircle,
  FaArrowLeft,
  FaPhoneAlt,
  FaShieldAlt,
  FaBuilding,
  FaDraftingCompass,
  FaHardHat,
  FaChevronRight,
  FaPalette,
  FaClipboardCheck,
  FaHome,
  FaChevronDown,
  FaSlidersH,
  FaLayerGroup,
  FaWhatsapp
} from "react-icons/fa";
import { SERVICES_DATA } from "../../data/services";
import styles from "./ServiceDetail.module.css";

const SERVICE_ICONS = {
  "architectural-design": <FaDraftingCompass />,
  "structural-engineering": <FaBuilding />,
  "turnkey-construction": <FaHardHat />,
  "interior-modular-design": <FaPalette />,
  "regulatory-approvals": <FaClipboardCheck />
};

const SERVICE_THEMES = {
  "architectural-design": {
    themeClass: styles.themeArchitectural,
    disciplineLabel: "CIVIL & ARCHITECTURAL DISCIPLINE"
  },
  "structural-engineering": {
    themeClass: styles.themeStructural,
    disciplineLabel: "STRUCTURAL & SEISMIC DISCIPLINE"
  },
  "turnkey-construction": {
    themeClass: styles.themeConstruction,
    disciplineLabel: "CIVIL EPC & CONSTRUCTION DISCIPLINE"
  },
  "interior-modular-design": {
    themeClass: styles.themeInterior,
    disciplineLabel: "INTERIOR & MILLWORK DISCIPLINE"
  },
  "regulatory-approvals": {
    themeClass: styles.themeRegulatory,
    disciplineLabel: "MUNICIPAL & LEGAL ENGINEERING DISCIPLINE"
  }
};

export default function ServiceDetail() {
  const { slug } = useParams();
  const service = SERVICES_DATA.find((s) => s.slug === slug);
  const otherServices = SERVICES_DATA.filter((s) => s.slug !== slug);
  const currentTheme = SERVICE_THEMES[slug] || SERVICE_THEMES["architectural-design"];

  const [openFaq, setOpenFaq] = useState(0); 

  const renderPortfolioCard = (item, index, total = 4) => {
    if (!item) return null;
    const isReversed = index % 2 === 1;
    return (
      <article
        key={index}
        className={`${styles.portfolioCard} ${styles.portfolioCardStandalone} ${isReversed ? styles.portfolioCardReversed : ""} ${styles.animateSlideLeft} ${styles.delay4}`}
        aria-label={item.title}
        itemScope
        itemType="https://schema.org/ImageObject"
      >
        <div className={styles.portfolioImageCol}>
          <img
            src={item.url}
            alt={`${item.title} - ${service.title} | Structura Studio`}
            title={`${item.title} - ${service.title}`}
            loading="lazy"
            decoding="async"
            width="800"
            height="500"
            itemProp="contentUrl"
            className={styles.portfolioImg}
          />
          <meta itemProp="name" content={`${item.title} - ${service.title}`} />
          <meta itemProp="caption" content={item.caption} />
        </div>
        <div className={styles.portfolioContentCol}>
          <div className={styles.portfolioMetaRow}>
            {item.tag && (
              <span className={styles.portfolioTagBadge}>{item.tag}</span>
            )}
            <span className={styles.portfolioIndex}>
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </div>
          <h3 className={styles.portfolioTitle}>{item.title}</h3>
          <p className={styles.portfolioCaption} itemProp="description">{item.caption}</p>
        </div>
      </article>
    );
  };

  if (!service) {
    return (
      <div className={styles.notFoundWrapper}>
        <div className={styles.notFoundCard}>
          <FaBuilding className={styles.notFoundIcon} />
          <h2>Service Not Found</h2>
          <p>The requested engineering or architectural discipline could not be located.</p>
          <Link to="/services" className={styles.backBtn}>
            <FaArrowLeft /> <span>Back to All Services</span>
          </Link>
        </div>
      </div>
    );
  }

  const detailSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.title,
    "serviceType": service.title,
    "description": service.metaDescription || service.shortDesc || service.fullDesc,
    "url": `${SEO_ENTITY.siteUrl}/services/${service.slug}`,
    "image": [
      service.coverImage,
      ...(service.gallery || []).map((img) => img.url)
    ],
    "provider": {
      "@id": `${SEO_ENTITY.siteUrl}/#organization`,
      "@type": "Organization",
      "name": SEO_ENTITY.legalName,
      "url": SEO_ENTITY.siteUrl,
      "telephone": SEO_ENTITY.primaryPhone,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": SEO_ENTITY.address.streetAddress,
        "addressLocality": SEO_ENTITY.address.addressLocality,
        "addressRegion": SEO_ENTITY.address.addressRegion,
        "postalCode": SEO_ENTITY.address.postalCode,
        "addressCountry": SEO_ENTITY.address.addressCountry
      }
    },
    "areaServed": SEO_ENTITY.serviceAreas.map((area) => ({
      "@type": "Place",
      "name": area
    })),
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

  // Keep FAQs in semantic HTML
  const faqSchema = null;

  const coverImageSchema = service.coverImage ? {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "@id": `${service.coverImage}#image`,
    "url": service.coverImage,
    "contentUrl": service.coverImage,
    "name": `${service.title} - Engineering & Architectural Overview`,
    "caption": service.imageAlt || `${service.title} by Structura Architecture & Construction`,
    "description": `${service.title} service visual by Structura Architecture & Construction`,
    "encodingFormat": "image/svg+xml",
    "representativeOfPage": true,
    "creator": {
      "@type": "Organization",
      "name": SEO_ENTITY.legalName,
      "url": SEO_ENTITY.siteUrl
    },
    "copyrightHolder": {
      "@type": "Organization",
      "name": SEO_ENTITY.legalName
    },
    "license": `${SEO_ENTITY.siteUrl}/terms`,
    "acquireLicensePage": `${SEO_ENTITY.siteUrl}/contact`
  } : null;

  const galleryImageSchemas = (service.gallery || []).map((img) => ({
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "@id": `${img.url}#image`,
    "url": img.url,
    "contentUrl": img.url,
    "name": `${img.title} - ${service.title}`,
    "caption": img.caption,
    "description": `${img.title}: ${img.caption} (${service.title} - Structura Architecture & Construction)`,
    "encodingFormat": "image/svg+xml",
    "representativeOfPage": false,
    "keywords": `${service.title}, ${img.tag || ""}, architecture, structural engineering`,
    "creator": {
      "@type": "Organization",
      "name": SEO_ENTITY.legalName,
      "url": SEO_ENTITY.siteUrl
    },
    "copyrightHolder": {
      "@type": "Organization",
      "name": SEO_ENTITY.legalName
    },
    "license": `${SEO_ENTITY.siteUrl}/terms`,
    "acquireLicensePage": `${SEO_ENTITY.siteUrl}/contact`
  }));

  return (
    <div className={`${styles.pageWrapper} ${currentTheme.themeClass || ""}`} key={slug}>
      <MetaTags
        title={service.seoTitle || `${service.title} | Structura Architecture & Construction`}
        description={service.metaDescription || service.shortDesc || service.fullDesc}
        keywords={service.keywords}
        canonical={`${SEO_ENTITY.siteUrl}/services/${service.slug}`}
        ogType="article"
        ogImage={service.coverImage || SEO_ENTITY.defaultOgImage}
        ogImageAlt={service.imageAlt || service.title}
        schema={[detailSchema, faqSchema, coverImageSchema, ...galleryImageSchemas].filter(Boolean)}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Services", url: "/services" },
          { name: service.title, url: `/services/${service.slug}` }
        ]}
      />

      <section className={styles.heroSection} aria-labelledby="service-detail-title">
        <div className={styles.heroContainer}>
          <header className={`${styles.heroSplitCard} ${styles.animateSlideLeft} ${styles.delay1}`}>
            <div className={styles.heroContentCol}>
              <nav className={styles.breadcrumbRow} aria-label="Breadcrumb">
                <Link to="/" className={styles.homeBreadcrumbLink}>
                  <FaHome className={styles.homeBreadcrumbIcon} />
                  <span>Home</span>
                </Link>
                <span className={styles.slash} aria-hidden="true">/</span>
                <Link
                  to="/services"
                  className={styles.backLink}
                  onClick={(e) => {
                    if (typeof window !== "undefined" && window.history.length > 1) {
                      e.preventDefault();
                      window.history.back();
                    }
                  }}
                >
                  <span>Services</span>
                </Link>
                <span className={styles.slash} aria-hidden="true">/</span>
                <strong className={styles.currentBreadcrumb} aria-current="page">{service.title}</strong>
              </nav>

              <div className={styles.sectionTagRow}>
                <span className={styles.tagSquare} aria-hidden="true" />
                <span>{currentTheme.disciplineLabel}</span>
              </div>

              <h1 id="service-detail-title" className={styles.serviceTitle}>
                {service.title}
              </h1>

              <p className={styles.serviceSubtitle}>
                {service.shortDesc}
              </p>
            </div>

            <div className={styles.heroImageCol} itemScope itemType="https://schema.org/ImageObject">
              <img
                src={service.coverImage}
                alt={service.imageAlt || `${service.title} - Structura Architecture & Construction`}
                title={`${service.title} - Architecture & Engineering`}
                loading="eager"
                decoding="async"
                width="800"
                height="500"
                itemProp="contentUrl"
                className={styles.heroImg}
              />
              <meta itemProp="name" content={service.title} />
              <meta itemProp="caption" content={service.imageAlt || service.shortDesc} />
            </div>
          </header>

          {service.workflow && service.workflow.length > 0 && (
            <div className={`${styles.heroWorkflowStrip} ${styles.animateSlideLeft} ${styles.delay3}`}>
              <div className={styles.workflowTrack}>
                {service.workflow.map((item, idx) => (
                  <div key={item.step || idx} className={styles.workflowCard}>
                    <div className={styles.workflowTopMeta}>
                      <span className={styles.workflowTag}>Phase {item.step || String(idx + 1).padStart(2, "0")}</span>
                    </div>

                    <div className={styles.workflowTitleGroup}>
                      <h3 className={styles.workflowStepTitle}>{item.title}</h3>
                      <div className={styles.workflowUnderline} aria-hidden="true" />
                    </div>

                    <p className={styles.workflowDesc}>{item.desc}</p>

                    <div className={styles.workflowBottomRow}>
                      <span className={styles.workflowRomanNumber} aria-hidden="true">
                        {item.step || String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.contentContainer}>
          <div className={styles.mainContent}>

            <div className={`${styles.detailBlock} ${styles.animateSlideLeft} ${styles.delay4}`}>
              <h2 className={styles.subHeading}>Scope of Work &amp; Technical Approach</h2>
              <p className={styles.fullDesc}>{service.fullDesc}</p>
            </div>

            {service.specs && service.specs.length > 0 && (
              <div className={`${styles.quickSpecsStrip} ${styles.animateSlideLeft} ${styles.delay4}`}>
                {service.specs.map((spec, idx) => (
                  <div key={idx} className={styles.quickSpecCard}>
                    <span className={styles.quickSpecLabel}>{spec.label}</span>
                    <span className={styles.quickSpecValue}>{spec.value}</span>
                  </div>
                ))}
                <div className={styles.quickSpecCard}>
                  <span className={styles.quickSpecLabel}>Studio HQ</span>
                  <span className={styles.quickSpecValue}>Design District</span>
                </div>
              </div>
            )}

            {service.gallery?.[0] && renderPortfolioCard(service.gallery[0], 0, service.gallery.length)}

            <div className={`${styles.detailBlock} ${styles.animateSlideLeft} ${styles.delay5}`}>
              <h2 className={styles.subHeading}>Key Capabilities &amp; Deliverables</h2>
              <div className={styles.featuresGrid}>
                {service.features && service.features.map((feature, idx) => (
                  <div key={idx} className={styles.featureCard}>
                    <FaCheckCircle className={styles.checkIcon} aria-hidden="true" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {service.gallery?.[1] && renderPortfolioCard(service.gallery[1], 1, service.gallery.length)}

            {service.detailedBreakdown && service.detailedBreakdown.length > 0 && (
              <div className={`${styles.detailBlock} ${styles.animateSlideLeft} ${styles.delay5}`}>
                <div className={styles.sectionHeaderFlex}>
                  <div>
                    <h2 className={styles.subHeadingNoBorder}>
                      <FaLayerGroup className={styles.inlineHeaderIcon} />
                      <span>Core Engineering Pillars</span>
                    </h2>
                    <p className={styles.sectionSubtext}>
                      Methodical technical execution designed for structural permanence and climatic resilience.
                    </p>
                  </div>
                </div>

                <div className={styles.breakdownGrid}>
                  {service.detailedBreakdown.map((item, idx) => (
                    <div key={idx} className={styles.breakdownCard}>
                      <span className={styles.breakdownIndex}>0{idx + 1}</span>
                      <h4 className={styles.breakdownTitle}>{item.title}</h4>
                      <p className={styles.breakdownDesc}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {service.gallery?.[2] && renderPortfolioCard(service.gallery[2], 2, service.gallery.length)}

            {service.technicalParameters && service.technicalParameters.length > 0 && (
              <div className={`${styles.detailBlock} ${styles.animateSlideLeft} ${styles.delay5}`}>
                <div className={styles.sectionHeaderFlex}>
                  <div>
                    <h2 className={styles.subHeadingNoBorder}>
                      <FaSlidersH className={styles.inlineHeaderIcon} />
                      <span>Technical Parameters &amp; Performance Standards</span>
                    </h2>
                    <p className={styles.sectionSubtext}>
                      Engineered specifications adhering strictly to national codes and alpine climate dynamics.
                    </p>
                  </div>
                </div>

                <div className={styles.paramTable}>
                  {service.technicalParameters.map((param, idx) => (
                    <div key={idx} className={styles.paramRow}>
                      <span className={styles.paramLabel}>{param.label}</span>
                      <span className={styles.paramValue}>{param.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {service.complianceInfo && (
              <div className={`${styles.complianceBox} ${styles.animateSlideLeft} ${styles.delay5}`}>
                <div className={styles.complianceHeader}>
                  <div className={styles.complianceIconBox}>
                    <FaShieldAlt className={styles.complianceIcon} aria-hidden="true" />
                  </div>
                  <div>
                    <h3>{service.complianceInfo.title}</h3>
                    <p>{service.complianceInfo.subtitle}</p>
                  </div>
                </div>
                <ul className={styles.complianceList}>
                  {service.complianceInfo.list.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {service.gallery?.[3] && renderPortfolioCard(service.gallery[3], 3, service.gallery.length)}

            {service.faqs && service.faqs.length > 0 && (
              <div className={`${styles.detailBlock} ${styles.animateSlideLeft} ${styles.delay6}`}>
                <div className={styles.sectionHeaderFlex}>
                  <div>
                    <h2 className={styles.subHeadingNoBorder}>Frequently Asked Questions</h2>
                    <p className={styles.sectionSubtext}>
                      Key technical clarifications and execution details for property owners and developers.
                    </p>
                  </div>
                </div>

                <div className={styles.faqList}>
                  {service.faqs.map((faq, idx) => {
                    const isOpen = openFaq === idx;
                    return (
                      <div
                        key={idx}
                        className={`${styles.faqCard} ${isOpen ? styles.faqCardOpen : ""}`}
                      >
                        <button
                          type="button"
                          className={styles.faqQuestionBtn}
                          onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                          aria-expanded={isOpen}
                        >
                          <span className={styles.faqQuestionText}>{faq.q}</span>
                          <FaChevronDown
                            className={`${styles.faqChevron} ${isOpen ? styles.faqChevronRotated : ""}`}
                            aria-hidden="true"
                          />
                        </button>
                        {isOpen && (
                          <div className={styles.faqAnswerBox}>
                            <p className={styles.faqAnswerText}>{faq.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={`${styles.bottomCtaCard} ${styles.animateSlideLeft} ${styles.delay5}`}>
              <div className={styles.bottomCtaLeft}>
                <div className={styles.bottomCtaBadge}>GET STARTED</div>
                <h3 className={styles.bottomCtaHeading}>Need {service.title}?</h3>
                <p className={styles.bottomCtaText}>
                  Schedule a direct engineering consultation or site visit with our licensed studio team.
                </p>
              </div>
              <div className={styles.bottomCtaActions}>
                <Link to="/contact" className={styles.primaryBtn} aria-label="Request Technical Consultation">
                  <FaPhoneAlt /> <span>Request Consultation</span>
                </Link>
                <a
                  href={`https://wa.me/15550100000?text=${encodeURIComponent(`Hello Structura Studio, I would like to inquire about your ${service.title} services.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.secondaryWhatsappBtn}
                >
                  <FaWhatsapp /> <span>Quick WhatsApp Desk</span>
                </a>
              </div>
            </div>

            <div className={`${styles.otherDisciplinesBlock} ${styles.animateSlideLeft} ${styles.delay6}`}>
              <h3 className={styles.subHeading}>Explore Other Core Disciplines</h3>
              <div className={styles.otherDisciplinesGrid}>
                {otherServices.map((item) => (
                  <Link
                    key={item.id || item.slug}
                    to={`/services/${item.slug}`}
                    className={styles.otherDisciplineCard}
                  >
                    <div className={styles.otherDisciplineIcon}>
                      {SERVICE_ICONS[item.slug] || <FaBuilding />}
                    </div>
                    <div className={styles.otherDisciplineInfo}>
                      <h4 className={styles.otherDisciplineTitle}>{item.title}</h4>
                      <p className={styles.otherDisciplineDesc}>{item.shortDesc}</p>
                    </div>
                    <FaChevronRight className={styles.otherDisciplineArrow} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}