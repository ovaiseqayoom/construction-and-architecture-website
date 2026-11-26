// Page: ProjectDetail — src/pages/Projects/ProjectDetail.jsx
import React, { useState, useEffect, lazy, Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import MetaTags from "../../components/common/SEO/MetaTags";
import { SEO_ENTITY } from "../../config/seo.config";
import {
  FaArrowLeft,
  FaArrowRight,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaWhatsapp,
  FaEnvelope,
  FaShareAlt,
  FaCheck,
  FaBuilding,
  FaSquare,
  FaHome,
} from "react-icons/fa";
import { API_ENDPOINTS } from "../../config/api";
import ProjectGallery from "../../components/projects/ProjectGallery";
import galleryStyles from "../../components/projects/ProjectGallery.module.css";
import { supabase } from "../../lib/supabaseClient";
import {
  normalizeProject,
  fetchLiveProjects,
  getProjectCoverUrl,
  extractProjectDescription,
  extractProjectHashtags,
  normalizeProjectGallery,
  formatProjectShare,
  renderSmartCaseStudy,
  DEFAULT_PROJECT_DELIVERABLES,
} from "../../utils";
import styles from "./ProjectDetail.module.css";

const ContactModal = lazy(() => import("../../components/common/ContactModal/ContactModal"));

function ProjectDetailSkeleton() {
  return (
    <div className={styles.pageWrapper} aria-busy="true" aria-label="Loading project case study">
      <div className={styles.container}>
        <nav className={styles.topUtilityBar} aria-label="Project breadcrumb navigation">
          <div className={styles.breadcrumbPath}>
            <Link to="/" className={styles.crumbLink}>
              <FaHome className={styles.crumbHomeIcon} /> Home
            </Link>
            <span className={styles.crumbSep}>/</span>
            <Link to="/projects" className={styles.crumbLink}>
              Projects
            </Link>
            <span className={styles.crumbSep}>/</span>
            <span className={`${styles.skeletonPill} ${styles.skeletonShimmer}`} style={{ width: "140px", display: "inline-block" }} />
          </div>

          <div className={styles.topActions}>
            <Link
              to="/projects"
              className={styles.backBtn}
              aria-label="Return to all portfolio projects"
              onClick={(e) => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  e.preventDefault();
                  window.history.back();
                }
              }}
            >
              <FaArrowLeft className={styles.backIcon} />
              <span>All Projects</span>
            </Link>

            <button
              className={styles.shareBtn}
              type="button"
              disabled
              style={{ opacity: 0.9, cursor: "default" }}
              aria-label="Share project"
            >
              <FaShareAlt />
              <span>Share</span>
            </button>
          </div>
        </nav>

        <div className={styles.contentLayout}>
          <div className={styles.primaryColumn}>
            <header className={styles.projectHeader}>
              <div className={styles.sectionTagRow}>
                <FaSquare className={styles.tagSquareIcon} aria-hidden="true" />
                <span className={`${styles.skeletonPill} ${styles.skeletonShimmer}`} style={{ width: "120px", display: "inline-block" }} />
              </div>

              <div className={styles.titleRow}>
                <div className={`${styles.skeletonH1} ${styles.skeletonShimmer}`} />
                <div className={styles.mobileShareIconBtn} style={{ pointerEvents: "none", opacity: 0.8 }}>
                  <FaShareAlt />
                </div>
              </div>

              <div className={styles.desktopMetaWrap}>
                <div className={styles.metaRow}>
                  <div className={styles.metaItem}>
                    <FaMapMarkerAlt className={styles.metaIcon} />
                    <span className={`${styles.skeletonMetaItem} ${styles.skeletonShimmer}`} style={{ width: "90px" }} />
                  </div>
                  <div className={styles.metaItem}>
                    <FaClock className={styles.metaIcon} />
                    <span className={`${styles.skeletonMetaItem} ${styles.skeletonShimmer}`} style={{ width: "120px" }} />
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.dotSeparator} />
                    <span className={`${styles.skeletonMetaItem} ${styles.skeletonShimmer}`} style={{ width: "85px" }} />
                  </div>
                </div>
              </div>
            </header>

            <div className={styles.galleryContainer}>
              <figure className={galleryStyles.galleryWrapper}>
                <div
                  className={`${galleryStyles.mainDisplay} ${styles.skeletonShimmer}`}
                  style={{ aspectRatio: "16 / 10" }}
                />
              </figure>
            </div>

            <div className={styles.mobileMetaWrap}>
              <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                  <FaMapMarkerAlt className={styles.metaIcon} />
                  <span className={`${styles.skeletonMetaItem} ${styles.skeletonShimmer}`} style={{ width: "90px" }} />
                </div>
                <div className={styles.metaItem}>
                  <FaClock className={styles.metaIcon} />
                  <span className={`${styles.skeletonMetaItem} ${styles.skeletonShimmer}`} style={{ width: "120px" }} />
                </div>
              </div>
            </div>

            <section className={styles.editorialSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionEyebrow}>
                  <FaSquare className={styles.sectionSquareIcon} aria-hidden="true" />
                  <span>Project Brief</span>
                </div>
                <h2 className={styles.sectionHeading}>Architecture &amp; Concept Overview</h2>
              </div>
              <div className={styles.editorialBody}>
                <div className={styles.skeletonParagraphBox}>
                  <div className={`${styles.skeletonParagraphLine} ${styles.skeletonShimmer}`} style={{ width: "100%" }} />
                  <div className={`${styles.skeletonParagraphLine} ${styles.skeletonShimmer}`} style={{ width: "96%" }} />
                  <div className={`${styles.skeletonParagraphLine} ${styles.skeletonShimmer}`} style={{ width: "72%", marginBottom: 0 }} />
                </div>
              </div>
            </section>

            <section className={styles.editorialSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionEyebrow}>
                  <FaSquare className={styles.sectionSquareIcon} aria-hidden="true" />
                  <span>Engineering Details</span>
                </div>
                <h2 className={styles.sectionHeading}>Technical Scope &amp; Structural Execution</h2>
              </div>
              <div className={styles.editorialBody}>
                <div className={styles.skeletonParagraphBox}>
                  <div className={`${styles.skeletonParagraphLine} ${styles.skeletonShimmer}`} style={{ width: "100%" }} />
                  <div className={`${styles.skeletonParagraphLine} ${styles.skeletonShimmer}`} style={{ width: "94%" }} />
                  <div className={`${styles.skeletonParagraphLine} ${styles.skeletonShimmer}`} style={{ width: "80%", marginBottom: 0 }} />
                </div>
              </div>
            </section>
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
                  className={styles.primaryActionBtn}
                  disabled
                  style={{ opacity: 0.9, cursor: "default" }}
                >
                  <FaEnvelope /> Request Project Quote
                </button>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className={styles.whatsappActionBtn}
                  style={{ opacity: 0.9, cursor: "default" }}
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
                  <span className={`${styles.skeletonSpecVal} ${styles.skeletonShimmer}`} style={{ width: "95px" }} />
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Location</span>
                  <span className={`${styles.skeletonSpecVal} ${styles.skeletonShimmer}`} style={{ width: "105px" }} />
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Timeline</span>
                  <span className={`${styles.skeletonSpecVal} ${styles.skeletonShimmer}`} style={{ width: "75px" }} />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { slug } = useParams();

  const [project, setProject] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activePerspective, setActivePerspective] = useState(null);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    async function fetchProject() {
      if (!slug) {
        setLoading(false);
        return;
      }

      const target = slug.toLowerCase().trim();
      const startTime = Date.now();

      let cachedProject = null;
      if (typeof window !== "undefined" && window.sessionStorage) {
        try {
          const cached = sessionStorage.getItem("app_projects_cache_v1");
          if (cached) {
            const parsed = JSON.parse(cached);
            const list = Array.isArray(parsed) ? parsed : parsed?.data;
            if (Array.isArray(list)) {
              const found = list.find(
                (p) =>
                  (p.slug || "").toLowerCase().trim() === target ||
                  (p.id ? String(p.id).toLowerCase() : "") === target ||
                  (p.slug || "").toLowerCase().replace(/-\d{4}$/, "") === target.replace(/-\d{4}$/, "")
              );
              if (found) {
                cachedProject = normalizeProject(found);
              }
            }
          }
        } catch {
        }
      }

      if (cachedProject) {
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, 220 - elapsed);
        setTimeout(() => {
          if (!isCancelled) {
            setProject(cachedProject);
            setLoading(false);
          }
        }, remainingDelay);
        return;
      }

      try {
        let data = null;

        if (supabase) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
          let sbQuery = supabase.from("projects").select("*");
          if (isUuid) {
            sbQuery = sbQuery.or(`id.eq.${slug},slug.eq.${slug}`);
          } else {
            sbQuery = sbQuery.eq("slug", slug);
          }

          const { data: sbData } = await sbQuery.maybeSingle();
          if (sbData) {
            data = sbData;
          } else if (!isUuid) {
            const basePrefix = slug.replace(/-\d{4}$/, "");
            const { data: fuzzyList } = await supabase
              .from("projects")
              .select("*")
              .ilike("slug", `${basePrefix}%`)
              .limit(1);

            if (fuzzyList && fuzzyList.length > 0) {
              data = fuzzyList[0];
            }
          }
        }

        if (!data && import.meta.env?.VITE_API_URL) {
          try {
            const res = await fetch(`${API_ENDPOINTS.PROJECTS}/${slug}`);
            if (res.ok) {
              const json = await res.json();
              data = json?.data || json;
            }
          } catch {
          }
        }

        if (!data) {
          const fallbackList = await fetchLiveProjects();
          data =
            fallbackList.find(
              (p) =>
                (p.slug || "").toLowerCase().trim() === target ||
                (p.id ? String(p.id).toLowerCase() : "") === target
            ) || null;
        }

        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, 220 - elapsed);

        setTimeout(() => {
          if (!isCancelled) {
            if (data) {
              setProject(normalizeProject(data));
            } else {
              setProject(null);
            }
            setLoading(false);
          }
        }, remainingDelay);
      } catch (err) {
        if (!isCancelled) {
          console.error("Error loading project:", err);
          setLoading(false);
        }
      }
    }

    fetchProject();

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    async function fetchAllProjects() {
      try {
        const list = await fetchLiveProjects();
        if (Array.isArray(list)) {
          setAllProjects(list);
        }
      } catch {
      }
    }
    fetchAllProjects();
  }, []);

  const handleShare = async () => {
    if (!project) return;
    const shareData = formatProjectShare(project);

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
    }
  };

  if (loading) {
    return <ProjectDetailSkeleton />;
  }

  if (!project) {
    return (
      <div className={styles.notFoundContainer}>
        <div className={styles.notFoundCard}>
          <FaBuilding className={styles.notFoundIcon} />
          <h1 className={styles.notFoundTitle}>Project Not Found</h1>
          <p className={styles.notFoundText}>
            The engineering project or case study you requested could not be located in our active database.
          </p>
          <Link to="/projects" className={styles.primaryBackBtn}>
            <FaArrowLeft /> View All Portfolio Projects
          </Link>
        </div>
      </div>
    );
  }

  const cover = getProjectCoverUrl(project);
  const normalizedGallery = normalizeProjectGallery(project);
  const gallery = normalizedGallery.map((item) => item.url);

  const projectDeliverables =
    project.deliverables && project.deliverables.length > 0
      ? project.deliverables
      : DEFAULT_PROJECT_DELIVERABLES;

  const { shortOverview, detailedDescription } = extractProjectDescription(project);
  const projectHashtags = extractProjectHashtags(project);
  const projectCanonicalUrl = `${SEO_ENTITY.siteUrl}/projects/${project.slug || project.id}`;

  const imageObjects = normalizedGallery.length > 0
    ? normalizedGallery.map((img, idx) => {
        const isFirst = idx === 0;
        return {
          "@type": "ImageObject",
          "@id": `${img.url}#image`,
          url: img.url,
          contentUrl: img.url,
          name: `${project.title} - ${img.label}`,
          caption: img.caption,
          description: `${project.title} - ${project.category || "Engineering"} project in ${project.location || "Design District"}`,
          encodingFormat: "image/svg+xml",
          representativeOfPage: isFirst,
          creator: {
            "@type": "Organization",
            name: SEO_ENTITY.legalName,
            url: SEO_ENTITY.siteUrl,
          },
          creditText: SEO_ENTITY.brandName,
          copyrightNotice: `© ${SEO_ENTITY.legalName}`,
          license: `${SEO_ENTITY.siteUrl}/terms`,
          acquireLicensePage: `${SEO_ENTITY.siteUrl}/contact`,
        };
      })
    : (cover ? [{
        "@type": "ImageObject",
        "@id": `${cover}#image`,
        url: cover,
        contentUrl: cover,
        name: `${project.title} - Main Cover Elevation`,
        caption: `${project.title} architectural design overview`,
        description: `${project.title} project overview and architectural design by Structura Architecture & Construction`,
        encodingFormat: "image/svg+xml",
        representativeOfPage: true,
        creator: {
          "@type": "Organization",
          name: SEO_ENTITY.legalName,
          url: SEO_ENTITY.siteUrl,
        },
        creditText: SEO_ENTITY.brandName,
        copyrightNotice: `© ${SEO_ENTITY.legalName}`,
        license: `${SEO_ENTITY.siteUrl}/terms`,
        acquireLicensePage: `${SEO_ENTITY.siteUrl}/contact`,
      }] : []);

  const projectSchema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${projectCanonicalUrl}#creativework`,
    name: project.title,
    headline: project.title,
    description:
      shortOverview ||
      `${project.title} - Architectural & Structural Engineering Project by Structura Architecture & Construction.`,
    url: projectCanonicalUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": projectCanonicalUrl,
    },
    primaryImageOfPage: imageObjects[0] || undefined,
    image: imageObjects,
    author: {
      "@type": "Organization",
      name: SEO_ENTITY.legalName,
      url: SEO_ENTITY.siteUrl,
    },
    provider: {
      "@id": `${SEO_ENTITY.siteUrl}/#organization`,
      "@type": "Organization",
      name: SEO_ENTITY.legalName,
      url: SEO_ENTITY.siteUrl,
    },
    copyrightHolder: {
      "@type": "Organization",
      name: SEO_ENTITY.legalName,
    },
    copyrightYear: new Date().getFullYear(),
    license: `${SEO_ENTITY.siteUrl}/terms`,
    acquireLicensePage: `${SEO_ENTITY.siteUrl}/contact`,
    creditText: SEO_ENTITY.brandName,
    ...(projectHashtags.length > 0 ? { keywords: projectHashtags.map((t) => t.replace(/^#/, "")).join(", ") } : {})
  };

  const imageAltText = `${project.title} - ${project.category || "Architecture"} Project in ${project.location || "Design District"}`;

  const currentIndex = allProjects.findIndex(
    (p) => (p.slug || p.id) === (project?.slug || project?.id)
  );
  const prevProject =
    currentIndex > 0
      ? allProjects[currentIndex - 1]
      : allProjects.length > 1 && currentIndex === 0
      ? allProjects[allProjects.length - 1]
      : null;
  const nextProject =
    currentIndex !== -1 && currentIndex < allProjects.length - 1
      ? allProjects[currentIndex + 1]
      : allProjects.length > 1 && currentIndex === allProjects.length - 1
      ? allProjects[0]
      : null;

  return (
    <div className={styles.pageWrapper}>
      <MetaTags
        title={`${project.title} | Projects | Structura Architecture & Construction`}
        description={
          shortOverview
            ? shortOverview.slice(0, 155)
            : `${project.title} project details by Structura Studio.`
        }
        keywords={projectHashtags.map((t) => t.replace(/^#/, ""))}
        canonical={projectCanonicalUrl}
        ogImage={cover || SEO_ENTITY.defaultOgImage}
        ogImageAlt={imageAltText}
        schema={[projectSchema, ...imageObjects]}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Projects", url: "/projects" },
          { name: project.title, url: projectCanonicalUrl }
        ]}
      />

      <div className={styles.liveContentFade}>
        <div className={styles.container}>
        <nav className={styles.topUtilityBar} aria-label="Project breadcrumb navigation">
          <div className={styles.breadcrumbPath}>
            <Link to="/" className={styles.crumbLink}>
              <FaHome className={styles.crumbHomeIcon} /> Home
            </Link>
            <span className={styles.crumbSep}>/</span>
            <Link to="/projects" className={styles.crumbLink}>
              Projects
            </Link>
            <span className={styles.crumbSep}>/</span>
            <span className={styles.crumbActive}>{project.title}</span>
          </div>

          <div className={styles.topActions}>
            <Link
              to="/projects"
              className={styles.backBtn}
              aria-label="Return to all portfolio projects"
              onClick={(e) => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  e.preventDefault();
                  window.history.back();
                }
              }}
            >
              <FaArrowLeft className={styles.backIcon} />
              <span>All Projects</span>
            </Link>

            <button
              onClick={handleShare}
              className={styles.shareBtn}
              type="button"
              aria-label="Share project"
            >
              {copied ? <FaCheck className={styles.copiedIcon} /> : <FaShareAlt />}
              <span>{copied ? "Link Copied" : "Share"}</span>
            </button>
          </div>
        </nav>

        <div className={styles.contentLayout}>
          <div className={styles.primaryColumn}>
            <header className={styles.projectHeader}>
              <div className={styles.sectionTagRow}>
                <FaSquare className={styles.tagSquareIcon} aria-hidden="true" />
                <span>{project.category || "Architecture & Engineering"}</span>
              </div>

              <div className={styles.titleRow}>
                <h1 className={styles.projectTitle}>{project.title}</h1>
                <button
                  onClick={handleShare}
                  className={styles.mobileShareIconBtn}
                  type="button"
                  aria-label="Share project"
                  title={copied ? "Link Copied" : "Share Project"}
                >
                  {copied ? <FaCheck className={styles.copiedIcon} /> : <FaShareAlt />}
                </button>
              </div>

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
                  {project.category && (
                    <div className={styles.metaItem}>
                      <span className={styles.dotSeparator} />
                      <span>{project.category}</span>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {gallery && gallery.length > 0 && (
              <div className={styles.galleryContainer}>
                <ProjectGallery
                  gallery={gallery}
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
              <section className={styles.editorialSection} aria-labelledby="overview-title">
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionEyebrow}>
                    <FaSquare className={styles.sectionSquareIcon} aria-hidden="true" />
                    <span>Project Brief</span>
                  </div>
                  <h2 id="overview-title" className={styles.sectionHeading}>
                    Architecture &amp; Concept Overview
                  </h2>
                </div>
                <div className={styles.editorialBody}>
                  {renderSmartCaseStudy(shortOverview, styles)}
                </div>
              </section>
            )}

            {detailedDescription && (
              <section className={styles.editorialSection} aria-labelledby="scope-title">
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionEyebrow}>
                    <FaSquare className={styles.sectionSquareIcon} aria-hidden="true" />
                    <span>Engineering Details</span>
                  </div>
                  <h2 id="scope-title" className={styles.sectionHeading}>
                    Technical Scope &amp; Structural Execution
                  </h2>
                </div>
                <div className={styles.editorialBody}>
                  {renderSmartCaseStudy(detailedDescription, styles)}
                </div>
              </section>
            )}

            <section className={styles.editorialSection} aria-labelledby="deliverables-title">
              <div className={styles.sectionHeader}>
                <div className={styles.sectionEyebrow}>
                  <FaSquare className={styles.sectionSquareIcon} aria-hidden="true" />
                  <span>Quality Assurance</span>
                </div>
                <h2 id="deliverables-title" className={styles.sectionHeading}>
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

            {normalizedGallery && normalizedGallery.length > 1 && (
              <section className={styles.perspectivesSection} aria-labelledby="perspectives-title">
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionEyebrow}>
                    <FaSquare className={styles.sectionSquareIcon} aria-hidden="true" />
                    <span>Visual Perspectives</span>
                  </div>
                  <h2 id="perspectives-title" className={styles.sectionHeading}>
                    Project Visual Perspectives &amp; Site Execution
                  </h2>
                </div>
                <div className={styles.perspectivesGrid}>
                  {normalizedGallery.map((img, idx) => (
                    <figure key={idx} className={styles.perspectiveFigure}>
                      <div
                        className={styles.perspectiveImageFrame}
                        onClick={() => setActivePerspective(img)}
                        role="button"
                        tabIndex={0}
                        aria-label={`View full resolution ${img.label || `photograph ${idx + 1}`}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setActivePerspective(img);
                          }
                        }}
                      >
                        <img
                          src={img.url}
                          alt={img.alt}
                          title={img.title}
                          loading={idx < 2 ? "eager" : "lazy"}
                          decoding="async"
                          width="1200"
                          height="750"
                          className={styles.perspectiveImage}
                        />
                        <div className={styles.perspectiveZoomHint}>
                          <span>View Full Resolution</span>
                        </div>
                      </div>
                      <figcaption className={styles.perspectiveCaption}>
                        <strong className={styles.perspectiveLabelBadge}>{img.label}:</strong>{" "}
                        <span>{img.caption}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
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
                  onClick={() => setContactOpen(true)}
                  className={styles.primaryActionBtn}
                >
                  <FaEnvelope /> Request Project Quote
                </button>

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

        <nav className={styles.portfolioNav} aria-label="Portfolio continuity navigation">
          {prevProject ? (
            <Link
              to={`/projects/${prevProject.slug || prevProject.id}`}
              className={styles.navProjectCard}
            >
              <span className={styles.navDirection}>
                <FaArrowLeft className={styles.navArrowIcon} /> Previous Project
              </span>
              <h4 className={styles.navProjectTitle}>{prevProject.title}</h4>
              <span className={styles.navProjectCategory}>
                {prevProject.category || "Architecture"}
              </span>
            </Link>
          ) : (
            <div className={styles.navProjectCardPlaceholder} />
          )}

          <Link to="/projects" className={styles.navCenterBtn}>
            <FaSquare className={styles.navSquareIcon} />
            <span>Archive Index</span>
          </Link>

          {nextProject ? (
            <Link
              to={`/projects/${nextProject.slug || nextProject.id}`}
              className={`${styles.navProjectCard} ${styles.navProjectCardRight}`}
            >
              <span className={styles.navDirection}>
                Next Project <FaArrowRight className={styles.navArrowIcon} />
              </span>
              <h4 className={styles.navProjectTitle}>{nextProject.title}</h4>
              <span className={styles.navProjectCategory}>
                {nextProject.category || "Architecture"}
              </span>
            </Link>
          ) : (
            <div className={styles.navProjectCardPlaceholder} />
          )}
        </nav>

        <div className={styles.mobileBottomActionBar}>
          <div className={styles.mobileActionText}>
            <strong>{project.title}</strong>
            <span>Turnkey Engineering Consultation</span>
          </div>
          <div className={styles.mobileActionButtons}>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className={styles.mobileQuoteBtn}
            >
              Inquire
            </button>
            <a
              href={`https://wa.me/15550100000?text=${encodeURIComponent(
                `Hello Structura Studio, I am interested in discussing "${project.title}".`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mobileWhatsAppBtn}
              aria-label="WhatsApp consultation"
            >
              <FaWhatsapp />
            </a>
          </div>
        </div>
      </div>
      </div>

      {activePerspective && (
        <div
          className={styles.perspectiveLightbox}
          onClick={() => setActivePerspective(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.perspectiveLightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.perspectiveLightboxClose}
              onClick={() => setActivePerspective(null)}
              aria-label="Close photo viewer"
            >
              ✕
            </button>
            <img
              src={activePerspective.url}
              alt={activePerspective.alt}
              title={activePerspective.title}
              className={styles.perspectiveLightboxImg}
            />
            <div className={styles.perspectiveLightboxCaption}>
              <strong className={styles.perspectiveLabelBadge}>{activePerspective.label}:</strong>{" "}
              {activePerspective.caption}
            </div>
          </div>
        </div>
      )}

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
  );
}