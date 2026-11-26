import React, { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaShareAlt,
  FaCheck,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaEnvelope,
  FaWhatsapp,
  FaExternalLinkAlt
} from "react-icons/fa";
import useScrollLock from "../../hooks/useScrollLock";
import MetaTags from "../common/SEO/MetaTags";
import ProjectGallery from "./ProjectGallery";
import {
  DEFAULT_PROJECT_DELIVERABLES,
  renderSmartCaseStudy,
  formatProjectShare,
  normalizeProjectGallery,
  extractProjectDescription,
  extractProjectHashtags,
  getProjectCoverUrl,
} from "../../utils";
import styles from "./ProjectDrawer.module.css";

const ContactModal = lazy(() => import("../common/ContactModal/ContactModal"));

export default function ProjectDrawer({
  isOpen,
  project,
  onClose,
  onNext,
  onPrev,
  currentIndex = 0,
  totalProjects = 1,
}) {
  const [copied, setCopied] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const handleRequestQuote = useCallback(() => {
    setContactOpen(true);
  }, []);

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onNext, onPrev]);

  const handleShare = useCallback(async () => {
    if (!project) return;
    const shareData = formatProjectShare(project);

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch (err) {
        if (err.name !== "AbortError") {
          await navigator.clipboard.writeText(shareData.url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2200);
        }
      }
    } else {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }, [project]);

  const coverImageUrl = getProjectCoverUrl(project);
  const normalizedGallery = normalizeProjectGallery(project);
  const galleryList = normalizedGallery.map((img) => img.url);

  const projectDeliverables = (project?.deliverables && project.deliverables.length > 0)
    ? project.deliverables
    : DEFAULT_PROJECT_DELIVERABLES;

  const { shortOverview, detailedDescription } = extractProjectDescription(project);
  const projectHashtags = extractProjectHashtags(project);

  const projectCanonicalUrl = project
    ? `${window.location.origin}/projects/${project.slug || project.id}`
    : `${window.location.origin}/projects`;

  const imageSchemaData = project ? {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    "name": project.title,
    "description": shortOverview,
    "image": galleryList.map((img) => (typeof img === "string" ? img : img.url || img.src)),
    "creator": {
      "@type": "Organization",
      "name": "Structura Architecture & Construction",
      "url": "https://example.com"
    },
    "locationCreated": {
      "@type": "Place",
      "name": project.location || "Design District"
    },
    ...(projectHashtags.length > 0 ? { keywords: projectHashtags.map((t) => t.replace(/^#/, "")).join(", ") } : {})
  } : null;

  return createPortal(
    <AnimatePresence>
      {isOpen && project && (
        <div className={styles.portalWrapper} role="dialog" aria-modal="true" aria-labelledby="modal-project-title">
          <MetaTags
            title={`${project.title} | Structura Architecture & Construction Portfolio`}
            description={shortOverview || `Architectural design and structural engineering for ${project.title} by Structura Architecture & Construction.`}
            keywords={projectHashtags.map((t) => t.replace(/^#/, ""))}
            canonical={projectCanonicalUrl}
            ogType="article"
            ogImage={coverImageUrl}
            schema={imageSchemaData}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={styles.backdrop}
            onClick={onClose}
          />

          <motion.aside
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 32,
              stiffness: 300,
              mass: 0.8
            }}
            className={styles.modalPanel}
            data-lenis-prevent="true"
          >
            <header className={styles.topBar}>
              <div className={styles.topBarInner}>
                <div className={styles.topBarLeft}>
                  <div className={styles.headerIndexBadge}>
                    <span className={styles.headerIndexDot} />
                    <span>Project {String(currentIndex + 1).padStart(2, "0")} / {String(totalProjects).padStart(2, "0")}</span>
                  </div>
                </div>

                <div className={styles.actionsGroup}>
                  <button
                    onClick={handleShare}
                    title="Share project link"
                    className={`${styles.iconBtn} ${copied ? styles.copiedActive : ""}`}
                    type="button"
                    aria-label="Share project link"
                  >
                    {copied ? (
                      <>
                        <FaCheck className={styles.successIcon} />
                        <span className={styles.copiedTooltip}>Link Copied!</span>
                      </>
                    ) : (
                      <FaShareAlt />
                    )}
                  </button>

                  <div className={styles.navControls}>
                    <button
                      onClick={onPrev}
                      aria-label="Previous project"
                      className={styles.iconBtn}
                      type="button"
                    >
                      <FaChevronLeft />
                    </button>
                    <button
                      onClick={onNext}
                      aria-label="Next project"
                      className={styles.iconBtn}
                      type="button"
                    >
                      <FaChevronRight />
                    </button>
                  </div>

                  <button
                    onClick={onClose}
                    aria-label="Close drawer"
                    className={styles.closeBtn}
                    type="button"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            </header>

            <div className={styles.scrollContent} data-lenis-prevent="true">
              <div className={styles.contentLayout}>
                <div className={styles.primaryColumn}>
                  <header className={styles.projectHeader}>
                    <h1 id="modal-project-title" className={styles.projectTitle}>{project.title}</h1>

                    <div className={styles.desktopMetaWrap}>
                      <div className={styles.metaRow}>
                        {project.location && (
                          <div className={styles.metaItem}>
                            <FaMapMarkerAlt className={styles.metaIcon} />
                            <span>{project.location}</span>
                          </div>
                        )}
                        {(project.duration || project.year) && (
                          <div className={styles.metaItem}>
                            <FaClock className={styles.metaIcon} />
                            <span>{project.duration || `Completed in ${project.year}`}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </header>

                  {galleryList && galleryList.length > 0 && (
                    <div className={styles.galleryContainer}>
                      <ProjectGallery
                        gallery={galleryList}
                        title={project.title}
                        category={project.category}
                        location={project.location}
                      />
                    </div>
                  )}

                  <div className={styles.mobileMetaWrap}>
                    <div className={styles.metaRow}>
                      {project.location && (
                        <div className={styles.metaItem}>
                          <FaMapMarkerAlt className={styles.metaIcon} />
                          <span>{project.location}</span>
                        </div>
                      )}
                      {(project.duration || project.year) && (
                        <div className={styles.metaItem}>
                          <FaClock className={styles.metaIcon} />
                          <span>{project.duration || `Completed in ${project.year}`}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {shortOverview && (
                    <section className={styles.editorialSection}>
                      <div className={styles.sectionHeader}>
                        <div className={styles.sectionEyebrow}>
                          <span className={styles.eyebrowDash} />
                          <span>Project Brief</span>
                        </div>
                        <h2 className={styles.sectionHeading}>
                          Architecture &amp; Concept Overview
                        </h2>
                      </div>
                      <div className={styles.editorialBody}>
                        {renderSmartCaseStudy(shortOverview, styles)}
                      </div>
                    </section>
                  )}

                  {detailedDescription && (
                    <section className={styles.editorialSection}>
                      <div className={styles.sectionHeader}>
                        <div className={styles.sectionEyebrow}>
                          <span className={styles.eyebrowDash} />
                          <span>Engineering Details</span>
                        </div>
                        <h2 className={styles.sectionHeading}>
                          Technical Scope &amp; Structural Execution
                        </h2>
                      </div>
                      <div className={styles.editorialBody}>
                        {renderSmartCaseStudy(detailedDescription, styles)}
                      </div>
                    </section>
                  )}

                  <section className={styles.editorialSection}>
                    <div className={styles.sectionHeader}>
                      <div className={styles.sectionEyebrow}>
                        <span className={styles.eyebrowDash} />
                        <span>Quality Assurance</span>
                      </div>
                      <h2 className={styles.sectionHeading}>
                        Key Project Deliverables
                      </h2>
                    </div>
                    <ul className={styles.deliverablesList}>
                      {projectDeliverables.map((item, idx) => (
                        <li key={idx} className={styles.deliverableItem}>
                          <FaCheckCircle className={styles.deliverableIcon} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  {projectHashtags.length > 0 && (
                    <div className={styles.bottomHashtagSection} aria-label="Project tags">
                      <span className={styles.bottomHashtagLabel}>Project Tags</span>
                      <div className={styles.hashtagRow}>
                        {projectHashtags.map((tag, idx) => (
                          <span key={idx} className={styles.hashtagPill}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <aside className={styles.sidebarColumn}>
                  <div className={styles.sidebarStickyCard}>
                    <div className={styles.sidebarHeader}>
                      <span className={styles.sidebarTag}>Project Advisory</span>
                      <h3 className={styles.sidebarTitle}>Planning a Similar Project?</h3>
                      <p className={styles.sidebarDesc}>
                        Consult directly with our principal architects and licensed structural engineers for turnkey planning, 3D modeling, and site execution.
                      </p>
                    </div>

                    <div className={styles.sidebarActions}>
                      <button
                        type="button"
                        onClick={handleRequestQuote}
                        className={styles.primaryActionBtn}
                      >
                        <FaEnvelope /> Request Project Quote
                      </button>

                      <Link
                        to={`/projects/${project.slug || project.id}`}
                        replace
                        title="Open dedicated standalone project case study"
                        className={styles.caseStudyLinkBtn}
                      >
                        <FaExternalLinkAlt /> Explore Case Study
                      </Link>

                      <a
                        href={`https://wa.me/15550100000?text=${encodeURIComponent(
                          `Hello Structura Studio, I am interested in discussing a project similar to "${project.title}".`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.whatsappActionBtn}
                      >
                        <FaWhatsapp /> Chat on WhatsApp
                      </a>
                    </div>

                    <div className={styles.projectSummaryBox}>
                      <div className={styles.summaryTitleRow}>
                        <span>Project Specifications</span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Category</span>
                        <span className={styles.summaryVal}>{project.category || "Engineering"}</span>
                      </div>
                      {project.location && (
                        <div className={styles.summaryRow}>
                          <span className={styles.summaryLabel}>Location</span>
                          <span className={styles.summaryVal}>{project.location}</span>
                        </div>
                      )}
                      {(project.duration || project.year) && (
                        <div className={styles.summaryRow}>
                          <span className={styles.summaryLabel}>Timeline</span>
                          <span className={styles.summaryVal}>{project.duration || project.year}</span>
                        </div>
                      )}
                      {project.supervision && (
                        <div className={styles.summaryRow}>
                          <span className={styles.summaryLabel}>Supervision</span>
                          <span className={styles.summaryVal}>{project.supervision}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </motion.aside>

          {contactOpen && (
            <Suspense fallback={null}>
              <ContactModal
                isOpen={contactOpen}
                onClose={() => setContactOpen(false)}
                initialService={project.category || "Architectural Design"}
              />
            </Suspense>
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}