import React, { useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import PageHero from "../common/PageHero/PageHero";
const ContactModal = lazy(() => import("../common/ContactModal/ContactModal"));
const heroDesktop = "/images/hero-desktop.svg";
const heroMobile = "/images/hero-mobile.svg";
import heroStyles from "../common/PageHero/PageHero.module.css";

export default function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <PageHero
        desktopImage={heroDesktop}
        mobileImage={heroMobile}
        imageAlt="Structura Architecture and Construction Hero"
        variant="home"
        showSocials={true}
        showScrollIndicator={true}
        eyebrow={
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem" }}>
            <span
              style={{
                width: 6,
                height: 6,
                background: "var(--app-accent-primary, #FFBB0F)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--app-font-body)",
                fontSize: "0.75rem",
                fontWeight: 500,
                letterSpacing: "0",
                color: "rgba(255, 255, 255, 0.85)",
                textTransform: "none",
              }}
            >
              Structura Architecture &amp; Construction
            </span>
          </div>
        }
        title="Modern Architecture,"
        titleHighlight="Precision Construction"
        subtitle="Building the future with precision."
        actions={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className={heroStyles.btnPrimary}
            >
              <span>Get started</span>
            </button>

            <Link to="/services" className={heroStyles.btnOutline}>
              <span>Our services</span>
            </Link>
          </>
        }
      />

      {isModalOpen && (
        <Suspense fallback={null}>
          <ContactModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            initialService="Turnkey Construction"
          />
        </Suspense>
      )}
    </>
  );
}
