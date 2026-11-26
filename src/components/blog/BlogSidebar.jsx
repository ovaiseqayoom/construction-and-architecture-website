import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import { List, ArrowUpRight } from "lucide-react";
import styles from "./BlogSidebar.module.css";

const Divider = memo(() => <div className={styles.divider} />);
Divider.displayName = "Divider";

const BlogSidebar = memo(function BlogSidebar({
  tableOfContents = [],
  author = {},
  category = "",
  date = "",
  readTime = "",
  viewsCount = 0,
}) {
  const [activeId, setActiveId] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const isClickScrollingRef = useRef(false);
  const clickTimeoutRef = useRef(null);
  const headingElsRef = useRef([]);
  const activeMobileItemRef = useRef(null);

  useEffect(() => {
    if (!mobileOpen) return;
    if (activeMobileItemRef.current) {
      activeMobileItemRef.current.scrollIntoView({ block: "center", behavior: "instant" });
    }
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    if (tableOfContents.length > 0 && !activeId) {
      setActiveId(tableOfContents[0].id);
    }
  }, [tableOfContents, activeId]);

  // Cache heading DOM elements whenever TOC items change instead of querying DOM on every scroll frame
  useEffect(() => {
    if (!tableOfContents || tableOfContents.length === 0) {
      headingElsRef.current = [];
      return;
    }

    const resolveHeadings = () => {
      headingElsRef.current = tableOfContents
        .map((item) => document.getElementById(item.id))
        .filter(Boolean);
    };

    resolveHeadings();
    const retryTimer = setTimeout(resolveHeadings, 180);
    return () => clearTimeout(retryTimer);
  }, [tableOfContents]);

  useEffect(() => {
    if (!tableOfContents || tableOfContents.length === 0) return;

    let ticking = false;

    const evaluateActiveHeading = () => {
      ticking = false;
      if (isClickScrollingRef.current) return;

      let headingEls = headingElsRef.current;
      if (headingEls.length === 0 || !headingEls[0].isConnected) {
        headingEls = tableOfContents
          .map((item) => document.getElementById(item.id))
          .filter(Boolean);
        headingElsRef.current = headingEls;
      }
      if (headingEls.length === 0) return;

      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollY + windowHeight >= documentHeight - 60) {
        const lastId = headingEls[headingEls.length - 1].id;
        setActiveId((prev) => (prev === lastId ? prev : lastId));
        return;
      }

      let currentId = headingEls[0].id;
      for (let i = 0; i < headingEls.length; i++) {
        const rect = headingEls[i].getBoundingClientRect();
        if (rect.top <= 130) {
          currentId = headingEls[i].id;
        } else {
          break;
        }
      }

      if (currentId) {
        setActiveId((prev) => (prev === currentId ? prev : currentId));
      }
    };

    const onScroll = () => {
      if (isClickScrollingRef.current || ticking) return;
      ticking = true;
      requestAnimationFrame(evaluateActiveHeading);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    evaluateActiveHeading();

    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(clickTimeoutRef.current);
    };
  }, [tableOfContents]);

  const scrollToHeading = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    setActiveId(id);
    setMobileOpen(false);
    isClickScrollingRef.current = true;
    clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 900);

    const navOffset = typeof window !== "undefined" && window.innerWidth < 1200 ? 78 : 92;
    if (window.lenis) {
      window.lenis.scrollTo(el, { offset: -navOffset, duration: 0.75 });
    } else {
      const elTop = el.getBoundingClientRect().top + window.scrollY - navOffset;
      window.scrollTo({
        top: elTop,
        behavior: "smooth",
      });
    }
  }, []);

  const mobileDotItems = useMemo(() => {
    if (tableOfContents.length === 0) return [];
    const primary = tableOfContents.filter((h) => h.level !== 3);
    const source = primary.length >= 3 ? primary : tableOfContents;
    if (source.length <= 6) return source;
    const step = (source.length - 1) / 5;
    return Array.from({ length: 6 }, (_, i) => source[Math.round(i * step)]);
  }, [tableOfContents]);

  const activeMobileDotIdx = useMemo(() => {
    if (mobileDotItems.length === 0 || !activeId) return 0;
    const activeIndex = tableOfContents.findIndex((h) => h.id === activeId);
    if (activeIndex <= 0) return 0;
    let closestDot = 0;
    let bestDist = Infinity;
    mobileDotItems.forEach((dotItem, idx) => {
      const tocIdx = tableOfContents.findIndex((h) => h.id === dotItem.id);
      const dist = Math.abs(tocIdx - activeIndex);
      if (dist < bestDist) {
        bestDist = dist;
        closestDot = idx;
      }
    });
    return closestDot;
  }, [mobileDotItems, tableOfContents, activeId]);

  const metaRows = useMemo(() => {
    const authorName = author?.name || "Structura Studio";
    const formattedDate = date
      ? new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      : "Recent";

    return [
      { label: "Published", value: formattedDate },
      { label: "Read time", value: readTime ? `${readTime} min read` : "5 min read" },
      ...(category
        ? [{ label: "Category", value: category, href: `/blog?category=${encodeURIComponent(category)}` }]
        : []),
      { label: "Author", value: authorName },
      {
        label: "Readers",
        value: viewsCount > 0 ? `${viewsCount.toLocaleString()} views` : "New",
      },
    ];
  }, [author?.name, date, readTime, category, viewsCount]);

  return (
    <>
      <aside className={styles.stickySidebar} aria-label="Article Details Sidebar">
        <div className={styles.sidebarInner}>
          <div className={styles.tocBlock}>
            <div className={styles.tocHeader}>
              <List size={13} className={styles.tocIcon} />
              <span>On this page</span>
            </div>

            <nav
              aria-label="Table of contents"
              className={styles.tocScrollArea}
              data-lenis-prevent="true"
              onWheel={(e) => {
                const el = e.currentTarget;
                if (el.scrollHeight > el.clientHeight) {
                  e.stopPropagation();
                }
              }}
            >
              {tableOfContents.length > 0 ? (
                <ul className={styles.tocList}>
                  {tableOfContents.map((item) => {
                    const isActive = activeId === item.id;
                    return (
                      <li key={item.id} className={styles.tocRow}>
                        <button
                          type="button"
                          onClick={() => scrollToHeading(item.id)}
                          className={`${styles.tocItem} ${item.level === 3 ? styles.tocItemSub : ""
                            } ${isActive ? styles.tocItemActive : ""}`}
                          aria-current={isActive ? "location" : undefined}
                        >
                          <span className={styles.tocText}>{item.text}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className={styles.tocList}>
                  <span className={styles.tocEmptyText}>Full article</span>
                </div>
              )}
            </nav>
          </div>

          <Divider />

          <div className={styles.sidebarSection}>
            <div className={styles.sectionLabel}>Overview</div>
            <div className={styles.metaRowGroup}>
              {metaRows.map((row) => (
                <div key={row.label} className={styles.metaRow}>
                  <span className={styles.metaLabel}>{row.label}</span>
                  {row.href ? (
                    <Link to={row.href} className={`${styles.metaValue} ${styles.metaLink}`}>
                      {row.value}
                    </Link>
                  ) : (
                    <span className={styles.metaValue} title={row.value}>
                      {row.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Divider />
          <div className={styles.deskSection}>
            <p className={styles.deskTitle}>Engineering Consultation</p>
            <p className={styles.deskDesc}>
              Discuss structural drawings, geotechnical testing, or engineering code compliance for your project.
            </p>
            <Link to="/contact" className={styles.deskBtnPrimary}>
              <span>Request Review</span>
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </aside>

      {tableOfContents.length > 0 && (
        <div className={styles.mobileTocRoot}>
          {mobileOpen && (
            <>
              <div
                className={styles.mobileTocBackdrop}
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
              />
              <div
                className={styles.mobileTocPopup}
                role="dialog"
                aria-modal="true"
                aria-label="Table of contents"
              >
                <nav
                  className={styles.mobileTocPopupBody}
                  data-lenis-prevent="true"
                  aria-label="Mobile table of contents"
                >
                  <ul className={styles.mobileTocList}>
                    {tableOfContents.map((item) => {
                      const isActive = activeId === item.id;
                      const isSub = item.level === 3;
                      return (
                        <li key={item.id} className={styles.tocRow}>
                          <button
                            ref={isActive ? activeMobileItemRef : null}
                            type="button"
                            onClick={() => scrollToHeading(item.id)}
                            className={`${styles.mobileTocPopupItem} ${isSub ? styles.mobileTocPopupItemSub : ""
                              } ${isActive ? styles.mobileTocPopupItemActive : ""}`}
                            aria-current={isActive ? "location" : undefined}
                          >
                            <span
                              aria-hidden="true"
                              className={`${styles.mobileTocLineDot} ${isSub ? styles.mobileTocLineDotSub : ""
                                } ${isActive ? styles.mobileTocLineDotActive : ""}`}
                            />
                            <span className={styles.tocText}>{item.text}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            </>
          )}

          <button
            type="button"
            className={`${styles.mobileTocDotsBtn} ${mobileOpen ? styles.mobileTocDotsBtnActive : ""}`}
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label="Open table of contents"
            title="Table of contents"
          >
            {mobileDotItems.map((dot, idx) => (
              <span
                key={dot.id}
                className={`${styles.mobileVerticalDot} ${idx === activeMobileDotIdx ? styles.mobileVerticalDotActive : ""
                  }`}
              />
            ))}
          </button>
        </div>
      )}
    </>
  );
});

BlogSidebar.displayName = "BlogSidebar";
export default BlogSidebar;

export const BlogSidebarSkeleton = memo(() => {
  return (
    <aside className={styles.stickySidebar} aria-hidden="true">
      <div className={styles.sidebarInner}>
        <div className={styles.tocBlock}>
          <div className={styles.tocHeader}>
            <List size={13} className={styles.tocIcon} />
            <span>On this page</span>
          </div>

          <div className={styles.tocScrollArea}>
            <ul className={styles.tocList}>
              <li className={styles.tocRow}>
                <span className={`${styles.tocItem} ${styles.tocItemActive}`}>
                  <span className={`${styles.skeletonBar} ${styles.skeletonShimmer}`} style={{ width: "86%", height: "11px" }} />
                </span>
              </li>
              <li className={styles.tocRow}>
                <span className={`${styles.tocItem} ${styles.tocItemSub}`}>
                  <span className={`${styles.skeletonBar} ${styles.skeletonShimmer}`} style={{ width: "70%", height: "10px" }} />
                </span>
              </li>
              <li className={styles.tocRow}>
                <span className={styles.tocItem}>
                  <span className={`${styles.skeletonBar} ${styles.skeletonShimmer}`} style={{ width: "80%", height: "11px" }} />
                </span>
              </li>
              <li className={styles.tocRow}>
                <span className={styles.tocItem}>
                  <span className={`${styles.skeletonBar} ${styles.skeletonShimmer}`} style={{ width: "74%", height: "11px" }} />
                </span>
              </li>
              <li className={styles.tocRow}>
                <span className={`${styles.tocItem} ${styles.tocItemSub}`}>
                  <span className={`${styles.skeletonBar} ${styles.skeletonShimmer}`} style={{ width: "64%", height: "10px" }} />
                </span>
              </li>
            </ul>
          </div>
        </div>

        <Divider />

        <div className={styles.sidebarSection}>
          <div className={styles.sectionLabel}>Overview</div>
          <div className={styles.metaRowGroup}>
            {[72, 60, 88, 96, 68].map((w, idx) => (
              <div key={idx} className={styles.metaRow}>
                <span className={`${styles.skeletonBar} ${styles.skeletonShimmer}`} style={{ width: "56px", height: "10px" }} />
                <span className={`${styles.skeletonBar} ${styles.skeletonShimmer}`} style={{ width: `${w}px`, height: "10px" }} />
              </div>
            ))}
          </div>
        </div>

        <Divider />

        <div className={styles.deskSection}>
          <p className={styles.deskTitle}>Engineering Consultation</p>
          <p className={styles.deskDesc}>
            Discuss structural drawings, geotechnical testing, or engineering code compliance for your project.
          </p>
          <span className={styles.deskBtnPrimary} style={{ opacity: 0.9, cursor: "default" }}>
            <span>Request Review</span>
            <ArrowUpRight size={13} aria-hidden="true" />
          </span>
        </div>
      </div>
    </aside>
  );
});
BlogSidebarSkeleton.displayName = "BlogSidebarSkeleton";
