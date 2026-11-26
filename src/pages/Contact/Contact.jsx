// Page: Contact — src/pages/Contact/Contact.jsx
import React, { useState, useEffect, useRef } from "react";
import MetaTags from "../../components/common/SEO/MetaTags";
import { PAGE_SEO, SEO_ENTITY, getFaqSchema } from "../../config/seo.config";
import {
  FaMapMarkerAlt,
  FaEnvelope,
  FaExternalLinkAlt,
  FaChevronDown,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
  FaArrowRight,
} from "react-icons/fa";
import ContactForm from "../../components/common/ContactForm/ContactForm";
import { supabase } from "../../lib/supabaseClient";
import { API_ENDPOINTS } from "../../config/api";
import styles from "./Contact.module.css";

const officeMapLink =
  "https://maps.google.com/?q=123+Architecture+Ave,+Design+District";

const faqList = [
  {
    q: "What engineering and architectural services does Structura provide?",
    a: "We offer architectural design, 3D modeling, seismic-compliant structural engineering, permit documentation, geotechnical review coordination, and turnkey construction management for residential, commercial, and civic projects.",
  },
  {
    q: "Do your structural designs follow modern seismic and wind-load standards?",
    a: "Yes. Every structural package incorporates ductile detailing, lateral drift limits, soil-structure alignment, and snow or wind load checks compliant with international structural codes.",
  },
  {
    q: "How do I schedule a studio consultation or site inspection?",
    a: "You can reach out through our contact form, direct phone line (+1 (555) 010-0000), or WhatsApp. We schedule an initial scoping session or arrange a site walkthrough to review feasibility.",
  },
  {
    q: "What is the typical workflow and timeline for a new project?",
    a: "Our process starts with survey and program discovery, followed by schematic architectural plans (2–3 weeks), structural analysis and BIM coordination, and permit submittals prior to mobilization.",
  },
  {
    q: "Can you assist with zoning audits and building permit submittals?",
    a: "Yes. We prepare Total Station contour maps, code-checked zoning sheets, structural stability undertakings, and permit submission packages for plan-check review.",
  },
  {
    q: "How are project estimates and construction budgets structured?",
    a: "We prepare detailed Bills of Quantities (BOQ) with transparent line-item allocations across structural frame, building envelope, MEP systems, and interior finishes.",
  },
  {
    q: "What is the best way to share existing survey files or CAD drawings?",
    a: "You can email your AutoCAD (.dwg), Revit models, or PDF survey drawings directly to hello@example.com for technical appraisal.",
  },
  {
    q: "How soon will I receive a response to my inquiry?",
    a: "All inquiries are reviewed by our engineering desk within 1 business day during regular studio hours (Mon–Fri, 9:00 AM – 6:00 PM).",
  },
];

export default function Contact() {
  const [openFaq, setOpenFaq] = useState(0);

  const [newsEmail, setNewsEmail] = useState("");
  const [newsMode, setNewsMode] = useState("subscribe");
  const [newsSubmitting, setNewsSubmitting] = useState(false);
  const [newsAlreadySubscribed, setNewsAlreadySubscribed] = useState(false);
  const [newsStatus, setNewsStatus] = useState({
    success: false,
    error: false,
    message: "",
  });
  const [newsBotcheck, setNewsBotcheck] = useState(false);
  const [newsWebsiteUrlHp, setNewsWebsiteUrlHp] = useState("");
  const [newsCompanyTaxHp, setNewsCompanyTaxHp] = useState("");
  const newsFormLoadedAtRef = useRef(Date.now());
  const newsLastSubmitTimeRef = useRef(0);

  useEffect(() => {
    const syncSubStatus = () => {
      const isSubbed = localStorage.getItem("app_newsletter_subscribed") === "true";
      setNewsAlreadySubscribed(isSubbed);
    };

    syncSubStatus();
    window.addEventListener("storage", syncSubStatus);
    window.addEventListener("app-newsletter-updated", syncSubStatus);

    return () => {
      window.removeEventListener("storage", syncSubStatus);
      window.removeEventListener("app-newsletter-updated", syncSubStatus);
    };
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? -1 : index);
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = newsEmail.trim().toLowerCase();
    if (!cleanEmail || newsSubmitting) return;

    const isUnsub = newsMode === "unsubscribe";

    const applySub = (msg) => {
      if (isUnsub) {
        localStorage.removeItem("app_newsletter_subscribed");
        setNewsAlreadySubscribed(false);
        setNewsMode("subscribe");
      } else {
        localStorage.setItem("app_newsletter_subscribed", "true");
        setNewsAlreadySubscribed(true);
      }
      window.dispatchEvent(new Event("app-newsletter-updated"));
      setNewsStatus({ success: true, error: false, message: msg });
      setNewsEmail("");
    };

    if (newsBotcheck || newsWebsiteUrlHp || newsCompanyTaxHp || Date.now() - newsFormLoadedAtRef.current < 800) {
      applySub(
        isUnsub
          ? "You have been successfully unsubscribed."
          : "Thank you for subscribing! Updates confirmation recorded."
      );
      return;
    }

    const now = Date.now();
    if (now - newsLastSubmitTimeRef.current < 2000) {
      setNewsStatus({
        success: false,
        error: true,
        message: "Please wait a moment before submitting again.",
      });
      return;
    }
    newsLastSubmitTimeRef.current = now;

    if (!supabase && !import.meta.env?.VITE_API_URL) {
      applySub(
        isUnsub
          ? "Demo mode: unsubscribed locally."
          : "Demo mode: thank you for subscribing!"
      );
      return;
    }

    setNewsSubmitting(true);
    setNewsStatus({ success: false, error: false, message: "" });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(API_ENDPOINTS.SUBSCRIBE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          action: isUnsub ? "unsubscribe" : "subscribe",
          botcheck: newsBotcheck ? "bot" : undefined,
          website_url_hp: newsWebsiteUrlHp,
          company_tax_hp: newsCompanyTaxHp,
          _formLoadedAt: newsFormLoadedAtRef.current,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      let result = {};
      try {
        result = await response.json();
      } catch { }

      if (response.ok && result.success !== false) {
        applySub(
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
                ? "User unsubscribed via contact page."
                : "Subscriber registered via contact page.",
              status: "unread",
            },
          ]);
          if (!dbErr) {
            applySub(
              isUnsub
                ? "You have been successfully unsubscribed."
                : "Thank you for subscribing! We have registered your subscription."
            );
            return;
          }
        } catch { }
      }

      setNewsStatus({
        success: false,
        error: true,
        message: err.message || "Failed to process newsletter request. Please try again.",
      });
    } finally {
      setNewsSubmitting(false);
    }
  };

  const contactSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": PAGE_SEO.contact.title,
      "description": PAGE_SEO.contact.description,
      "url": PAGE_SEO.contact.canonical,
      "mainEntity": {
        "@type": ["Organization", "LocalBusiness", "GeneralContractor"],
        "@id": `${SEO_ENTITY.siteUrl}/#organization`,
        "name": SEO_ENTITY.legalName,
        "telephone": SEO_ENTITY.primaryPhone,
        "email": SEO_ENTITY.primaryEmail,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": SEO_ENTITY.address.streetAddress,
          "addressLocality": SEO_ENTITY.address.addressLocality,
          "addressRegion": SEO_ENTITY.address.addressRegion,
          "postalCode": SEO_ENTITY.address.postalCode,
          "addressCountry": SEO_ENTITY.address.addressCountry
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": SEO_ENTITY.geo.latitude,
          "longitude": SEO_ENTITY.geo.longitude
        }
      }
    },
    getFaqSchema(faqList)
  ].filter(Boolean);

  const renderNewsletterCard = () => {
    return (
      <div className={styles.newsletterCard}>
        <div className={styles.newsletterContentTop}>
          <div className={styles.newsletterHeader}>
            <div className={styles.newsletterEyebrow}>
              <span className={styles.eyebrowSquareAmber} />
              <span>{newsMode === "unsubscribe" ? "PREFERENCES" : "ENGINEERING DIGEST"}</span>
            </div>
            <h2 className={styles.newsletterTitle}>
              {newsMode === "unsubscribe"
                ? "Unsubscribe from updates"
                : "Stay ahead with engineering & design insights"}
            </h2>
            <p className={styles.newsletterDesc}>
              {newsMode === "unsubscribe"
                ? "Enter your email address below to remove yourself from our newsletter list."
                : "Curated project showcases, seismic safety guidelines, and architectural engineering trends delivered straight to your inbox."}
            </p>
          </div>

          {newsAlreadySubscribed && newsMode !== "unsubscribe" ? (
            <div className={styles.subscribedBadgeBox}>
              <div className={styles.subscribedBadgeInner}>
                <FaCheckCircle className={styles.subscribedCheckIcon} />
                <span>You are subscribed to Structura updates</span>
              </div>
              <button
                type="button"
                className={styles.unsubToggleLink}
                onClick={() => {
                  setNewsMode("unsubscribe");
                  setNewsStatus({ success: false, error: false, message: "" });
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
                checked={newsBotcheck}
                onChange={(e) => setNewsBotcheck(e.target.checked)}
                style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <input
                type="text"
                name="website_url_hp"
                value={newsWebsiteUrlHp}
                onChange={(e) => setNewsWebsiteUrlHp(e.target.value)}
                style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <input
                type="text"
                name="company_tax_hp"
                value={newsCompanyTaxHp}
                onChange={(e) => setNewsCompanyTaxHp(e.target.value)}
                style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
                tabIndex={-1}
                autoComplete="new-password"
                aria-hidden="true"
              />

              <div className={styles.subscribeInputGroup}>
                <div className={styles.subscribeInputWrapper}>
                  <FaEnvelope className={styles.subscribeInputIcon} />
                  <input
                    type="email"
                    placeholder={
                      newsMode === "unsubscribe"
                        ? "Enter email to unsubscribe"
                        : "Enter your email address"
                    }
                    value={newsEmail}
                    onChange={(e) => setNewsEmail(e.target.value)}
                    maxLength={100}
                    required
                    disabled={newsSubmitting}
                    className={styles.subscribeInput}
                  />
                </div>

                <button
                  type="submit"
                  className={newsMode === "unsubscribe" ? styles.unsubscribeButton : styles.subscribeButton}
                  disabled={newsSubmitting}
                  aria-label={newsMode === "unsubscribe" ? "Unsubscribe" : "Subscribe to Engineering Digest"}
                >
                  {newsSubmitting ? (
                    <>
                      <FaSpinner className={styles.spinnerIcon} />
                      <span>Processing...</span>
                    </>
                  ) : newsMode === "unsubscribe" ? (
                    <span>Unsubscribe</span>
                  ) : (
                    <>
                      <span>Subscribe</span>
                      <FaArrowRight className={styles.btnArrowIcon} />
                    </>
                  )}
                </button>
              </div>

              {newsMode === "unsubscribe" && (
                <div className={styles.unsubBackRow}>
                  <button
                    type="button"
                    className={styles.backToSubBtn}
                    onClick={() => {
                      setNewsMode("subscribe");
                      setNewsStatus({ success: false, error: false, message: "" });
                    }}
                  >
                    &larr; Cancel &amp; stay subscribed
                  </button>
                </div>
              )}

              {newsStatus.error && (
                <div className={styles.errorMessage}>
                  <FaExclamationCircle />
                  <span>{newsStatus.message}</span>
                </div>
              )}
              {newsStatus.success && (
                <div className={styles.successMessage}>
                  <FaCheckCircle />
                  <span>{newsStatus.message}</span>
                </div>
              )}
            </form>
          )}
        </div>

        {newsMode !== "unsubscribe" && (
          <div className={styles.newsletterFooterNote}>
            <span>No spam • Monthly editions • Unsubscribe anytime</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.pageContainer}>
      <MetaTags
        title={PAGE_SEO.contact.title}
        description={PAGE_SEO.contact.description}
        canonical={PAGE_SEO.contact.canonical}
        schema={contactSchemas}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Contact", url: "/contact" }
        ]}
      />

      <section className={styles.heroSection}>
        <div className={styles.heroWrapper}>
          <div className={styles.heroHeader}>
            <div className={styles.eyebrowBadge}>
              <span className={styles.eyebrowSquare} />
              <span>CONTACT &amp; CONSULTATION</span>
            </div>
            <h1 className={styles.heroTitle}>
              Let&apos;s build something <span className={styles.accentText}>remarkable</span> together
            </h1>
            <p className={styles.heroSubtitle}>
              Have a project in mind or need expert structural guidance? Connect directly with our engineering studio or schedule an introductory walkthrough.
            </p>
          </div>

          <div className={styles.heroFormWrap}>
            <ContactForm
              title={null}
              subtitle={null}
            />
          </div>
        </div>
      </section>

      <section className={styles.locationNewsletterSection}>
        <div className={styles.locationNewsletterWrapper}>
          <div className={styles.locationNewsletterGrid}>
            <div className={styles.newsletterSlot}>
              {renderNewsletterCard()}
            </div>

            <div className={styles.mapCard}>
              <div className={styles.mapFrameWrapper}>
                <img
                  src="/images/about/studio-office.svg"
                  alt="Structura Studio Location — 123 Architecture Ave, Design District"
                  className={styles.mapIframe}
                  loading="lazy"
                />
                <a
                  href={officeMapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.mapFloatingBtn}
                  aria-label="Open Studio Address in Maps"
                >
                  <FaMapMarkerAlt className={styles.floatingBtnPin} />
                  <span>123 Architecture Ave</span>
                  <FaExternalLinkAlt className={styles.btnIcon} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.faqSection}>
        <div className={styles.faqWrapper}>
          <div className={styles.faqHeader}>
            <div className={styles.eyebrowBadge}>
              <span className={styles.eyebrowSquare} />
              <span>TECHNICAL INQUIRIES &amp; FAQ</span>
            </div>
            <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
            <p className={styles.faqSubtitle}>
              Everything you need to know about starting a project consultation with us.
            </p>
          </div>

          <div className={styles.faqList}>
            {faqList.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className={`${styles.faqCard} ${isOpen ? styles.faqCardOpen : ""}`}
                >
                  <button
                    type="button"
                    className={styles.faqQuestionBtn}
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    <FaChevronDown
                      className={`${styles.faqChevron} ${isOpen ? styles.faqChevronRotated : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className={styles.faqAnswer}>
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}