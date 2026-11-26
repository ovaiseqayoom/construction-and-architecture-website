import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  FaTimes,
  FaPhoneAlt,
  FaWhatsapp,
  FaExclamationCircle,
  FaFacebookF,
  FaInstagram,
  FaPinterestP,
  FaCheck,
} from "react-icons/fa";
import useScrollLock from "../../../hooks/useScrollLock";
import useModalDismiss from "../../../hooks/useModalDismiss";
import { supabase } from "../../../lib/supabaseClient";
import { API_ENDPOINTS } from "../../../config/api";
import { isValidEmail, isBotSubmission, checkRateLimit, recordSubmission } from "../../../utils";
import styles from "./ContactModal.module.css";

const CUSTOMER_SUPPORT_ART_DESKTOP = "/images/contact-support.svg";
const CUSTOMER_SUPPORT_ART_MOBILE = "/images/contact-support.svg";

const DEFAULT_SERVICE_OPTIONS = [
  "Architectural Design",
  "Structural Engineering",
  "Turnkey Construction",
  "Interior & Modular Design",
  "Permits & Site Surveys",
  "Feasibility & Valuation",
];

function normalizeService(name) {
  if (!name) return DEFAULT_SERVICE_OPTIONS[0];
  const clean = name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
  const match = DEFAULT_SERVICE_OPTIONS.find((opt) => {
    const cleanOpt = opt.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
    return cleanOpt === clean || cleanOpt.includes(clean) || clean.includes(cleanOpt);
  });
  return match || name;
}

const RATE_LIMIT_STORAGE_KEY = "app_contact_submissions";

export default function ContactModal({
  isOpen,
  onClose,
  initialService = null,
}) {
  const formLoadedAtRef = useRef(Date.now());
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    services: initialService ? [normalizeService(initialService)] : [],
    message: "",
    botcheck: false,
    website_url_hp: "",
  });

  const modalCardRef = useRef(null);

  const [isDesktopArtLoaded, setIsDesktopArtLoaded] = useState(false);
  const [isMobileArtLoaded, setIsMobileArtLoaded] = useState(false);
  const desktopImgRef = useRef(null);
  const mobileImgRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (typeof window !== "undefined") {
        const img1 = new Image();
        img1.src = CUSTOMER_SUPPORT_ART_DESKTOP;
        const img2 = new Image();
        img2.src = CUSTOMER_SUPPORT_ART_MOBILE;
      }
      if (desktopImgRef.current?.complete && desktopImgRef.current?.naturalWidth > 0) {
        setIsDesktopArtLoaded(true);
      }
      if (mobileImgRef.current?.complete && mobileImgRef.current?.naturalWidth > 0) {
        setIsMobileArtLoaded(true);
      }
    }
  }, [isOpen]);

  const [status, setStatus] = useState({
    submitting: false,
    success: false,
    error: false,
    message: "",
  });

  useScrollLock(isOpen);

  const handleModalClose = useCallback(() => {
    if (window.location.hash === "#contact-form") {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
    setStatus({ submitting: false, success: false, error: false, message: "" });
    onClose();
  }, [onClose]);

  useModalDismiss({
    isOpen,
    onClose: handleModalClose,
    modalRef: modalCardRef,
    closeOnEscape: true,
    closeOnOutsideClick: false,
  });

  useEffect(() => {
    if (isOpen) {
      if (window.location.hash !== "#contact-form") {
        window.history.pushState(null, "", "#contact-form");
      }
    } else {
      if (window.location.hash === "#contact-form") {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search
        );
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash !== "#contact-form" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      if (initialService) {
        const canonical = normalizeService(initialService);
        setFormData((prev) => ({
          ...prev,
          services: [canonical],
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          services: [],
        }));
      }
    }
  }, [initialService, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (status.error) {
      setStatus((prev) => ({ ...prev, error: false, message: "" }));
    }
  };

  const handleServiceToggle = (serviceName) => {
    setFormData((prev) => {
      const exists = prev.services.includes(serviceName);
      const updated = exists
        ? prev.services.filter((s) => s !== serviceName)
        : [...prev.services, serviceName];
      return {
        ...prev,
        services: updated,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setStatus({
        submitting: false,
        success: false,
        error: true,
        message: "Please fill in all required fields (Name, Email, Message).",
      });
      return;
    }

    if (!isValidEmail(formData.email.trim())) {
      setStatus({
        submitting: false,
        success: false,
        error: true,
        message: "Please enter a valid email address.",
      });
      return;
    }

    if (isBotSubmission(formData, formLoadedAtRef.current)) {
      setStatus({
        submitting: false,
        success: true,
        error: false,
        message: "Your message has been received.",
      });
      return;
    }

    const rateLimit = checkRateLimit(RATE_LIMIT_STORAGE_KEY, 10, 600000);
    if (!rateLimit.allowed) {
      setStatus({
        submitting: false,
        success: false,
        error: true,
        message: "Too many submissions. Please wait a moment before trying again.",
      });
      return;
    }

    setStatus({ submitting: true, success: false, error: false, message: "" });

    const submissionData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || "Not Provided",
      service: formData.services.length > 0 ? formData.services.join(", ") : "General Inquiry",
      message: formData.message.trim(),
    };

    const finishSuccess = (msg = "Thank you! Your submission has been sent.") => {
      recordSubmission(RATE_LIMIT_STORAGE_KEY);
      setStatus({ submitting: false, success: true, error: false, message: msg });
      setFormData({
        name: "",
        email: "",
        phone: "",
        services: [DEFAULT_SERVICE_OPTIONS[0]],
        message: "",
        botcheck: false,
        website_url_hp: "",
      });
      formLoadedAtRef.current = Date.now();
    };

    if (!supabase && !import.meta.env?.VITE_API_URL) {
      finishSuccess("Demo mode: Your inquiry has been validated locally.");
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const resendResponse = await fetch(API_ENDPOINTS.SEND_INQUIRY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...submissionData,
          botcheck: formData.botcheck,
          website_url_hp: formData.website_url_hp,
          _formLoadedAt: formLoadedAtRef.current,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const resendData = await resendResponse.json().catch(() => null);

      if (!resendResponse.ok) {
        if (supabase) {
          try {
            const { error: dbErr } = await supabase.from("inquiries").insert([
              {
                name: submissionData.name,
                email: submissionData.email,
                phone: submissionData.phone !== "Not Provided" ? submissionData.phone : null,
                service: submissionData.service,
                message: submissionData.message,
                status: "unread",
              },
            ]);
            if (dbErr) throw dbErr;
            finishSuccess();
            return;
          } catch (dbErr) {
            console.warn("Direct Supabase fallback insert error:", dbErr);
          }
        }
        throw new Error(resendData?.error || "Unable to submit consultation request. Please try again.");
      }

      finishSuccess();
    } catch (err) {
      if (supabase) {
        try {
          const { error: dbErr } = await supabase.from("inquiries").insert([
            {
              name: submissionData.name,
              email: submissionData.email,
              phone: submissionData.phone !== "Not Provided" ? submissionData.phone : null,
              service: submissionData.service,
              message: submissionData.message,
              status: "unread",
            },
          ]);
          if (dbErr) throw dbErr;
          finishSuccess();
          return;
        } catch (dbErr) {
          console.warn("Direct Supabase fallback in catch error:", dbErr);
        }
      }
      setStatus({
        submitting: false,
        success: false,
        error: true,
        message: err.message || "Failed to submit. Please try again.",
      });
    }
  };

  const isFormValid = Boolean(
    formData.name.trim() &&
    isValidEmail(formData.email.trim()) &&
    formData.message.trim()
  );

  return createPortal(
    <div
      className={styles.modalBackdrop}
      onClick={handleModalClose}
      role="dialog"
      aria-modal="true"
      data-lenis-prevent="true"
    >
      <div
        ref={modalCardRef}
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
      >
        <div className={styles.modalGrid}>
          <div className={styles.gradientCard}>
            <div className={styles.cardHeaderRow}>
              <div className={styles.avatarGroup}>
                <img
                  src="/images/team/avatar-02.svg"
                  alt="Elena Cho - Structural Engineering Lead"
                  className={styles.directorAvatar}
                  width="58"
                  height="58"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>

            <p className={styles.coordinatorBio}>
              <strong>Elena Cho</strong> – Structural Engineering Lead, can help scope your project&apos;s initial requirements.
            </p>

            <div className={styles.modalArtContainer}>
              {!isDesktopArtLoaded && (
                <div className={styles.modalArtSkeleton} aria-hidden="true">
                  <div className={styles.modalArtSkeletonShimmer} />
                  <div className={styles.modalArtSkeletonGlow} />
                </div>
              )}
              <img
                ref={desktopImgRef}
                src={CUSTOMER_SUPPORT_ART_DESKTOP}
                alt="Structura Studio Technical Consultation"
                className={`${styles.modalArtImg} ${isDesktopArtLoaded ? styles.modalArtImgLoaded : styles.modalArtImgLoading}`}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width="1536"
                height="1024"
                onLoad={() => setIsDesktopArtLoaded(true)}
              />
            </div>

            <div className={styles.socialIconsRow} aria-label="Social links">
              <a
                href="https://example.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.socialCircleBtn} ${styles.socialBtnFacebook}`}
                aria-label="Facebook"
                title="Facebook"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://example.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.socialCircleBtn} ${styles.socialBtnInstagram}`}
                aria-label="Instagram"
                title="Instagram"
              >
                <FaInstagram />
              </a>
              <a
                href="https://example.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.socialCircleBtn} ${styles.socialBtnPinterest}`}
                aria-label="Pinterest"
                title="Pinterest"
              >
                <FaPinterestP />
              </a>
              <a
                href="https://wa.me/15550100000"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialCircleBtn}
                aria-label="WhatsApp"
                title="WhatsApp"
              >
                <FaWhatsapp />
              </a>
              <a
                href="tel:+15550100000"
                className={styles.socialCircleBtn}
                aria-label="Phone"
                title="Phone"
              >
                <FaPhoneAlt />
              </a>
            </div>
          </div>

          <div className={styles.formPanel}>
            {/* Minimalist frosted Success Overlay above the form (form remains slightly visible in background) */}
            {status.success && (
              <div className={styles.successOverlay} role="status" aria-live="polite">
                <button
                  type="button"
                  className={styles.successCloseBtn}
                  onClick={handleModalClose}
                  aria-label="Close modal"
                >
                  <FaTimes />
                </button>

                <div className={styles.successContent}>
                  <svg
                    className={styles.successCheckIcon}
                    viewBox="0 0 80 80"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle cx="40" cy="40" r="36" stroke="#22C55E" strokeWidth="6" />
                    <path
                      d="M24 40.5L35 51.5L56 28"
                      stroke="#22C55E"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <h3 className={styles.successTitle}>Thank you!</h3>
                  <p className={styles.successDesc}>Your submission has been sent.</p>
                </div>
              </div>
            )}

            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={handleModalClose}
              aria-label="Close modal"
            >
              <FaTimes />
            </button>

            {/* Mobile 3D Character placed ABOVE the title */}
            <div className={styles.mobileArtContainer}>
              {!isMobileArtLoaded && (
                <div className={styles.mobileArtSkeleton} aria-hidden="true">
                  <div className={styles.mobileArtSkeletonShimmer} />
                </div>
              )}
              <img
                ref={mobileImgRef}
                src={CUSTOMER_SUPPORT_ART_MOBILE}
                alt="Structura Studio Support"
                className={`${styles.mobileArtImg} ${isMobileArtLoaded ? styles.mobileArtImgLoaded : styles.mobileArtImgLoading}`}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width="1199"
                height="1312"
                onLoad={() => setIsMobileArtLoaded(true)}
              />
            </div>

            {/* Title positioned under image on mobile, top on desktop */}
            <h2 className={styles.formHeading}>
              <span className={styles.headingMuted}>What services </span>
              <span className={styles.headingLight}>we can support you with?</span>
            </h2>

            <form onSubmit={handleSubmit} className={styles.formElement} noValidate>
              <input
                type="checkbox"
                name="botcheck"
                className={styles.honeypot}
                checked={formData.botcheck}
                onChange={handleInputChange}
                tabIndex={-1}
                autoComplete="off"
              />
              <input
                type="text"
                name="website_url_hp"
                className={styles.honeypot}
                value={formData.website_url_hp || ""}
                onChange={handleInputChange}
                tabIndex={-1}
                autoComplete="off"
              />

              <div className={styles.serviceSection}>
                <span className={styles.serviceSectionTitle}>I'm interested in</span>
                <div className={styles.servicesCheckboxGrid}>
                  {DEFAULT_SERVICE_OPTIONS.map((svc) => {
                    const isChecked = formData.services.includes(svc);
                    return (
                      <button
                        key={svc}
                        type="button"
                        className={`${styles.checkboxItem} ${isChecked ? styles.checkboxItemActive : ""
                          }`}
                        onClick={() => handleServiceToggle(svc)}
                        role="checkbox"
                        aria-checked={isChecked}
                      >
                        <span
                          className={`${styles.customCheckbox} ${isChecked ? styles.checkboxChecked : ""
                            }`}
                        >
                          {isChecked && <FaCheck className={styles.checkIcon} />}
                        </span>
                        <span className={styles.checkboxLabel}>{svc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.inputStack}>
                <div className={styles.underlineGroup}>
                  <label htmlFor="modal-name" className={styles.underlineLabel}>
                    Your Name
                  </label>
                  <input
                    id="modal-name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className={styles.underlineField}
                    autoComplete="name"
                  />
                </div>

                <div className={styles.underlineGroup}>
                  <label htmlFor="modal-email" className={styles.underlineLabel}>
                    E-mail
                  </label>
                  <input
                    id="modal-email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={styles.underlineField}
                    autoComplete="email"
                  />
                </div>

                <div className={styles.underlineGroup}>
                  <label htmlFor="modal-phone" className={styles.underlineLabel}>
                    Phone
                  </label>
                  <input
                    id="modal-phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={styles.underlineField}
                    autoComplete="tel"
                  />
                </div>

                <div className={styles.underlineGroup}>
                  <label htmlFor="modal-message" className={styles.underlineLabel}>
                    Message
                  </label>
                  <input
                    id="modal-message"
                    name="message"
                    type="text"
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    className={styles.underlineField}
                  />
                </div>
              </div>

              {status.error && (
                <div className={styles.errorBanner} role="alert">
                  <FaExclamationCircle className={styles.errorIcon} />
                  <span>{status.message}</span>
                </div>
              )}

              <div className={styles.submitRow}>
                <button
                  type="submit"
                  className={styles.limeSubmitBtn}
                  disabled={status.submitting || !isFormValid}
                >
                  {status.submitting ? "Submitting..." : "Submit"}
                </button>
              </div>

              {/* Legal links (very small, right-aligned in desktop, centered in mobile) */}
              <div className={styles.legalLinksRow}>
                <Link
                  to="/terms"
                  onClick={handleModalClose}
                  className={styles.legalLink}
                >
                  Terms
                </Link>
                <span className={styles.legalDivider}>•</span>
                <Link
                  to="/privacy"
                  onClick={handleModalClose}
                  className={styles.legalLink}
                >
                  Privacy Policy
                </Link>
              </div>

              {/* Social icons on mobile at the bottom */}
              <div className={styles.mobileSocialRow} aria-label="Social links">
                <a
                  href="https://example.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.socialCircleBtn} ${styles.socialBtnFacebook}`}
                  aria-label="Facebook"
                  title="Facebook"
                >
                  <FaFacebookF />
                </a>
                <a
                  href="https://example.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.socialCircleBtn} ${styles.socialBtnInstagram}`}
                  aria-label="Instagram"
                  title="Instagram"
                >
                  <FaInstagram />
                </a>
                <a
                  href="https://example.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.socialCircleBtn} ${styles.socialBtnPinterest}`}
                  aria-label="Pinterest"
                  title="Pinterest"
                >
                  <FaPinterestP />
                </a>
                <a
                  href="https://wa.me/15550100000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialCircleBtn}
                  aria-label="WhatsApp"
                  title="WhatsApp"
                >
                  <FaWhatsapp />
                </a>
                <a
                  href="tel:+15550100000"
                  className={styles.socialCircleBtn}
                  aria-label="Phone"
                  title="Phone"
                >
                  <FaPhoneAlt />
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
