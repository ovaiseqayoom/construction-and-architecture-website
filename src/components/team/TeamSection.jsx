import React from "react";
import { FaArrowRight, FaLock } from "react-icons/fa";
import { shouldBlurEmployeeFace } from "../../data/team";
import styles from "./TeamSection.module.css";

function resolveTeamImage(img) {
  if (!img) return "/images/team/placeholder.jpg";
  return img;
}

export function TeamMemberItem({ employee, index = 0 }) {
  if (!employee) return null;

  const { employeeId, name, designation, image } = employee;
  const isBlurred = shouldBlurEmployeeFace(employee);

  const formattedIndex = String(index + 1).padStart(2, "0");

  const handleCardClick = (e) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    url.searchParams.set("member", employeeId);
    window.history.pushState({ isEmployeeModalOpen: true, member: employeeId }, "", url.toString());
    window.dispatchEvent(new Event("popstate"));
  };

  const imageSrc = resolveTeamImage(image);

  return (
    <a
      href={`?member=${employeeId}`}
      onClick={handleCardClick}
      className={styles.memberCard}
      aria-label={`View profile of ${name}, ${designation}`}
    >
      <div className={styles.bgImageStage} aria-hidden="true">
        <img
          src={imageSrc}
          alt={name}
          className={`${styles.bgCardImg} ${isBlurred ? styles.blurredFace : ""}`}
          loading="lazy"
          decoding="async"
          width="400"
          height="500"
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
        <div className={styles.bgDarkOverlay} />
      </div>

      <div className={styles.cardContent}>
        <div className={styles.titleGroup}>
          <h3 className={styles.cardTitle}>{name}</h3>
          <div className={styles.underlineRule} />
          <p className={styles.designationText}>{designation}</p>
        </div>

        <div className={styles.bottomFooter}>
          <div className={styles.readMoreWrapper}>
            <span className={styles.readMoreText}>View Profile</span>
            <FaArrowRight className={styles.readMoreArrow} />
          </div>
          <span className={styles.romanNumber}>{formattedIndex}</span>
        </div>
      </div>
    </a>
  );
}

export const TeamCard = TeamMemberItem;

export function TeamRoster({ members }) {
  if (!members || members.length === 0) return null;

  return (
    <div className={styles.rosterGrid} role="list" aria-label="Team Members Roster">
      {members.map((employee, idx) => (
        <div key={employee.employeeId} className={styles.gridItem} role="listitem">
          <TeamMemberItem employee={employee} index={idx} />
        </div>
      ))}
    </div>
  );
}

export const TeamGrid = TeamRoster;

function TeamSection({ id, title, members = [] }) {
  const headingId = `${id}-heading`;

  return (
    <section id={id} className={styles.section} aria-labelledby={headingId}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerSquare} />
            <h2 id={headingId} className={styles.title}>
              {title}
            </h2>
          </div>
          <span className={styles.countBadge}>{members.length} Members</span>
        </header>

        {members.length > 0 ? (
          <TeamRoster members={members} />
        ) : (
          <div className={styles.emptyState}>
            <p>Department details are currently being updated.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default TeamSection;