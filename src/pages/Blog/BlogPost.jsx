// Page: BlogPost — src/pages/Blog/BlogPost.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import MetaTags from "../../components/common/SEO/MetaTags";
import { SEO_ENTITY } from "../../config/seo.config";
import { getAuthorProfile } from "../../utils/authors";
import {
  fetchSingleBlog,
  fetchLiveBlogs,
  extractTableOfContents,
} from "../../utils/blog";
import ArticleContent from "../../components/blog/ArticleContent";
import BlogSidebar, { BlogSidebarSkeleton } from "../../components/blog/BlogSidebar";
import { supabase } from "../../lib/supabaseClient";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Eye,
} from "lucide-react";
import { FiArrowUpRight, FiShare2 } from "react-icons/fi";
import ShareModal from "../../components/blog/ShareModal";
import styles from "./BlogPost.module.css";

function formatDate(dateStr) {
  if (!dateStr) return "Recent";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCardDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function RelatedCardImage({ src, alt, title }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={styles.relatedSideImageWrapper}>
      {!isLoaded && <div className={styles.relatedSkeletonShimmer} aria-hidden="true" />}
      {!hasError && src ? (
        <img
          src={src}
          alt={alt}
          title={title}
          loading="lazy"
          decoding="async"
          className={`${styles.relatedSideImg} ${
            isLoaded ? styles.relatedSideImgLoaded : styles.relatedSideImgLoading
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            setIsLoaded(true);
          }}
        />
      ) : (
        <div className={styles.relatedSideFallback} aria-hidden="true">
          <BookOpen size={18} />
        </div>
      )}
    </div>
  );
}

function ArticleCoverImage({ src, alt, title }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={styles.featuredCoverFrame}>
      {!isLoaded && <div className={styles.coverSkeletonShimmer} aria-hidden="true" />}
      {!hasError && src ? (
        <img
          src={src}
          alt={alt}
          title={title}
          width="1648"
          height="928"
          fetchPriority="high"
          decoding="async"
          className={`${styles.featuredCoverImg} ${
            isLoaded ? styles.featuredCoverImgLoaded : styles.featuredCoverImgLoading
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            setIsLoaded(true);
          }}
        />
      ) : null}
    </div>
  );
}

function ArticleSkeleton() {
  return (
    <div className={styles.articlePageWrapper} aria-busy="true" aria-label="Loading engineering publication">
      <div className={styles.mainContainer}>
        <div className={styles.articleLayoutGrid}>
          <div className={styles.mainContentColumn}>
            <div className={styles.topNavRow}>
              <div className={styles.breadcrumbTrail}>
                <Link
                  to="/blog"
                  className={styles.breadcrumbRoot}
                  onClick={(e) => {
                    if (typeof window !== "undefined" && window.history.length > 1) {
                      e.preventDefault();
                      window.history.back();
                    }
                  }}
                >
                  Articles
                </Link>
                <ChevronRight size={10} className={styles.breadcrumbChevron} />
                <span className={styles.skeletonBreadcrumbPill} />
              </div>

              <div className={styles.mobileCategoryBadge}>
                <span className={styles.skeletonCategoryPill} />
              </div>

              <Link
                to="/blog"
                className={styles.backAllArticlesLink}
                onClick={(e) => {
                  if (typeof window !== "undefined" && window.history.length > 1) {
                    e.preventDefault();
                    window.history.back();
                  }
                }}
              >
                <span className={styles.backIconBox}>
                  <ArrowLeft size={12} />
                </span>
                <span>All articles</span>
              </Link>
            </div>

            <div className={styles.categoryBadgeRow}>
              <div className={styles.skeletonCategoryPill} />
            </div>

            <div className={styles.skeletonH1} />
            <div className={styles.skeletonH1Short} />

            <div className={styles.mobileCoverContainer}>
              <div className={`${styles.featuredCoverFrame} ${styles.skeletonCoverPlaceholder}`}>
                <div className={styles.coverSkeletonShimmer} />
              </div>
            </div>

            <div className={styles.skeletonExcerpt} />
            <div className={styles.skeletonExcerptShort} />

            <div className={styles.metaStripBar}>
              <div className={styles.authorBadgeGroup}>
                <div className={styles.skeletonAvatarRound} />
                <div className={styles.skeletonAuthorCol}>
                  <div className={styles.skeletonAuthorNameBar} />
                  <div className={styles.skeletonAuthorRoleBar} />
                </div>
              </div>

              <div className={styles.stripDivider} />

              <div className={styles.metaDetailsRow}>
                <div className={styles.metaItemsGroup}>
                  <span className={styles.metaItem}>
                    <Calendar size={13} className={styles.metaItemIcon} />
                    <span className={styles.skeletonMetaPill} />
                  </span>

                  <span className={styles.metaDotDivider}>•</span>

                  <span className={styles.metaItem}>
                    <Clock size={13} className={styles.metaItemIcon} />
                    <span className={styles.skeletonMetaPillShort} />
                  </span>

                  <span className={styles.metaDotDivider}>•</span>

                  <span className={styles.metaItem}>
                    <Eye size={13} className={styles.metaItemIcon} />
                    <span className={styles.skeletonMetaPillShort} />
                  </span>
                </div>

                <div className={styles.skeletonShareBtn} aria-hidden="true" />
              </div>
            </div>

            <div className={styles.desktopCoverContainer}>
              <div className={`${styles.featuredCoverFrame} ${styles.skeletonCoverPlaceholder}`}>
                <div className={styles.coverSkeletonShimmer} />
              </div>
            </div>

            <div className={styles.skeletonParagraphLine} style={{ width: "100%" }} />
            <div className={styles.skeletonParagraphLine} style={{ width: "95%" }} />
            <div className={styles.skeletonParagraphLine} style={{ width: "98%" }} />
            <div className={styles.skeletonParagraphLine} style={{ width: "70%", marginBottom: "2rem" }} />

            <div className={styles.skeletonHeading2} />
            <div className={styles.skeletonParagraphLine} style={{ width: "100%" }} />
            <div className={styles.skeletonParagraphLine} style={{ width: "92%" }} />
            <div className={styles.skeletonParagraphLine} style={{ width: "85%", marginBottom: "2rem" }} />

            <div className={styles.skeletonDiagramBox}>
              <div className={styles.coverSkeletonShimmer} />
            </div>

            <div className={styles.skeletonParagraphLine} style={{ width: "100%" }} />
            <div className={styles.skeletonParagraphLine} style={{ width: "94%" }} />
          </div>

          <BlogSidebarSkeleton />
        </div>
      </div>
    </div>
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Engagement states: views only
  const [viewsCount, setViewsCount] = useState(0);

  const rafRef = useRef(null);
  const progressBarRef = useRef(null);

  useEffect(() => {
    if (!slug || !supabase) return;
    let isCancelled = false;

    async function recordView() {
      try {
        const { data: newViews, error } = await supabase.rpc(
          "increment_blog_views",
          { p_slug: slug }
        );
        if (!error && typeof newViews === "number" && !isCancelled) {
          setViewsCount(newViews);
        }
      } catch (e) {
        console.warn("View increment error:", e);
      }
    }

    recordView();

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    async function loadArticle() {
      if (!slug) {
        setLoading(false);
        return;
      }
      const startTime = Date.now();

      try {
        const article = await fetchSingleBlog(slug);
        if (article && !isCancelled) {
          let related = [];
          try {
            const all = await fetchLiveBlogs();
            if (!isCancelled) {
              related = all
                .filter((b) => b.id !== article.id && b.category === article.category)
                .slice(0, 3);
              if (related.length < 3) {
                const extra = all
                  .filter((b) => b.id !== article.id && !related.some((r) => r.id === b.id))
                  .slice(0, 3 - related.length);
                related.push(...extra);
              }
            }
          } catch {
          }

          const elapsed = Date.now() - startTime;
          const remainingDelay = Math.max(0, 240 - elapsed);

          setTimeout(() => {
            if (!isCancelled) {
              setBlog(article);
              setViewsCount((prev) => Math.max(prev, Number(article.viewsCount || 0) + 1));
              setRelatedBlogs(related);
              setLoading(false);
            }
          }, remainingDelay);
        } else if (!isCancelled) {
          setBlog(null);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn("[BlogPost] Article load error:", err);
          setLoading(false);
        }
      }
    }

    loadArticle();

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  // Direct DOM progress updates via scaleX avoid re-rendering the full article tree on every scroll tick
  const updateProgress = useCallback(() => {
    const bar = progressBarRef.current;
    if (!bar) return;
    const d = document.documentElement;
    const maxScroll = d.scrollHeight - d.clientHeight;
    const raw = maxScroll > 0 ? d.scrollTop / maxScroll : 0;
    const ratio = isNaN(raw) ? 0 : Math.max(0, Math.min(raw, 1));
    bar.style.transform = `scaleX(${ratio})`;
    bar.style.opacity = ratio > 0.004 && ratio < 0.996 ? "1" : "0";
  }, []);

  useEffect(() => {
    const onWindowScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateProgress);
    };

    window.addEventListener("scroll", onWindowScroll, { passive: true });
    updateProgress();
    return () => {
      window.removeEventListener("scroll", onWindowScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateProgress]);

  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.transform = "scaleX(0)";
      progressBarRef.current.style.opacity = "0";
    }
  }, [slug]);

  const sidebarAuthor = useMemo(
    () => ({
      name: blog?.authorName,
      role: blog?.authorRole,
      avatar: blog?.authorAvatar,
    }),
    [blog?.authorName, blog?.authorRole, blog?.authorAvatar]
  );

  const tableOfContents = useMemo(() => {
    return extractTableOfContents(blog?.content || "");
  }, [blog?.content]);

  const cleanArticleContent = useMemo(() => {
    if (!blog?.content) return "";
    return blog.content
      .replace(/(?:^|\n)#{2,4}\s*(?:FAQ:?|Frequently Asked Questions:?)\s*[^\n\r]*[\r\n]+[\s\S]*?(?=(?:^|\n)#{2,3}\s+(?!(?:FAQ|Frequently Asked Questions))|$)/gi, "")
      .trim();
  }, [blog?.content]);

  const handleOpenShareModal = useCallback(async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const isMobile =
      typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";

    if (isMobile && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: blog?.title || "",
          text: blog?.excerpt || blog?.title || "",
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }
    setIsShareModalOpen(true);
  }, [blog?.title, blog?.excerpt]);

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const articleSchema = useMemo(() => {
    if (!blog) return null;

    const canonicalUrl = blog.canonicalUrl || `${SEO_ENTITY.siteUrl}/blog/${blog.slug}`;
    const cleanExcerpt = (blog.metaDescription || blog.excerpt || blog.title || "").replace(/<[^>]*>?/gm, "").trim();
    const abstract = blog.blufSummary || cleanExcerpt;
    const authorProfile = getAuthorProfile(blog.authorId || blog.authorName);
    const reviewerProfile = blog.reviewedBy ? getAuthorProfile(blog.reviewedBy) : null;
    const tags = Array.isArray(blog.tags) ? blog.tags : [];
    const standards = Array.isArray(blog.engineeringStandards) ? blog.engineeringStandards : [];
    const mergedKeywords = [...tags, ...standards].filter(Boolean);
    const wordCount = (blog.content || "").replace(/<[^>]*>?/gm, "").split(/\s+/).filter(Boolean).length;
    const geoScope = blog.geoScope || "global";

    const graph = [];

    let inLanguage = "en";
    let spatialCoverage = undefined;

    if (geoScope === "regional") {
      inLanguage = "en-US";
      spatialCoverage = [
        { "@type": "City", name: "Design District" },
      ];
    } else {
      inLanguage = "en-US";
    }

    const techArticle = {
      "@type": ["TechArticle", "BlogPosting"],
      "@id": `${canonicalUrl}#article`,
      isPartOf: {
        "@id": `${SEO_ENTITY.siteUrl}/#website`,
      },
      headline: blog.title,
      description: cleanExcerpt,
      abstract: abstract,
      image: blog.coverImage
        ? [blog.coverImage]
        : [SEO_ENTITY.ogDefaultImage],
      datePublished: blog.publishedAt || new Date().toISOString(),
      dateModified: blog.updatedAt || blog.publishedAt || new Date().toISOString(),
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": canonicalUrl,
        primaryImageOfPage: {
          "@type": "ImageObject",
          "@id": `${canonicalUrl}#primaryimage`,
          url: blog.coverImage || SEO_ENTITY.ogDefaultImage,
          contentUrl: blog.coverImage || SEO_ENTITY.ogDefaultImage,
          caption: blog.coverImageAlt || blog.title,
        },
      },
      articleSection: blog.category,
      proficiencyLevel: "Expert",
      isAccessibleForFree: true,
      wordCount,
      inLanguage,
      ...(spatialCoverage ? { spatialCoverage } : {}),
      ...(mergedKeywords.length > 0 ? { keywords: mergedKeywords.join(", ") } : {}),
      ...(standards.length > 0
        ? {
            about: standards.map((std) => ({
              "@type": "Thing",
              name: std,
            })),
          }
        : {}),
      ...(tags.length > 0
        ? {
            mentions: tags.map((tag) => ({
              "@type": "Thing",
              name: tag,
            })),
          }
        : {}),
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", ".app-bluf-summary", "article > header > p"],
      },
      publisher: {
        "@id": `${SEO_ENTITY.siteUrl}/#organization`,
      },
      author: {
        "@type": "Person",
        "@id": `${SEO_ENTITY.siteUrl}/about#${authorProfile.id}`,
        name: (authorProfile.name || "").replace(/^Er\.\s+/i, ""),
        honorificPrefix: "Er.",
        jobTitle: authorProfile.role,
        description: authorProfile.bio,
        image: authorProfile.avatar,
        worksFor: {
          "@id": `${SEO_ENTITY.siteUrl}/#organization`,
        },
      },
      ...(reviewerProfile
        ? {
            reviewedBy: {
              "@type": "Person",
              "@id": `${SEO_ENTITY.siteUrl}/about#${reviewerProfile.id}`,
              name: (reviewerProfile.name || "").replace(/^Er\.\s+/i, ""),
              honorificPrefix: "Er.",
              jobTitle: reviewerProfile.role,
              description: reviewerProfile.bio,
              image: reviewerProfile.avatar,
              worksFor: {
                "@id": `${SEO_ENTITY.siteUrl}/#organization`,
              },
            },
          }
        : {}),
    };
    graph.push(techArticle);

    const breadcrumbList = {
      "@type": "BreadcrumbList",
      "@id": `${canonicalUrl}#breadcrumbs`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${SEO_ENTITY.siteUrl}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Articles",
          item: `${SEO_ENTITY.siteUrl}/blog`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: blog.title,
          item: canonicalUrl,
        },
      ],
    };
    graph.push(breadcrumbList);

    return {
      "@context": "https://schema.org",
      "@graph": graph,
    };
  }, [blog]);

  if (loading || !blog || !blog.content) {
    if (!loading && !blog) {
      return (
        <div className={styles.notFoundPage}>
          <div className={styles.notFoundContainer}>
            <div className={styles.notFoundIcon}>📭</div>
            <h1 className={styles.notFoundTitle}>Article Not Found</h1>
            <p className={styles.notFoundDesc}>
              This engineering publication may have been updated or the URL is incorrect.
            </p>
            <button
              onClick={() => navigate("/blog")}
              className={styles.backToHubBtn}
            >
              <ArrowLeft size={15} />
              <span>Back to Engineering Blog</span>
            </button>
          </div>
        </div>
      );
    }
    return <ArticleSkeleton />;
  }

  const articleCanonicalUrl = blog.canonicalUrl || `${SEO_ENTITY.siteUrl}/blog/${blog.slug}`;
  const markdownTwinUrl = `${SEO_ENTITY.siteUrl}/blog/${blog.slug}.md`;

  return (
    <div className={styles.articlePageWrapper}>
      <MetaTags
        title={`${blog.metaTitle || blog.title} | Structura Studio`}
        description={blog.metaDescription || blog.excerpt}
        canonical={articleCanonicalUrl}
        ogType="article"
        ogImage={blog.coverImage || SEO_ENTITY.defaultOgImage}
        ogImageAlt={blog.coverImageAlt || blog.title}
        schema={articleSchema}
      >
        <link
          rel="alternate"
          type="text/markdown"
          href={markdownTwinUrl}
          title={`${blog.title} (Markdown)`}
        />
      </MetaTags>

      <div
        ref={progressBarRef}
        className={styles.readingProgressBar}
        aria-hidden="true"
      />

      <div className={styles.mainContainer}>
        <div className={styles.articleLayoutGrid}>
          <div className={styles.mainContentColumn}>
            <div className={styles.topNavRow}>
              <div className={styles.breadcrumbTrail}>
                <Link
                  to="/blog"
                  className={styles.breadcrumbRoot}
                  onClick={(e) => {
                    if (typeof window !== "undefined" && window.history.length > 1) {
                      e.preventDefault();
                      window.history.back();
                    }
                  }}
                >
                  Articles
                </Link>
                <ChevronRight size={10} className={styles.breadcrumbChevron} />
                <span className={styles.breadcrumbCurrentCategory}>
                  {blog.category || "Article"}
                </span>
              </div>

              <div className={styles.mobileCategoryBadge}>
                <span className={styles.categoryPillTag}>{blog.category}</span>
              </div>

              <Link
                to="/blog"
                className={styles.backAllArticlesLink}
                onClick={(e) => {
                  if (typeof window !== "undefined" && window.history.length > 1) {
                    e.preventDefault();
                    window.history.back();
                  }
                }}
              >
                <span className={styles.backIconBox}>
                  <ArrowLeft size={12} />
                </span>
                <span>All articles</span>
              </Link>
            </div>

            <div className={styles.categoryBadgeRow}>
              <span className={styles.categoryPillTag}>{blog.category}</span>
            </div>

            <h1 className={styles.articleTitleH1}>{blog.title}</h1>

            {blog.coverImage && (
              <div className={styles.mobileCoverContainer}>
                <ArticleCoverImage
                  src={blog.coverImage}
                  alt={blog.coverImageAlt || blog.title}
                  title={blog.title}
                />
              </div>
            )}

            {blog.excerpt && (
              <p className={styles.articleHeroExcerpt}>{blog.excerpt}</p>
            )}

            <div className={styles.metaStripBar}>
              <div className={styles.authorBadgeGroup}>
                <div className={styles.authorAvatarFrame}>
                  <img
                    src={blog.authorAvatar}
                    alt={blog.authorName}
                    className={styles.authorAvatarImg}
                  />
                </div>
                <div className={styles.authorTextMeta}>
                  <p className={styles.authorNameText}>{blog.authorName}</p>
                  <p className={styles.authorRoleSub}>{blog.authorRole || "Author"}</p>
                </div>
              </div>

              <div className={styles.stripDivider} />

              <div className={styles.metaDetailsRow}>
                <div className={styles.metaItemsGroup}>
                  <span className={styles.metaItem}>
                    <Calendar size={13} className={styles.metaItemIcon} />
                    <span>{formatDate(blog.publishedAt)}</span>
                  </span>

                  <span className={styles.metaDotDivider}>•</span>

                  <span className={styles.metaItem}>
                    <Clock size={13} className={styles.metaItemIcon} />
                    <span>{blog.readingTime || 5} min read</span>
                  </span>

                  <span className={styles.metaDotDivider}>•</span>

                  <span className={styles.metaItem} title="Total article readers">
                    <Eye size={13} className={styles.metaItemIcon} />
                    <span>{viewsCount.toLocaleString()} views</span>
                  </span>
                </div>

                <button
                  type="button"
                  className={styles.detailShareBtn}
                  onClick={handleOpenShareModal}
                  title="Share publication"
                  aria-label="Share publication"
                >
                  <FiShare2 size={13} className={styles.shareIcon} aria-hidden="true" />
                </button>
              </div>
            </div>

            {blog.coverImage && (
              <div className={styles.desktopCoverContainer}>
                <ArticleCoverImage
                  src={blog.coverImage}
                  alt={blog.coverImageAlt || blog.title}
                  title={blog.title}
                />
              </div>
            )}

            <ArticleContent content={cleanArticleContent} />

            {((blog.faqItems && blog.faqItems.length > 0) || (blog.faq_items && blog.faq_items.length > 0)) && (
              <section className={styles.faqSection} aria-label="Frequently Asked Questions">
                <div className={styles.faqHeader}>
                  <span className={styles.faqEyebrow}>Technical Clarifications</span>
                  <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
                </div>

                <div className={styles.faqAccordion}>
                  {(blog.faqItems || blog.faq_items).map((faq, index) => {
                    const isOpen = openFaqIndex === index;
                    return (
                      <div key={index} className={styles.faqCard}>
                        <button
                          type="button"
                          className={styles.faqQuestionBtn}
                          onClick={() => toggleFaq(index)}
                          aria-expanded={isOpen}
                        >
                          <span className={styles.faqQuestionText}>{faq.question}</span>
                          <ChevronDown
                            size={16}
                            className={`${styles.faqChevron} ${
                              isOpen ? styles.faqChevronOpen : ""
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className={styles.faqAnswerContent}>
                            <p>{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <div className={styles.bottomAuthorFooter}>
              <div className={styles.bottomAuthorInfo}>
                <img
                  src={blog.authorAvatar}
                  alt={blog.authorName}
                  className={styles.bottomAuthorAvatar}
                />
                <div>
                  <p className={styles.writtenByLabel}>Written by</p>
                  <p className={styles.bottomAuthorName}>{blog.authorName}</p>
                  <p className={styles.bottomAuthorRole}>{blog.authorRole}</p>
                </div>
              </div>

              <div className={styles.bottomShareRow}>
                <span className={styles.shareLabel}>Share:</span>
                <button
                  type="button"
                  onClick={handleOpenShareModal}
                  className={styles.bottomShareBtn}
                  aria-label="Share article"
                >
                  <FiShare2 size={13} />
                  <span>Share Article</span>
                </button>
              </div>
            </div>

            {relatedBlogs.length > 0 && (
              <section className={styles.relatedArticlesSection} aria-label="Related Articles">
                <div className={styles.relatedSectionHeader}>
                  <h2 className={styles.relatedSectionTitle}>Related Articles</h2>
                </div>

                <div className={styles.relatedSideStack}>
                  {relatedBlogs.map((post) => (
                    <article key={post.id || post.slug} className={styles.relatedSideCard}>
                      <Link
                        to={`/blog/${post.slug}`}
                        className={styles.relatedSideImageLink}
                        tabIndex={-1}
                        aria-hidden="true"
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                            if (window.lenis) window.lenis.scrollTo(0, { immediate: true });
                          }
                        }}
                      >
                        <RelatedCardImage
                          src={post.coverImage}
                          alt={post.coverImageAlt || post.title}
                          title={post.title}
                        />
                      </Link>

                      <div className={styles.relatedSideContent}>
                        <div className={styles.eyebrowRow}>
                          {post.category && (
                            <Link
                              to={`/blog?category=${encodeURIComponent(post.category)}`}
                              className={styles.categoryBadge}
                              onClick={() => {
                                if (typeof window !== "undefined") {
                                  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                                  if (window.lenis) window.lenis.scrollTo(0, { immediate: true });
                                }
                              }}
                            >
                              {post.category}
                            </Link>
                          )}
                          {typeof post.viewsCount === "number" && post.viewsCount > 0 && (
                            <span className={styles.cardViewsCount}>
                              <Eye size={12} className={styles.viewsIcon} aria-hidden="true" />
                              <span>{post.viewsCount.toLocaleString()}</span>
                            </span>
                          )}
                        </div>

                        <Link
                          to={`/blog/${post.slug}`}
                          className={styles.relatedTitleLink}
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                              if (window.lenis) window.lenis.scrollTo(0, { immediate: true });
                            }
                          }}
                        >
                          <div className={styles.relatedTitleWithArrowRow}>
                            <h3 className={styles.relatedSideTitle}>{post.title}</h3>
                            <FiArrowUpRight className={styles.relatedTitleArrowIcon} aria-hidden="true" />
                          </div>
                        </Link>

                        {post.excerpt && (
                          <p className={styles.relatedSideExcerpt}>{post.excerpt}</p>
                        )}

                        <div className={styles.cardFooter}>
                          <span className={styles.authorNameText}>{post.authorName}</span>
                          {post.publishedAt && <span className={styles.metaDot}>•</span>}
                          {post.publishedAt && (
                            <span className={styles.metaDateText}>
                              {formatCardDate(post.publishedAt)}
                            </span>
                          )}
                          {post.readingTime && <span className={styles.metaDot}>•</span>}
                          {post.readingTime && (
                            <span className={styles.readingTimePill}>
                              {post.readingTime} min read
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>

          <BlogSidebar
            tableOfContents={tableOfContents}
            author={sidebarAuthor}
            category={blog.category}
            date={blog.publishedAt}
            readTime={blog.readingTime}
            viewsCount={viewsCount}
          />
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={{
          title: blog.title,
          url: typeof window !== "undefined" ? window.location.href : articleCanonicalUrl,
          category: blog.category,
          excerpt: blog.excerpt,
        }}
      />
    </div>
  );
}
