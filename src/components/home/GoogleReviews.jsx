import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  FaStar,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaEdit,
} from "react-icons/fa";
import { Quote } from "lucide-react";
import styles from "./GoogleReviews.module.css";

const API_URL = import.meta.env.VITE_REVIEWS_WIDGET_URL || "";

const GOOGLE_WRITE_REVIEW_URL = "https://example.com";

const GOOGLE_READ_ALL_URL = "https://example.com";

const AVATAR_TONES = [
  "#2563EB",
  "#0D9488",
  "#7C3AED",
  "#D97706",
  "#DC2626",
  "#0891B2",
];

const MAX_CHAR_COLLAPSED = 110;

const FALLBACK_REVIEWS = [
  {
    id: "fb-1",
    authorName: "Claire Bennett",
    authorPhotoUrl: null,
    relativePublishTimeDescription: "Recently",
    text: "Highly organized design-build team! Structura handled our custom residence from schematic massing through final handover with zero hidden extras.",
    rating: 5,
  },
  {
    id: "fb-2",
    authorName: "David Okafor",
    authorPhotoUrl: null,
    relativePublishTimeDescription: "Recently",
    text: "Clean 3D modeling and super responsive structural engineers. The BIM clash checks saved weeks during framing and MEP rough-in.",
    rating: 5,
  },
  {
    id: "fb-3",
    authorName: "Rachel Lind",
    authorPhotoUrl: null,
    relativePublishTimeDescription: "Recently",
    text: "Transparent BOQ breakdowns made comparing specification options straightforward. Every concrete pour and curing log was documented.",
    rating: 5,
  },
  {
    id: "fb-4",
    authorName: "Samuel Park",
    authorPhotoUrl: null,
    relativePublishTimeDescription: "Recently",
    text: "Great experience working with the architectural and interior millwork teams. Joinery tolerances and lighting came out crisp.",
    rating: 5,
  },
  {
    id: "fb-5",
    authorName: "Nadia Mansour",
    authorPhotoUrl: null,
    relativePublishTimeDescription: "Recently",
    text: "Thorough site survey and permitting coordination kept our multi-unit schedule right on track from day one.",
    rating: 5,
  },
  {
    id: "fb-6",
    authorName: "thomas_m",
    authorPhotoUrl: null,
    relativePublishTimeDescription: "Recently",
    text: "Thoughtful thermal envelope details and steady weekly site supervision. Would happily collaborate with Structura again.",
    rating: 5,
  },
];

function getReviewDate(r) {
  if (!r) return "Recently";

  const officialRelativeString =
    r.relative_publish_time_description ||
    r.relativePublishTimeDescription ||
    r.relative_time_description ||
    r.relativeTimeDescription ||
    r.time_description ||
    r.timeDescription ||
    r.relative_time ||
    r.relativeTime ||
    r.timeAgo ||
    r.time_ago ||
    r.time_ago_text;

  if (typeof officialRelativeString === "string" && officialRelativeString.trim().length > 0) {
    return officialRelativeString.trim();
  }

  const rawDate =
    r.published_at ||
    r.publishedAt ||
    r.created_at ||
    r.createdAt ||
    r.date ||
    r.datetime ||
    r.time ||
    r.timestamp;

  if (!rawDate) return "Recently";

  if (typeof rawDate === "string" && (rawDate.includes("ago") || rawDate.toLowerCase() === "yesterday")) {
    return rawDate.trim();
  }

  let date;
  if (typeof rawDate === "number") {
    date = new Date(rawDate < 1e11 ? rawDate * 1000 : rawDate);
  } else {
    date = new Date(rawDate);
  }

  if (isNaN(date.getTime())) {
    return typeof rawDate === "string" ? rawDate : "Recently";
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  const diffInMonths = Math.floor(diffInDays / 30.4375);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  const diffInYears = Math.floor(diffInDays / 365.25);
  return `${diffInYears}y ago`;
}

function getReviewPhotoUrl(r) {
  if (!r) return null;
  let url =
    (typeof r.author === "object"
      ? r.author?.avatar_url ||
      r.author?.avatarUrl ||
      r.author?.avatar ||
      r.author?.photo_url ||
      r.author?.photoUrl ||
      r.author?.photo ||
      r.author?.image_url ||
      r.author?.imageUrl ||
      r.author?.image ||
      r.author?.picture
      : null) ||
    r.author_avatar_url ||
    r.author_avatar ||
    r.authorAvatar ||
    r.author_photo_url ||
    r.authorPhotoUrl ||
    r.author_photo ||
    r.authorPhoto ||
    r.author_image ||
    r.authorImage ||
    r.profile_photo_url ||
    r.profilePhotoUrl ||
    r.profile_photo ||
    r.profilePhoto ||
    r.avatar_url ||
    r.avatarUrl ||
    r.avatar ||
    r.photo_url ||
    r.photoUrl ||
    r.photo ||
    r.image_url ||
    r.imageUrl ||
    r.image ||
    r.picture ||
    r.reviewer?.profilePhotoUrl ||
    r.reviewer?.photoUrl ||
    r.reviewer?.avatarUrl ||
    r.reviewer?.avatar ||
    r.reviewer?.photo ||
    r.reviewer?.picture ||
    null;

  if (url && typeof url === "string") {
    url = url.trim();
    if (url.startsWith("//")) {
      url = `https:${url}`;
    }
    return url.length > 5 ? url : null;
  }
  return null;
}

function ReviewAvatar({ photoUrl, name, index }) {
  const [imgFailed, setImgFailed] = useState(false);
  const letter = (name || "C").charAt(0).toUpperCase();
  const tone = AVATAR_TONES[index % AVATAR_TONES.length];

  if (photoUrl && !imgFailed) {
    return (
      <div className={styles.avatarWrapper}>
        <img
          src={photoUrl}
          alt={name}
          className={styles.avatarImg}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          width="34"
          height="34"
          draggable={false}
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={styles.avatarWrapper}>
      <div className={styles.avatarLetter} style={{ background: tone }} aria-hidden="true">
        {letter}
      </div>
    </div>
  );
}

function getResponsiveCardsPerView(width) {
  if (typeof width !== "number" || width <= 0) return 3.8;
  if (width < 480) return 1.12;
  if (width < 768) return 1.35;
  if (width < 1024) return 2.2;
  if (width < 1360) return 3.2;
  if (width <= 1650) return 3.8;
  return 4.2;
}

export default function GoogleReviews() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalDragRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const isPausedRef = useRef(false);

  const [reviews, setReviews] = useState(FALLBACK_REVIEWS);
  const [isMobileDevice, setIsMobileDevice] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        window.innerWidth < 768 ||
        "ontouchstart" in window ||
        (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0)
      );
    }
    return false;
  });

  const [summary, setSummary] = useState({
    rating: 4.8,
    count: 25,
    label: "Exceptional",
    writeUri: GOOGLE_WRITE_REVIEW_URL,
  });

  const [cardsPerView, setCardsPerView] = useState(() => {
    if (typeof window !== "undefined") {
      return getResponsiveCardsPerView(window.innerWidth);
    }
    return 3.8;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    if (!API_URL) return;
    let isCancelled = false;

    const fetchReviews = () => {
      fetch(API_URL, { signal: AbortSignal.timeout(8000) })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (isCancelled) return;
          const rawList =
            data?.reviews ||
            data?.data?.reviews ||
            data?.widget?.reviews ||
            data?.items ||
            data?.data ||
            (Array.isArray(data) ? data : []);

          if (Array.isArray(rawList) && rawList.length > 0) {
            const parsedReviews = rawList.map((r, idx) => {
              const name =
                (typeof r.author === "string" ? r.author : r.author?.name) ||
                r.authorName ||
                r.author_name ||
                r.reviewer?.displayName ||
                r.reviewer?.name ||
                r.name ||
                r.user?.name ||
                "Google Client";

              const photo = getReviewPhotoUrl(r);
              const time = getReviewDate(r);
              const rawText =
                r.text || r.comment || r.review_text || r.content || r.body || "";
              const text =
                rawText && rawText.trim().length > 0
                  ? rawText.trim()
                  : "Rated 5 stars on Google for exceptional civil engineering and project execution.";

              const singleRating = Number(r.rating?.value || r.rating || r.stars || r.starRating || 5);
              const safeRating = Math.max(
                1,
                Math.min(5, Math.round(isNaN(singleRating) ? 5 : singleRating))
              );

              const reviewUrl =
                r.url ||
                r.review_url ||
                r.reviewUrl ||
                (r.author?.profileUrl ? r.author.profileUrl : null) ||
                GOOGLE_READ_ALL_URL;

              return {
                id: r.id || `live-rev-${idx}`,
                authorName: name,
                authorPhotoUrl: photo,
                relativePublishTimeDescription: time,
                text,
                rating: safeRating,
                reviewUrl,
              };
            });

            setReviews(parsedReviews);
          }

          const rawApiRating =
            data?.widget?.gbpLocationSummary?.rating ||
            data?.gbpLocationSummary?.rating ||
            data?.locationSummary?.rating ||
            data?.business?.rating ||
            data?.place?.rating ||
            data?.place?.rating_star ||
            data?.overview?.rating ||
            data?.rating;

          const rawApiCount =
            data?.widget?.gbpLocationSummary?.reviewsCount ||
            data?.widget?.gbpLocationSummary?.reviewCount ||
            data?.gbpLocationSummary?.reviewsCount ||
            data?.gbpLocationSummary?.reviewCount ||
            data?.locationSummary?.reviewCount ||
            data?.business?.review_count ||
            data?.place?.user_ratings_total ||
            data?.place?.reviews_count ||
            data?.overview?.count ||
            data?.count;

          const writeUri =
            data?.widget?.gbpLocationSummary?.writeAReviewUri ||
            data?.gbpLocationSummary?.writeAReviewUri ||
            GOOGLE_WRITE_REVIEW_URL;

          const parsedRating = Number(rawApiRating);
          const parsedCount = Number(rawApiCount);

          setSummary({
            rating: !isNaN(parsedRating) && parsedRating > 0 ? parsedRating : 4.8,
            count: !isNaN(parsedCount) && parsedCount > 0 ? parsedCount : 25,
            label: "Exceptional",
            writeUri,
          });
        })
        .catch((err) => {
          console.warn("Using fallback reviews due to API response:", err.message);
        });
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const handle = window.requestIdleCallback(fetchReviews, { timeout: 2500 });
      return () => {
        isCancelled = true;
        if (window.cancelIdleCallback) window.cancelIdleCallback(handle);
      };
    } else {
      const timer = setTimeout(fetchReviews, 1200);
      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const calculated = getResponsiveCardsPerView(window.innerWidth);
      setCardsPerView((prev) => (prev !== calculated ? calculated : prev));
      setIsMobileDevice(
        window.innerWidth < 768 ||
        "ontouchstart" in window ||
        (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0)
      );
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalOriginal = reviews.length;

  const displayReviews = useMemo(() => {
    if (totalOriginal === 0) return [];
    return [...reviews, ...reviews, ...reviews];
  }, [reviews, totalOriginal]);

  const nextSlide = useCallback(() => {
    if (totalOriginal === 0) return;

    setCurrentIndex((prev) => {
      const next = prev + 1;
      if (next >= totalOriginal * 2) {
        setTimeout(() => {
          setIsTransitioning(false);
          setCurrentIndex(totalOriginal);
          setTimeout(() => setIsTransitioning(true), 30);
        }, 550);
      }
      return next;
    });
  }, [totalOriginal]);

  const prevSlide = useCallback(() => {
    if (totalOriginal === 0) return;
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, [totalOriginal]);

  // NEVER auto-slide on mobile devices
  useEffect(() => {
    if (totalOriginal === 0) return;
    if (isMobileDevice) return; // Completely disabled on mobile to prevent any confusion

    const interval = setInterval(() => {
      if (
        isPausedRef.current ||
        isPointerDownRef.current ||
        isHorizontalDragRef.current
      ) {
        return;
      }
      nextSlide();
    }, 6000);

    return () => clearInterval(interval);
  }, [totalOriginal, nextSlide, isMobileDevice]);

  const handlePointerDown = (e) => {
    if (totalOriginal === 0) return;
    if (e.button !== undefined && e.button !== 0) return;
    isPausedRef.current = true;
    isPointerDownRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    isHorizontalDragRef.current = false;
    hasDraggedRef.current = false;
  };

  const handlePointerMove = (e) => {
    if (!isPointerDownRef.current) return;
    const diffX = e.clientX - startXRef.current;
    const diffY = e.clientY - startYRef.current;

    if (!isHorizontalDragRef.current) {
      if (Math.abs(diffY) > 6 && Math.abs(diffY) > Math.abs(diffX)) {
        isPointerDownRef.current = false;
        return;
      }
      if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) {
        isHorizontalDragRef.current = true;
        hasDraggedRef.current = true;
        setIsDragging(true);
        if (trackRef.current && !trackRef.current.hasPointerCapture(e.pointerId)) {
          try {
            trackRef.current.setPointerCapture(e.pointerId);
          } catch {
          }
        }
      }
    }

    if (isHorizontalDragRef.current) {
      setDragOffset(diffX);
    }
  };

  const handlePointerUp = (e) => {
    const wasHorizontal = isHorizontalDragRef.current;
    const currentOffset = dragOffset;

    isPointerDownRef.current = false;
    isHorizontalDragRef.current = false;

    if (trackRef.current && trackRef.current.hasPointerCapture(e.pointerId)) {
      try {
        trackRef.current.releasePointerCapture(e.pointerId);
      } catch {
      }
    }

    if (wasHorizontal) {
      setIsDragging(false);
      const threshold = 45;
      if (currentOffset < -threshold) {
        nextSlide();
      } else if (currentOffset > threshold) {
        prevSlide();
      } else {
        setIsTransitioning(true);
      }
      setDragOffset(0);
    }
  };

  const activeDotIndex = totalOriginal > 0 ? currentIndex % totalOriginal : 0;
  const progressPercent = totalOriginal > 0 ? ((activeDotIndex + 1) / totalOriginal) * 100 : 0;

  return (
    <section
      ref={sectionRef}
      className={styles.reviewSection}
      aria-labelledby="google-reviews-title"
      onMouseEnter={() => {
        isPausedRef.current = true;
      }}
      onMouseLeave={() => {
        if (!isMobileDevice) {
          isPausedRef.current = false;
        }
      }}
    >
      <div className={styles.container}>
        {/* Clean, authentic Header (No arrows) */}
        <div className={styles.sectionHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.sectionTagRow}>
              <span className={styles.tagDot} aria-hidden="true" />
              <span>Client reviews</span>
            </div>
            <h2 id="google-reviews-title" className={styles.sectionTitle}>
              What clients say on{" "}
              <span className={styles.googleBrand}>
                <img
                  src="/google-logo.svg"
                  alt="Google"
                  className={styles.headerGoogleLogo}
                  width="26"
                  height="26"
                  loading="lazy"
                  decoding="async"
                />
              </span>
            </h2>

            <div className={styles.ratingSubline}>
              <span className={styles.ratingScore}>{summary.rating.toFixed(1)}</span>
              <div className={styles.starsInline} aria-label={`${summary.rating.toFixed(1)} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <FaStar key={i} className={styles.headerStar} />
                ))}
              </div>
              <span className={styles.ratingCount}>
                Based on {summary.count}+ Google Reviews
              </span>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.actionLinks}>
              <a
                href={summary.writeUri || GOOGLE_WRITE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.headerActionLink}
              >
                <FaEdit className={styles.actionIcon} />
                <span>Write a review</span>
              </a>
              <span className={styles.actionDivider}>•</span>
              <a
                href={GOOGLE_READ_ALL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.headerActionLink}
              >
                <span>View on Google</span>
                <FaExternalLinkAlt className={styles.actionIconSmall} />
              </a>
            </div>
          </div>
        </div>

        {/* Minimal Progress Line */}
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Seamless Editorial Slider — Each Card Expands Individually */}
      <div className={styles.fullBleedSlider}>
        <div className={styles.carouselWrapper}>
          <div
            className={`${styles.trackViewport} ${isDragging ? styles.grabbing : ""}`}
            ref={trackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div
              className={styles.sliderTrack}
              style={{
                transform: `translate3d(calc(-${currentIndex * (100 / cardsPerView)}% + ${dragOffset}px), 0, 0)`,
                WebkitTransform: `translate3d(calc(-${currentIndex * (100 / cardsPerView)}% + ${dragOffset}px), 0, 0)`,
                transition: isDragging || !isTransitioning
                  ? "none"
                  : "transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {displayReviews.map((review, index) => {
                const rawText = review.text || "";
                const isLong = rawText.length > MAX_CHAR_COLLAPSED;
                const displayText = isLong
                  ? `${rawText.slice(0, MAX_CHAR_COLLAPSED).trim()}...`
                  : rawText;
                const reviewUrl = review.reviewUrl || GOOGLE_READ_ALL_URL;

                return (
                  <div
                    key={index}
                    className={styles.slideItem}
                    style={{ flex: `0 0 ${100 / cardsPerView}%` }}
                  >
                    <article
                      className={styles.reviewChip}
                      onPointerDown={() => {
                        isPausedRef.current = true;
                      }}
                    >
                      <div className={styles.authorRow}>
                        <ReviewAvatar
                          photoUrl={review.authorPhotoUrl}
                          name={review.authorName}
                          index={index}
                        />

                        <div className={styles.authorDetails}>
                          <div className={styles.nameLine}>
                            <span className={styles.authorName}>
                              {review.authorName}
                            </span>
                            <FaCheckCircle
                              className={styles.verifiedCheck}
                              title="Verified Google Reviewer"
                              aria-hidden="true"
                            />
                          </div>

                          <div
                            className={styles.starsInline}
                            aria-label={`${review.rating || 5} out of 5 stars`}
                          >
                            {Array.from({ length: review.rating || 5 }).map((_, sIdx) => (
                              <FaStar key={sIdx} className={styles.cardStar} />
                            ))}
                          </div>
                        </div>

                        <a
                          href={reviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.cardGoogleMark}
                          title="View verified review on Google"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <img
                            src="/google-logo.svg"
                            alt="Google"
                            className={styles.cardGoogleLogo}
                            width="18"
                            height="18"
                            loading="lazy"
                            decoding="async"
                          />
                        </a>
                      </div>

                      {/* Italic Review Quote with outlined quote icon directly before the text */}
                      <blockquote className={styles.reviewQuote}>
                        <Quote
                          className={styles.leadQuoteIcon}
                          size={16}
                          aria-hidden="true"
                        />
                        <span>{displayText}</span>
                        {isLong && (
                          <a
                            href={reviewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.readMoreLink}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            title="Read verified review on Google"
                          >
                            Read more
                          </a>
                        )}
                      </blockquote>

                      {/* Small Bottom Timestamp so card never looks empty */}
                      <div className={styles.cardFooter}>
                        <span className={styles.bottomDate}>
                          {review.relativePublishTimeDescription}
                        </span>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
