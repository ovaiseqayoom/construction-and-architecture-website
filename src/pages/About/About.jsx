// Page: About — src/pages/About/About.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MetaTags from "../../components/common/SEO/MetaTags";
import { PAGE_SEO, SEO_ENTITY } from "../../config/seo.config";
import AboutHero from "../../components/about/AboutHero";
import TeamSection from "../../components/team/TeamSection";
const textGraphicDesktop = "/images/about/showcase.svg";
const textGraphicMobile = "/images/about/showcase.svg";

const mosaicVisionImg = "/images/about/vision.svg";
const mosaicMissionImg = "/images/about/mission.svg";
const mosaicValuesImg = "/images/about/values.svg";
import styles from "./About.module.css";

const aboutSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "ProfessionalService"],
      "@id": `${SEO_ENTITY.siteUrl}/#organization`,
      "name": SEO_ENTITY.brandName,
      "alternateName": SEO_ENTITY.shortName,
      "url": `${SEO_ENTITY.siteUrl}/`,
      "logo": {
        "@type": "ImageObject",
        "url": SEO_ENTITY.logoUrl,
        "width": SEO_ENTITY.logoWidth,
        "height": SEO_ENTITY.logoHeight
      },
      "image": SEO_ENTITY.defaultOgImage,
      "foundingDate": SEO_ENTITY.foundingDate,
      "description": SEO_ENTITY.description,
      "telephone": SEO_ENTITY.primaryPhone,
      "email": SEO_ENTITY.primaryEmail,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": SEO_ENTITY.address.streetAddress,
        "addressLocality": SEO_ENTITY.address.addressLocality,
        "addressRegion": SEO_ENTITY.address.addressRegion,
        "postalCode": SEO_ENTITY.address.postalCode,
        "addressCountry": SEO_ENTITY.address.countryCode
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": SEO_ENTITY.geo.latitude,
        "longitude": SEO_ENTITY.geo.longitude
      },
      "founder": SEO_ENTITY.directors.map((d) => ({
        "@type": "Person",
        "name": d.name,
        "jobTitle": d.jobTitle
      })),
      "knowsAbout": SEO_ENTITY.knowsAbout
    },
    {
      "@type": "AboutPage",
      "@id": `${SEO_ENTITY.siteUrl}/about/#webpage`,
      "url": `${SEO_ENTITY.siteUrl}/about`,
      "name": PAGE_SEO.about.title,
      "description": PAGE_SEO.about.description,
      "isPartOf": {
        "@type": "WebSite",
        "@id": `${SEO_ENTITY.siteUrl}/#website`,
        "name": SEO_ENTITY.brandName,
        "url": `${SEO_ENTITY.siteUrl}/`
      },
      "about": {
        "@id": `${SEO_ENTITY.siteUrl}/#organization`
      }
    }
  ]
};

const SECTION_CONTENT = [
  {
    id: "leadership",
    eyebrow: "Direction & governance",
    title: "Leadership Team",
    description:
      "Principal architects and engineering directors guiding design quality, structural safety, and transparent delivery for Structura.",
  },
  {
    id: "architecture",
    eyebrow: "Concept & planning",
    title: "Architecture & Design Team",
    description:
      "Designers translating client vision into buildable CAD architectural and structural plans.",
  },
  {
    id: "construction",
    eyebrow: "On-site execution",
    title: "Field Operations Team",
    description:
      "Skilled engineers, technicians, and field supervisors executing projects safely on the ground.",
  },
];

export default function About() {
  const [sections, setSections] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  useEffect(() => {
    let isMounted = true;

    import("../../data/team")
      .then(({ getMembersBySection }) => {
        if (!isMounted) return;
        const populatedSections = SECTION_CONTENT.map((section) => ({
          ...section,
          members: getMembersBySection ? getMembersBySection(section.id) : [],
        })).filter((section) => section.members && section.members.length > 0);
        setSections(populatedSections);
      })
      .catch((err) => {
        console.error("Error loading team data:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingTeam(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.isVisible);
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -30px 0px",
      }
    );

    const animatedElements = document.querySelectorAll(`.${styles.revealOnScroll}`);
    animatedElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.aboutPage}>
      <MetaTags
        title={PAGE_SEO.about.title}
        description={PAGE_SEO.about.description}
        canonical={PAGE_SEO.about.canonical}
        schema={aboutSchema}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "About Us", url: "/about" }
        ]}
      />

      <section className={styles.heroWrapper}>
        <AboutHero />
      </section>

      <section id="corporate-profile" className={styles.canvasSection}>
        <div className={styles.container}>
          <div className={styles.canvasDisplayContainer}>
            <picture className={styles.canvasPicture}>
              <source media="(max-width: 900px)" srcSet={textGraphicMobile} />
              <img
                src={textGraphicDesktop}
                alt="Structura Architecture and Construction Studio"
                className={styles.canvasBackdropImg}
                loading="lazy"
                decoding="async"
                width="1200"
                height="600"
              />
            </picture>

            <div className={styles.canvasOverlayContent}>
              <div className={styles.canvasHeader}>
                <div className={styles.sectionEyebrow}>
                  <span className={styles.eyebrowSquare} />
                  <span>WHO WE ARE</span>
                </div>
                <h2 className={styles.canvasMainTitle}>
                  Crafting spaces with heart, intention, and expertise
                </h2>
              </div>

              <div className={styles.canvasBodyBlock}>
                <h3 className={styles.canvasSubtitle}>
                  Thoughtfully designed structures that prioritize safety, longevity, and everyday livability.
                </h3>
                <p className={styles.canvasParagraph}>
                  <strong>Structura Architecture &amp; Construction</strong> is an integrated architectural and civil engineering practice. We combine computational structural rigor with refined spatial design, creating resilient buildings tailored to site climate and client goals.
                </p>

                <div className={styles.canvasCtaRow}>
                  <Link to="/services" className={styles.pillOliveButton}>
                    <span>Explore Our Services</span>
                    <span className={styles.pillArrow}>↗</span>
                  </Link>
                </div>

                <div className={styles.canvasMissionBox}>
                  <h4 className={styles.missionTitle}>Our Mission &amp; Craft</h4>
                  <p className={styles.missionParagraph}>
                    Through unified BIM workflows, transparent Bills of Quantities, and laboratory-audited site execution, we deliver durable residential, commercial, and civic works.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="mission-vision-values" className={styles.mosaicSection}>
        <div className={styles.container}>
          <div className={`${styles.sectionHeaderCentered} ${styles.mosaicHeader} ${styles.revealOnScroll}`}>
            <div className={styles.sectionEyebrowCenter}>
              <span className={styles.eyebrowSquare} />
              <span>GUIDING PRINCIPLES</span>
            </div>
            <h2 className={styles.sectionTitle}>Mission, Vision &amp; Core Values</h2>
            <p className={styles.sectionDesc}>
              The structural standards and enduring purpose guiding every blueprint, foundation, and building we deliver.
            </p>
          </div>

          <div className={`${styles.mosaicGrid} ${styles.revealOnScroll}`}>
            <div className={`${styles.mosaicTile} ${styles.mosaicImgTile} ${styles.areaVisionImg}`}>
              <img
                src={mosaicVisionImg}
                alt="Architectural Precision and Modern Vision"
                className={styles.mosaicImg}
                loading="lazy"
                decoding="async"
                width="600"
                height="400"
              />
            </div>

            <div className={`${styles.mosaicTile} ${styles.mosaicCard} ${styles.mosaicMissionCard} ${styles.areaMissionCard}`}>
              <div className={styles.mosaicCardInner}>
                <span className={styles.mosaicCardBadge}>01 / PURPOSE</span>
                <h3 className={styles.mosaicCardTitle}>Mission</h3>
                <p className={styles.mosaicCardText}>
                  To elevate residential and commercial architecture through ductile structural precision, passive thermal comfort, and transparent turnkey execution.
                </p>
              </div>
            </div>

            <div className={`${styles.mosaicTile} ${styles.mosaicImgTile} ${styles.areaValuesImg}`}>
              <img
                src={mosaicValuesImg}
                alt="Strategic Planning and Architectural Integrity"
                className={styles.mosaicImg}
                loading="lazy"
                decoding="async"
                width="600"
                height="400"
              />
            </div>

            <div className={`${styles.mosaicTile} ${styles.mosaicCard} ${styles.mosaicVisionCard} ${styles.areaVisionCard}`}>
              <div className={styles.mosaicCardInner}>
                <span className={styles.mosaicCardBadge}>02 / ASPIRATION</span>
                <h3 className={styles.mosaicCardTitle}>Vision</h3>
                <p className={styles.mosaicCardText}>
                  To set the standard for climate-responsive structural resilience and clean architectural craftsmanship across every built environment.
                </p>
              </div>
            </div>

            <div className={`${styles.mosaicTile} ${styles.mosaicImgTile} ${styles.areaMissionImg}`}>
              <img
                src={mosaicMissionImg}
                alt="Precision Structural Detailing and Craft"
                className={styles.mosaicImg}
                loading="lazy"
                decoding="async"
                width="600"
                height="400"
              />
            </div>

            <div className={`${styles.mosaicTile} ${styles.mosaicCard} ${styles.mosaicValuesCard} ${styles.areaValuesCard}`}>
              <div className={styles.mosaicCardInner}>
                <span className={styles.mosaicCardBadge}>03 / PILLARS</span>
                <h3 className={styles.mosaicCardTitle}>Core Values</h3>
                <ul className={styles.mosaicValuesList}>
                  <li>
                    <span className={styles.valueBullet} />
                    <span>Seismic Safety &amp; Code Rigor</span>
                  </li>
                  <li>
                    <span className={styles.valueBullet} />
                    <span>Uncompromising Integrity</span>
                  </li>
                  <li>
                    <span className={styles.valueBullet} />
                    <span>Transparent Turnkey Delivery</span>
                  </li>
                  <li>
                    <span className={styles.valueBullet} />
                    <span>Climate-Adaptive Design</span>
                  </li>
                  <li>
                    <span className={styles.valueBullet} />
                    <span>Client-Centric Precision</span>
                  </li>
                  <li>
                    <span className={styles.valueBullet} />
                    <span>Sustainable Materiality</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.factSheetSection}>
        <div className={styles.container}>
          <div className={`${styles.sectionHeaderCentered} ${styles.revealOnScroll}`}>
            <div className={styles.sectionEyebrowCenter}>
              <span className={styles.eyebrowSquare} />
              <span>PRACTICE PROFILE</span>
            </div>
            <h2 className={styles.sectionTitle}>Studio Fact Sheet</h2>
            <p className={styles.sectionDesc}>
              Key disciplines, technical standards, and studio benchmarks guiding our design-build engagements.
            </p>
          </div>

          <div className={styles.ledgerStrip}>
            <div className={`${styles.ledgerItem} ${styles.revealOnScroll} ${styles.revealDelay1}`}>
              <span className={styles.ledgerLabel}>Established</span>
              <h3 className={styles.ledgerValue}>2018</h3>
              <p className={styles.ledgerDesc}>Independent design-build and structural engineering practice.</p>
            </div>

            <div className={`${styles.ledgerItem} ${styles.revealOnScroll} ${styles.revealDelay2}`}>
              <span className={styles.ledgerLabel}>BIM Standard</span>
              <h3 className={styles.ledgerValueCIN}>LOD 350 / ISO 19650</h3>
              <p className={styles.ledgerDesc}>Coordinated architectural, structural, and MEP clash resolution.</p>
            </div>

            <div className={`${styles.ledgerItem} ${styles.revealOnScroll} ${styles.revealDelay3}`}>
              <span className={styles.ledgerLabel}>Headquarters</span>
              <h3 className={styles.ledgerValue}>Design District</h3>
              <p className={styles.ledgerDesc}>123 Architecture Ave, Design District, 10001.</p>
            </div>

            <div className={`${styles.ledgerItem} ${styles.revealOnScroll} ${styles.revealDelay4}`}>
              <span className={styles.ledgerLabel}>Core Discipline</span>
              <h3 className={styles.ledgerValue}>Design &amp; Build</h3>
              <p className={styles.ledgerDesc}>Architecture, Structural Engineering &amp; Turnkey Contracting.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="team-roster" className={styles.teamRosterSection}>
        <div className={styles.container}>
          <div className={`${styles.sectionHeaderCentered} ${styles.revealOnScroll}`}>
            <div className={styles.sectionEyebrowCenter}>
              <span className={styles.eyebrowSquare} />
              <span>IN-HOUSE LEADERSHIP &amp; TALENT</span>
            </div>
            <h2 className={styles.sectionTitle}>Meet Our Engineering &amp; Design Team</h2>
            <p className={styles.sectionDesc}>
              A multidisciplinary group of licensed architects, structural engineers, and site superintendents.
            </p>
          </div>

          <div className={styles.sectionsWrapper}>
            {loadingTeam ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#71717A" }}>
                Loading team members...
              </div>
            ) : (
              sections.map((section) => (
                <div key={section.id}>
                  <TeamSection
                    id={section.id}
                    title={section.title}
                    description={section.description}
                    members={section.members}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={`${styles.editorialCtaWrap} ${styles.revealOnScroll}`}>
            <div className={styles.sectionEyebrowCenter}>
              <span className={styles.eyebrowSquare} />
              <span>START A CONVERSATION</span>
            </div>
            <h2 className={styles.editorialCtaTitle}>Ready to Discuss Your Next Engineering Project?</h2>
            <p className={styles.editorialCtaDesc}>
              Reach out to our architecture and engineering studio for site assessments, 3D concept studies, or full turnkey execution.
            </p>
            <div className={styles.editorialCtaActions}>
              <Link to="/contact" className={styles.pillOliveButton}>
                <span>Schedule a Consultation</span>
                <span className={styles.pillArrow}>↗</span>
              </Link>
              <a href="tel:+15550100000" className={styles.editorialCallBtn}>
                Call +1 (555) 010-0000
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}