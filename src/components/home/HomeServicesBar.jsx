import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaChevronRight } from "react-icons/fa";
import styles from "./HomeServicesBar.module.css";

const SERVICES_CARDS = [
  {
    num: "01",
    category: "Architecture + Design",
    title: "Bespoke 3D Elevations & Spatial Masterplans",
    desc: "Comprehensive 2D spatial layouts, photorealistic 3D exterior elevations, and passive solar orientation.",
    link: "/services/architectural-design",
    image: "/images/projects/courtyard-villa.webp",
    alt: "Structura 3D Architectural Design",
  },
  {
    num: "02",
    category: "Bespoke Interiors",
    title: "Timeless Residential & Commercial Interior Architecture",
    desc: "Precision factory-manufactured modular kitchens, custom wardrobes, and moisture-resistant millwork.",
    link: "/services/interior-modular-design",
    image: "/images/projects/studio-fitout.webp",
    alt: "Structura Modular Interior Design",
  },
  {
    num: "03",
    category: "Structural Integrity",
    title: "Seismic-Compliant High-Performance Engineering",
    desc: "Code-verified ductile structural frames, retaining walls, and finite-element load modeling.",
    link: "/services/structural-engineering",
    image: "/images/home/structural-frame.webp",
    alt: "Structura Structural Engineering",
  },
  {
    num: "04",
    category: "Turnkey Execution",
    title: "Full-Cycle Turnkey Civil Construction & Site Execution",
    desc: "End-to-end site execution, material procurement, and project management for commercial spaces and villas.",
    link: "/services/turnkey-construction",
    image: "/images/home/quality-inspection.webp",
    alt: "Structura Turnkey Construction",
  },
];

export default function HomeServicesBar() {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const scrollContainerRef = useRef(null);

  const activeIdx = hoveredIdx !== null ? hoveredIdx : 2;

  const handleScrollNext = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  return (
    <section className={styles.servicesBarSection} aria-label="Core Engineering Services">
      <div className={styles.barOuter}>
        <div
          ref={scrollContainerRef}
          className={styles.cardsTrack}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {SERVICES_CARDS.map((card, idx) => {
            const isActive = activeIdx === idx;

            return (
              <Link
                key={card.num}
                to={card.link}
                className={`${styles.serviceCard} ${isActive ? styles.cardActive : ""}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                aria-label={`${card.title} - Read more`}
              >
                <div className={styles.bgImageStage} aria-hidden="true">
                  <img
                    src={card.image}
                    alt={card.alt}
                    className={styles.bgCardImg}
                    loading="lazy"
                    decoding="async"
                    width="600"
                    height="400"
                    onError={(e) => {
                      if (!e.currentTarget.src.endsWith("/images/services/turnkey-construction.svg")) {
                        e.currentTarget.src = "/images/services/turnkey-construction.svg";
                      }
                    }}
                  />
                  <div className={styles.bgDarkOverlay} />
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.topMetaRow}>
                    <span className={styles.categoryTag}>{card.category}</span>
                  </div>

                  <div className={styles.titleGroup}>
                    <h3 className={styles.cardTitle}>{card.title}</h3>
                    <div className={styles.underlineRule} aria-hidden="true" />
                  </div>

                  <div className={styles.bottomRow}>
                    <div className={styles.readMoreWrapper}>
                      <span className={styles.readMoreText}>Read more</span>
                      <FaArrowRight className={styles.readMoreArrow} aria-hidden="true" />
                    </div>

                    <span className={styles.romanNumber} aria-hidden="true">
                      {card.num}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          className={styles.nextScrollBtn}
          onClick={handleScrollNext}
          aria-label="Scroll services right"
        >
          <FaChevronRight />
        </button>
      </div>
    </section>
  );
}
