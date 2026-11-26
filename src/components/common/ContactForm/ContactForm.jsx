import React, { useState, useRef, useEffect } from "react";
import {
  FaTimes,
  FaWhatsapp,
  FaPhoneAlt,
  FaFacebookF,
  FaInstagram,
  FaPinterestP,
  FaExclamationCircle,
  FaCheck,
} from "react-icons/fa";
import styles from "./ContactForm.module.css";
import { supabase } from "../../../lib/supabaseClient";
import { API_ENDPOINTS } from "../../../config/api";
import { isValidEmail, isBotSubmission, checkRateLimit, recordSubmission } from "../../../utils";

const contactArtDesktop = "/images/contact-support.svg";
const contactArtMobile = "/images/contact-support.svg";

const SERVICE_OPTIONS = [
  "Architectural Design",
  "Structural Engineering",
  "Turnkey Construction",
  "Interior & Modular Design",
  "Permits & Site Surveys",
  "Feasibility & Valuation",
];

const COUNTRY_CODES = [
  { code: "+1", label: "US", name: "USA / Canada" },
  { code: "+44", label: "UK", name: "United Kingdom" },
  { code: "+61", label: "AU", name: "Australia" },
  { code: "+49", label: "DE", name: "Germany" },
  { code: "+971", label: "UAE", name: "United Arab Emirates" },
];

const RATE_LIMIT_STORAGE_KEY = "app_contact_submissions";

export default function ContactForm({
  title = "Let's design your dream space",
  subtitle = "Connect directly with our licensed structural engineers and studio architects.",
  _eyebrow = "CONSULTATION & INQUIRY",
  initialService,
}) {
  const formLoadedAtRef = useRef(Date.now());
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    countryCode: "+1",
    services: initialService ? [initialService] : [],
    message: "",
    botcheck: false,
    website_url_hp: "",
  });

  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef(null);

  const [isArtLoaded, setIsArtLoaded] = useState(false);
  const artImgRef = useRef(null);

  const [status, setStatus] = useState({
    submitting: false,
    success: false,
    error: false,
    message: "",
  });

  useEffect(() => {
    if (artImgRef.current && artImgRef.current.complete && artImgRef.current.naturalWidth > 0) {
      setIsArtLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (initialService) {
      const canonical = SERVICE_OPTIONS.find(
        (opt) =>
          opt.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "") ===
          initialService.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "")
      ) || initialService;

      setFormData((prev) => ({
        ...prev,
        services: [canonical],
      }));
    }
  }, [initialService]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target)) {
        setIsCountryDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsCountryDropdownOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
      const isSelected = prev.services.includes(serviceName);
      let updated;
      if (isSelected) {
        updated = prev.services.filter((s) => s !== serviceName);
      } else {
        updated = [...prev.services, serviceName];
      }
      return { ...prev, services: updated };
    });
    if (status.error) {
      setStatus((prev) => ({ ...prev, error: false, message: "" }));
    }
  };

  const handleCountrySelect = (code) => {
    setFormData((prev) => ({ ...prev, countryCode: code }));
    setIsCountryDropdownOpen(false);
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Please enter your name.";
    if (!formData.email.trim() || !isValidEmail(formData.email)) {
      return "Please enter a valid email address.";
    }
    if (!formData.message.trim()) {
      return "Please provide some project comments or requirements.";
    }
    if (formData.message.trim().length < 10) {
      return "Please enter at least 10 characters in your project comments.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isBotSubmission(formData, formLoadedAtRef.current)) {
      setStatus({
        submitting: false,
        success: true,
        error: false,
        message: "Thank you! Your message has been received.",
      });
      return;
    }

    const { allowed } = checkRateLimit(RATE_LIMIT_STORAGE_KEY, 10);
    if (!allowed) {
      setStatus({
        submitting: false,
        success: false,
        error: true,
        message:
          "Submission frequency limit reached. Please wait a moment or contact us directly via WhatsApp.",
      });
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setStatus({
        submitting: false,
        success: false,
        error: true,
        message: validationError,
      });
      return;
    }

    setStatus({ submitting: true, success: false, error: false, message: "" });

    const fullName = formData.name.trim();
    const formattedPhone = formData.phone.trim()
      ? `${formData.countryCode} ${formData.phone.trim()}`
      : "Not Provided";
    const selectedServicesText =
      formData.services.length > 0
        ? formData.services.join(", ")
        : "General Engineering Consultation";

    const submissionData = {
      name: fullName,
      email: formData.email.trim(),
      phone: formattedPhone,
      service: selectedServicesText,
      message: formData.message.trim(),
    };

    const completeSuccess = (successMsg) => {
      recordSubmission(RATE_LIMIT_STORAGE_KEY);
      setStatus({
        submitting: false,
        success: true,
        error: false,
        message: successMsg,
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        countryCode: "+1",
        services: [SERVICE_OPTIONS[0]],
        message: "",
        botcheck: false,
        website_url_hp: "",
      });
      formLoadedAtRef.current = Date.now();
    };

    if (!supabase && !import.meta.env?.VITE_API_URL) {
      completeSuccess(
        "Demo mode: Your consultation inquiry was validated locally. Connect Supabase or API routes to deliver live messages."
      );
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
            completeSuccess("Thank you! Your inquiry has been received by our engineering desk.");
            return;
          } catch (dbErr) {
            console.warn("Direct Supabase fallback insert error:", dbErr);
          }
        }
        throw new Error(resendData?.error || "Unable to send inquiry. Please try again.");
      }

      completeSuccess("Thank you! Your inquiry has been received by our engineering desk.");
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
          completeSuccess("Thank you! Your inquiry has been received by our engineering desk.");
          return;
        } catch (dbErr) {
          console.warn("Direct Supabase fallback in catch error:", dbErr);
        }
      }
      setStatus({
        submitting: false,
        success: false,
        error: true,
        message: err.message || "Failed to submit. Please check your connection.",
      });
    }
  };

  const handleResetForm = () => {
    setStatus({ submitting: false, success: false, error: false, message: "" });
    formLoadedAtRef.current = Date.now();
  };

  const openWhatsApp = () => {
    const name = formData.name.trim() || "Prospective Client";
    const inquiryBody = [
      "Hello Structura Studio Team,",
      "",
      `Name: ${name}`,
      `Email: ${formData.email.trim() || "-"}`,
      `Phone: ${formData.phone.trim() ? `${formData.countryCode} ${formData.phone.trim()}` : "-"}`,
      `Services: ${formData.services.join(", ") || "-"}`,
      "",
      "Project Details:",
      formData.message.trim() || "Requesting architectural & engineering consultation.",
    ].join("\n");

    window.open(
      `https://wa.me/15550100000?text=${encodeURIComponent(inquiryBody)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <section className={styles.sectionOuter} aria-label="Contact Form Section">
      <div className={styles.formContainer}>
        <div className={styles.artCol}>
          <div className={styles.artWrapper}>
            {!isArtLoaded && (
              <div className={styles.artSkeleton} aria-hidden="true">
                <div className={styles.artSkeletonShimmer} />
                <div className={styles.artSkeletonGlow} />
              </div>
            )}
            <picture className={styles.artPicture}>
              <source media="(max-width: 768px)" srcSet={contactArtMobile} />
              <img
                ref={artImgRef}
                src={contactArtDesktop}
                alt="Structura Studio Consultation Desk"
                className={`${styles.artImg} ${isArtLoaded ? styles.artImgLoaded : styles.artImgLoading}`}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width="1536"
                height="1024"
                onLoad={() => setIsArtLoaded(true)}
              />
            </picture>
          </div>

          <div className={styles.desktopSocialRow} aria-label="Social and direct channels">
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
            <button
              type="button"
              onClick={openWhatsApp}
              className={`${styles.socialCircleBtn} ${styles.socialBtnWhatsapp}`}
              aria-label="WhatsApp"
              title="WhatsApp"
            >
              <FaWhatsapp />
            </button>
            <a
              href="tel:+15550100000"
              className={`${styles.socialCircleBtn} ${styles.socialBtnPhone}`}
              aria-label="Phone Line"
              title="Call Studio"
            >
              <FaPhoneAlt />
            </a>
          </div>
        </div>

        <div className={styles.formCol}>
          {(title || subtitle) && (
            <div className={styles.headerArea}>
              {title && <h2 className={styles.title}>{title}</h2>}
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
          )}

          <form className={styles.contactForm} onSubmit={handleSubmit} noValidate>
            <input
              type="checkbox"
              name="botcheck"
              className={styles.honeypot}
              onChange={handleInputChange}
              checked={formData.botcheck}
              tabIndex={-1}
              autoComplete="off"
            />
            <input
              type="text"
              name="website_url_hp"
              className={styles.honeypot}
              onChange={handleInputChange}
              value={formData.website_url_hp || ""}
              tabIndex={-1}
              autoComplete="off"
            />

            <div className={styles.fieldGroup}>
              <label htmlFor="form-name" className={styles.fieldLabel}>
                Your Name
              </label>
              <input
                type="text"
                id="form-name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Your name"
                autoComplete="name"
                className={styles.textInput}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="form-email" className={styles.fieldLabel}>
                Email
              </label>
              <input
                type="email"
                id="form-email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Your email address"
                autoComplete="email"
                className={styles.textInput}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="form-phone" className={styles.fieldLabel}>
                Phone number
              </label>
              <div className={styles.phoneInputGroup}>
                <div className={styles.countryPicker} ref={countryDropdownRef}>
                  <button
                    type="button"
                    className={styles.countryTrigger}
                    onClick={() => setIsCountryDropdownOpen((p) => !p)}
                    aria-haspopup="listbox"
                    aria-expanded={isCountryDropdownOpen}
                  >
                    <span>
                      {COUNTRY_CODES.find((c) => c.code === formData.countryCode)?.label || "IN"}
                    </span>
                    <span className={styles.caretDown}>▾</span>
                  </button>

                  {isCountryDropdownOpen && (
                    <ul className={styles.countryMenu} role="listbox">
                      {COUNTRY_CODES.map((item) => (
                        <li
                          key={item.code}
                          role="option"
                          aria-selected={formData.countryCode === item.code}
                          className={`${styles.countryOption} ${formData.countryCode === item.code ? styles.countryOptionActive : ""
                            }`}
                          onClick={() => handleCountrySelect(item.code)}
                        >
                          <strong>{item.label}</strong>
                          <span>{item.code}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <input
                  type="tel"
                  id="form-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={`${formData.countryCode} (000) 000-0000`}
                  autoComplete="tel"
                  className={styles.phoneField}
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="form-message" className={styles.fieldLabel}>
                Comments
              </label>
              <textarea
                id="form-message"
                name="message"
                required
                rows={4}
                maxLength={900}
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Describe your project requirements, site location, estimated plot size, or any specific architectural and engineering goals..."
                className={styles.textareaInput}
              />
            </div>

            <div className={styles.servicesGroup}>
              <span className={styles.fieldLabel}>Services</span>
              <div className={styles.servicesCheckboxGrid}>
                {SERVICE_OPTIONS.map((svc) => {
                  const isChecked = formData.services.includes(svc);
                  return (
                    <label key={svc} className={styles.checkboxItem}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleServiceToggle(svc)}
                        className={styles.nativeCheckbox}
                      />
                      <span
                        className={`${styles.customCheckbox} ${isChecked ? styles.checkboxChecked : ""
                          }`}
                      >
                        {isChecked && <FaCheck className={styles.checkIcon} />}
                      </span>
                      <span className={styles.checkboxLabel}>{svc}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {status.error && (
              <div className={styles.errorBanner} role="alert">
                <FaExclamationCircle className={styles.statusIcon} />
                <span>{status.message}</span>
              </div>
            )}

            <div className={styles.submitWrapper}>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={status.submitting}
                aria-busy={status.submitting}
              >
                {status.submitting ? "Submitting inquiry..." : "Request Consultation"}
              </button>
            </div>

            <div className={styles.mobileSocialRow} aria-label="Social and direct channels">
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
              <button
                type="button"
                onClick={openWhatsApp}
                className={`${styles.socialCircleBtn} ${styles.socialBtnWhatsapp}`}
                aria-label="WhatsApp"
                title="WhatsApp"
              >
                <FaWhatsapp />
              </button>
              <a
                href="tel:+15550100000"
                className={`${styles.socialCircleBtn} ${styles.socialBtnPhone}`}
                aria-label="Phone Line"
                title="Call Studio"
              >
                <FaPhoneAlt />
              </a>
            </div>
          </form>

          {status.success && (
            <div className={styles.successOverlay} role="status" aria-live="polite">
              <button
                type="button"
                className={styles.successCloseBtn}
                onClick={handleResetForm}
                aria-label="Close confirmation"
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
        </div>
      </div>
    </section>
  );
}