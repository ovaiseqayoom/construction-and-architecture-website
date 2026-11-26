import React from "react";
import { FaAward, FaCompass, FaCubes, FaDraftingCompass, FaHardHat, FaLayerGroup, FaStar } from "react-icons/fa";
import { ShieldCheck } from "lucide-react";
import styles from "./BrandMarquee.module.css";

const BRAND_PLATFORMS = [
  {
    name: "ISO 9001 QA",
    sub: "Quality Management",
    logo: <ShieldCheck size={22} className={styles.brandImg} aria-hidden="true" />,
  },
  {
    name: "BIM LOD 350",
    sub: "Clash-Free Coordination",
    logo: <FaCubes size={20} className={styles.brandImg} aria-hidden="true" />,
  },
  {
    name: "Seismic Code",
    sub: "Ductile Structural Design",
    logo: <FaAward size={20} className={styles.brandImg} aria-hidden="true" />,
  },
  {
    name: "Client Reviews",
    sub: "4.9 ★ Rated",
    isRating: true,
    logo: <FaStar size={20} className={styles.brandImg} aria-hidden="true" />,
  },
  {
    name: "CSI MasterFormat",
    sub: "Transparent BOQ Spec",
    logo: <FaLayerGroup size={20} className={styles.brandImg} aria-hidden="true" />,
  },
  {
    name: "ASHRAE 90.1",
    sub: "Thermal Envelope Spec",
    logo: <FaCompass size={20} className={styles.brandImg} aria-hidden="true" />,
  },
  {
    name: "ACI 318 Spec",
    sub: "Structural Concrete QA",
    logo: <FaDraftingCompass size={20} className={styles.brandImg} aria-hidden="true" />,
  },
  {
    name: "OSHA Field Safety",
    sub: "Zero-LTI Site Protocol",
    logo: <FaHardHat size={20} className={styles.brandImg} aria-hidden="true" />,
  },
];

export default function BrandMarquee() {
  return (
    <section className={styles.brandMarqueeSection} aria-label="Engineering Standards and Accreditations">
      <div className={styles.brandMarqueeHeader}>
        <span className={styles.brandMarqueeEyebrow}>
          ENGINEERED TO INTERNATIONAL STRUCTURAL &amp; SUSTAINABILITY BENCHMARKS
        </span>
      </div>

      <div className={styles.brandMarqueeViewport}>
        <div className={styles.brandMarqueeTrack}>
          {BRAND_PLATFORMS.map((item, idx) => (
            <div key={`brand-primary-${idx}`} className={styles.brandItem}>
              <div className={styles.logoHolder}>{item.logo}</div>
              <div className={styles.brandTextLockup}>
                <span className={styles.brandPrimary}>{item.name}</span>
                {item.isRating ? (
                  <span className={styles.brandRating}>
                    4.9 <FaStar className={styles.starIcon} aria-hidden="true" /> Rated
                  </span>
                ) : (
                  <span className={styles.brandSecondary}>{item.sub}</span>
                )}
              </div>
            </div>
          ))}

          {BRAND_PLATFORMS.map((item, idx) => (
            <div key={`brand-duplicate-${idx}`} className={styles.brandItem} aria-hidden="true">
              <div className={styles.logoHolder}>{item.logo}</div>
              <div className={styles.brandTextLockup}>
                <span className={styles.brandPrimary}>{item.name}</span>
                {item.isRating ? (
                  <span className={styles.brandRating}>
                    4.9 <FaStar className={styles.starIcon} /> Rated
                  </span>
                ) : (
                  <span className={styles.brandSecondary}>{item.sub}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.bottomLineContainer} aria-hidden="true">
        <div className={styles.thinBottomSliderLine} />
      </div>
    </section>
  );
}
