import { useEffect, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Layout from "./components/layout/Layout/Layout";
import ScrollManager from "./components/common/ScrollManager";
import PageLoader from "./components/common/PageLoader";
import InitialSiteLoader from "./components/common/InitialSiteLoader/InitialSiteLoader";
import ErrorBoundary from "./components/ErrorBoundary";
import {
  lazyWithRetry,
  ROUTE_IMPORTERS,
  prefetchCoreRoutes,
} from "./utils/routeLoader";

const Home = lazyWithRetry("/", ROUTE_IMPORTERS["/"], { routeName: "Home" });
const Contact = lazyWithRetry("/contact", ROUTE_IMPORTERS["/contact"], { routeName: "Contact" });
const About = lazyWithRetry("/about", ROUTE_IMPORTERS["/about"], { routeName: "About" });
const Projects = lazyWithRetry("/projects", ROUTE_IMPORTERS["/projects"], { routeName: "Projects" });
const ProjectDetail = lazyWithRetry("project-detail", ROUTE_IMPORTERS["project-detail"], { routeName: "ProjectDetail" });
const BlogHub = lazyWithRetry("/blog", ROUTE_IMPORTERS["/blog"], { routeName: "BlogHub" });
const BlogPost = lazyWithRetry("blog-detail", ROUTE_IMPORTERS["blog-detail"], { routeName: "BlogPost" });
const Services = lazyWithRetry("/services", ROUTE_IMPORTERS["/services"], { routeName: "Services" });
const ServiceDetail = lazyWithRetry("services-detail", ROUTE_IMPORTERS["services-detail"], { routeName: "ServiceDetail" });
const Careers = lazyWithRetry("/careers", ROUTE_IMPORTERS["/careers"], { routeName: "Careers" });
const Terms = lazyWithRetry("/terms", ROUTE_IMPORTERS["/terms"], { routeName: "Terms" });
const Privacy = lazyWithRetry("/privacy", ROUTE_IMPORTERS["/privacy"], { routeName: "Privacy" });
const TeamProfile = lazyWithRetry("team-profile", ROUTE_IMPORTERS["team-profile"], { routeName: "TeamProfile" });
const NotFound = lazyWithRetry("not-found", ROUTE_IMPORTERS["not-found"], { routeName: "NotFound" });

export default function App() {
  useEffect(() => {
    prefetchCoreRoutes();
  }, []);

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <InitialSiteLoader />
        <ScrollManager />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="contact" element={<Contact />} />
              <Route path="about" element={<About />} />
              <Route path="team" element={<Navigate to="/about" replace />} />
              <Route path="team/:employeeId" element={<TeamProfile />} />
              <Route path="careers" element={<Careers />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:slug" element={<ProjectDetail />} />
              <Route path="blog" element={<BlogHub />} />
              <Route path="blog/:slug" element={<BlogPost />} />
              <Route path="blogs" element={<Navigate to="/blog" replace />} />
              <Route path="blogs/:slug" element={<Navigate to="/blog/:slug" replace />} />
              <Route path="services" element={<Services />} />
              <Route path="services/:slug" element={<ServiceDetail />} />
              <Route path="terms" element={<Terms />} />
              <Route path="privacy" element={<Privacy />} />
            </Route>
            <Route path="404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Analytics />
        <SpeedInsights />
      </ErrorBoundary>
    </HelmetProvider>
  );
}