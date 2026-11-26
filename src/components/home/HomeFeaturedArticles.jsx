import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchLiveBlogs } from "../../utils/blog";
import { prefetchRoute } from "../../utils/routeLoader";
import { FiArrowUpRight } from "react-icons/fi";
import { FaArrowRight } from "react-icons/fa";
import { Eye } from "lucide-react";
import styles from "./HomeFeaturedArticles.module.css";

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

function BlogCardImage({
  src,
  alt,
  title,
  aspectRatioClass = styles.aspectBig,
  viewsCount = 0,
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`${styles.cardImageWrapper} ${aspectRatioClass}`}>
      {!isLoaded && <div className={styles.skeletonShimmer} aria-hidden="true" />}
      {!hasError && src ? (
        <img
          src={src}
          alt={alt || title || "Structura Engineering Publication"}
          title={title}
          loading="lazy"
          decoding="async"
          width="1672"
          height="941"
          className={`${styles.cardImg} ${isLoaded ? styles.cardImgLoaded : styles.cardImgLoading}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      ) : (
        <div className={styles.imageFallback}>
          <span>STRUCTURA JOURNAL</span>
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

export default function HomeFeaturedArticles() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadBlogs() {
      try {
        const list = await fetchLiveBlogs();
        if (isMounted) {
          setBlogs(list || []);
        }
      } catch (err) {
        console.warn("[HomeFeaturedArticles] Failed to fetch blogs:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBlogs();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredPost = useMemo(() => {
    if (blogs.length === 0) return null;
    return blogs.find((b) => b.isFeatured) || blogs[0];
  }, [blogs]);

  const recentSidePosts = useMemo(() => {
    if (!featuredPost) return [];
    return blogs.filter((b) => b.id !== featuredPost.id).slice(0, 3);
  }, [blogs, featuredPost]);

  if (!loading && (!featuredPost || blogs.length === 0)) {
    return null;
  }

  return (
    <section className={styles.sectionWrapper} aria-label="Featured technical publications">
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <div className={styles.eyebrowRow}>
              <span className={styles.eyebrowSquare} />
              <span>Technical Publications</span>
            </div>
            <h2 className={styles.sectionHeading}>Featured articles</h2>
          </div>

          <Link to="/blog" className={styles.viewAllBtnHeader}>
            <span>View all articles</span>
            <FaArrowRight className={styles.btnArrow} />
          </Link>
        </div>

        {loading ? (
          <div className={styles.recentGrid}>
            <div className={styles.recentBigCard}>
              <div className={styles.cardImageWrapper} style={{ height: "300px" }}>
                <div className={styles.skeletonShimmer} />
              </div>
            </div>
            <div className={styles.recentSideStack}>
              {[1, 2, 3].map((n) => (
                <div key={n} style={{ height: "90px", position: "relative", borderRadius: "8px", overflow: "hidden" }}>
                  <div className={styles.skeletonShimmer} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.recentGrid}>
            {featuredPost && (
              <article
                className={styles.recentBigCard}
                onMouseEnter={() => prefetchRoute("blog-detail")}
                onTouchStart={() => prefetchRoute("blog-detail")}
              >
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
                      <Link
                        to={`/blog?category=${encodeURIComponent(featuredPost.category)}#all-posts-section`}
                        className={styles.categoryBadge}
                      >
                        {featuredPost.category}
                      </Link>
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
            )}

            <div className={styles.recentSideStack}>
              {recentSidePosts.map((post) => (
                <article
                  key={post.id || post.slug}
                  className={styles.recentSideCard}
                  onMouseEnter={() => prefetchRoute("blog-detail")}
                  onTouchStart={() => prefetchRoute("blog-detail")}
                >
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
                      aspectRatioClass={styles.aspectBig}
                    />
                  </Link>

                  <div className={styles.recentSideContent}>
                    {post.category && (
                      <div className={styles.eyebrowRow}>
                        <Link
                          to={`/blog?category=${encodeURIComponent(post.category)}#all-posts-section`}
                          className={styles.categoryBadge}
                        >
                          {post.category}
                        </Link>
                      </div>
                    )}

                    <Link to={`/blog/${post.slug}`} className={styles.titleLink}>
                      <div className={styles.titleWithArrowRow}>
                        <h4 className={styles.recentSideTitle}>{post.title}</h4>
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
        )}

        <div className={styles.viewAllWrapperMobile}>
          <Link to="/blog" className={styles.viewAllBtnMobile}>
            <span>View all articles</span>
            <FaArrowRight className={styles.btnArrow} />
          </Link>
        </div>
      </div>
    </section>
  );
}
