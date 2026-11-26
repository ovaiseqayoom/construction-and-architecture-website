import React from "react";
import {
  FaRegCalendarCheck,
  FaAward,
  FaLayerGroup,
  FaProjectDiagram,
} from "react-icons/fa";
import styles from "./TickerBanner.module.css";

const HIGHLIGHT_ITEMS = [
  {
    icon: <FaRegCalendarCheck className={styles.highlightIcon} />,
    title: "Est. 2018",
    subtitle: "Integrated Design-Build Studio",
  },
  {
    icon: <FaAward className={styles.highlightIcon} />,
    title: "Code Certified",
    subtitle: "Seismic & Thermal Envelope Rigor",
  },
  {
    icon: <FaLayerGroup className={styles.highlightIcon} />,
    title: "Multi-Discipline",
    subtitle: "Architecture to Structural BIM",
  },
  {
    icon: <FaProjectDiagram className={styles.highlightIcon} />,
    title: "End-to-End",
    subtitle: "Concept to Turnkey Execution",
  },
];

export default function TickerBanner() {
  return (
    <section className={styles.tickerSection}>
      <div className={styles.tickerContainer}>
        <div className={styles.tickerTrack}>
          {HIGHLIGHT_ITEMS.map((item, index) => (
            <div className={styles.tickerItem} key={`ticker-1-${index}`}>
              {item.icon}
              <div className={styles.tickerContent}>
                <h3>{item.title}</h3>
                <p>{item.subtitle}</p>
              </div>
              <span className={styles.tickerDot}>•</span>
            </div>
          ))}

          {HIGHLIGHT_ITEMS.map((item, index) => (
            <div className={styles.tickerItem} key={`ticker-2-${index}`}>
              {item.icon}
              <div className={styles.tickerContent}>
                <h3>{item.title}</h3>
                <p>{item.subtitle}</p>
              </div>
              <span className={styles.tickerDot}>•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
