// Page: Home — src/pages/Home/Home.jsx
import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import MetaTags from "../../components/common/SEO/MetaTags";
import { PAGE_SEO, getCorporateKnowledgeGraph } from "../../config/seo.config";
import Hero from "../../components/home/Hero";
import BrandMarquee from "../../components/home/BrandMarquee";
import StatsCounter from "../../components/home/StatsCounter";
import AboutBento from "../../components/home/AboutBento";
import HomeServicesBar from "../../components/home/HomeServicesBar";
import FeaturedProjects from "../../components/home/FeaturedProjects";
import WhyTrustUs from "../../components/home/WhyTrustUs";
import LeadershipMessages from "../../components/home/LeadershipMessages";
import HomeFeaturedArticles from "../../components/home/HomeFeaturedArticles";
import GoogleReviews from "../../components/home/GoogleReviews";
import HomeCtaStrip from "../../components/home/HomeCtaStrip";
import TickerBanner from "../../components/home/TickerBanner";
import { fetchLiveProjects } from "../../utils";
import styles from "./Home.module.css";

const ProjectDrawer = lazy(() => import("../../components/projects/ProjectDrawer"));
const ContactModal = lazy(() => import("../../components/common/ContactModal/ContactModal"));

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactInitialService, setContactInitialService] = useState("Turnkey Construction");

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      try {
        const list = await fetchLiveProjects();
        if (isMounted) {
          setProjects(list || []);
        }
      } catch (err) {
        console.error("Error loading live projects on Home:", err);
        if (isMounted) setProjects([]);
      } finally {
        if (isMounted) setLoadingProjects(false);
      }
    }

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (projects.length === 0) return;

    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        const found = projects.find(
          (p) => p.slug === hash || String(p.id) === hash
        );
        if (found) setSelectedProject(found);
      } else {
        setSelectedProject(null);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, [projects]);

  const openProjectModal = useCallback((project, replace = false) => {
    setSelectedProject(project);
    if (window.location.hash !== `#${project.slug}`) {
      if (replace) {
        window.history.replaceState({ isProjectModalOpen: true, slug: project.slug }, "", `#${project.slug}`);
      } else {
        window.history.pushState({ isProjectModalOpen: true, slug: project.slug }, "", `#${project.slug}`);
      }
    }
  }, []);

  const closeProjectModal = useCallback(() => {
    setSelectedProject(null);
    if (window.history.state?.isProjectModalOpen || window.history.state?.slug) {
      window.history.back();
    } else if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
  }, []);

  const currentModalIndex = selectedProject
    ? projects.findIndex(
      (p) => (p.slug || p.id) === (selectedProject.slug || selectedProject.id)
    )
    : 0;

  const handleNextProject = useCallback(() => {
    if (projects.length === 0) return;
    const nextIdx = (currentModalIndex + 1) % projects.length;
    openProjectModal(projects[nextIdx], true);
  }, [currentModalIndex, projects, openProjectModal]);

  const handlePrevProject = useCallback(() => {
    if (projects.length === 0) return;
    const prevIdx = (currentModalIndex - 1 + projects.length) % projects.length;
    openProjectModal(projects[prevIdx], true);
  }, [currentModalIndex, projects, openProjectModal]);

  const handleRequestQuoteFromDrawer = useCallback((service) => {
    closeProjectModal();
    setContactInitialService(service || "Architectural Design");
    setTimeout(() => {
      setIsContactModalOpen(true);
    }, 80);
  }, [closeProjectModal]);

  return (
    <>
      <MetaTags
        title={PAGE_SEO.home.title}
        description={PAGE_SEO.home.description}
        canonical={PAGE_SEO.home.canonical}
        schema={getCorporateKnowledgeGraph()}
      />

      <section className={styles.heroWrapper}>
        <Hero />
      </section>

      <HomeServicesBar />

      <BrandMarquee />

      <FeaturedProjects
        projects={projects}
        loading={loadingProjects}
        onOpenModal={openProjectModal}
      />

      <StatsCounter />

      <AboutBento />

      <WhyTrustUs />

      <GoogleReviews />

      <LeadershipMessages />

      <HomeFeaturedArticles />

      <HomeCtaStrip onOpenContactModal={() => setIsContactModalOpen(true)} />

      <TickerBanner />

      {selectedProject && (
        <Suspense fallback={null}>
          <ProjectDrawer
            isOpen={!!selectedProject}
            project={selectedProject}
            onClose={closeProjectModal}
            onNext={handleNextProject}
            onPrev={handlePrevProject}
            currentIndex={currentModalIndex}
            totalProjects={projects.length}
            onRequestQuote={handleRequestQuoteFromDrawer}
          />
        </Suspense>
      )}

      {isContactModalOpen && (
        <Suspense fallback={null}>
          <ContactModal
            isOpen={isContactModalOpen}
            onClose={() => setIsContactModalOpen(false)}
            initialService={contactInitialService}
          />
        </Suspense>
      )}
    </>
  );
}
