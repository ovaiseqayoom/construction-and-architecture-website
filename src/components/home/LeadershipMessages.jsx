import React from "react";
import styles from "./LeadershipMessages.module.css";

const chairmanImg = "/images/team/avatar-01.svg";
const mdImg = "/images/team/avatar-02.svg";
const techImg = "/images/team/avatar-03.svg";
const opsImg = "/images/team/avatar-04.svg";

const leadershipData = [
  {
    id: "chairman",
    memberId: "studio-0101",
    name: "Daniel Reyes",
    role: "Principal Architect",
    tag: "Studio Direction",
    image: chairmanImg,
    salutation: "Dear Clients, Partners, and Collaborators,",
    message: [
      "Welcome to Structura Architecture & Construction. Our studio was built around a direct principle: enduring architecture depends equally on spatial clarity, honest materials, and structural discipline from day one.",
      "From initial site feasibility to final interior commissioning, our multidisciplinary teams collaborate under unified BIM models and transparent client communication.",
    ],
  },
  {
    id: "managing-director",
    memberId: "studio-0102",
    name: "Elena Cho",
    role: "Structural Engineering Lead",
    tag: "Seismic & BIM",
    image: mdImg,
    salutation: "Dear Clients and Partners,",
    message: [
      "Structural engineering should liberate architectural form rather than constrain it. By modeling lateral forces, cantilever deflections, and soil-structure interaction early in schematic design, we make complex spans safe and cost-predictable.",
      "Every steel connection and rebar confinement zone goes through peer verification before a single drawing reaches site crews.",
    ],
  },
  {
    id: "tech-director",
    memberId: "studio-0103",
    name: "Marcus Patel",
    role: "Director – Construction & Field QA",
    tag: "Site Operations & BOQ",
    image: techImg,
    salutation: "Dear Clients and Partners,",
    message: [
      "Construction integrity shows up in the unseen details: documented concrete curing logs, pre-pour steel cage audits, hydrostatic pressure tests, and clear Bills of Quantities.",
      "Our field superintendents manage milestone sequencing so schedules remain predictable and zero surprise markups appear after breaking ground.",
    ],
  },
  {
    id: "ops-director",
    memberId: "studio-0104",
    name: "Sophia Laurent",
    role: "Director – Interior & Envelope Systems",
    tag: "Building Physics",
    image: opsImg,
    salutation: "Dear Clients and Partners,",
    message: [
      "Comfort after occupancy comes from continuous thermal envelopes, acoustic separation, calibrated daylighting, and precision factory-milled joinery built to tight reveal tolerances.",
      "We treat architectural shells and interior finishes as one cohesive craft rather than separate afterthoughts.",
    ],
  },
];

export default function LeadershipMessages() {
  const handleOpenMemberModal = (memberId, e) => {
    if (e) e.stopPropagation();
    const url = new URL(window.location.href);
    url.searchParams.set("member", memberId);
    window.history.pushState({ isEmployeeModalOpen: true, member: memberId }, "", url.pathname + url.search);
    window.dispatchEvent(new Event("popstate"));
  };

  return (
    <section className={styles.leadershipSection} aria-labelledby="leadership-heading">
      <div className={styles.container}>
        <header className={styles.headerBlock}>
          <div className={styles.headerLeft}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDash} aria-hidden="true" />
              <span>Executive leadership &amp; directives</span>
            </div>
            <h2 id="leadership-heading" className={styles.headingTitle}>
              Leadership &amp; rigor
            </h2>
          </div>

          <div className={styles.headerRight}>
            <p className={styles.headingDesc}>
              Executive commitment to engineering accuracy, disciplined execution, and client trust across J&K.
            </p>
          </div>
        </header>

        <div className={styles.leaderGrid}>
          {leadershipData.map((item) => (
            <article key={item.id} className={styles.leaderCard}>
              <div className={styles.cardIdentity}>
                <div className={styles.identityLeft}>
                  <button
                    type="button"
                    className={styles.headshotBtn}
                    onClick={(e) => handleOpenMemberModal(item.memberId, e)}
                    title={`View ${item.name}'s corporate profile`}
                    aria-label={`Open ${item.name} profile modal`}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className={styles.headshotImg}
                      loading="lazy"
                      decoding="async"
                      width="64"
                      height="64"
                    />
                  </button>

                  <div className={styles.nameLockup}>
                    <button
                      type="button"
                      className={styles.nameBtn}
                      onClick={(e) => handleOpenMemberModal(item.memberId, e)}
                      title={`View ${item.name}'s corporate profile`}
                    >
                      <h3 className={styles.leaderName}>{item.name}</h3>
                    </button>
                    <p className={styles.leaderRole}>{item.role}</p>
                  </div>
                </div>
              </div>

              <div className={styles.cardBody}>
                {item.salutation && (
                  <p className={styles.salutationText}>{item.salutation}</p>
                )}

                <div className={styles.messageBlock}>
                  {item.message.map((paragraph, pIdx) => (
                    <p key={pIdx} className={styles.bodyParagraph}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button
                  type="button"
                  className={styles.profileActionBtn}
                  onClick={(e) => handleOpenMemberModal(item.memberId, e)}
                  aria-label={`View ${item.name}'s verified profile and credentials`}
                >
                  <span>View executive profile</span>
                  <svg
                    className={styles.actionArrow}
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M3.333 8h9.334M8.667 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
