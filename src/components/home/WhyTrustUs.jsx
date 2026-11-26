import React, { useEffect, useRef } from "react";
import { FaSquare } from "react-icons/fa";
import styles from "./WhyTrustUs.module.css";

const TRUST_MOSAIC_IMAGES = {
  seismic: "/images/home/structural-frame.webp",
  turnkey: "/images/home/cad-drafting.webp",
  quality: "/images/home/quality-inspection.webp",
};

export default function WhyTrustUs() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry], obs) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.isVisible);
          obs.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={styles.whyTrustSection}
      aria-labelledby="why-trust-title"
    >
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTagRow}>
            <FaSquare className={styles.tagSquareIcon} aria-hidden="true" />
            <span>Why choose us</span>
          </div>
          <h2 id="why-trust-title" className={styles.mainTitle}>
            Why clients trust Structura
          </h2>
          <p className={styles.mainDesc}>
            Combining geotechnical precision with disciplined structural engineering to deliver safe, enduring residential and commercial spaces.
          </p>
        </div>

        <div className={styles.mosaicGrid}>
          <div className={`${styles.mosaicTile} ${styles.mosaicImgTile} ${styles.areaSeismicImg}`}>
            <img
              src={TRUST_MOSAIC_IMAGES.seismic}
              alt="Ductile Seismic Concrete Framework"
              className={styles.mosaicImg}
              loading="lazy"
              decoding="async"
              width="600"
              height="400"
            />
          </div>

          <div className={`${styles.mosaicTile} ${styles.mosaicCard} ${styles.mosaicTurnkeyCard} ${styles.areaTurnkeyCard}`}>
            <div className={styles.mosaicCardInner}>
              <span className={styles.mosaicCardBadge}>02 / Execution</span>
              <h3 className={styles.mosaicCardTitle}>Unified Turnkey Delivery</h3>
              <p className={styles.mosaicCardText}>
                Eliminate contractor disputes through single-window accountability. We manage every phase from initial 3D concept elevations and municipal approvals to turnkey on-site framing, electrical-plumbing integration, and final handover.
              </p>
              <ul className={styles.cardFeaturesList}>
                <li>
                  <span className={styles.featureBullet} />
                  <span>BIM &amp; photorealistic 3D elevations</span>
                </li>
                <li>
                  <span className={styles.featureBullet} />
                  <span>Municipal approvals &amp; sanction drawings</span>
                </li>
                <li>
                  <span className={styles.featureBullet} />
                  <span>Guaranteed timelines &amp; transparent milestones</span>
                </li>
              </ul>
            </div>
          </div>

          <div className={`${styles.mosaicTile} ${styles.mosaicImgTile} ${styles.areaQualityImg}`}>
            <img
              src={TRUST_MOSAIC_IMAGES.quality}
              alt="Multi-Stage On-Site Structural Inspection and Quality Control"
              className={styles.mosaicImg}
              loading="lazy"
              decoding="async"
              width="600"
              height="400"
            />
          </div>

          <div className={`${styles.mosaicTile} ${styles.mosaicCard} ${styles.mosaicSeismicCard} ${styles.areaSeismicCard}`}>
            <div className={styles.mosaicCardInner}>
              <span className={styles.mosaicCardBadge}>01 / Resilience</span>
              <h3 className={styles.mosaicCardTitle}>Ductile Seismic Engineering</h3>
              <p className={styles.mosaicCardText}>
                Engineered for lateral seismic resilience, sloped topography, and heavy environmental snow and wind loads through code-verified framing and geotechnical alignment.
              </p>
              <ul className={styles.cardFeaturesList}>
                <li>
                  <span className={styles.featureBullet} />
                  <span>ACI 318 &amp; Eurocode 8 ductile compliance</span>
                </li>
                <li>
                  <span className={styles.featureBullet} />
                  <span>Bioclimatic thermal &amp; snow-load calculations</span>
                </li>
                <li>
                  <span className={styles.featureBullet} />
                  <span>Site-specific geotechnical soil analysis</span>
                </li>
              </ul>
            </div>
          </div>

          <div className={`${styles.mosaicTile} ${styles.mosaicImgTile} ${styles.areaTurnkeyImg}`}>
            <img
              src={TRUST_MOSAIC_IMAGES.turnkey}
              alt="Architectural Drafting, CAD Modeling and Structural Plans"
              className={styles.mosaicImg}
              loading="lazy"
              decoding="async"
              width="600"
              height="400"
            />
          </div>

          <div className={`${styles.mosaicTile} ${styles.mosaicCard} ${styles.mosaicQualityCard} ${styles.areaQualityCard}`}>
            <div className={styles.mosaicCardInner}>
              <span className={styles.mosaicCardBadge}>03 / Integrity</span>
              <h3 className={styles.mosaicCardTitle}>Certified Materials &amp; QA/QC</h3>
              <p className={styles.mosaicCardText}>
                Uncompromising material standards at every milestone. We source certified high-ductility reinforcing steel, laboratory-tested concrete mixes, and audit rebar placement before every pour.
              </p>
              <ul className={styles.cardFeaturesList}>
                <li>
                  <span className={styles.featureBullet} />
                  <span>Certified ductile steel &amp; lab-tested concrete</span>
                </li>
                <li>
                  <span className={styles.featureBullet} />
                  <span>Mandatory pre-pour rebar &amp; slump audits</span>
                </li>
                <li>
                  <span className={styles.featureBullet} />
                  <span>100% itemized transparent BOQ pricing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}