import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaSquare,
  FaMapMarkerAlt,
  FaClock,
  FaArrowRight,
} from "react-icons/fa";
import { getProjectCoverUrl } from "../../utils";
import styles from "./FeaturedProjects.module.css";

function ProjectCardImage({ src, alt, title }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={styles.cardImageWrapper}>
      {!isLoaded && <div className={styles.skeletonShimmer} aria-hidden="true" />}
      <img
        src={src}
        alt={alt}
        title={title}
        loading="lazy"
        decoding="async"
        width="800"
        height="500"
        className={`${styles.cardImg} ${isLoaded ? styles.cardImgLoaded : styles.cardImgLoading}`}
        onLoad={() => setIsLoaded(true)}
      />
      <div className={styles.cardImageOverlay} />
    </div>
  );
}

function FeaturedProjectsSkeleton() {
  return (
    <div className={styles.grid} role="status" aria-label="Loading featured engineering projects">
      {[0, 1, 2, 3].map((idx) => (
        <div key={`fp-skeleton-${idx}`} className={`${styles.projectCard} ${styles.skeletonCard}`} aria-hidden="true">
          <div className={`${styles.cardImageWrapper} ${styles.skeletonImage}`}>
            <div className={styles.skeletonShimmer} />
          </div>
          <div className={styles.cardBody}>
            <div className={styles.metaHeaderRow}>
              <div className={styles.skeletonCategoryBadge} />
              <div className={styles.skeletonIndexBadge} />
            </div>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonSummaryLine} />
            <div className={styles.skeletonSummaryLineShort} />
            <div className={styles.cardMeta}>
              <div className={styles.skeletonMetaPill} />
            </div>
            <div className={styles.skeletonActionBtn}>
              <div className={styles.skeletonBtnText} />
              <div className={styles.skeletonBtnCircle} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FeaturedProjects({
  projects = [],
  loading = false,
  onOpenModal,
}) {
  const explicitlyFeatured = projects.filter(
    (p) => Boolean(p.is_featured || p.isFeatured)
  );

  const featured = explicitlyFeatured.length >= 4
    ? explicitlyFeatured.slice(0, 4)
    : [
        ...explicitlyFeatured,
        ...projects.filter((p) => !explicitlyFeatured.some((ef) => (ef.id || ef.slug) === (p.id || p.slug)))
      ].slice(0, 4);

  return (
    <section className={styles.projectsPreview} aria-labelledby="featured-projects-title">
      <div className={styles.container}>
        <div className={styles.splitHeaderContainer}>
          <div className={styles.splitHeaderLeft}>
            <div className={styles.sectionTagRow}>
              <FaSquare className={styles.tagSquareIcon} aria-hidden="true" />
              <span>Featured portfolio</span>
            </div>
            <h2 id="featured-projects-title" className={styles.splitTitle}>
              Engineering in practice
            </h2>
          </div>

          <div className={styles.splitHeaderRight}>
            <p className={styles.splitDesc}>
              A curated selection of our architectural planning, structural engineering, and precision construction developments.
            </p>
          </div>
        </div>

        {loading ? (
          <FeaturedProjectsSkeleton />
        ) : featured.length === 0 ? (
          <div className={styles.statusBox}>
            No featured projects available.
          </div>
        ) : (
          <div className={styles.grid}>
            {featured.map((project, idx) => {
              const cover = getProjectCoverUrl(project);
              const projectId = project.id || project.slug || idx;

              return (
                <article
                  key={projectId}
                  className={styles.projectCard}
                  onClick={() => onOpenModal && onOpenModal(project)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (onOpenModal) onOpenModal(project);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View project details for ${project.title}`}
                >
                  <ProjectCardImage
                    src={cover}
                    alt={`${project.title} - ${project.category || "Architecture"} in ${project.location || "Design District"}`}
                    title={`${project.title} | Structura Studio`}
                  />

                  <div className={styles.cardBody}>
                    <div className={styles.metaHeaderRow}>
                      {project.category && (
                        <span className={styles.categoryBadge}>{project.category}</span>
                      )}
                      <span className={styles.projectIndex}>
                        {String(idx + 1).padStart(2, "0")} / {String(featured.length).padStart(2, "0")}
                      </span>
                    </div>

                    <h3 className={styles.cardTitle} title={project.title}>
                      <Link
                        to={`/projects/${project.slug || project.id}`}
                        className={styles.cardTitleLink}
                        onClick={(e) => {
                          if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0 && onOpenModal) {
                            e.preventDefault();
                            onOpenModal(project);
                          }
                        }}
                      >
                        {project.title}
                      </Link>
                    </h3>

                    <p className={styles.cardSummary}>
                      {project.summary || project.description}
                    </p>

                    <div className={styles.cardMeta}>
                      <div className={styles.metaItem} title={project.location || ""}>
                        <FaMapMarkerAlt className={styles.metaIcon} aria-hidden="true" />
                        <span>{project.location || "Location on Request"}</span>
                      </div>
                      {(project.duration || project.year) && (
                        <div className={`${styles.metaItem} ${styles.metaItemDuration}`} title={project.duration || project.year}>
                          <FaClock className={styles.metaIcon} aria-hidden="true" />
                          <span>{project.duration || project.year}</span>
                        </div>
                      )}
                    </div>

                    <Link
                      to={`/projects/${project.slug || project.id}`}
                      className={styles.viewDetailBtn}
                      onClick={(e) => {
                        if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0 && onOpenModal) {
                          e.preventDefault();
                          onOpenModal(project);
                        }
                      }}
                      aria-label={`Explore project ${project.title}`}
                    >
                      <span>Explore project</span>
                      <div className={styles.arrowCircle}>
                        <FaArrowRight className={styles.linkArrow} aria-hidden="true" />
                      </div>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className={styles.viewAllWrapper}>
          <Link
            to="/projects"
            className={styles.viewAllBtn}
            aria-label="View All Projects Portfolio"
            onClick={() => window.dispatchEvent(new CustomEvent("resetProjectFilters"))}
          >
            <span>View all projects</span>
            <span className={styles.btnArrow}>
              <FaArrowRight />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
