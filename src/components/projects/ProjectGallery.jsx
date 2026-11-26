import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaExpandArrowsAlt,
} from "react-icons/fa";
import styles from "./ProjectGallery.module.css";

export default function ProjectGallery({
  gallery = [],
  title = "",
  category = "Engineering",
  location = "Design District"
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const normalizedGallery = gallery.map((item, idx) => {
    const rawUrl = typeof item === "string" ? item : item.url || item.src || item.image || "";
    const descriptiveAlt = `${title} - ${category} Architectural View ${idx + 1} | ${location}`;
    const imageTitle = `${title} - View ${idx + 1}`;

    return {
      url: rawUrl,
      alt: descriptiveAlt,
      title: imageTitle,
      caption: item.caption || (gallery.length > 1 ? `${title} - Perspective ${idx + 1}` : ""),
    };
  });

  const totalImages = normalizedGallery.length;
  const currentImage = normalizedGallery[selectedIndex] || normalizedGallery[0];

  useEffect(() => {
    setSelectedIndex(0);
  }, [gallery]);

  const handlePrev = useCallback(
    (e) => {
      e?.stopPropagation();
      setSelectedIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
    },
    [totalImages]
  );

  const handleNext = useCallback(
    (e) => {
      e?.stopPropagation();
      setSelectedIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
    },
    [totalImages]
  );

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, handlePrev, handleNext]);

  if (!gallery || totalImages === 0) return null;

  return (
    <figure className={styles.galleryWrapper} itemScope itemType="https://schema.org/ImageObject">
      <div
        className={styles.mainDisplay}
        onClick={() => setIsLightboxOpen(true)}
        role="button"
        tabIndex={0}
        aria-label={`Open full resolution photograph ${selectedIndex + 1}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsLightboxOpen(true);
          }
        }}
      >
        <img
          src={currentImage.url}
          alt={currentImage.alt}
          title={currentImage.title}
          loading="eager"
          decoding="async"
          width="1200"
          height="750"
          itemProp="contentUrl"
          className={styles.mainImage}
        />
        <meta itemProp="name" content={currentImage.title} />
        <meta itemProp="caption" content={currentImage.caption || currentImage.alt} />
        <div className={styles.zoomOverlay} aria-hidden="true">
          <FaExpandArrowsAlt className={styles.zoomIcon} />
          <span>
            {selectedIndex + 1} / {totalImages}
          </span>
        </div>
      </div>

      {currentImage.caption && (
        <figcaption className={styles.caption} itemProp="description">
          {currentImage.caption}
        </figcaption>
      )}

      {totalImages > 1 && (
        <nav className={styles.thumbnailGrid} aria-label="Selectable project photo thumbnails">
          {normalizedGallery.map((img, idx) => (
            <button
              key={idx}
              type="button"
              className={`${styles.thumbButton} ${idx === selectedIndex ? styles.activeThumb : ""
                }`}
              onClick={() => setSelectedIndex(idx)}
              aria-label={`Select photo ${idx + 1}`}
              itemScope
              itemType="https://schema.org/ImageObject"
            >
              <img src={img.url} alt={img.alt} loading="lazy" decoding="async" width="160" height="100" itemProp="contentUrl" />
              <meta itemProp="name" content={img.title} />
            </button>
          ))}
        </nav>
      )}

      {isLightboxOpen &&
        createPortal(
          <div
            className={styles.lightbox}
            onClick={() => setIsLightboxOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Close photo viewer"
            >
              <FaTimes />
            </button>

            {totalImages > 1 && (
              <>
                <button
                  type="button"
                  className={`${styles.navBtn} ${styles.prevBtn}`}
                  onClick={handlePrev}
                  aria-label="Previous photo"
                >
                  <FaChevronLeft />
                </button>

                <button
                  type="button"
                  className={`${styles.navBtn} ${styles.nextBtn}`}
                  onClick={handleNext}
                  aria-label="Next photo"
                >
                  <FaChevronRight />
                </button>
              </>
            )}

            <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
              <img
                src={currentImage.url}
                alt={currentImage.alt}
                title={currentImage.title}
                width="1600"
                height="1000"
                decoding="async"
                className={styles.lightboxImage}
              />

              <div className={styles.lightboxMeta}>
                <span className={styles.lightboxCounter}>
                  {selectedIndex + 1} / {totalImages}
                </span>
                {currentImage.caption && (
                  <p className={styles.lightboxCaption}>{currentImage.caption}</p>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </figure>
  );
}