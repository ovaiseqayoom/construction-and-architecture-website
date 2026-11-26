import React from "react";
import { Link } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import styles from "./AboutHero.module.css";

const defaultHeroImage = "/images/about/studio-office.webp";
const fallbackOffice = "/images/about/studio-office.webp";

const FEATURE_COLUMNS = [
  {
    title: "Architectural Planning",
    link: "/services/architectural-design",
    desc: "Bespoke 3D elevations and spatial layouts adapted to site terrain.",
  },
  {
    title: "Structural Engineering",
    link: "/services/structural-engineering",
    desc: "Seismic-resilient ductile structural frames and foundation engineering.",
  },
  {
    title: "Turnkey Construction",
    link: "/services/turnkey-construction",
    desc: "Full-cycle site execution with transparent BOQs and milestone audits.",
  },
  {
    title: "Bespoke Interiors",
    link: "/services/interior-modular-design",
    desc: "Timeless livable spaces with modular joinery and thermal comfort.",
  },
];

export default function AboutHero({
  title = "Thoughtful Design, Enduring Engineering",
  subtitle = "An integrated architecture and engineering studio crafting resilient homes and inspiring spaces.",
  ctaText = "Meet our team",
  ctaLink = "#team-roster",
  heroImage,
  galleryImages = [],
}) {
  const displayImage = heroImage || galleryImages[0] || defaultHeroImage;

  const handleScrollToSection = (e) => {
    if (ctaLink.startsWith("#")) {
      e.preventDefault();
      const targetId = ctaLink.substring(1);
      const element = document.getElementById(targetId) || document.getElementById("corporate-profile");
      if (element) {
        if (window.lenis) {
          window.lenis.scrollTo(element, { offset: -60 });
        } else {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  return (
    <div className={styles.heroWrapperBlock}>
      <section className={styles.heroSection} aria-labelledby="about-hero-title">
        <div className={styles.heroBgWrapper}>
          <img
            src={displayImage}
            alt="Structura Architecture and Construction Studio"
            className={styles.heroBgImg}
            loading="eager"
            decoding="async"
            width="1920"
            height="1080"
            onError={(e) => {
              if (e.currentTarget.src !== fallbackOffice) {
                e.currentTarget.src = fallbackOffice;
              }
            }}
          />
          <div className={styles.heroOverlay} />
        </div>

        <div className={styles.heroContentContainer}>
          <div className={styles.breadcrumb}>
            <FaHome className={styles.homeIcon} aria-hidden="true" />
            <Link to="/" className={styles.breadcrumbLink}>Home</Link>
            <span className={styles.slash}>/</span>
            <strong className={styles.activeBreadcrumb}>About Us</strong>
          </div>

          <h1 id="about-hero-title" className={styles.mainHeadline}>
            {title}
          </h1>

          {subtitle && (
            <p className={styles.subParagraph}>
              {subtitle}
            </p>
          )}

          <div className={styles.ctaWrapper}>
            <a
              href={ctaLink}
              onClick={handleScrollToSection}
              className={styles.pillButton}
              aria-label={ctaText}
            >
              <span>{ctaText}</span>
              <span className={styles.pillArrow} aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

      <section className={styles.featureBarSection} aria-label="Core Engineering Disciplines">
        <div className={styles.featureBarContainer}>
          <div className={styles.featureGrid}>
            {FEATURE_COLUMNS.map((col, idx) => (
              <Link key={idx} to={col.link} className={styles.featureCard}>
                <div className={styles.featureCardHeader}>
                  <h2 className={styles.featureCardTitle}>{col.title}</h2>
                  <span className={styles.featureArrow} aria-hidden="true">↗</span>
                </div>
                <p className={styles.featureCardDesc}>{col.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}