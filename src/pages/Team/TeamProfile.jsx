// Page: TeamProfile — src/pages/Team/TeamProfile.jsx
import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import MetaTags from "../../components/common/SEO/MetaTags";
import { SEO_ENTITY } from "../../config/seo.config";
import {
  FaShieldAlt,
  FaEnvelope,
  FaBuilding,
  FaAward,
  FaPhoneAlt,
  FaShareAlt,
  FaAddressCard,
  FaCheck,
  FaExternalLinkAlt,
  FaBolt,
} from "react-icons/fa";
import { getEmployeeById } from "../../data/team";
const logoWhite = "/logo-white.svg";
import styles from "./TeamProfile.module.css";

function TeamProfile() {
  const { employeeId } = useParams();
  const employee = getEmployeeById(employeeId);
  const [isVerifying, setIsVerifying] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (employee) {
      const timer = setTimeout(() => {
        setIsVerifying(false);
      }, 450);

      return () => clearTimeout(timer);
    }
  }, [employee]);

  if (!employee) {
    return <Navigate to="/about" replace />;
  }

  const {
    employeeId: id,
    name,
    designation,
    department,
    contact,
    bio,
    image,
    gender,
    din,
    quote,
    stats = [],
    skills = [],
  } = employee;

  const handleShare = async () => {
    const shareData = {
      title: `${name} | Structura Studio Profile`,
      text: `Studio profile for ${name}, ${designation} at Structura Architecture & Construction.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadVCard = () => {
    const vCardData = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${name}`,
      `N:;${name};;;`,
      `ORG:Structura Architecture & Construction;${department}`,
      `TITLE:${designation}`,
      contact?.email ? `EMAIL;TYPE=INTERNET,WORK:${contact.email}` : "",
      contact?.phone
        ? `TEL;TYPE=CELL,VOICE:${contact.phone.replace(/[\s()-]/g, "")}`
        : "TEL;TYPE=WORK,VOICE:+15550100000",
      "ADR;TYPE=WORK:;;123 Architecture Ave;Design District;Metro Area;10001;USA",
      `URL:${SEO_ENTITY.siteUrl}`,
      `NOTE:Studio ID: ${id?.toUpperCase()}`,
      "END:VCARD",
    ]
      .filter(Boolean)
      .join("\r\n");

    const blob = new Blob([vCardData], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${name.replace(/\s+/g, "_")}_Structura.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const cleanName = name || "";
  const honorific = undefined;

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SEO_ENTITY.siteUrl}/team/${employee?.slug || id}#person`,
    name: cleanName,
    ...(honorific ? { honorificPrefix: honorific } : {}),
    jobTitle: designation,
    worksFor: {
      "@id": `${SEO_ENTITY.siteUrl}/#organization`,
      "@type": "Organization",
      name: SEO_ENTITY.brandName,
      url: SEO_ENTITY.siteUrl,
    },
    email: contact?.email,
    image: image,
  };

  if (isVerifying) {
    return (
      <div className={styles.loadingPage}>
        <MetaTags
          title={`${name} — Studio Profile | Structura`}
          description={`Team credential for ${name}, ${designation} in the ${department} department at Structura Architecture & Construction.`}
          canonical={`${SEO_ENTITY.siteUrl}/team/${employee?.slug || id}`}
          ogImage={image || SEO_ENTITY.defaultOgImage}
          ogImageAlt={`${name} - ${designation}`}
          schema={personSchema}
          noindex={true}
        />
        <div className={styles.loadingInner}>
          <img src={logoWhite} alt="Structura Logo" className={styles.loadingLogo} width="120" height="26" decoding="async" />
          <div className={styles.spinner}>
            <div className={styles.spinnerRing} />
            <FaShieldAlt className={styles.loadingIcon} />
          </div>
          <div className={styles.loadingText}>
            <h2>Loading Team Profile...</h2>
            <p>ID #{id?.toUpperCase()} • Structura Studio</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      <MetaTags
        title={`${name} — Studio Profile | Structura`}
        description={`Team profile for ${name}, ${designation} at Structura Architecture & Construction.`}
        canonical={`${SEO_ENTITY.siteUrl}/team/${employee?.slug || id}`}
        ogType="profile"
        ogImage={image || SEO_ENTITY.defaultOgImage}
        ogImageAlt={`${name} - ${designation}`}
        schema={personSchema}
        noindex={true}
      />

      <div className={styles.pageWrapper}>
        <header className={styles.topCurvedBanner}>
          <div className={styles.bannerContainer}>
            <div className={styles.topBrandBar}>
              <img
                src={logoWhite}
                alt="Structura Architecture and Construction"
                className={styles.bannerLogo}
                width="135"
                height="28"
                decoding="async"
              />
            </div>

            <div className={styles.heroBannerProfile}>
              <div className={styles.avatarWrapper}>
                <div className={styles.avatarOuterCard}>
                  <div className={styles.avatarInnerFrame}>
                    <img
                      src={image || "/images/team/avatar-01.svg"}
                      alt={name}
                      className={styles.avatarImg}
                      width="160"
                      height="160"
                      decoding="async"
                    />
                  </div>

                  <div className={styles.boltBadge} title="Active Status" aria-label="Status: Active">
                    <FaBolt className={styles.boltIcon} />
                  </div>
                </div>
              </div>

              <div className={styles.identityDetails}>
                <span className={styles.departmentPill}>
                  <FaBuilding className={styles.deptIcon} />
                  {department}
                </span>
                <h1 className={styles.personName}>{name}</h1>
                <span className={styles.corpRegistryText}>
                  {designation} • Structura Studio
                </span>
              </div>
            </div>
          </div>

          <div className={styles.topCurveDivider} aria-hidden="true">
            <svg
              viewBox="0 0 360 28"
              fill="none"
              preserveAspectRatio="none"
              className={styles.curveSvg}
            >
              <path
                d="M0,0 C120,28 240,28 360,0 L360,28 L0,28 Z"
                fill="#F8FAFC"
              />
            </svg>
          </div>
        </header>

        <div className={styles.bodyCanvas}>
          <div className={styles.contentContainer}>
            <section className={styles.detailsList}>
              <h2 className={styles.sectionHeader}>Credential &amp; Registry Verification</h2>

              <div className={styles.paramRow}>
                <span className={styles.paramLabel}>Employee ID</span>
                <strong className={styles.paramValue}>{id?.toUpperCase()}</strong>
              </div>

              <div className={styles.paramRow}>
                <span className={styles.paramLabel}>Status &amp; Employment</span>
                <strong className={styles.paramValue}>Permanent Active Personnel</strong>
              </div>

              {din && (
                <div className={styles.paramRowHighlight}>
                  <span className={styles.paramLabel}>Director DIN</span>
                  <strong className={styles.paramValueGold}>{din}</strong>
                </div>
              )}

              <div className={styles.paramRow}>
                <span className={styles.paramLabel}>Designation</span>
                <strong className={styles.paramValue}>{designation}</strong>
              </div>

              <div className={styles.paramRow}>
                <span className={styles.paramLabel}>Department</span>
                <strong className={styles.paramValue}>{department}</strong>
              </div>

              {contact?.phone && (
                <div className={styles.paramRow}>
                  <span className={styles.paramLabel}>Phone</span>
                  <a
                    href={`tel:${contact.phone.replace(/[\s-]/g, "")}`}
                    className={styles.paramEmailLink}
                  >
                    {contact.phone}
                  </a>
                </div>
              )}

              {["studio-0102", "studio-0103", "studio-0104"].includes(id?.toLowerCase()) && contact?.email && (
                <div className={styles.paramRow}>
                  <span className={styles.paramLabel}>Work Email</span>
                  <a href={`mailto:${contact.email.trim()}`} className={styles.paramEmailLink}>
                    {contact.email.trim()}
                  </a>
                </div>
              )}

              <div className={styles.paramRow}>
                <span className={styles.paramLabel}>Practice Unit</span>
                <strong className={styles.paramValue}>Structura Studio Directorate</strong>
              </div>

              <div className={styles.paramRow}>
                <span className={styles.paramLabel}>Gender</span>
                <strong className={styles.paramValue}>{gender || "Male"}</strong>
              </div>
            </section>

            {stats.length > 0 && (
              <section className={styles.statsStrip}>
                {stats.map((st, i) => (
                  <div key={i} className={styles.statCell}>
                    <span className={styles.statNum}>{st.value}</span>
                    <span className={styles.statTitle}>{st.label}</span>
                  </div>
                ))}
              </section>
            )}

            {quote && (
              <section className={styles.quoteBlock}>
                <p className={styles.quoteText}>“{quote}”</p>
              </section>
            )}

            {bio && (
              <section className={styles.textSection}>
                <h2 className={styles.sectionHeader}>Professional Overview</h2>
                <p className={styles.paragraphText}>{bio}</p>
              </section>
            )}

            {skills.length > 0 && (
              <section className={styles.textSection}>
                <h2 className={styles.sectionHeader}>Core Competencies</h2>
                <div className={styles.competencyGroup}>
                  {skills.map((skill, index) => (
                    <span key={index} className={styles.competencyTag}>
                      <FaAward className={styles.skillIcon} />
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className={styles.actionButtonsGroup}>
              <button
                type="button"
                onClick={handleDownloadVCard}
                className={styles.actionBtnBlack}
                aria-label="Save contact to phone"
              >
                <FaAddressCard />
                <span>Save to Contacts (vCard)</span>
              </button>

              {contact?.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className={styles.actionBtnBlack}
                  aria-label="Send email"
                >
                  <FaEnvelope />
                  <span>Send Email</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleShare}
                className={styles.actionBtnBlack}
                aria-label="Share verification link"
              >
                {copied ? <FaCheck /> : <FaShareAlt />}
                <span>{copied ? "Verification Link Copied" : "Share Verification Link"}</span>
              </button>
            </section>

            <section className={styles.hotlineSection}>
              <div className={styles.hotlineInfo}>
                <FaPhoneAlt className={styles.hotlineIcon} />
                <div>
                  <span className={styles.hotlineLabel}>Studio Verification Desk</span>
                  <a href="tel:+15550100000" className={styles.hotlinePhone}>
                    +1 (555) 010-0000
                  </a>
                </div>
              </div>
            </section>

            <section className={styles.cardPolicySection}>
              <h2 className={styles.policyTitle}>Studio Credential Policy</h2>
              <p className={styles.policyText}>
                This digital credential verifies active team membership at <strong>Structura Architecture &amp; Construction</strong> for client walkthroughs and active construction site supervision.
              </p>
              <p className={styles.policyText}>
                Non-transferable credential. If found, please contact{" "}
                <strong>123 Architecture Ave, Design District, 10001</strong>.
              </p>
            </section>
          </div>
        </div>

        <footer className={styles.bottomCurvedFooter}>
          <div className={styles.bottomCurveDivider} aria-hidden="true">
            <svg
              viewBox="0 0 360 28"
              fill="none"
              preserveAspectRatio="none"
              className={styles.curveSvg}
            >
              <path
                d="M0,28 C120,0 240,0 360,28 L360,0 L0,0 Z"
                fill="#F8FAFC"
              />
            </svg>
          </div>

          <div className={styles.footerContainer}>
            <div className={styles.barcodeWrap}>
              <div className={styles.barcodePattern} aria-hidden="true" />
              <span className={styles.barcodeHash}>
                DIGITAL RECORD: {id?.toUpperCase()}-STUDIO-V1
              </span>
            </div>

            <div className={styles.footerBottomLinks}>
              <span>STRUCTURA ARCHITECTURE &amp; CONSTRUCTION</span>
              <a
                href={SEO_ENTITY.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.siteLink}
              >
                <span>example.com</span>
                <FaExternalLinkAlt />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default TeamProfile;