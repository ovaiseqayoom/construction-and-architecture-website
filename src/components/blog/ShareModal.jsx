import React, { useState, useEffect } from "react";
import {
  FaWhatsapp,
  FaLinkedinIn,
  FaFacebookF,
  FaTwitter,
  FaEnvelope,
} from "react-icons/fa";
import { FiX, FiCheck, FiCopy } from "react-icons/fi";
import styles from "./ShareModal.module.css";

export default function ShareModal({ isOpen, onClose, post }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      return;
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  const url = post.url || (typeof window !== "undefined" ? window.location.href : "");
  const title = post.title || "";
  const category = post.category || "";

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Fallback
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title}\n\n${url}`)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
    `Check out this engineering publication from Structura Studio:\n\n${title}\n${url}`
  )}`;

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className={styles.card}>
        <div className={styles.header}>
          <h3 id="share-modal-title" className={styles.title}>
            Share Publication
          </h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close share dialog"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className={styles.preview}>
          {category && <span className={styles.category}>{category}</span>}
          <p className={styles.postTitle}>{title}</p>
        </div>

        <div className={styles.socialGrid}>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.socialBtn} ${styles.shareWhatsApp}`}
            aria-label="Share on WhatsApp"
          >
            <FaWhatsapp size={20} className={styles.socialIcon} />
            <span>WhatsApp</span>
          </a>

          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.socialBtn} ${styles.shareLinkedIn}`}
            aria-label="Share on LinkedIn"
          >
            <FaLinkedinIn size={18} className={styles.socialIcon} />
            <span>LinkedIn</span>
          </a>

          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.socialBtn} ${styles.shareTwitter}`}
            aria-label="Share on X"
          >
            <FaTwitter size={18} className={styles.socialIcon} />
            <span>X</span>
          </a>

          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.socialBtn} ${styles.shareFacebook}`}
            aria-label="Share on Facebook"
          >
            <FaFacebookF size={18} className={styles.socialIcon} />
            <span>Facebook</span>
          </a>

          <a
            href={emailUrl}
            className={`${styles.socialBtn} ${styles.shareEmail}`}
            aria-label="Share via Email"
          >
            <FaEnvelope size={18} className={styles.socialIcon} />
            <span>Email</span>
          </a>
        </div>

        <div className={styles.copySection}>
          <span className={styles.copyLabel}>Page Link</span>
          <div className={styles.inputGroup}>
            <input
              type="text"
              readOnly
              value={url}
              className={styles.input}
              onFocus={(e) => e.target.select()}
              aria-label="Article link"
            />
            <button
              type="button"
              className={`${styles.copyBtn} ${copied ? styles.copyBtnSuccess : ""}`}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <FiCheck size={14} className={styles.copyIcon} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <FiCopy size={14} className={styles.copyIcon} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
