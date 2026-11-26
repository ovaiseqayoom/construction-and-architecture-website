import React, { useEffect, useState, useCallback } from "react";
import { 
  FaTimes, 
  FaEnvelope, 
  FaBuilding, 
  FaAward, 
  FaQuoteLeft, 
  FaIdCard, 
  FaLock, 
  FaShieldAlt, 
  FaCheckCircle 
} from "react-icons/fa";
import useScrollLock from "../../hooks/useScrollLock";
import useModalDismiss from "../../hooks/useModalDismiss";
import { teamMembers, getEmployeeById, shouldBlurEmployeeFace } from "../../data/team";
import styles from "./EmployeeModal.module.css";

function CountUpStat({ rawValue }) {
  const [displayValue, setDisplayValue] = useState(() => {
    if (!rawValue) return "0";
    const match = rawValue.match(/^(\d+(?:\.\d+)?)(.*)$/);
    if (!match) return rawValue;
    return match[1].includes(".") ? `0.0${match[2] || ""}` : `0${match[2] || ""}`;
  });

  useEffect(() => {
    if (!rawValue) return;

    const match = rawValue.match(/^(\d+(?:\.\d+)?)(.*)$/);
    if (!match) {
      setDisplayValue(rawValue);
      return;
    }

    const targetNum = parseFloat(match[1]);
    const suffix = match[2] || "";
    const isDecimal = match[1].includes(".");
    const duration = 1200; 
    const startTime = performance.now();

    let animationFrameId;

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentNum = easeOut * targetNum;

      if (isDecimal) {
        setDisplayValue(`${currentNum.toFixed(1)}${suffix}`);
      } else {
        setDisplayValue(`${Math.round(currentNum)}${suffix}`);
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(rawValue);
      }
    };

    animationFrameId = requestAnimationFrame(updateCounter);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [rawValue]);

  return <span>{displayValue}</span>;
}

export function EmployeeModal() {
  const [activeEmployee, setActiveEmployee] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  const checkActiveEmployee = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get("member") || params.get("id");
    const hashId = window.location.hash ? window.location.hash.replace("#", "").trim() : "";

    const targetId = paramId || hashId;

    if (targetId) {
      const found = getEmployeeById(targetId) || 
        teamMembers.find(m => m.employeeId?.toLowerCase() === targetId.toLowerCase());
      if (found) {
        setIsClosing(false);
        setActiveEmployee(found);
      } else {
        setActiveEmployee(null);
      }
    } else {
      setActiveEmployee(null);
    }
  }, []);

  useEffect(() => {
    checkActiveEmployee();

    const handleLocationChange = () => {
      checkActiveEmployee();
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("hashchange", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, [checkActiveEmployee]);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);

    setTimeout(() => {
      setActiveEmployee(null);
      setIsClosing(false);

      const url = new URL(window.location.href);
      const hasParam = url.searchParams.has("member") || url.searchParams.has("id") || !!url.hash;

      if (window.history.state?.isEmployeeModalOpen || window.history.state?.member) {
        window.history.back();
      } else if (hasParam) {
        url.searchParams.delete("member");
        url.searchParams.delete("id");
        url.hash = "";
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
      }
    }, 280);
  }, [isClosing]);

  useScrollLock(Boolean(activeEmployee && !isClosing));

  useModalDismiss({
    isOpen: Boolean(activeEmployee),
    onClose: handleClose,
    closeOnEscape: true,
    closeOnOutsideClick: false,
  });

  if (!activeEmployee) return null;

  const {
    employeeId: id,
    name,
    designation,
    department,
    contact,
    bio,
    quote,
    image,
    din,
    skills = [],
    projects = [],
    stats = []
  } = activeEmployee;

  const isBlurred = shouldBlurEmployeeFace(activeEmployee);

  return (
    <div 
      className={`${styles.overlay} ${isClosing ? styles.overlayClosing : ""}`} 
      onClick={handleClose} 
      role="dialog" 
      aria-modal="true"
      data-lenis-prevent
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div 
        className={`${styles.modalCard} ${isClosing ? styles.modalCardClosing : ""}`} 
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent
      >
        <div className={styles.modalHeader}>
          <div className={styles.headerBadgesRow}>
            <span className={styles.deptBadge}>
              <FaBuilding /> {department}
            </span>
            <span className={styles.idTag}>
              <FaIdCard /> ID: {id?.toUpperCase()}
            </span>
          </div>

          <button 
            type="button" 
            className={styles.closeBtn} 
            onClick={handleClose} 
            aria-label="Close profile modal"
          >
            <FaTimes />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.profileSummary}>
            <div className={styles.avatarFrame}>
              <img
                src={image || "/images/team/placeholder.jpg"}
                alt={name}
                className={`${styles.avatarImg} ${isBlurred ? styles.blurredFace : ""}`}
                width="140"
                height="140"
                loading="lazy"
                decoding="async"
                draggable={!isBlurred}
                onContextMenu={(e) => {
                  if (isBlurred) e.preventDefault();
                }}
                onDragStart={(e) => {
                  if (isBlurred) e.preventDefault();
                }}
              />
              {isBlurred && (
                <>
                  <div
                    className={styles.privacyShield}
                    onContextMenu={(e) => e.preventDefault()}
                    aria-hidden="true"
                  />
                  <div className={styles.privacyMaskOverlay} aria-hidden="true">
                    <FaLock className={styles.privacyMaskIcon} />
                  </div>
                </>
              )}
            </div>

            <div className={styles.summaryDetails}>
              {department && (
                <span className={styles.mobileDeptBadge}>
                  <FaBuilding /> {department}
                </span>
              )}
              <h2 className={styles.memberName}>{name}</h2>
              <p className={styles.memberDesignation}>{designation}</p>

              {contact?.email && (
                <a 
                  href={`mailto:${contact.email}`} 
                  className={styles.emailTextLink}
                  title={`Email ${contact.email}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `mailto:${contact.email}`;
                  }}
                >
                  <FaEnvelope className={styles.emailTextIcon} />
                  <span className={styles.emailTextContent}>
                    {contact.email.toLowerCase().startsWith("info@") ? "SEND EMAIL" : contact.email}
                  </span>
                </a>
              )}
            </div>
          </div>

          {din && (
            <div className={styles.directorDinBanner}>
              <div className={styles.dinBannerLeft}>
                <div className={styles.dinIconRing}>
                  <FaShieldAlt className={styles.dinBannerIcon} />
                </div>
                <div className={styles.dinTextGroup}>
                  <span className={styles.dinBannerLabel}>GOVERNMENT MCA REGISTERED DIRECTOR</span>
                  <span className={styles.dinBannerValue}>
                    Director Identification Number (DIN): <strong>{din}</strong>
                  </span>
                </div>
              </div>
              <span className={styles.dinStatusBadge}>VERIFIED</span>
            </div>
          )}

          {stats.length > 0 && (
            <div className={styles.statsRow}>
              {stats.map((stat, idx) => (
                <div key={idx} className={styles.statBox}>
                  <span className={styles.statValue}>
                    <CountUpStat rawValue={stat.value} />
                  </span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </div>
              ))}
            </div>
          )}

          {quote && (
            <div className={styles.quoteBox}>
              <FaQuoteLeft className={styles.quoteIcon} />
              <p className={styles.quoteText}>“{quote}”</p>
            </div>
          )}

          <div className={styles.sectionBlock}>
            <h3 className={styles.blockTitle}>Professional Overview</h3>
            <p className={styles.blockBody}>
              {bio ||
                `${name} serves as ${designation} within ${department} at Structura Architecture & Construction, leading key technical operations and field execution.`}
            </p>
          </div>

          {skills.length > 0 && (
            <div className={styles.sectionBlock}>
              <h3 className={styles.blockTitle}>Core Competencies</h3>
              <div className={styles.skillsGrid}>
                {skills.map((skill, idx) => (
                  <span key={idx} className={styles.skillBadge}>
                    <FaAward className={styles.badgeIcon} /> {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div className={styles.sectionBlock}>
              <h3 className={styles.blockTitle}>Key Projects &amp; Engagements</h3>
              <ul className={styles.projectsList}>
                {projects.map((project, idx) => (
                  <li key={idx} className={styles.projectItem}>
                    <FaCheckCircle className={styles.projectCheckIcon} />
                    <span>{project}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeModal;
