import React from "react";
import styles from "./PageLoader.module.css";

export default function PageLoader() {
  return (
    <>
      <div
        className={styles.topProgressTrack}
        role="progressbar"
        aria-label="Loading page"
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={styles.topProgressBar} />
      </div>

      <div className={styles.pageSkeletonWrapper} aria-hidden="true">
        <div className={styles.skeletonBreadcrumb} />
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonSubtitle} />
        <div className={styles.skeletonGrid}>
          {[1, 2, 3].map((n) => (
            <div key={n} className={styles.skeletonCard}>
              <div className={styles.skeletonMedia} />
              <div className={styles.skeletonContent}>
                <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                <div className={styles.skeletonLine} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}