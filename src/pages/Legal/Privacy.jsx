import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MetaTags from "../../components/common/SEO/MetaTags";
import { PAGE_SEO } from "../../config/seo.config";
import styles from "./Legal.module.css";

const SECTIONS = [
  { id: "collection", label: "01. Information Collected" },
  { id: "usage", label: "02. How Data Is Used" },
  { id: "confidentiality", label: "03. Drawing & CAD Confidentiality" },
  { id: "storage", label: "04. Retention & Security" },
  { id: "contact", label: "05. Privacy Contact" },
];

export default function Privacy() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState("collection");

  useEffect(() => {
    const onScroll = () => {
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el && el.getBoundingClientRect().top <= 140) {
          setActiveId(SECTIONS[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={styles.legalPage}>
      <MetaTags
        title={PAGE_SEO.privacy.title}
        description={PAGE_SEO.privacy.description}
        canonical={PAGE_SEO.privacy.canonical}
      />

      <button
        type="button"
        onClick={() => navigate(-1)}
        className={styles.floatingBackBtn}
        aria-label="Go back"
      >
        ← Back
      </button>

      <header className={styles.headerSection}>
        <div className={styles.headerInner}>
          <span className={styles.headerBadge}>LEGAL &amp; DATA GOVERNANCE</span>
          <h1 className={styles.pageTitle}>Privacy Policy</h1>
          <p className={styles.headerDescription}>
            How Structura Architecture &amp; Construction handles project inquiries, technical drawings, and visitor information.
          </p>
          <div className={styles.metaBar}>
            <span className={styles.metaItem}>Effective: January 2026</span>
            <span className={styles.metaDivider}>•</span>
            <span className={styles.metaItem}>Structura Architecture &amp; Construction</span>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.legalLayout}>
          <aside className={styles.sidebar} aria-label="Document sections">
            <p className={styles.tocTitle}>Contents</p>
            <nav className={styles.tocNav}>
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  style={{
                    fontWeight: activeId === s.id ? 600 : 400,
                    color: activeId === s.id ? "#0f172a" : undefined,
                  }}
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </aside>

          <main className={styles.contentSection}>
            <div className={styles.documentBody}>
              <article id="collection" className={styles.clause}>
                <span className={styles.clauseNumber}>CLAUSE 01</span>
                <h2 className={styles.clauseTitle}>Information We Collect</h2>
                <p>
                  When you submit a consultation inquiry, career application, or newsletter subscription, we collect only the contact details and project notes you choose to provide (such as name, email address, phone number, and project scope).
                </p>
              </article>

              <article id="usage" className={styles.clause}>
                <span className={styles.clauseNumber}>CLAUSE 02</span>
                <h2 className={styles.clauseTitle}>How We Use Submitted Information</h2>
                <ul className={styles.clauseList}>
                  <li>Preparing architectural feasibility responses and Bills of Quantities (BOQ).</li>
                  <li>Scheduling studio consultations or engineering site surveys.</li>
                  <li>Evaluating candidate portfolios submitted via the Careers form.</li>
                </ul>
              </article>

              <article id="confidentiality" className={styles.clause}>
                <span className={styles.clauseNumber}>CLAUSE 03</span>
                <h2 className={styles.clauseTitle}>Drawing &amp; CAD Confidentiality</h2>
                <p className={styles.editorialQuote}>
                  Client topographic surveys, BIM models, structural calculations, and site photographs remain strictly confidential and are never shared externally without written client authorization.
                </p>
              </article>

              <article id="storage" className={styles.clause}>
                <span className={styles.clauseNumber}>CLAUSE 04</span>
                <h2 className={styles.clauseTitle}>Retention &amp; Security</h2>
                <p>
                  Project records are retained only for active design, permitting, and statutory warranty periods. In local preview or demo deployments without configured environment variables, form submissions remain strictly local to your browser session.
                </p>
              </article>

              <article id="contact" className={styles.clause}>
                <span className={styles.clauseNumber}>CLAUSE 05</span>
                <h2 className={styles.clauseTitle}>Contact Us</h2>
                <div className={styles.contactBlock}>
                  <div className={styles.factList}>
                    <div className={styles.factRow}>
                      <span className={styles.factLabel}>Studio</span>
                      <span className={styles.factValue}>Structura Architecture &amp; Construction</span>
                    </div>
                    <div className={styles.factRow}>
                      <span className={styles.factLabel}>Address</span>
                      <span className={styles.factValue}>123 Architecture Ave, Design District</span>
                    </div>
                    <div className={styles.factRow}>
                      <span className={styles.factLabel}>Email</span>
                      <span className={styles.factValue}>
                        <a href="mailto:hello@example.com">hello@example.com</a>
                      </span>
                    </div>
                    <div className={styles.factRow}>
                      <span className={styles.factLabel}>Phone</span>
                      <span className={styles.factValue}>
                        <a href="tel:+15550100000">+1 (555) 010-0000</a>
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
