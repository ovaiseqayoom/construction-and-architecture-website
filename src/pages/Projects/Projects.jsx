// Page: Projects — src/pages/Projects/Projects.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from "react";
import { Link, useLocation } from "react-router-dom";
import MetaTags from "../../components/common/SEO/MetaTags";
import { PAGE_SEO, SEO_ENTITY } from "../../config/seo.config";
import {
  FaHome,
  FaMapMarkerAlt,
  FaClock,
  FaArrowRight,
  FaArrowDown,
  FaSquare,
  FaSearch,
  FaSlidersH,
  FaChevronDown,
  FaTimes
} from "react-icons/fa";
import { fetchLiveProjects, getProjectCoverUrl } from "../../utils";
import PageHero from "../../components/common/PageHero/PageHero";
import heroStyles from "../../components/common/PageHero/PageHero.module.css";
import styles from "./Projects.module.css";

const ProjectDrawer = lazy(() => import("../../components/projects/ProjectDrawer"));
const ContactModal = lazy(() => import("../../components/common/ContactModal/ContactModal"));

const heroDesktop = "/images/projects/civic-commons.webp";
const heroMobile = "/images/hero-mobile.webp";

const CATEGORIES = [
  "All",
  "Residential",
  "Commercial",
  "Institutional",
  "Religious",
  "Industrial",
  "Infrastructure",
  "Interior & Fit-Out",
  "Renovation & Restoration"
];

function getResponsiveItemsPerPage(width) {
  if (typeof width !== "number" || width <= 0) return 16;
  if (width <= 640) return 12;
  if (width < 1024) return 8;
  if (width < 1440) return 12;
  if (width < 1800) return 16;
  if (width < 2200) return 20;
  if (width < 2600) return 24;
  if (width < 3000) return 28;
  return 32;
}

function ProjectCardImage({ src, alt, title }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={styles.cardImageWrapper}>
      {!isLoaded && <div className={styles.skeletonShimmer} aria-hidden="true" />}
      {!hasError ? (
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
          onError={() => {
            setHasError(true);
            setIsLoaded(true);
          }}
        />
      ) : (
        <div className={styles.cardFallbackImage} aria-hidden="true" />
      )}
      <div className={styles.cardImageOverlay} />
    </div>
  );
}

export default function Projects() {
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactInitialService, setContactInitialService] = useState("Turnkey Construction");
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    if (typeof window !== "undefined") {
      return getResponsiveItemsPerPage(window.innerWidth);
    }
    return 16;
  });

  useEffect(() => {
    const handleResize = () => {
      const calculated = getResponsiveItemsPerPage(window.innerWidth);
      setItemsPerPage((prev) => (prev !== calculated ? calculated : prev));
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const projectsSectionRef = useRef(null);
  const filterDropdownRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get("category");
    if (cat) {
      const matched = CATEGORIES.find(
        (c) => c.toLowerCase() === cat.toLowerCase()
      );
      if (matched) {
        setActiveCategory(matched);
        setActivePage(1);
      }
    } else {
      setActiveCategory("All");
      setSearchQuery("");
      setActivePage(1);
    }
  }, [location.search]);

  useEffect(() => {
    const handleReset = () => {
      setActiveCategory("All");
      setSearchQuery("");
      setActivePage(1);
      setIsFilterOpen(false);

      if (window.location.search) {
        window.history.replaceState(null, "", window.location.pathname);
      }

      if (window.lenis) {
        if (projectsSectionRef.current) {
          window.lenis.scrollTo(projectsSectionRef.current, { offset: -70 });
        } else {
          window.lenis.scrollTo(0);
        }
      } else {
        if (projectsSectionRef.current) {
          projectsSectionRef.current.scrollIntoView({ behavior: "smooth" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    };

    window.addEventListener("resetProjectFilters", handleReset);
    return () => window.removeEventListener("resetProjectFilters", handleReset);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      try {
        const list = await fetchLiveProjects();
        if (isMounted) {
          setProjects(list || []);
        }
      } catch (err) {
        console.error("Error loading live projects:", err);
        if (isMounted) setProjects([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesCategory =
        activeCategory === "All" ||
        p.category?.toLowerCase() === activeCategory.toLowerCase();

      const cleanQuery = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !cleanQuery ||
        p.title?.toLowerCase().includes(cleanQuery) ||
        p.location?.toLowerCase().includes(cleanQuery) ||
        p.summary?.toLowerCase().includes(cleanQuery) ||
        p.description?.toLowerCase().includes(cleanQuery) ||
        p.category?.toLowerCase().includes(cleanQuery);

      return matchesCategory && matchesSearch;
    });
  }, [projects, activeCategory, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / itemsPerPage));
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedProjects = useMemo(() => {
    return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProjects, startIndex, itemsPerPage]);

  useEffect(() => {
    if (activePage > totalPages) {
      setActivePage(totalPages);
    }
  }, [activePage, totalPages]);

  useEffect(() => {
    if (projects.length === 0) return;

    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "").trim().toLowerCase();
      if (hash) {
        let found = projects.find(
          (p) => (p.slug || "").toLowerCase() === hash || String(p.id).toLowerCase() === hash
        );

        if (!found) {
          const cleanHash = hash.replace(/-\d{4}$/, "");
          found = projects.find((p) => {
            const pSlug = (p.slug || "").toLowerCase();
            const pClean = pSlug.replace(/-\d{4}$/, "");
            return pSlug.startsWith(cleanHash) || pClean === cleanHash;
          });
        }

        if (found) setSelectedProject(found);
      } else {
        setSelectedProject(null);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, [projects]);

  const openProjectModal = useCallback((project, replace = false) => {
    setSelectedProject(project);
    if (window.location.hash !== `#${project.slug}`) {
      if (replace) {
        window.history.replaceState({ isProjectModalOpen: true, slug: project.slug }, "", `#${project.slug}`);
      } else {
        window.history.pushState({ isProjectModalOpen: true, slug: project.slug }, "", `#${project.slug}`);
      }
    }
  }, []);

  const closeProjectModal = useCallback(() => {
    setSelectedProject(null);
    if (window.history.state?.isProjectModalOpen || window.history.state?.slug) {
      window.history.back();
    } else if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  const handleRequestQuoteFromDrawer = useCallback((service) => {
    closeProjectModal();
    setContactInitialService(service || "Architectural Design");
    setTimeout(() => {
      setIsContactModalOpen(true);
    }, 80);
  }, [closeProjectModal]);

  const scrollToProjectsTop = () => {
    if (window.lenis) {
      if (projectsSectionRef.current) {
        window.lenis.scrollTo(projectsSectionRef.current, { offset: -70 });
      } else {
        window.lenis.scrollTo(0);
      }
    } else {
      if (projectsSectionRef.current) {
        projectsSectionRef.current.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleFilter = (category) => {
    setActiveCategory(category);
    setActivePage(1);
    setIsFilterOpen(false);
    scrollToProjectsTop();
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setActivePage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActivePage(1);
  };

  const handleResetAll = () => {
    setActiveCategory("All");
    setSearchQuery("");
    setActivePage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setActivePage(page);
      scrollToProjectsTop();
    }
  };

  const currentModalIndex = selectedProject
    ? filteredProjects.findIndex((p) => (p.slug || p.id) === (selectedProject.slug || selectedProject.id))
    : 0;

  const handleNextProject = useCallback(() => {
    if (filteredProjects.length === 0) return;
    const nextIdx = (currentModalIndex + 1) % filteredProjects.length;
    openProjectModal(filteredProjects[nextIdx], true);
  }, [currentModalIndex, filteredProjects, openProjectModal]);

  const handlePrevProject = useCallback(() => {
    if (filteredProjects.length === 0) return;
    const prevIdx = (currentModalIndex - 1 + filteredProjects.length) % filteredProjects.length;
    openProjectModal(filteredProjects[prevIdx], true);
  }, [currentModalIndex, filteredProjects, openProjectModal]);

  const projectsSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": PAGE_SEO.projects.title,
    "description": PAGE_SEO.projects.description,
    "url": PAGE_SEO.projects.canonical,
    "publisher": {
      "@type": "Organization",
      "name": SEO_ENTITY.legalName,
      "url": SEO_ENTITY.siteUrl
    }
  };

  const renderHeroRightSidebar = () => {
    const top3 = projects.slice(0, 3);
    if (top3.length === 0) return null;

    return (
      <aside className={styles.heroSidebarCard} aria-label="Recent Featured Projects">
        <div className={styles.heroSidebarHeader}>
          <div className={styles.heroSidebarTitleBlock}>
            <h3 className={styles.heroSidebarHeading}>Featured Projects</h3>
          </div>
          <button
            type="button"
            onClick={scrollToProjectsTop}
            className={styles.heroSidebarViewAllBtn}
            aria-label="View all projects in archive"
          >
            <span>View All</span>
            <FaArrowDown className={styles.heroSidebarArrow} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.heroSidebarList}>
          {top3.map((project, idx) => {
            const coverSrc = getProjectCoverUrl(project) || project.coverImage;
            return (
              <div
                key={project.id || project.slug || idx}
                onClick={() => openProjectModal(project)}
                className={styles.heroSidebarItem}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openProjectModal(project);
                  }
                }}
              >
                <div className={styles.heroSidebarThumbWrapper}>
                  {coverSrc ? (
                    <img
                      src={coverSrc}
                      alt={project.title}
                      className={styles.heroSidebarThumb}
                      loading="lazy"
                      decoding="async"
                      width="68"
                      height="48"
                    />
                  ) : (
                    <div className={styles.heroSidebarThumbPlaceholder} />
                  )}
                </div>
                <div className={styles.heroSidebarItemBody}>
                  <div className={styles.heroSidebarItemMeta}>
                    <span className={styles.heroSidebarItemCat}>{project.category || "Civil Build"}</span>
                    {project.location && (
                      <>
                        <span className={styles.heroSidebarItemDot}>•</span>
                        <span className={styles.heroSidebarItemLoc}>{project.location}</span>
                      </>
                    )}
                  </div>
                  <h4 className={styles.heroSidebarItemTitle} title={project.title}>
                    {project.title}
                  </h4>
                </div>
                <div className={styles.heroSidebarItemArrow} aria-hidden="true">
                  <FaArrowRight />
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    );
  };

  return (
    <div className={styles.pageWrapper}>
      <MetaTags
        title={PAGE_SEO.projects.title}
        description={PAGE_SEO.projects.description}
        canonical={PAGE_SEO.projects.canonical}
        schema={projectsSchema}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Projects", url: "/projects" }
        ]}
      />

      <PageHero
        desktopImage={heroDesktop}
        mobileImage={heroMobile}
        imageAlt="Structura Architecture Portfolio"
        variant="standard"
        showScrollIndicator={true}
        eyebrow={
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontFamily: "var(--app-font-body)",
              fontSize: "0.85rem",
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            <FaHome style={{ color: "#FFFFFF", fontSize: "0.8rem" }} />
            <Link to="/" style={{ color: "#A1A1AA", textDecoration: "none" }}>
              Home
            </Link>
            <span style={{ color: "#71717A" }}>/</span>
            <span style={{ color: "#FFFFFF", fontWeight: 700 }}>Projects</span>
          </div>
        }
        title="Work That"
        titleHighlight="Speaks for Itself"
        subtitle="Explore our architectural, structural, and turnkey portfolio."
        actions={
          <>
            <button
              type="button"
              onClick={() => setIsContactModalOpen(true)}
              className={heroStyles.btnPrimary}
            >
              <span>Build With Us</span>
            </button>
            <button
              type="button"
              onClick={scrollToProjectsTop}
              className={heroStyles.btnOutline}
            >
              <span>Explore Work</span>
            </button>
          </>
        }
        rightContent={renderHeroRightSidebar()}
      />

      <section className={styles.projectsSection} ref={projectsSectionRef} aria-labelledby="section-title">
        <div className={styles.projectsContainer}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderLeft}>
              <div className={styles.sectionTagRow}>
                <FaSquare className={styles.tagSquareIcon} aria-hidden="true" />
                <span>Complete Archive</span>
              </div>
              <h2 id="section-title" className={styles.sectionTitle}>
                Completed Projects
              </h2>
            </div>
            <p className={styles.sectionDescription}>
              Browse through our portfolio of architectural design, structural engineering, and turnkey construction developments.
            </p>
          </div>

          <div className={styles.controlsBar}>
            <div className={styles.searchWrapper}>
              <FaSearch className={styles.searchIcon} aria-hidden="true" />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by title, location, or discipline..."
                value={searchQuery}
                onChange={handleSearchChange}
                aria-label="Search projects"
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={handleClearSearch}
                  aria-label="Clear search query"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <div className={styles.filterDropdownWrapper} ref={filterDropdownRef}>
              <button
                type="button"
                className={`${styles.filterTriggerBtn} ${isFilterOpen ? styles.filterTriggerActive : ""
                  } ${activeCategory !== "All" ? styles.filterHasValue : ""}`}
                onClick={() => setIsFilterOpen((prev) => !prev)}
                aria-expanded={isFilterOpen}
                aria-haspopup="listbox"
              >
                <div className={styles.filterTriggerLeft}>
                  <FaSlidersH className={styles.filterSlidersIcon} aria-hidden="true" />
                  <span className={styles.filterBtnLabel}>
                    {activeCategory === "All" ? "Filter" : activeCategory}
                  </span>
                </div>
                <FaChevronDown
                  className={`${styles.filterChevron} ${isFilterOpen ? styles.chevronRotated : ""
                    }`}
                  aria-hidden="true"
                />
              </button>

              {isFilterOpen && (
                <div
                  className={styles.filterMenu}
                  role="listbox"
                  aria-label="Select discipline filter"
                  data-lenis-prevent
                  onWheel={(e) => e.stopPropagation()}
                >
                  <div className={styles.filterMenuHeader}>
                    <span className={styles.menuHeaderTitle}>Select Discipline</span>
                    {activeCategory !== "All" && (
                      <button
                        type="button"
                        className={styles.resetFilterBtn}
                        onClick={() => handleFilter("All")}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div
                    className={styles.filterOptionsGrid}
                    data-lenis-prevent
                  >
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        role="option"
                        aria-selected={activeCategory === cat}
                        className={`${styles.filterOption} ${activeCategory === cat ? styles.filterOptionActive : ""
                          }`}
                        onClick={() => handleFilter(cat)}
                      >
                        <span>{cat}</span>
                        {activeCategory === cat && <span className={styles.activeCheckDot} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {(activeCategory !== "All" || searchQuery) && (
            <div className={styles.filterFeedbackRow}>
              <span className={styles.feedbackText}>
                Showing <strong>{filteredProjects.length}</strong>{" "}
                {filteredProjects.length === 1 ? "project" : "projects"}
                {activeCategory !== "All" && <> in <em>"{activeCategory}"</em></>}
                {searchQuery && <> matching <em>"{searchQuery}"</em></>}
              </span>
              <button type="button" className={styles.resetFeedbackBtn} onClick={handleResetAll}>
                Clear all filters
              </button>
            </div>
          )}

          {loading ? (
            <div className={styles.grid} aria-label="Loading projects archive" aria-busy="true">
              {Array.from({ length: itemsPerPage || 16 }).map((_, idx) => (
                <div
                  key={`project-skeleton-${idx}`}
                  className={`${styles.projectCard} ${styles.skeletonCard}`}
                  aria-hidden="true"
                >
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
          ) : filteredProjects.length === 0 ? (
            <div className={styles.statusBox}>
              <p>No projects match your current filter or search criteria.</p>
              <button type="button" className={styles.emptyResetBtn} onClick={handleResetAll}>
                Reset Search &amp; Filters
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {paginatedProjects.map((project, idx) => {
                const cover = project.coverImage || project.cover_image || project.image;
                const projectId = project.id || project.slug || idx;
                const projectNumber = (activePage - 1) * itemsPerPage + idx + 1;
                const totalCount = filteredProjects.length;

                return (
                  <article
                    key={projectId}
                    className={styles.projectCard}
                    onClick={() => openProjectModal(project)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openProjectModal(project);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for ${project.title}`}
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
                          {String(projectNumber).padStart(2, "0")} / {String(totalCount).padStart(2, "0")}
                        </span>
                      </div>

                      <h3 className={styles.cardTitle} title={project.title}>
                        <Link
                          to={`/projects/${project.slug || project.id}`}
                          className={styles.cardTitleLink}
                          onClick={(e) => {
                            if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                              e.preventDefault();
                              openProjectModal(project);
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
                          if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                            e.preventDefault();
                            openProjectModal(project);
                          }
                        }}
                        aria-label={`Explore project ${project.title}`}
                      >
                        <span>Explore Project</span>
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

          {filteredProjects.length > itemsPerPage && (
            <nav className={styles.pagination} aria-label="Portfolio pagination">
              <button
                type="button"
                className={styles.pageBtn}
                disabled={activePage === 1}
                onClick={() => handlePageChange(activePage - 1)}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  type="button"
                  key={num}
                  className={`${styles.pageNumber} ${activePage === num ? styles.activePage : ""}`}
                  onClick={() => handlePageChange(num)}
                  aria-current={activePage === num ? "page" : undefined}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className={styles.pageBtn}
                disabled={activePage === totalPages}
                onClick={() => handlePageChange(activePage + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </div>
      </section>

      {selectedProject && (
        <Suspense fallback={null}>
          <ProjectDrawer
            isOpen={!!selectedProject}
            project={selectedProject}
            onClose={closeProjectModal}
            onNext={handleNextProject}
            onPrev={handlePrevProject}
            currentIndex={currentModalIndex}
            totalProjects={filteredProjects.length}
            onRequestQuote={handleRequestQuoteFromDrawer}
          />
        </Suspense>
      )}

      {isContactModalOpen && (
        <Suspense fallback={null}>
          <ContactModal
            isOpen={isContactModalOpen}
            onClose={() => setIsContactModalOpen(false)}
            initialService={contactInitialService}
          />
        </Suspense>
      )}
    </div>
  );
}