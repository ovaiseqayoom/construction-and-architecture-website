// Page: Services — src/pages/Services/Services.jsx
import React, { useState, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import MetaTags from "../../components/common/SEO/MetaTags";
import { PAGE_SEO, SEO_ENTITY } from "../../config/seo.config";
import { FaHome, FaArrowRight, FaShieldAlt } from "react-icons/fa";
import HomeCtaStrip from "../../components/home/HomeCtaStrip";
import { SERVICES_DATA } from "../../data/services";
import styles from "./Services.module.css";

const ContactModal = lazy(() => import("../../components/common/ContactModal/ContactModal"));

const DISCIPLINE_METAS = {
  "architectural-design": {
    category: "Civil & Architectural Practice",
    mobileCategory: "Civil & Architecture",
    code: "ARCH // 01",
    tag: "CIVIL & ARCHITECTURE"
  },
  "interior-modular-design": {
    category: "Bespoke Interior & Modular Joinery",
    mobileCategory: "Interior & Modular",
    code: "INT // 02",
    tag: "MODULAR JOINERY"
  },
  "structural-engineering": {
    category: "Structural Integrity & Seismic Engineering",
    mobileCategory: "Structural & Seismic",
    code: "STR // 03",
    tag: "SEISMIC ZONE V"
  },
  "turnkey-construction": {
    category: "Turnkey Execution & Site Realization",
    mobileCategory: "Turnkey Execution",
    code: "EXEC // 04",
    tag: "TURNKEY BUILD"
  },
  "regulatory-approvals": {
    category: "Municipal & Statutory Compliance",
    mobileCategory: "Statutory Compliance",
    code: "REG // 05",
    tag: "MUNICIPAL LIAISON"
  }
};

export default function Services() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(
    SERVICES_DATA[0]?.title || "Architectural Design"
  );

  useEffect(() => {
    if (window.location.hash === "#contact-form") {
      setModalOpen(true);
    }

    const handleHashChange = () => {
      if (window.location.hash === "#contact-form") {
        setModalOpen(true);
      } else {
        setModalOpen(false);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, []);

  const openConsultation = (serviceTitle) => {
    setSelectedService(serviceTitle);
    setModalOpen(true);
  };

  const servicesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: PAGE_SEO.services.title,
    description: PAGE_SEO.services.description,
    numberOfItems: SERVICES_DATA.length,
    itemListElement: SERVICES_DATA.map((service, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "Service",
        name: service.title,
        description: service.shortDesc || service.metaDescription,
        url: `${SEO_ENTITY.siteUrl}/services/${service.slug}`,
        image: service.coverImage,
        provider: {
          "@type": "Organization",
          "@id": `${SEO_ENTITY.siteUrl}/#organization`,
          name: SEO_ENTITY.legalName,
          url: SEO_ENTITY.siteUrl
        },
        areaServed: {
          "@type": "Place",
          name: "Design District"
        }
      }
    }))
  };

  const catalogImageSchemas = SERVICES_DATA.map((service) => ({
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "@id": `${service.coverImage}#image`,
    url: service.coverImage,
    contentUrl: service.coverImage,
    name: `${service.title} - Structura Architecture & Construction`,
    caption: service.imageAlt || service.shortDesc,
    description: `${service.title} - Architectural and structural engineering service`,
    encodingFormat: "image/svg+xml",
    creator: {
      "@type": "Organization",
      name: SEO_ENTITY.legalName,
      url: SEO_ENTITY.siteUrl
    },
    copyrightHolder: {
      "@type": "Organization",
      name: SEO_ENTITY.legalName
    },
    license: `${SEO_ENTITY.siteUrl}/terms`
  }));

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SEO_ENTITY.siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "Services", item: `${SEO_ENTITY.siteUrl}/services` }
    ]
  };

  return (
    <div className={styles.pageWrapper}>
      <MetaTags
        title={PAGE_SEO.services.title}
        description={PAGE_SEO.services.description}
        canonical={PAGE_SEO.services.canonical}
        schema={[servicesSchema, breadcrumbSchema, ...catalogImageSchemas]}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Services", url: "/services" }
        ]}
      />

      <header className={styles.pageHeader}>
        <div className={styles.headerContainer}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to="/" className={styles.breadcrumbLink}>
              <FaHome className={styles.breadcrumbHomeIcon} aria-hidden="true" />
              <span>Home</span>
            </Link>
            <span className={styles.breadcrumbDivider}>/</span>
            <span className={styles.breadcrumbCurrent} aria-current="page">Services</span>
          </nav>

          <div className={styles.headerContent}>
            <div className={styles.tagRow}>
              <span className={styles.tagDot} aria-hidden="true" />
              <span className={styles.tagText}>
                DISCIPLINE CATALOG &amp; CAPABILITIES
              </span>
            </div>

            <h1 className={styles.mainHeading}>
              Engineering &amp; Architecture
            </h1>

            <p className={styles.headerSubtext}>
              Integrated architectural design, seismic engineering, and transparent turnkey execution.
            </p>
          </div>
        </div>
      </header>

      <section className={styles.twinGridSection} aria-label="Engineering & Architectural Disciplines">
        <div className={styles.container}>
          <div className={styles.twinGrid}>
            {SERVICES_DATA.map((service, index) => {
              const discipline = DISCIPLINE_METAS[service.slug] || {
                category: "Engineering Discipline",
                mobileCategory: "Engineering",
                code: `ENG // 0${index + 1}`,
                tag: "ENGINEERING"
              };
              const num = `0${index + 1}`;

              return (
                <article key={service.slug} className={styles.twinItem}>
                  <Link
                    to={`/services/${service.slug}`}
                    className={styles.illustrationLink}
                    aria-label={`View ${service.title} architectural discipline`}
                  >
                    <div className={styles.illustrationStage}>
                      <div className={styles.stageHeader}>
                        <span className={styles.stageCode}>{discipline.code}</span>
                        <span className={styles.stageTag}>{discipline.tag}</span>
                      </div>
                      <img
                        src={service.coverImage}
                        alt={service.imageAlt || service.title}
                        className={styles.floatingImg}
                        loading={index < 2 ? "eager" : "lazy"}
                        decoding="async"
                        width="800"
                        height="520"
                      />
                    </div>
                  </Link>

                  <div className={styles.textCol}>
                    <div className={styles.disciplineMeta}>
                      <span className={styles.disciplineIndex}>{num}</span>
                      <span className={styles.metaSlash}>/</span>
                      <span className={styles.disciplineCategory}>
                        <span className={styles.disciplineDot} aria-hidden="true" />
                        <span className={styles.categoryDesktop}>{discipline.category}</span>
                        <span className={styles.categoryMobile}>{discipline.mobileCategory || discipline.category}</span>
                      </span>
                    </div>

                    <h2 className={styles.disciplineTitle}>
                      <Link to={`/services/${service.slug}`} className={styles.titleLink}>
                        {service.title}
                      </Link>
                    </h2>

                    <p className={styles.disciplineDesc}>
                      {service.shortDesc}
                    </p>

                    <div className={styles.actionGroup}>
                      <Link
                        to={`/services/${service.slug}`}
                        className={styles.readMoreBtn}
                      >
                        <span>Read more</span>
                        <FaArrowRight className={styles.btnArrow} />
                      </Link>

                      <button
                        type="button"
                        className={styles.secondaryConsultBtn}
                        onClick={() => openConsultation(service.title)}
                        aria-label={`Discuss ${service.title}`}
                      >
                        <span>Discuss</span>
                        <FaArrowRight className={styles.consultArrow} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            <article className={`${styles.twinItem} ${styles.workflowTile}`}>
              <div className={styles.workflowCard}>
                <div className={styles.workflowHeader}>
                  <div className={styles.workflowMeta}>
                    <span className={styles.workflowDot} aria-hidden="true" />
                    <span className={styles.workflowCategory}>
                      <span className={styles.categoryDesktop}>Integrated Project Delivery</span>
                      <span className={styles.categoryMobile}>Project Delivery</span>
                    </span>
                  </div>
                  <h2 className={styles.workflowTitle}>
                    How We Deliver Projects
                  </h2>
                  <p className={styles.workflowSubtitle}>
                    A structured 4-stage engineering lifecycle from raw valley terrain to turnkey handover.
                  </p>
                </div>

                <div className={styles.stepsDiagram}>
                  <div className={styles.connectingLine} aria-hidden="true" />

                  <div className={styles.stepRow}>
                    <div className={styles.circleWrapper}>
                      <span className={styles.stepCircle}>01</span>
                    </div>
                    <div className={styles.stepInfo}>
                      <h3 className={styles.stepHeading}>Site Survey &amp; Topography Feasibility</h3>
                      <p className={styles.stepDesc}>
                        Contour surveys, high-altitude soil bearing tests &amp; passive winter solar path modeling.
                      </p>
                    </div>
                  </div>

                  <div className={styles.connectorNode} aria-hidden="true" />

                  <div className={styles.stepRow}>
                    <div className={styles.circleWrapper}>
                      <span className={styles.stepCircle}>02</span>
                    </div>
                    <div className={styles.stepInfo}>
                      <h3 className={styles.stepHeading}>Architectural &amp; Seismic CAD Modeling</h3>
                      <p className={styles.stepDesc}>
                        2D layouts, photorealistic 3D renders &amp; IS 1893:2016 Zone V rebar detailing.
                      </p>
                    </div>
                  </div>

                  <div className={styles.connectorNode} aria-hidden="true" />

                  <div className={styles.stepRow}>
                    <div className={styles.circleWrapper}>
                      <span className={styles.stepCircle}>03</span>
                    </div>
                    <div className={styles.stepInfo}>
                      <h3 className={styles.stepHeading}>Municipal Sanction &amp; Statutory Approvals</h3>
                      <p className={styles.stepDesc}>
                        SDA, LAWDA, BOCA documentation &amp; chartered structural stability certification.
                      </p>
                    </div>
                  </div>

                  <div className={styles.connectorNode} aria-hidden="true" />

                  <div className={styles.stepRow}>
                    <div className={styles.circleWrapper}>
                      <span className={`${styles.stepCircle} ${styles.circleActive}`}>04</span>
                    </div>
                    <div className={styles.stepInfo}>
                      <h3 className={styles.stepHeading}>Turnkey Construction &amp; Key Handover</h3>
                      <p className={styles.stepDesc}>
                        Lab-tested concrete pouring, civil milestones, snag-list rectification &amp; occupancy.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={styles.lifecycleFooter}>
                  <div className={styles.footerIconRing}>
                    <FaShieldAlt className={styles.footerShieldIcon} aria-hidden="true" />
                  </div>
                  <div className={styles.footerText}>
                    <span className={styles.footerTag}>SINGLE-POINT TECHNICAL ACCOUNTABILITY</span>
                    <p className={styles.footerDesc}>
                      Architectural design, seismic calculations, and turnkey construction managed under one licensed practice to eliminate site discrepancies and contractor delays.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <HomeCtaStrip onOpenContactModal={() => setModalOpen(true)} theme="services" />

      {modalOpen && (
        <Suspense fallback={null}>
          <ContactModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            initialService={selectedService}
          />
        </Suspense>
      )}
    </div>
  );
}