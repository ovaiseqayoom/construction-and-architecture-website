import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styles from "./Footer.module.css";
const logoBg = "/logo-white.svg";
import { supabase } from "../../../lib/supabaseClient";
import { API_ENDPOINTS } from "../../../config/api";

import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaWhatsapp,
  FaFacebookF,
  FaInstagram,
  FaPinterestP,
  FaChevronRight,
  FaPaperPlane,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
} from "react-icons/fa";

const Footer = () => {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState("subscribe");
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [status, setStatus] = useState({
    success: false,
    error: false,
    message: "",
  });
  const [botcheck, setBotcheck] = useState(false);
  const [websiteUrlHp, setWebsiteUrlHp] = useState("");
  const [companyTaxHp, setCompanyTaxHp] = useState("");
  const formLoadedAtRef = useRef(Date.now());
  const lastSubmitTimeRef = useRef(0);

  useEffect(() => {
    const syncSubStatus = () => {
      const isSubbed = localStorage.getItem("app_newsletter_subscribed") === "true";
      setAlreadySubscribed(isSubbed);
    };

    syncSubStatus();
    window.addEventListener("storage", syncSubStatus);
    window.addEventListener("app-newsletter-updated", syncSubStatus);

    return () => {
      window.removeEventListener("storage", syncSubStatus);
      window.removeEventListener("app-newsletter-updated", syncSubStatus);
    };
  }, []);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || submitting) return;

    const isUnsub = mode === "unsubscribe";

    const applyLocalSubState = (msg) => {
      if (isUnsub) {
        localStorage.removeItem("app_newsletter_subscribed");
        setAlreadySubscribed(false);
        setMode("subscribe");
      } else {
        localStorage.setItem("app_newsletter_subscribed", "true");
        setAlreadySubscribed(true);
      }
      window.dispatchEvent(new Event("app-newsletter-updated"));
      setStatus({ success: true, error: false, message: msg });
      setEmail("");
    };

    if (botcheck || websiteUrlHp || companyTaxHp || Date.now() - formLoadedAtRef.current < 800) {
      applyLocalSubState(
        isUnsub
          ? "You have been successfully unsubscribed."
          : "Thank you for subscribing! Updates confirmation recorded."
      );
      return;
    }

    const now = Date.now();
    if (now - lastSubmitTimeRef.current < 2000) {
      setStatus({
        success: false,
        error: true,
        message: "Please wait a moment before submitting again.",
      });
      return;
    }
    lastSubmitTimeRef.current = now;

    if (!supabase && !import.meta.env?.VITE_API_URL) {
      applyLocalSubState(
        isUnsub
          ? "Demo mode: unsubscribed locally."
          : "Demo mode: thank you for subscribing!"
      );
      return;
    }

    setSubmitting(true);
    setStatus({ success: false, error: false, message: "" });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(API_ENDPOINTS.SUBSCRIBE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          action: isUnsub ? "unsubscribe" : "subscribe",
          botcheck: botcheck ? "bot" : undefined,
          website_url_hp: websiteUrlHp,
          company_tax_hp: companyTaxHp,
          _formLoadedAt: formLoadedAtRef.current,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      let result = {};
      try {
        result = await response.json();
      } catch { }

      if (response.ok && result.success !== false) {
        applyLocalSubState(
          isUnsub
            ? "You have been successfully unsubscribed from our newsletter."
            : "Thank you for subscribing! A confirmation has been sent to your inbox."
        );
      } else {
        throw new Error(result.error || "Request failed. Please try again.");
      }
    } catch (err) {
      if (supabase) {
        try {
          const { error: dbErr } = await supabase.from("inquiries").insert([
            {
              name: isUnsub ? "Unsubscribed User" : "Newsletter Subscriber",
              email: cleanEmail,
              service: isUnsub ? "Newsletter Unsubscribe" : "Newsletter Subscription",
              message: isUnsub
                ? "User unsubscribed via website footer."
                : "Subscriber registered via website footer.",
              status: "unread",
            },
          ]);
          if (!dbErr) {
            applyLocalSubState(
              isUnsub
                ? "You have been successfully unsubscribed."
                : "Thank you for subscribing! We have registered your subscription."
            );
            return;
          }
        } catch { }
      }

      setStatus({
        success: false,
        error: true,
        message: err.message || "Operation failed. Please check your connection.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFooterLinkClick = (targetPath) => {
    if (typeof window !== "undefined" && window.location.pathname === targetPath) {
      if (window.lenis) {
        window.lenis.scrollTo(0);
      } else {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.bgWatermarkText} aria-hidden="true">
        STRUCTURA
      </div>

      <div className={styles.footerContainer}>
        <div className={`${styles.footerColumn} ${styles.companyColumn}`}>
          <div className={styles.logoWrapper}>
            <img
              src={logoBg}
              alt="Structura Architecture and Construction"
              className={styles.footerLogo}
              width="140"
              height="36"
              loading="lazy"
              decoding="async"
            />
          </div>

          <p className={styles.companyDescription}>
            Structura Architecture &amp; Construction delivers structural engineering, architectural planning, interior architecture, and turnkey construction solutions.
          </p>

          <div className={styles.socialIcons}>
            <a
              href="https://example.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className={styles.socialLinkFacebook}
            >
              <FaFacebookF />
            </a>

            <a
              href="https://example.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={styles.socialLinkInstagram}
            >
              <FaInstagram />
            </a>

            <a
              href="https://example.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Pinterest"
              className={styles.socialLinkPinterest}
            >
              <FaPinterestP />
            </a>

            <a href="mailto:hello@example.com" aria-label="Email">
              <FaEnvelope />
            </a>
          </div>
        </div>

        <div className={`${styles.footerColumn} ${styles.linksColumn}`}>
          <h3 className={styles.columnTitle}>Quick Links</h3>
          <ul className={styles.navLinksList}>
            <li>
              <Link to="/" onClick={() => handleFooterLinkClick("/")}>
                <FaChevronRight className={styles.linkChevron} />
                <span>Home</span>
              </Link>
            </li>
            <li>
              <Link to="/services" onClick={() => handleFooterLinkClick("/services")}>
                <FaChevronRight className={styles.linkChevron} />
                <span>Our Services</span>
              </Link>
            </li>
            <li>
              <Link
                to="/projects"
                onClick={() => {
                  handleFooterLinkClick("/projects");
                  window.dispatchEvent(new CustomEvent("resetProjectFilters"));
                }}
              >
                <FaChevronRight className={styles.linkChevron} />
                <span>Featured Projects</span>
              </Link>
            </li>
            <li>
              <Link to="/about" onClick={() => handleFooterLinkClick("/about")}>
                <FaChevronRight className={styles.linkChevron} />
                <span>About Us</span>
              </Link>
            </li>
            <li>
              <Link to="/blog" onClick={() => handleFooterLinkClick("/blog")}>
                <FaChevronRight className={styles.linkChevron} />
                <span>Engineering Blog</span>
              </Link>
            </li>
            <li>
              <Link to="/careers" onClick={() => handleFooterLinkClick("/careers")}>
                <FaChevronRight className={styles.linkChevron} />
                <span>Careers</span>
              </Link>
            </li>
            <li>
              <Link to="/contact" onClick={() => handleFooterLinkClick("/contact")}>
                <FaChevronRight className={styles.linkChevron} />
                <span>Contact Us</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className={`${styles.footerColumn} ${styles.contactColumn}`}>
          <h3 className={styles.columnTitle}>Get In Touch</h3>

          <ul className={styles.contactList}>
            <li>
              <FaMapMarkerAlt className={styles.contactIcon} />
              <span>123 Architecture Ave, Design District</span>
            </li>

            <li>
              <FaPhoneAlt className={styles.contactIcon} />
              <a href="tel:+15550100000">+1 (555) 010-0000</a>
            </li>

            <li>
              <FaEnvelope className={styles.contactIcon} />
              <a href="mailto:hello@example.com">hello@example.com</a>
            </li>

            <li>
              <FaWhatsapp className={styles.contactIcon} />
              <a
                href="https://wa.me/15550100000"
                target="_blank"
                rel="noopener noreferrer"
              >
                +1 (555) 010-0000
              </a>
            </li>
          </ul>
        </div>

        <div className={`${styles.footerColumn} ${styles.newsletterColumn}`}>
          <h3 className={styles.columnTitle}>
            {mode === "unsubscribe" ? "Unsubscribe from Updates" : "Engineering Insights"}
          </h3>
          <p className={styles.newsletterText}>
            {mode === "unsubscribe"
              ? "Enter your email address below to remove yourself from our newsletter list."
              : "Get practical updates on construction, architecture, building codes, and structural engineering."}
          </p>

          {alreadySubscribed && mode !== "unsubscribe" ? (
            <div className={styles.subscribedBadgeBox}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FaCheckCircle className={styles.subscribedCheckIcon} />
                <span>Subscribed</span>
              </div>
              <button
                type="button"
                className={styles.unsubToggleLink}
                onClick={() => {
                  setMode("unsubscribe");
                  setStatus({ success: false, error: false, message: "" });
                }}
              >
                Unsubscribe?
              </button>
            </div>
          ) : (
            <form className={styles.subscribeForm} onSubmit={handleNewsletterSubmit}>
              <input
                type="checkbox"
                name="botcheck"
                checked={botcheck}
                onChange={(e) => setBotcheck(e.target.checked)}
                style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <input
                type="text"
                name="website_url_hp"
                value={websiteUrlHp}
                onChange={(e) => setWebsiteUrlHp(e.target.value)}
                style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <input
                type="text"
                name="company_tax_hp"
                value={companyTaxHp}
                onChange={(e) => setCompanyTaxHp(e.target.value)}
                style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
                tabIndex={-1}
                autoComplete="new-password"
                aria-hidden="true"
              />
              <div className={styles.inputWrapper}>
                <input
                  type="email"
                  placeholder={
                    mode === "unsubscribe"
                      ? "Enter email to unsubscribe"
                      : "Enter your email address"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={100}
                  required
                  disabled={submitting}
                  className={styles.subscribeInput}
                />
                <button
                  type="submit"
                  className={mode === "unsubscribe" ? styles.unsubscribeButton : styles.subscribeButton}
                  aria-label={mode === "unsubscribe" ? "Confirm Unsubscribe" : "Subscribe"}
                  disabled={submitting}
                  title={mode === "unsubscribe" ? "Confirm Unsubscribe" : "Subscribe"}
                >
                  {submitting ? (
                    <FaSpinner className={styles.spinnerIcon} />
                  ) : mode === "unsubscribe" ? (
                    <span className={styles.unsubBtnText}>Unsub</span>
                  ) : (
                    <FaPaperPlane />
                  )}
                </button>
              </div>

              {status.error && (
                <div className={styles.errorMessage}>
                  <FaExclamationCircle />
                  <span>{status.message}</span>
                </div>
              )}
              {status.success && (
                <div className={styles.successMessage}>
                  <FaCheckCircle />
                  <span>{status.message}</span>
                </div>
              )}
            </form>
          )}

          {mode === "unsubscribe" && (
            <div className={styles.unsubRow}>
              <button
                type="button"
                className={styles.resubToggleLink}
                onClick={() => {
                  setMode("subscribe");
                  setStatus({ success: false, error: false, message: "" });
                }}
              >
                &larr; Cancel &amp; stay subscribed
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.footerBottomBar}>
        <div className={styles.bottomContent}>
          <p className={styles.copyrightText}>
            &copy; {year} Structura Architecture &amp; Construction. All rights reserved.
          </p>

          <div className={styles.legalLinks}>
            <Link to="/privacy" className={styles.legalLink}>
              Privacy Policy
            </Link>
            <span className={styles.legalDivider}>•</span>
            <Link to="/terms" className={styles.legalLink}>
              Terms &amp; Conditions
            </Link>
          </div>

          <p className={styles.devCredit}>
            Open-Source Architecture &amp; Engineering Web Template
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;