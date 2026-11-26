// Page: Careers — src/pages/Careers/Careers.jsx
import React, { useState, useEffect, useRef } from "react";
import MetaTags from "../../components/common/SEO/MetaTags";
import { PAGE_SEO, SEO_ENTITY } from "../../config/seo.config";
import {
  FaAward,
  FaBuilding,
  FaEnvelope,
  FaPhoneAlt,
  FaPaperPlane,
  FaCheckCircle,
  FaExclamationCircle,
  FaLink,
  FaUser,
  FaSpinner,
  FaFileAlt,
  FaArrowRight,
  FaClock,
  FaCheck,
} from "react-icons/fa";
import { supabase } from "../../lib/supabaseClient";
import { API_ENDPOINTS } from "../../config/api";
import { isValidEmail } from "../../utils";
import {
  CAREER_CULTURE_PILLARS,
  HIRING_STEPS,
  CAREER_DISCIPLINES,
  EXPERIENCE_LEVELS,
} from "../../data/careers";
import styles from "./Careers.module.css";

const leadImg = "/images/team/avatar-03.svg";
const MAX_MESSAGE_CHARS = 600;

export default function Careers() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    disciplines: [],
    experience: EXPERIENCE_LEVELS[1],
    portfolioUrl: "",
    message: "",
    botcheck: false,
    website_url_hp: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const formRef = useRef(null);

  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    if (
      hash === "#candidate-application-form" ||
      hash === "#apply" ||
      hash === "#application" ||
      hash === "#form"
    ) {
      if (formRef.current) {
        if (window.lenis) {
          window.lenis.scrollTo(formRef.current, { offset: -70, duration: 1.2 });
        } else {
          formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) {
      setServerError("");
    }
  };

  const handleDisciplineToggle = (label) => {
    setFormData((prev) => {
      const exists = prev.disciplines.includes(label);
      const updated = exists
        ? prev.disciplines.filter((d) => d !== label)
        : [...prev.disciplines, label];
      return { ...prev, disciplines: updated };
    });
    if (errors.disciplines) {
      setErrors((prev) => ({ ...prev, disciplines: "" }));
    }
    if (serverError) {
      setServerError("");
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required for follow-up.";
    } else if (formData.phone.replace(/[^0-9]/g, "").length < 8) {
      newErrors.phone = "Please enter a valid phone number.";
    }

    if (!formData.disciplines || formData.disciplines.length === 0) {
      newErrors.disciplines = "Please select at least one discipline or role of interest.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    if (formData.botcheck || (formData.website_url_hp && formData.website_url_hp.trim() !== "")) {
      setSubmitted(true);
      return;
    }

    if (!validate()) return;

    setSubmitting(true);
    setServerError("");

    try {
      const selectedPosition = formData.disciplines.join(", ");
      const candidateMsg = formData.message.trim();
      const apiPayload = {
        fullName: formData.fullName.trim(),
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        position: selectedPosition,
        experience: formData.experience,
        portfolioUrl: formData.portfolioUrl.trim(),
        portfolio: formData.portfolioUrl.trim(),
        message: candidateMsg,
        coverLetter: candidateMsg,
        coverNote: candidateMsg,
        briefIntro: candidateMsg,
        keyProjects: candidateMsg,
        _formLoadedAt: Date.now() - 2000,
      };

      if (!supabase && !import.meta.env?.VITE_API_URL) {
        setSubmitted(true);
        setSubmitting(false);
        return;
      }

      let apiSucceeded = false;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(API_ENDPOINTS.CAREER, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiPayload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          apiSucceeded = true;
        }
      } catch (fetchErr) {
        console.warn("API career dispatch warning:", fetchErr);
      }

      let fallbackSaved = false;
      if (!apiSucceeded && supabase) {
        try {
          const formattedMessage = [
            `Position: ${selectedPosition}`,
            `Experience: ${formData.experience}`,
            `Portfolio: ${formData.portfolioUrl.trim() || "Not Provided"}`,
            "",
            "Brief Introduction / Key Projects:",
            candidateMsg || "Not Provided",
          ].join("\n");

          const { error: dbErr } = await supabase.from("inquiries").insert([
            {
              name: formData.fullName.trim(),
              email: formData.email.trim().toLowerCase(),
              phone: formData.phone.trim() || null,
              service: `Career: ${selectedPosition}`,
              message: formattedMessage,
              status: "unread",
            },
          ]);
          if (!dbErr) {
            fallbackSaved = true;
          } else {
            console.warn("Supabase record persistence warning:", dbErr.message);
          }
        } catch (dbErr) {
          console.warn("Supabase record persistence warning:", dbErr);
        }
      }

      if (!apiSucceeded && !fallbackSaved) {
        throw new Error("Application submission could not be completed. Please try again or email hello@example.com.");
      }

      setSubmitted(true);
      setSubmitting(false);

      if (formRef.current) {
        if (window.lenis) {
          window.lenis.scrollTo(formRef.current, { offset: -70, duration: 1.2 });
        } else {
          formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    } catch (err) {
      console.error("Application submission error:", err);
      setServerError("Submission encountered an issue. You may email us directly at hello@example.com.");
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      disciplines: [],
      experience: EXPERIENCE_LEVELS[1],
      portfolioUrl: "",
      message: "",
      botcheck: false,
      website_url_hp: "",
    });
    setErrors({});
    setServerError("");
    setSubmitted(false);
  };

  const careersSchemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SEO_ENTITY.siteUrl}/careers#webpage`,
        "url": `${SEO_ENTITY.siteUrl}/careers`,
        "name": "Careers & Talent | Structura Architecture & Construction",
        "description": "Submit your credentials for structural engineering, 3D architectural modeling, and turnkey construction roles at Structura Architecture & Construction.",
        "isPartOf": {
          "@type": "WebSite",
          "@id": `${SEO_ENTITY.siteUrl}/#website`,
          "name": SEO_ENTITY.brandName,
          "url": SEO_ENTITY.siteUrl,
        },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": SEO_ENTITY.siteUrl,
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Careers",
              "item": `${SEO_ENTITY.siteUrl}/careers`,
            },
          ],
        },
      },
      {
        "@type": "Organization",
        "@id": `${SEO_ENTITY.siteUrl}/#organization`,
        "name": SEO_ENTITY.brandName,
        "url": SEO_ENTITY.siteUrl,
        "logo": SEO_ENTITY.logoUrl,
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": SEO_ENTITY.primaryPhone,
          "contactType": "Human Resources / Talent",
          "email": SEO_ENTITY.primaryEmail,
          "areaServed": "US",
          "availableLanguage": ["English"],
        },
      },
    ],
  };

  return (
    <div className={styles.careersPage}>
      <MetaTags
        title={PAGE_SEO.careers.title}
        description={PAGE_SEO.careers.description}
        canonical={`${SEO_ENTITY.siteUrl}/careers`}
        schema={careersSchemaGraph}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Careers", url: "/careers" },
        ]}
      />

      <div className={styles.careersContainer}>
        <header className={styles.heroSection}>
          <div className={styles.eyebrowBadge}>
            <span className={styles.eyebrowSquare} />
            <span>CAREERS &amp; TALENT ACQUISITION</span>
          </div>

          <h1 className={styles.mainTitle}>Be part of our mission</h1>

          <p className={styles.subtitle}>
            We welcome architects, BIM coordinators, structural engineers, and field superintendents committed to craft, code discipline, and transparent delivery.
          </p>
        </header>

        <div className={styles.careersMasterGrid}>
          <section
            ref={formRef}
            id="candidate-application-form"
            className={styles.formSectionCard}
            aria-label="Candidate Application Form"
          >
            <div className={styles.formCardHeader}>
              <div className={styles.formCardTitleWrapper}>
                <h2 className={styles.formCardTitle}>Candidate Application</h2>
                <p className={styles.formCardSubtitle}>
                  Submit your professional credentials, experience, and portfolio for direct review by our leadership team.
                </p>
              </div>
              <span className={styles.statusLiveBadge}>Active Intake</span>
            </div>

            {submitted ? (
              <div className={styles.successStateWrapper}>
                <div className={styles.successIconBox}>
                  <FaCheckCircle />
                </div>
                <h3 className={styles.successTitle}>Application Submitted Successfully</h3>
                <p className={styles.successDesc}>
                  Thank you, <strong>{formData.fullName}</strong>. Your application for <strong>{formData.disciplines.join(", ")}</strong> has been recorded for review by our engineering directors.
                </p>
                <div className={styles.successMetaBox}>
                  <div className={styles.successMetaRow}>
                    <span className={styles.successMetaLabel}>Selected Disciplines:</span>
                    <span className={styles.successMetaVal}>{formData.disciplines.join(", ")}</span>
                  </div>
                  <div className={styles.successMetaRow}>
                    <span className={styles.successMetaLabel}>Experience Tier:</span>
                    <span className={styles.successMetaVal}>{formData.experience}</span>
                  </div>
                  <div className={styles.successMetaRow}>
                    <span className={styles.successMetaLabel}>Primary Contact:</span>
                    <span className={styles.successMetaVal}>{formData.email} • {formData.phone}</span>
                  </div>
                </div>
                <div className={styles.successActions}>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className={styles.resetFormBtn}
                  >
                    Submit Another Application
                  </button>
                  <a
                    href="mailto:hello@example.com"
                    className={styles.directEmailLink}
                  >
                    Email HR Directly <FaArrowRight />
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.applicationForm} noValidate>
                <input
                  type="checkbox"
                  name="botcheck"
                  checked={formData.botcheck}
                  onChange={handleChange}
                  style={{ display: "none" }}
                  tabIndex={-1}
                  autoComplete="off"
                />
                <input
                  type="text"
                  name="website_url_hp"
                  value={formData.website_url_hp}
                  onChange={handleChange}
                  style={{ display: "none" }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {serverError && (
                  <div className={styles.formErrorBanner}>
                    <FaExclamationCircle className={styles.bannerErrorIcon} />
                    <span>{serverError}</span>
                  </div>
                )}

                <div className={styles.formField}>
                  <label htmlFor="fullName" className={styles.formLabel}>
                    Full Name <span className={styles.requiredStar}>*</span>
                  </label>
                  <div className={`${styles.inputContainer} ${errors.fullName ? styles.inputError : ""}`}>
                    <FaUser className={styles.inputIcon} />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="e.g. Jordan Taylor"
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={submitting}
                      className={styles.textInput}
                    />
                  </div>
                  {errors.fullName && <p className={styles.fieldError}>{errors.fullName}</p>}
                </div>

                <div className={styles.formGridTwo}>
                  <div className={styles.formField}>
                    <label htmlFor="email" className={styles.formLabel}>
                      Email Address <span className={styles.requiredStar}>*</span>
                    </label>
                    <div className={`${styles.inputContainer} ${errors.email ? styles.inputError : ""}`}>
                      <FaEnvelope className={styles.inputIcon} />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@domain.com"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={submitting}
                        className={styles.textInput}
                      />
                    </div>
                    {errors.email && <p className={styles.fieldError}>{errors.email}</p>}
                  </div>

                  <div className={styles.formField}>
                    <label htmlFor="phone" className={styles.formLabel}>
                      Phone / WhatsApp <span className={styles.requiredStar}>*</span>
                    </label>
                    <div className={`${styles.inputContainer} ${errors.phone ? styles.inputError : ""}`}>
                      <FaPhoneAlt className={styles.inputIcon} />
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+1 (555) 010-0000"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={submitting}
                        className={styles.textInput}
                      />
                    </div>
                    {errors.phone && <p className={styles.fieldError}>{errors.phone}</p>}
                  </div>
                </div>

                <div className={styles.formField}>
                  <div className={styles.labelWithCounter}>
                    <label className={styles.formLabel}>
                      Discipline / Role of Interest <span className={styles.requiredStar}>*</span>
                    </label>
                    <span className={styles.selectionHint}>
                      {formData.disciplines.length > 0
                        ? `${formData.disciplines.length} selected`
                        : "Select one or more"}
                    </span>
                  </div>

                  <div className={styles.checkboxGrid} role="group" aria-label="Disciplines of interest">
                    {CAREER_DISCIPLINES.map((discipline) => {
                      const isChecked = formData.disciplines.includes(discipline);
                      return (
                        <button
                          type="button"
                          key={discipline}
                          role="checkbox"
                          aria-checked={isChecked}
                          onClick={() => handleDisciplineToggle(discipline)}
                          className={`${styles.checkboxTile} ${isChecked ? styles.checkboxTileChecked : ""}`}
                        >
                          <span className={`${styles.checkSquare} ${isChecked ? styles.checkSquareActive : ""}`}>
                            {isChecked && <FaCheck className={styles.checkTickIcon} />}
                          </span>
                          <span className={styles.checkboxTitle}>{discipline}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.disciplines && <p className={styles.fieldError}>{errors.disciplines}</p>}
                </div>

                <div className={styles.formField}>
                  <label htmlFor="experience" className={styles.formLabel}>
                    Experience Level <span className={styles.requiredStar}>*</span>
                  </label>
                  <div className={styles.inputContainer}>
                    <FaClock className={styles.inputIcon} />
                    <select
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      disabled={submitting}
                      className={styles.selectInput}
                    >
                      {EXPERIENCE_LEVELS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formField}>
                  <label htmlFor="portfolioUrl" className={styles.formLabel}>
                    Resume / Portfolio Link <span className={styles.optionalNote}>(Google Drive, Dropbox, or LinkedIn)</span>
                  </label>
                  <div className={styles.inputContainer}>
                    <FaLink className={styles.inputIcon} />
                    <input
                      id="portfolioUrl"
                      name="portfolioUrl"
                      type="url"
                      placeholder="https://drive.google.com/... or https://linkedin.com/in/..."
                      value={formData.portfolioUrl}
                      onChange={handleChange}
                      disabled={submitting}
                      className={styles.textInput}
                    />
                  </div>
                  <p className={styles.fieldHint}>
                    Please ensure link sharing permissions are set to &quot;Anyone with the link can view&quot;.
                  </p>
                </div>

                <div className={styles.formField}>
                  <div className={styles.labelWithCounter}>
                    <label htmlFor="message" className={styles.formLabel}>
                      Brief Introduction / Key Projects
                    </label>
                    <span className={styles.charCounter}>
                      {formData.message.length}/{MAX_MESSAGE_CHARS}
                    </span>
                  </div>
                  <div className={styles.textareaContainer}>
                    <FaFileAlt className={styles.textareaIcon} />
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      maxLength={MAX_MESSAGE_CHARS}
                      placeholder="Tell us about your civil engineering background, software proficiency (ETABS, AutoCAD, Revit), and notable projects you have contributed to..."
                      value={formData.message}
                      onChange={handleChange}
                      disabled={submitting}
                      className={styles.textareaInput}
                    />
                  </div>
                </div>

                <div className={styles.formSubmitRow}>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={styles.submitBtn}
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className={styles.spinner} />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Candidate Profile</span>
                        <FaPaperPlane className={styles.planeIcon} />
                      </>
                    )}
                  </button>
                  <p className={styles.privacyGuarantee}>
                    All submissions are reviewed directly by our directors under strict corporate confidentiality.
                  </p>
                </div>
              </form>
            )}
          </section>

          <aside className={styles.contextSidebar} aria-label="Studio Context & Credentials">
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarCardHeader}>
                <span className={styles.sidebarCardLabel}>Studio Verification</span>
                <span className={styles.verifiedTag}>Official</span>
              </div>

              <div className={styles.studioInfoItem}>
                <FaBuilding className={styles.studioIcon} />
                <div>
                  <div className={styles.studioItemTitle}>Studio Headquarters</div>
                  <div className={styles.studioItemSub}>
                    123 Architecture Ave, Design District, 10001
                  </div>
                </div>
              </div>

              <div className={styles.studioInfoItem}>
                <FaAward className={styles.studioIcon} />
                <div>
                  <div className={styles.studioItemTitle}>Licensed Design-Build Practice</div>
                  <div className={styles.studioItemSub}>ISO 9001 &amp; BIM LOD 350</div>
                </div>
              </div>

              <div className={styles.studioInfoItem}>
                <FaClock className={styles.studioIcon} />
                <div>
                  <div className={styles.studioItemTitle}>Operating Hours</div>
                  <div className={styles.studioItemSub}>Mon – Fri &bull; 9:00 AM – 6:00 PM</div>
                </div>
              </div>

              <div className={styles.sidebarDivider} />

              <div className={styles.sidebarContactList}>
                <a href="mailto:hello@example.com" className={styles.sidebarContactLink}>
                  <FaEnvelope /> hello@example.com
                </a>
                <a href="tel:+15550100000" className={styles.sidebarContactLink}>
                  <FaPhoneAlt /> +1 (555) 010-0000
                </a>
              </div>
            </div>

            <div className={styles.sidebarCard}>
              <div className={styles.sidebarCardHeader}>
                <span className={styles.sidebarCardLabel}>Leadership Perspective</span>
              </div>

              <blockquote className={styles.directorQuote}>
                &ldquo;At Structura, we value engineering clarity and field craftsmanship. Every team member sees their calculations and detailing take form cleanly on site.&rdquo;
              </blockquote>

              <div className={styles.directorProfile}>
                <img
                  src={leadImg}
                  alt="Marcus Patel"
                  className={styles.directorAvatar}
                  loading="lazy"
                  decoding="async"
                  width="48"
                  height="48"
                />
                <div>
                  <div className={styles.directorName}>Marcus Patel</div>
                  <div className={styles.directorRole}>Director – Construction &amp; Field QA</div>
                </div>
              </div>
            </div>

            <div className={styles.sidebarCard}>
              <div className={styles.sidebarCardHeader}>
                <span className={styles.sidebarCardLabel}>Why Engineers Choose Us</span>
              </div>

              <div className={styles.cultureList}>
                {CAREER_CULTURE_PILLARS.slice(0, 3).map((pillar) => (
                  <div key={pillar.id} className={styles.cultureListItem}>
                    <div className={styles.cultureListTop}>
                      <span className={styles.cultureTag}>{pillar.tag}</span>
                      <span className={styles.cultureMetric}>{pillar.metric}</span>
                    </div>
                    <h4 className={styles.cultureTitle}>{pillar.title}</h4>
                    <p className={styles.cultureDesc}>{pillar.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <section className={styles.processLedgerSection} aria-label="Evaluation & Onboarding Process">
          <div className={styles.ledgerHeader}>
            <div className={styles.eyebrowBadge}>
              <span className={styles.eyebrowSquare} />
              <span>THE SELECTION PATH</span>
            </div>
            <h2 className={styles.ledgerTitle}>Our Intake &amp; Evaluation Process</h2>
            <p className={styles.ledgerSub}>
              We believe in a transparent, merit-driven evaluation that values technical competency, practical site understanding, and cultural alignment.
            </p>
          </div>

          <div className={styles.stepsLedgerGrid}>
            {HIRING_STEPS.map((stepItem) => (
              <article key={stepItem.step} className={styles.stepLedgerCard}>
                <div className={styles.stepNumber}>{stepItem.step}</div>
                <h3 className={styles.stepItemTitle}>{stepItem.title}</h3>
                <p className={styles.stepItemDesc}>{stepItem.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
