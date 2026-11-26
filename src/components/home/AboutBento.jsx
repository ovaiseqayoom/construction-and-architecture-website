import React from "react";
import { Link } from "react-router-dom";
import {
  FaSquare,
  FaMicrochip,
  FaAward,
  FaShieldAlt,
  FaBuilding,
  FaArrowRight,
} from "react-icons/fa";
const officeImage = "/images/about/studio-office.webp";
import styles from "./AboutBento.module.css";

const CREDENTIAL_PILLARS = [
  {
    icon: <FaAward />,
    title: "Integrated Design-Build",
    desc: "Unified architectural design, structural analysis, and field execution under one roof.",
  },
  {
    icon: <FaShieldAlt />,
    title: "Seismic-Code Compliance",
    desc: "Rigorous ductile framing, finite-element drift audits, and material testing.",
  },
  {
    icon: <FaBuilding />,
    title: "Transparent BOQ Delivery",
    desc: "Line-item Bills of Quantities and milestone scheduling with zero hidden markups.",
  },
];

export default function AboutBento() {
  return (
    <section className={styles.aboutSection} aria-labelledby="about-bento-title">
      <svg width="0" height="0" className={styles.clipDefSvg} aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="about-bento-notch-clip" clipPathUnits="objectBoundingBox">
            <path d="
              M 0.08 0
              L 0.295 0
              C 0.310 0, 0.314 0.018, 0.314 0.038
              L 0.314 0.052
              C 0.314 0.084, 0.366 0.084, 0.366 0.052
              L 0.366 0.038
              C 0.366 0.018, 0.370 0, 0.385 0
              L 0.92 0
              C 0.965 0, 1 0.035, 1 0.08
              L 1 0.575
              C 1 0.590, 0.982 0.594, 0.962 0.594
              L 0.948 0.594
              C 0.916 0.594, 0.916 0.646, 0.948 0.646
              L 0.962 0.646
              C 0.982 0.646, 1 0.650, 1 0.665
              L 1 0.92
              C 1 0.965, 0.965 1, 0.92 1
              L 0.08 1
              C 0.035 1, 0 0.965, 0 0.92
              L 0 0.665
              C 0 0.650, 0.018 0.646, 0.038 0.646
              L 0.052 0.646
              C 0.084 0.646, 0.084 0.594, 0.052 0.594
              L 0.038 0.594
              C 0.018 0.594, 0 0.590, 0 0.575
              L 0 0.08
              C 0 0.035, 0.035 0, 0.08 0
              Z
            " />
          </clipPath>

          <clipPath id="about-bento-notch-clip-mobile" clipPathUnits="objectBoundingBox">
            <path d="
              M 0.07 0
              L 0.315 0
              C 0.326 0, 0.330 0.025, 0.330 0.048
              L 0.330 0.062
              C 0.330 0.105, 0.370 0.105, 0.370 0.062
              L 0.370 0.048
              C 0.370 0.025, 0.374 0, 0.385 0
              L 0.93 0
              C 0.970 0, 1 0.045, 1 0.10
              L 1 0.56
              C 1 0.580, 0.980 0.585, 0.962 0.585
              L 0.950 0.585
              C 0.915 0.585, 0.915 0.655, 0.950 0.655
              L 0.962 0.655
              C 0.980 0.655, 1 0.660, 1 0.68
              L 1 0.90
              C 1 0.955, 0.970 1, 0.93 1
              L 0.07 1
              C 0.030 1, 0 0.955, 0 0.90
              L 0 0.68
              C 0 0.660, 0.020 0.655, 0.038 0.655
              L 0.050 0.655
              C 0.085 0.655, 0.085 0.585, 0.050 0.585
              L 0.038 0.585
              C 0.020 0.585, 0 0.580, 0 0.56
              L 0 0.10
              C 0 0.045, 0.030 0, 0.07 0
              Z
            " />
          </clipPath>
        </defs>
      </svg>

      <div className={styles.container}>
        <div className={styles.desktopView}>
          <div className={styles.editorialGrid}>
            <div className={styles.headerBlock}>
              <div className={styles.tagRow}>
                <span className={styles.tagSquare} aria-hidden="true" />
                <span className={styles.tagText}>About Structura</span>
              </div>

              <h2 id="about-bento-title" className={styles.mainTitle}>
                Engineering you can trust
              </h2>

              <p className={styles.leadParagraph}>
                Structura Architecture &amp; Construction delivers client-first civil, structural, and architectural solutions, pairing engineering code discipline with ground-up turnkey execution.
              </p>
            </div>

            <div className={styles.imageCol}>
              <div className={`${styles.imageFrame} ${styles.customNotchShape}`}>
                <img
                  src={officeImage}
                  alt="Structura Architecture and Construction Studio"
                  className={styles.showcaseImg}
                  loading="lazy"
                  decoding="async"
                  width="800"
                  height="500"
                />
              </div>
            </div>

            <div className={styles.pillarsList}>
              {CREDENTIAL_PILLARS.map((pillar, idx) => (
                <div key={idx} className={styles.pillarRow}>
                  <div className={styles.pillarIconBox} aria-hidden="true">
                    {pillar.icon}
                  </div>
                  <div className={styles.pillarText}>
                    <h3 className={styles.pillarTitle}>{pillar.title}</h3>
                    <p className={styles.pillarDesc}>{pillar.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.actionRow}>
              <Link to="/about" className={styles.primaryBtn} aria-label="Learn more about Structura">
                <span>Learn more about us</span>
                <FaArrowRight className={styles.arrowIcon} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.mobileView}>
          <div className={styles.splitHeaderContainer}>
            <div className={styles.splitHeaderLeft}>
              <div className={styles.sectionTagRow}>
                <FaSquare className={styles.tagSquareIcon} aria-hidden="true" />
                <span>About us</span>
              </div>
              <h2 className={styles.splitTitle}>
                Driven by quality <span className={styles.titleGrey}>&amp; precision</span>
              </h2>
            </div>

            <div className={styles.splitHeaderRight}>
              <p className={styles.splitDesc}>
                Delivering client-first civil and architectural engineering by pairing corporate standards with deep regional expertise.
              </p>
            </div>
          </div>

          <div className={styles.bentoGrid}>
            <div className={`${styles.imageCard} ${styles.customNotchShape}`}>
              <img
                src={officeImage}
                alt="Structura Architecture and Construction Studio"
                className={styles.officeImg}
                loading="lazy"
                decoding="async"
                width="600"
                height="380"
              />
            </div>

            <div className={`${styles.bentoCard} ${styles.cardLarge}`}>
              <div className={styles.cardContentRelative}>
                <div className={styles.brandHeader}>
                  <span className={styles.brandName}>
                    Structura Architecture &amp; Construction
                  </span>
                  <div className={styles.brandLine} />
                </div>

                <div className={styles.bigStatNum}>2018</div>
                <p className={styles.bentoText}>
                  Multidisciplinary studio delivering licensed architecture, structural engineering, and transparent turnkey builds.
                </p>

                <div className={styles.avatarStack} aria-label="Leadership team avatars">
                  <div className={styles.avatar} title="Daniel Reyes">D</div>
                  <div className={styles.avatar} title="Elena Cho">E</div>
                  <div className={styles.avatar} title="Marcus Patel">M</div>
                  <div className={styles.avatarPlus} aria-hidden="true">+</div>
                </div>
              </div>
            </div>

            <div className={styles.bentoStack}>
              <div className={styles.bentoCard}>
                <div className={styles.cardIconBox} aria-hidden="true">
                  <FaMicrochip />
                </div>
                <h3 className={styles.cardSmallTitle}>Modern technology</h3>
                <p className={styles.cardSmallDesc}>
                  We integrate 3D BIM coordination, elevation studies, and finite-element modeling for precision.
                </p>
              </div>

              <div className={styles.bentoCard}>
                <div className={styles.cardIconBox} aria-hidden="true">
                  <FaAward />
                </div>
                <div className={styles.mediumStatNum}>LOD 350</div>
                <p className={styles.cardSmallDesc}>
                  Coordinated architectural, structural, and MEP documentation prior to groundbreaking.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.sectionFooter}>
            <Link to="/about" className={styles.aboutBtn}>
              <span>Learn more about us</span>
              <span className={styles.aboutBtnArrow}>
                <FaArrowRight />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
