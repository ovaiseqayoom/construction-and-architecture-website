import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MetaTags from "../../components/common/SEO/MetaTags";
import { PAGE_SEO } from "../../config/seo.config";
import styles from "./Legal.module.css";

const SECTIONS = [
  { id: "scope", label: "01. Scope of Engagement" },
  { id: "codes", label: "02. Engineering Codes & Drawings" },
  { id: "boq", label: "03. BOQ & Payment Milestones" },
  { id: "ip", label: "04. Intellectual Property" },
  { id: "contact", label: "05. Studio Notice" },
];

export default function Terms() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState("scope");

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
        title={PAGE_SEO.terms.title}
        description={PAGE_SEO.terms.description}
        canonical={PAGE_SEO.terms.canonical}
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
          <span className={styles.headerBadge}>SERVICE AGREEMENT TEMPLATE</span>
          <h1 className={styles.pageTitle}>Terms &amp; Conditions</h1>
          <p className={styles.headerDescription}>
            General terms governing architectural consultancy, structural engineering deliverables, and turnkey construction engagements.
          </p>
          <div className={styles.metaBar}>
            <span className={styles.metaItem}>Updated: January 2026</span>
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
              <article id="scope" className={styles.clause}>
                <span className={styles.clauseNumber}>CLAUSE 01</span>
                <h2 className={styles.clauseTitle}>Scope of Engagement</h2>
                <p>
                  Architectural planning, structural calculations, and turnkey construction scopes are governed by written project proposals and approved Bills of Quantities (BOQ). Conceptual website tools and schematic cost estimators provide preliminary planning guidance only.
                </p>
              </article>

              <article id="codes" className={styles.clause}>
                <span className={styles.clauseNumber}>CLAUSE 02</span>
                <h2 className={styles.clauseTitle}>Engineering Codes &amp; Site Conditions</h2>
                <ul className={styles.clauseList}>
                  <li>Structural designs assume verified geotechnical bearing capacity and accurate survey boundaries.</li>
                  <li>Field modifications deviating from Issued-For-Construction drawings require written structural sign-off.</li>
                </ul>
              </article>

              <article id="boq" className={styles.clause}>
                <span className={styles.clauseNumber}>CLAUSE 03</span>
                <h2 className={styles.clauseTitle}>BOQ &amp; Milestone Billing</h2>
                <p className={styles.editorialQuote}>
                  Turnkey contracts are structured around transparent line-item specifications and verified physical site milestones.
                </p>
              </article>

              <article id="ip" className={styles.clause}>
                <span className={styles.clauseNumber}>CLAUSE 04</span>
                <h2 className={styles.clauseTitle}>Intellectual Property</h2>
                <p>
                  Architectural drawings, BIM models, and specifications remain studio instruments of service licensed for execution on the designated project parcel upon milestone settlement.
                </p>
              </article>

              <article id="contact" className={styles.clause}>
                <span className={styles.clauseNumber}>CLAUSE 05</span>
                <h2 className={styles.clauseTitle}>Studio Contact</h2>
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
