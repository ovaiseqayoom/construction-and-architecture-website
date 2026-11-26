import React, { useState, useEffect, useRef } from "react";
import { FaFacebookF, FaInstagram, FaPinterestP } from "react-icons/fa";
import styles from "./PageHero.module.css";

const DEFAULT_SOCIALS = [
  { label: "Facebook", href: "https://example.com", icon: <FaFacebookF />, className: "socialFacebook" },
  { label: "Instagram", href: "https://example.com", icon: <FaInstagram />, className: "socialInstagram" },
  { label: "Pinterest", href: "https://example.com", icon: <FaPinterestP />, className: "socialPinterest" },
];

export default function PageHero({
  desktopImage,
  mobileImage,
  imageAlt = "Structura Architecture and Construction",
  eyebrow,
  title,
  titleHighlight,
  subtitle,
  actions,
  showSocials = false,
  showScrollIndicator = false,
  variant = "standard", 
  rightContent = null,
}) {
  const isHome = variant === "home";
  const heroRef = useRef(null);

  const [isSlideReady, setIsSlideReady] = useState(() => {
    if (typeof window === "undefined") return true;
    return !document.documentElement.classList.contains("site-loading");
  });

  const handleScrollDown = () => {
    if (typeof window === "undefined") return;
    if (heroRef.current) {
      const heroBottom = heroRef.current.getBoundingClientRect().bottom + window.scrollY;
      window.scrollTo({ top: heroBottom, behavior: "smooth" });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (isSlideReady) return;

    const handleLoaderComplete = () => {
      setIsSlideReady(true);
    };

    window.addEventListener("site-loader-complete", handleLoaderComplete);
    const fallbackTimer = setTimeout(() => {
      setIsSlideReady(true);
    }, 1500);

    return () => {
      window.removeEventListener("site-loader-complete", handleLoaderComplete);
      clearTimeout(fallbackTimer);
    };
  }, [isSlideReady]);

  return (
    <div className={styles.heroTrack}>
      <section
        ref={heroRef}
        className={`${styles.heroSection} ${isHome ? styles.heroSectionHome : ""}`}
        aria-label="Hero Section"
      >
        <div className={styles.imageContainer}>
          <picture>
            {mobileImage && <source media="(max-width: 768px)" srcSet={mobileImage} />}
            <img
              src={desktopImage}
              alt={imageAlt}
              className={styles.imageElement}
              fetchPriority="high"
              loading="eager"
              width="1920"
              height="1080"
              decoding="async"
            />
          </picture>
        </div>

        <div
          className={`${styles.heroContent} ${
            isHome ? styles.heroContentHome : styles.heroContentProjects
          }`}
        >
          <div
            className={`${styles.textWrapper} ${
              isSlideReady ? styles.animateSlideLeft : styles.textWrapperHidden
            }`}
          >
            {eyebrow && <div className={styles.eyebrowContainer}>{eyebrow}</div>}

            <h1 className={styles.mainTitle}>
              {title}
              {titleHighlight && (
                <>
                  <br />
                  <span className={styles.titleGrey}>{titleHighlight}</span>
                </>
              )}
            </h1>

            {subtitle && <p className={styles.subTitle}>{subtitle}</p>}

            {actions && <div className={styles.ctaGroup}>{actions}</div>}
          </div>

          {rightContent && (
            <div
              className={`${styles.heroRightSlot} ${
                isSlideReady ? styles.animateSlideRight : styles.rightSlotHidden
              }`}
            >
              {rightContent}
            </div>
          )}
        </div>

        {showSocials && (
          <div className={styles.heroFooter}>
            <div className={styles.socialLinks} aria-label="Social media links">
              {DEFAULT_SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles[social.className] || ""}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        )}

        {showScrollIndicator && (
          <button
            type="button"
            onClick={handleScrollDown}
            className={styles.scrollIndicator}
            aria-label="Scroll down to content"
          >
            <span className={styles.scrollMouse}>
              <span className={styles.wheel} />
            </span>
            <span className={styles.scrollChevron} aria-hidden="true">
              <svg
                width="14"
                height="8"
                viewBox="0 0 14 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1L7 7L13 1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        )}
      </section>
    </div>
  );
}   