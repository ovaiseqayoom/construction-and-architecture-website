// Page: BlogHub — src/pages/Blog/BlogHub.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import MetaTags from "../../components/common/SEO/MetaTags";
import { SEO_ENTITY } from "../../config/seo.config";
import { fetchLiveBlogs, getCachedBlogsSync, BLOG_CATEGORIES } from "../../utils/blog";
import { supabase } from "../../lib/supabaseClient";
import { API_ENDPOINTS } from "../../config/api";
import {
  FaHome,
  FaSearch,
  FaSlidersH,
  FaChevronDown,
  FaTimes,
  FaArrowLeft,
  FaArrowRight,
  FaChevronRight,
  FaBookOpen,
  FaCheck,
  FaCheckCircle,
} from "react-icons/fa";
import { FiArrowUpRight, FiShare2 } from "react-icons/fi";
import { Eye, Loader2 } from "lucide-react";
import ShareModal from "../../components/blog/ShareModal";
import styles from "./BlogHub.module.css";

const POSTS_PER_PAGE = 24;
const PAGE_BATCH_SIZE = 8;

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function submitNewsletter(email) {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  if (!supabase && !import.meta.env?.VITE_API_URL) {
    if (typeof window !== "undefined") {
      localStorage.setItem("app_newsletter_subscribed", "true");
      window.dispatchEvent(new Event("app-newsletter-updated"));
    }
    return { success: true, message: "Demo mode: subscribed locally to editorial updates." };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    const response = await fetch(API_ENDPOINTS.SUBSCRIBE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: cleanEmail,
        action: "subscribe",
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const result = await response.json().catch(() => ({}));
    if (response.ok && result.success !== false) {
      if (typeof window !== "undefined") {
        localStorage.setItem("app_newsletter_subscribed", "true");
        window.dispatchEvent(new Event("app-newsletter-updated"));
      }
      return { success: true, message: "Thank you for subscribing! You're on our editorial list." };
    }
  } catch (err) {
    console.warn("[BlogHub] API subscribe notice, attempting database registration:", err.message);
  }

  if (supabase) {
    try {
      const { error } = await supabase.from("inquiries").insert([
        {
          name: "Blog Newsletter Subscriber",
          email: cleanEmail,
          service: "Newsletter Subscription",
          message: "Subscriber registered via Engineering Blog Hub.",
          status: "unread",
        },
      ]);
      if (!error) {
        if (typeof window !== "undefined") {
          localStorage.setItem("app_newsletter_subscribed", "true");
          window.dispatchEvent(new Event("app-newsletter-updated"));
        }
        return { success: true, message: "Thank you for subscribing! You're on our editorial list." };
      }
    } catch (err) {
      console.warn("[BlogHub] Supabase fallback notice:", err.message);
    }
  }

  throw new Error("Subscription service is temporarily unavailable. Please try again shortly.");
}

function BlogCardImage({
  src,
  alt,
  title,
  aspectRatioClass = styles.aspectDefault,
  viewsCount = 0,
  showHoverOverlay = false,
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`${styles.cardImageWrapper} ${aspectRatioClass} ${showHoverOverlay ? styles.hasHoverOverlay : ""}`}>
      {!isLoaded && <div className={styles.skeletonShimmer} aria-hidden="true" />}
      {!hasError && src ? (
        <img
          src={src}
          alt={alt}
          title={title}
          loading="lazy"
          decoding="async"
          width="1672"
          height="941"
          className={`${styles.cardImg} ${isLoaded ? styles.cardImgLoaded : styles.cardImgLoading}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            setIsLoaded(true);
          }}
        />
      ) : (
        <div className={styles.cardFallbackImage} aria-hidden="true">
          <FaBookOpen className={styles.fallbackIcon} />
        </div>
      )}

      {showHoverOverlay && (
        <div className={styles.imageHoverBackdrop} aria-hidden="true">
          <div className={styles.imageHoverArrowCircle}>
            <FiArrowUpRight size={22} className={styles.imageHoverArrow} />
          </div>
        </div>
      )}

      {typeof viewsCount === "number" && viewsCount > 0 && (
        <div className={styles.bigCardViewsBadge} aria-label={`${viewsCount} views`}>
          <Eye size={12} className={styles.bigCardViewsIcon} aria-hidden="true" />
          <span>{viewsCount.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

function BlogCardSkeleton() {
  return (
    <div className={styles.skeletonCard} aria-hidden="true">
      <div className={styles.skeletonImageWrapper}>
        <div className={styles.skeletonShimmer} />
      </div>
      <div className={styles.skeletonCardBody}>
        <div className={styles.skeletonAuthorRow}>
          <div className={styles.skeletonAuthorBar}>
            <div className={styles.skeletonShimmer} />
          </div>
        </div>
        <div className={styles.skeletonTitleRow}>
          <div className={styles.skeletonTitleLine1}>
            <div className={styles.skeletonShimmer} />
          </div>
          <div className={styles.skeletonTitleLine2}>
            <div className={styles.skeletonShimmer} />
          </div>
        </div>
        <div className={styles.skeletonExcerptRow}>
          <div className={styles.skeletonExcerptLine1}>
            <div className={styles.skeletonShimmer} />
          </div>
          <div className={styles.skeletonExcerptLine2}>
            <div className={styles.skeletonShimmer} />
          </div>
        </div>
        <div className={styles.skeletonPillsRow}>
          <div className={styles.skeletonPillTag}>
            <div className={styles.skeletonShimmer} />
          </div>
          <div className={styles.skeletonPillDate}>
            <div className={styles.skeletonShimmer} />
          </div>
          <div className={styles.skeletonPillDot} />
          <div className={styles.skeletonPillTime}>
            <div className={styles.skeletonShimmer} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlogHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [blogs, setBlogs] = useState(() => getCachedBlogsSync() || []);
  const [loading, setLoading] = useState(() => {
    const cached = getCachedBlogsSync();
    return !cached || cached.length === 0;
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeCategory = searchParams.get("category") || "All";
  const searchQuery = searchParams.get("q") || "";
  const activePage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filteringCategory, setFilteringCategory] = useState(null);
  const [shareModalPost, setShareModalPost] = useState(null);

  const [heroEmail, setHeroEmail] = useState("");
  const [heroSubmitting, setHeroSubmitting] = useState(false);
  const [heroStatus, setHeroStatus] = useState(null);

  const [bottomEmail, setBottomEmail] = useState("");
  const [bottomSubmitting, setBottomSubmitting] = useState(false);
  const [bottomStatus, setBottomStatus] = useState(null);

  const blogSectionRef = useRef(null);
  const filterDropdownRef = useRef(null);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

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
    async function loadBlogs() {
      setBlogs((prev) => {
        if (!prev || prev.length === 0) {
          setLoading(true);
        }
        return prev;
      });
      try {
        const list = await fetchLiveBlogs();
        if (isMounted && Array.isArray(list) && list.length > 0) {
          setBlogs(list);
        }
      } catch (err) {
        console.warn("[BlogHub] Failed to fetch blogs:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadBlogs();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateFilters = useCallback(
    (newCat, newQ, newPage = 1) => {
      const params = {};
      const cat = newCat !== undefined ? newCat : activeCategory;
      const q = newQ !== undefined ? newQ : searchQuery;
      const page = newPage !== undefined ? newPage : 1;

      if (cat && cat !== "All") params.category = cat;
      if (q && q.trim()) params.q = q.trim();
      if (page > 1) params.page = String(page);

      setSearchParams(params, { replace: true });
    },
    [activeCategory, searchQuery, setSearchParams]
  );

  const scrollToAllArticles = () => {
    const doScroll = () => {
      const headingEl = document.getElementById("all-articles-title") || document.getElementById("all-posts-section");
      if (headingEl) {
        if (window.lenis) {
          window.lenis.scrollTo(headingEl, { offset: -90, duration: 0.6 });
        } else {
          const y = headingEl.getBoundingClientRect().top + window.pageYOffset - 90;
          window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
        }
      }
    };
    doScroll();
    setTimeout(doScroll, 60);
  };

  const handleFilterSelect = (category) => {
    setIsFilterOpen(false);
    setFilteringCategory(category);
    setIsFiltering(true);
    updateFilters(category, searchQuery, 1);
    scrollToAllArticles();

    setTimeout(() => {
      setIsFiltering(false);
      setFilteringCategory(null);
    }, 450);
  };

  const handleSharePost = async (e, post) => {
    e.preventDefault();
    e.stopPropagation();
    const url = typeof window !== "undefined" ? `${window.location.origin}/blog/${post.slug}` : "";
    if (!url) return;

    // On mobile devices where native share sheet exists, invoke browser native share
    const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || post.title,
          url,
        });
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }

    // On desktop or when native share is unavailable/fails, open the dedicated Share Dialog Popup
    setShareModalPost({
      title: post.title,
      slug: post.slug,
      url,
      excerpt: post.excerpt || "",
      category: post.category || "",
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsFiltering(true);
    updateFilters(activeCategory, searchInput, 1);
    setTimeout(() => {
      setIsFiltering(false);
    }, 240);
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setIsFiltering(true);
    updateFilters(activeCategory, "", 1);
    setTimeout(() => {
      setIsFiltering(false);
    }, 240);
  };

  const handleResetAll = () => {
    setSearchInput("");
    setIsFilterOpen(false);
    setIsFiltering(true);
    updateFilters("All", "", 1);
    setTimeout(() => {
      setIsFiltering(false);
    }, 240);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setIsFiltering(true);
      updateFilters(activeCategory, searchQuery, page);
      setTimeout(() => {
        setIsFiltering(false);
      }, 240);
      const allPostsEl = document.getElementById("all-posts-section");
      if (allPostsEl) {
        if (window.lenis) {
          window.lenis.scrollTo(allPostsEl, { offset: -80 });
        } else {
          allPostsEl.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  const handleHeroSubscribe = async (e) => {
    e.preventDefault();
    if (!heroEmail || heroSubmitting) return;

    setHeroSubmitting(true);
    setHeroStatus(null);
    try {
      const res = await submitNewsletter(heroEmail);
      setHeroStatus({ success: true, message: res.message });
      setHeroEmail("");
      setTimeout(() => setHeroStatus(null), 6000);
    } catch (err) {
      setHeroStatus({ success: false, message: err.message || "Failed to subscribe. Please try again." });
    } finally {
      setHeroSubmitting(false);
    }
  };

  const handleBottomSubscribe = async (e) => {
    e.preventDefault();
    if (!bottomEmail || bottomSubmitting) return;

    setBottomSubmitting(true);
    setBottomStatus(null);
    try {
      const res = await submitNewsletter(bottomEmail);
      setBottomStatus({ success: true, message: res.message });
      setBottomEmail("");
      setTimeout(() => setBottomStatus(null), 6000);
    } catch (err) {
      setBottomStatus({ success: false, message: err.message || "Failed to subscribe. Please try again." });
    } finally {
      setBottomSubmitting(false);
    }
  };

  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const matchesCategory =
        activeCategory === "All" ||
        blog.category?.toLowerCase() === activeCategory.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        blog.title?.toLowerCase().includes(q) ||
        blog.excerpt?.toLowerCase().includes(q) ||
        blog.content?.toLowerCase().includes(q) ||
        blog.authorName?.toLowerCase().includes(q) ||
        blog.category?.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [blogs, searchQuery, activeCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredBlogs.length / POSTS_PER_PAGE));
  const startIndex = (activePage - 1) * POSTS_PER_PAGE;
  const paginatedBlogs = useMemo(() => {
    return filteredBlogs.slice(startIndex, startIndex + POSTS_PER_PAGE);
  }, [filteredBlogs, startIndex]);

  const [visibleCount, setVisibleCount] = useState(PAGE_BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreSentinelRef = useRef(null);

  useEffect(() => {
    setVisibleCount(Math.min(PAGE_BATCH_SIZE, paginatedBlogs.length || PAGE_BATCH_SIZE));
    setIsLoadingMore(false);
  }, [activePage, activeCategory, searchQuery, paginatedBlogs.length]);

  const hasMoreInPage = visibleCount < paginatedBlogs.length;
  const visibleBlogs = useMemo(() => {
    return paginatedBlogs.slice(0, visibleCount);
  }, [paginatedBlogs, visibleCount]);

  useEffect(() => {
    if (!hasMoreInPage || isLoadingMore) return;

    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + PAGE_BATCH_SIZE, paginatedBlogs.length));
            setIsLoadingMore(false);
          }, 320);
        }
      },
      { rootMargin: "250px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreInPage, isLoadingMore, paginatedBlogs.length]);

  const showRecentSection = !loading && blogs.length >= 4;
  const featuredPost = useMemo(() => {
    if (!showRecentSection || blogs.length === 0) return null;
    return blogs.find((b) => b.isFeatured) || blogs[0];
  }, [showRecentSection, blogs]);

  const recentSidePosts = useMemo(() => {
    if (!showRecentSection || !featuredPost) return [];
    return blogs.filter((b) => b.id !== featuredPost.id).slice(0, 3);
  }, [showRecentSection, blogs, featuredPost]);

  const hubSchema = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${SEO_ENTITY.siteUrl}/blog#collection`,
      "url": `${SEO_ENTITY.siteUrl}/blog`,
      "name": "Structura Engineering Publications & Technical Blog",
      "description":
        "In-depth structural engineering analyses, transparent BOQ guides, building physics, and turnkey construction insights by Structura Architecture & Construction.",
      "publisher": {
        "@type": "Organization",
        "name": SEO_ENTITY.legalName,
        "url": SEO_ENTITY.siteUrl,
      },
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": filteredBlogs.slice(0, 10).map((blog, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "url": `${SEO_ENTITY.siteUrl}/blog/${blog.slug}`,
          "name": blog.title,
        })),
      },
    };
  }, [filteredBlogs]);

  return (
    <div className={styles.pageWrapper}>
      <MetaTags
        title="Engineering Whitepapers, Codes & Construction Guides | Structura Journal"
        description="Structural engineering analyses, transparent construction budgeting, building envelope physics, and turnkey guides by Structura Studio."
        canonical={`${SEO_ENTITY.siteUrl}/blog`}
        schema={hubSchema}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Articles", url: "/blog" },
        ]}
      />

      <section className={styles.blogSection} ref={blogSectionRef} aria-labelledby="blog-hub-title">
        <div className={styles.container}>
          <header className={styles.heroHeader}>
            <nav className={styles.centeredBreadcrumbs} aria-label="Breadcrumb">
              <Link to="/" className={styles.breadcrumbLink}>
                <FaHome className={styles.homeIcon} />
                <span>Home</span>
              </Link>
              <FaChevronRight className={styles.breadcrumbDivider} />
              <span className={styles.breadcrumbCurrent}>Articles</span>
            </nav>

            <h1 id="blog-hub-title" className={styles.heroTitle}>
              Inside Engineering: Stories &amp; Field Research
            </h1>
            <p className={styles.heroSubtitle}>
              Technical structural analyses, transparent BOQ breakdowns,
              building physics, and architectural construction insights.
            </p>

            <form onSubmit={handleHeroSubscribe} className={styles.heroSubscribeForm}>
              <div className={styles.subscribeInputWrapper}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={heroEmail}
                  onChange={(e) => setHeroEmail(e.target.value)}
                  className={styles.subscribeInput}
                  aria-label="Email address for engineering updates"
                  required
                />
              </div>
              <button
                type="submit"
                className={styles.subscribeBtn}
                disabled={heroSubmitting}
              >
                {heroSubmitting ? (
                  "Subscribing..."
                ) : heroStatus?.success ? (
                  <>
                    <FaCheck className={styles.checkIcon} /> Subscribed
                  </>
                ) : (
                  "Subscribe"
                )}
              </button>
            </form>

            {heroStatus && (
              <div
                className={`${styles.subscribeFeedback} ${heroStatus.success ? styles.subscribeFeedbackSuccess : styles.subscribeFeedbackError
                  }`}
                role="status"
              >
                {heroStatus.success && <FaCheckCircle className={styles.feedbackIcon} />}
                <span>{heroStatus.message}</span>
              </div>
            )}
          </header>

          {loading && (
            <div className={styles.skeletonContainer} aria-busy="true" aria-label="Loading publications">
              <div className={styles.recentSection}>
                <div className={styles.skeletonRecentHeading} />
                <div className={styles.recentGrid}>
                  <div className={styles.skeletonBigCard}>
                    <div className={styles.skeletonImageBig}><div className={styles.skeletonShimmer} /></div>
                    <div className={styles.skeletonLineShort}><div className={styles.skeletonShimmer} /></div>
                    <div className={styles.skeletonLineTitle}><div className={styles.skeletonShimmer} /></div>
                    <div className={styles.skeletonLineDesc}><div className={styles.skeletonShimmer} /></div>
                  </div>
                  <div className={styles.recentSideStack}>
                    {[1, 2, 3].map((n) => (
                      <div key={n} className={styles.skeletonSideCard}>
                        <div className={styles.skeletonSideThumb}><div className={styles.skeletonShimmer} /></div>
                        <div className={styles.skeletonSideContent}>
                          <div className={styles.skeletonLineShort}><div className={styles.skeletonShimmer} /></div>
                          <div className={styles.skeletonLineTitleSmall}><div className={styles.skeletonShimmer} /></div>
                          <div className={styles.skeletonLineDescSmall}><div className={styles.skeletonShimmer} /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.allPostsSection}>
                <div className={styles.skeletonRecentHeading} />
                <div className={styles.grid}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <BlogCardSkeleton key={`init-skeleton-${i}`} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {!loading && showRecentSection && featuredPost && (
            <section className={styles.recentSection} aria-label="Recent engineering publications">
              <h2 className={styles.sectionHeading}>Recent articles</h2>

              <div className={styles.recentGrid}>
                <article className={styles.recentBigCard}>
                  <Link
                    to={`/blog/${featuredPost.slug}`}
                    className={styles.recentBigImageLink}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <BlogCardImage
                      src={featuredPost.coverImage}
                      alt={featuredPost.coverImageAlt || featuredPost.title}
                      title={featuredPost.title}
                      aspectRatioClass={styles.aspectBig}
                      viewsCount={featuredPost.viewsCount}
                    />
                  </Link>

                  <div className={styles.recentBigContent}>
                    {featuredPost.category && (
                      <div className={styles.eyebrowRow}>
                        <button
                          type="button"
                          className={`${styles.categoryBadge} ${filteringCategory === featuredPost.category ? styles.categoryBadgeLoading : ""}`}
                          onClick={() => handleFilterSelect(featuredPost.category, true)}
                          disabled={isFiltering}
                          aria-label={`Filter by ${featuredPost.category}`}
                        >
                          {filteringCategory === featuredPost.category && (
                            <Loader2 size={10} className={styles.categoryBadgeSpinner} aria-hidden="true" />
                          )}
                          <span>{featuredPost.category}</span>
                        </button>
                      </div>
                    )}

                    <Link to={`/blog/${featuredPost.slug}`} className={styles.titleLink}>
                      <div className={styles.titleWithArrowRow}>
                        <h3 className={styles.recentBigTitle}>{featuredPost.title}</h3>
                        <FiArrowUpRight className={styles.titleArrowIcon} aria-hidden="true" />
                      </div>
                    </Link>

                    {featuredPost.excerpt && (
                      <p className={styles.recentBigExcerpt}>{featuredPost.excerpt}</p>
                    )}

                    <div className={styles.cardFooter}>
                      <span className={styles.authorNameText}>{featuredPost.authorName}</span>
                      <span className={styles.authorMetaDot}>•</span>
                      <div className={styles.metaRow}>
                        {featuredPost.publishedAt && (
                          <span className={styles.metaDateText}>
                            {formatDate(featuredPost.publishedAt)}
                          </span>
                        )}
                        {featuredPost.publishedAt && featuredPost.readingTime && (
                          <span className={styles.metaDot}>•</span>
                        )}
                        {featuredPost.readingTime && (
                          <span className={styles.readingTimePill}>
                            {featuredPost.readingTime} min read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>

                <div className={styles.recentSideStack}>
                  {recentSidePosts.map((post) => (
                    <article key={post.id || post.slug} className={styles.recentSideCard}>
                      <Link
                        to={`/blog/${post.slug}`}
                        className={styles.recentSideImageLink}
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        <BlogCardImage
                          src={post.coverImage}
                          alt={post.coverImageAlt || post.title}
                          title={post.title}
                          aspectRatioClass={styles.aspectSide}
                        />
                      </Link>

                      <div className={styles.recentSideContent}>
                        {post.category && (
                          <div className={styles.eyebrowRow}>
                            <button
                              type="button"
                              className={`${styles.categoryBadge} ${filteringCategory === post.category ? styles.categoryBadgeLoading : ""}`}
                              onClick={() => handleFilterSelect(post.category, true)}
                              disabled={isFiltering}
                              aria-label={`Filter by ${post.category}`}
                            >
                              {filteringCategory === post.category && (
                                <Loader2 size={10} className={styles.categoryBadgeSpinner} aria-hidden="true" />
                              )}
                              <span>{post.category}</span>
                            </button>
                          </div>
                        )}

                        <Link to={`/blog/${post.slug}`} className={styles.titleLink}>
                          <div className={styles.titleWithArrowRow}>
                            <h3 className={styles.recentSideTitle}>{post.title}</h3>
                            <FiArrowUpRight className={styles.titleArrowIcon} aria-hidden="true" />
                          </div>
                        </Link>

                        {post.excerpt && (
                          <p className={styles.recentSideExcerpt}>{post.excerpt}</p>
                        )}

                        <div className={styles.cardFooter}>
                          <span className={styles.authorNameText}>{post.authorName}</span>
                          <span className={styles.authorMetaDot}>•</span>
                          <div className={styles.metaRow}>
                            {typeof post.viewsCount === "number" && post.viewsCount > 0 && (
                              <span className={styles.mobileViewsPill}>
                                <Eye size={11} className={styles.viewsIcon} aria-hidden="true" />
                                <span>{post.viewsCount.toLocaleString()}</span>
                                <span className={styles.metaDot}>•</span>
                              </span>
                            )}
                            {post.publishedAt && (
                              <span className={styles.metaDateText}>
                                {formatDate(post.publishedAt)}
                              </span>
                            )}
                            {post.publishedAt && post.readingTime && (
                              <span className={styles.metaDot}>•</span>
                            )}
                            {post.readingTime && (
                              <span className={styles.readingTimePill}>
                                {post.readingTime} min read
                              </span>
                            )}
                            {typeof post.viewsCount === "number" && post.viewsCount > 0 && (
                              <span className={styles.desktopViewsPill}>
                                <span className={styles.metaDot}>•</span>
                                <Eye size={11} className={styles.viewsIcon} aria-hidden="true" />
                                <span>{post.viewsCount.toLocaleString()}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className={styles.allPostsSection} id="all-posts-section" aria-label="All engineering publications">
            <div className={styles.allPostsHeaderRow}>
              <h2 className={styles.sectionHeading} id="all-articles-title">All articles</h2>

              <div className={styles.controlsBar}>
                <form onSubmit={handleSearchSubmit} className={styles.searchBoxWrapper}>
                  <FaSearch className={styles.searchIcon} aria-hidden="true" />
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search articles..."
                    value={searchInput}
                    onChange={handleSearchChange}
                    aria-label="Search articles"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      className={styles.clearSearchBtn}
                      onClick={handleClearSearch}
                      aria-label="Clear search query"
                    >
                      <FaTimes />
                    </button>
                  )}
                </form>

                <div className={styles.filterDropdownWrapper} ref={filterDropdownRef}>
                  <button
                    type="button"
                    className={`${styles.filterTriggerBtn} ${isFilterOpen ? styles.filterTriggerActive : ""} ${
                      activeCategory !== "All" ? styles.filterHasValue : ""
                    }`}
                    onClick={() => setIsFilterOpen((prev) => !prev)}
                    aria-expanded={isFilterOpen}
                    aria-haspopup="listbox"
                  >
                    <FaSlidersH className={styles.filterSlidersIcon} aria-hidden="true" />
                    <span className={styles.filterBtnLabel}>
                      {activeCategory === "All" ? "Filter by Category" : activeCategory}
                    </span>
                    <FaChevronDown
                      className={`${styles.filterChevron} ${isFilterOpen ? styles.chevronRotated : ""}`}
                      aria-hidden="true"
                    />
                  </button>

                  {isFilterOpen && (
                    <div
                      className={styles.filterMenu}
                      role="listbox"
                      aria-label="Select discipline filter"
                      data-lenis-prevent="true"
                      onWheel={(e) => e.stopPropagation()}
                    >
                      <div className={styles.filterMenuHeader}>
                        <span className={styles.menuHeaderTitle}>Select Category</span>
                        {activeCategory !== "All" && (
                          <button
                            type="button"
                            className={styles.resetFilterBtn}
                            onClick={() => handleFilterSelect("All")}
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <div className={styles.filterOptionsGrid} data-lenis-prevent="true">
                        {BLOG_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            role="option"
                            aria-selected={activeCategory === cat}
                            className={`${styles.filterOption} ${
                              activeCategory === cat ? styles.filterOptionActive : ""
                            }`}
                            onClick={() => handleFilterSelect(cat)}
                          >
                            <span>{cat === "All" ? "All Categories" : cat}</span>
                            {activeCategory === cat && <span className={styles.activeCheckDot} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isFiltering && (
              <div className={styles.filterLoadingRow} aria-live="polite">
                <div className={styles.filterSpinner} />
                <span>Updating publications...</span>
              </div>
            )}

            {(activeCategory !== "All" || searchQuery) && (
              <div className={styles.filterFeedbackRow}>
                <span className={styles.feedbackText}>
                  Showing <strong>{filteredBlogs.length}</strong>{" "}
                  {filteredBlogs.length === 1 ? "publication" : "publications"}
                  {activeCategory !== "All" && (
                    <>
                      {" "}
                      in <em>"{activeCategory}"</em>
                    </>
                  )}
                  {searchQuery && (
                    <>
                      {" "}
                      matching <em>"{searchQuery}"</em>
                    </>
                  )}
                </span>
                <button type="button" className={styles.resetFeedbackBtn} onClick={handleResetAll}>
                  Clear all filters
                </button>
              </div>
            )}

            {!loading && filteredBlogs.length === 0 && !isFiltering && (
              <div className={styles.statusBox}>
                <FaBookOpen className={styles.statusIcon} />
                <p>No engineering publications match your search or filter criteria.</p>
                <button type="button" className={styles.emptyResetBtn} onClick={handleResetAll}>
                  Reset Search &amp; Filters
                </button>
              </div>
            )}

            {!loading && filteredBlogs.length > 0 && (
              <>
                <div className={`${styles.grid} ${isFiltering ? styles.gridFiltering : ""}`}>
                  {visibleBlogs.map((blog) => (
                    <article key={blog.id || blog.slug} className={`${styles.gridCard} ${styles.cardFadeIn}`}>
                      <Link
                        to={`/blog/${blog.slug}`}
                        className={styles.gridImageLink}
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        <BlogCardImage
                          src={blog.coverImage}
                          alt={blog.coverImageAlt || blog.title}
                          title={blog.title}
                          aspectRatioClass={styles.aspectGrid}
                          viewsCount={blog.viewsCount}
                          showHoverOverlay={true}
                        />
                      </Link>

                      <div className={styles.gridCardBody}>
                        <div className={styles.eyebrowRow}>
                          {blog.category && (
                            <button
                              type="button"
                              className={`${styles.categoryBadge} ${filteringCategory === blog.category ? styles.categoryBadgeLoading : ""}`}
                              onClick={() => handleFilterSelect(blog.category)}
                              disabled={isFiltering}
                              aria-label={`Filter by ${blog.category}`}
                            >
                              {filteringCategory === blog.category && (
                                <Loader2 size={10} className={styles.categoryBadgeSpinner} aria-hidden="true" />
                              )}
                              <span>{blog.category}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className={styles.cardShareBtn}
                            onClick={(e) => handleSharePost(e, blog)}
                            title="Share publication"
                            aria-label={`Share ${blog.title}`}
                          >
                            <FiShare2 size={13} className={styles.shareIcon} aria-hidden="true" />
                          </button>
                        </div>

                        <Link to={`/blog/${blog.slug}`} className={styles.titleLink}>
                          <div className={styles.titleWithArrowRow}>
                            <h3 className={styles.gridCardTitle} title={blog.title}>
                              {blog.title}
                            </h3>
                            <FiArrowUpRight className={styles.titleArrowIcon} aria-hidden="true" />
                          </div>
                        </Link>

                        {blog.excerpt && (
                          <p className={styles.gridCardExcerpt} title={blog.excerpt}>
                            {blog.excerpt}
                          </p>
                        )}

                        <div className={styles.cardFooter}>
                          <span className={styles.authorNameText}>{blog.authorName}</span>
                          {blog.publishedAt && <span className={styles.metaDot}>•</span>}
                          {blog.publishedAt && (
                            <span className={styles.metaDateText}>
                              {formatDate(blog.publishedAt)}
                            </span>
                          )}
                          {blog.readingTime && <span className={styles.metaDot}>•</span>}
                          {blog.readingTime && (
                            <span className={styles.readingTimePill}>
                              {blog.readingTime} min read
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}

                  {isLoadingMore &&
                    Array.from({
                      length: Math.min(PAGE_BATCH_SIZE, paginatedBlogs.length - visibleCount),
                    }).map((_, i) => (
                      <BlogCardSkeleton key={`skeleton-load-more-${i}`} />
                    ))}
                </div>

                {hasMoreInPage && (
                  <div ref={loadMoreSentinelRef} className={styles.sentinelRow} aria-hidden="true" />
                )}
              </>
            )}

            {filteredBlogs.length > POSTS_PER_PAGE && (
              <nav className={styles.pagination} aria-label="Publications pagination">
                <button
                  type="button"
                  className={styles.pageNavBtn}
                  disabled={activePage === 1}
                  onClick={() => handlePageChange(activePage - 1)}
                  aria-label="Previous page"
                >
                  <FaArrowLeft className={styles.navArrowIcon} />
                  <span>Previous</span>
                </button>

                <div className={styles.pageNumbersGroup}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                    <button
                      type="button"
                      key={num}
                      className={`${styles.pageNumberBtn} ${activePage === num ? styles.activePageNumberBtn : ""
                        }`}
                      onClick={() => handlePageChange(num)}
                      aria-current={activePage === num ? "page" : undefined}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className={styles.pageNavBtn}
                  disabled={activePage === totalPages}
                  onClick={() => handlePageChange(activePage + 1)}
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <FaArrowRight className={styles.navArrowIcon} />
                </button>
              </nav>
            )}
          </section>

          <section className={styles.bottomNewsletterSection} aria-label="Newsletter subscription">
            <div className={styles.bottomAccentLine} />
            <div className={styles.bottomNewsletterContent}>
              <div className={styles.bottomNewsletterText}>
                <h2 className={styles.bottomNewsletterTitle}>Sign up to our newsletter</h2>
                <p className={styles.bottomNewsletterSubtitle}>
                  Stay up to date with new technical articles, building codes, and structural engineering insights.
                </p>
              </div>

              <form onSubmit={handleBottomSubscribe} className={styles.bottomSubscribeForm}>
                <div className={styles.subscribeInputWrapper}>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={bottomEmail}
                    onChange={(e) => setBottomEmail(e.target.value)}
                    className={styles.subscribeInput}
                    aria-label="Email address for engineering newsletter"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className={styles.subscribeBtn}
                  disabled={bottomSubmitting}
                >
                  {bottomSubmitting ? (
                    "Subscribing..."
                  ) : bottomStatus?.success ? (
                    <>
                      <FaCheck className={styles.checkIcon} /> Subscribed
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </form>
            </div>

            {bottomStatus && (
              <div
                className={`${styles.subscribeFeedback} ${bottomStatus.success ? styles.subscribeFeedbackSuccess : styles.subscribeFeedbackError
                  }`}
                role="status"
              >
                {bottomStatus.success && <FaCheckCircle className={styles.feedbackIcon} />}
                <span>{bottomStatus.message}</span>
              </div>
            )}
          </section>
        </div>
      </section>

      <ShareModal
        isOpen={!!shareModalPost}
        onClose={() => setShareModalPost(null)}
        post={shareModalPost}
      />
    </div>
  );
}
