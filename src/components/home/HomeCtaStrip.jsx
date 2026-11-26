import React from "react";
import { FaArrowRight, FaPhoneAlt, FaCheckCircle, FaDraftingCompass } from "react-icons/fa";
import { SEO_ENTITY } from "../../config/seo.config";
import { getTelUrl } from "../../utils/contactLinks";
import styles from "./HomeCtaStrip.module.css";

export default function HomeCtaStrip({ onOpenContactModal, theme = "default" }) {
  const isServicesTheme = theme === "services";

  return (
    <section
      className={`${styles.ctaSection} ${isServicesTheme ? styles.servicesThemeSection : ""}`}
      aria-label="Start Your Project"
    >
      <div className={styles.container}>
        <div className={styles.innerCard}>
          <div className={styles.bgGridPattern} aria-hidden="true" />

          <div className={styles.contentWrap}>
            <div className={styles.eyebrowRow}>
              <span className={styles.eyebrowIcon}>
                <FaDraftingCompass />
              </span>
              <span className={styles.eyebrowText}>
                Architecture &amp; Structural Precision
              </span>
            </div>

            <h2 className={styles.title}>
              Ready to turn your vision into an enduring space?
            </h2>

            <p className={styles.subtitle}>
              Whether you need turnkey commercial construction, seismic structural validation, or complete 3D architectural blueprints, our licensed engineers are ready to build with you.
            </p>

            <div className={styles.actionGroup}>
              <button
                type="button"
                className={`${styles.primaryBtn} ${isServicesTheme ? styles.servicesPrimaryBtn : ""}`}
                onClick={onOpenContactModal}
                aria-haspopup="dialog"
              >
                <span>Start your project</span>
                <FaArrowRight className={styles.btnArrow} />
              </button>

              <a
                href={getTelUrl()}
                className={styles.secondaryCallBtn}
                aria-label="Call studio office directly"
              >
                <FaPhoneAlt className={styles.phoneIcon} />
                <span>Call {SEO_ENTITY.primaryPhone}</span>
              </a>
            </div>

            <div className={styles.trustPillsRow}>
              <div className={styles.trustPill}>
                <FaCheckCircle className={styles.trustCheck} />
                <span>Licensed Structural &amp; BIM Team</span>
              </div>
              <span className={styles.pillDivider} aria-hidden="true">•</span>
              <div className={styles.trustPill}>
                <FaCheckCircle className={styles.trustCheck} />
                <span>Seismic-Code Compliant Design</span>
              </div>
              <span className={styles.pillDivider} aria-hidden="true">•</span>
              <div className={styles.trustPill}>
                <FaCheckCircle className={styles.trustCheck} />
                <span>Free Initial Assessment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
