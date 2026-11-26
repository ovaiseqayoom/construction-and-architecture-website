import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaTools,
  FaBuilding,
  FaUsers,
  FaBriefcase,
  FaEnvelope,
  FaPhoneAlt,
  FaArrowRight,
  FaChevronDown,
  FaDraftingCompass,
  FaHardHat,
  FaCouch,
  FaFileContract,
  FaLandmark,
  FaMosque,
  FaIndustry,
  FaRoad,
  FaThLarge,
  FaLayerGroup,
  FaBookOpen,
} from "react-icons/fa";
import {
  FiMenu,
  FiX,
  FiHome,
  FiLayers,
  FiGrid,
  FiBookOpen,
  FiUsers,
  FiBriefcase,
  FiMail,
  FiPhoneCall,
  FiSearch,
  FiChevronDown,
  FiChevronRight,
  FiShield,
  FiFileText,
} from "react-icons/fi";
import useScrollLock from "../../../hooks/useScrollLock";
import { fetchLiveProjects } from "../../../utils";
import { fetchLiveBlogs } from "../../../utils/blog";
import { SERVICES_DATA } from "../../../data/services";
import { prefetchRoute } from "../../../utils/routeLoader";
import styles from "./Navbar.module.css";

const logo = "/logo.svg";

const STATIC_SEARCH_PAGES = [
  { title: "Home", to: "/", category: "Page", snippet: "Architecture, structural engineering & turnkey construction" },
  { title: "Services Overview", to: "/services", category: "Page", snippet: "Architectural, structural, and turnkey solutions" },
  { title: "Projects Portfolio", to: "/projects", category: "Page", snippet: "Engineered residential and commercial builds" },
  { title: "About Us & Leadership", to: "/about", category: "Page", snippet: "Our mission, studio leadership, and engineering standards" },
  { title: "Engineering Blog & Research", to: "/blog", category: "Page", snippet: "Seismic technical papers, BOQ guides & building physics" },
  { title: "Careers & Join Team", to: "/careers", category: "Page", snippet: "Engineering openings, internships & site management roles" },
  { title: "Contact & Studio Consultation", to: "/contact", category: "Page", snippet: "Studio address, direct helpline & project consultations" },
  { title: "Privacy Policy", to: "/privacy", category: "Page", snippet: "Client confidentiality and data governance" },
  { title: "Terms & Conditions", to: "/terms", category: "Page", snippet: "Engineering contracting and execution guidelines" },
];

const ContactModal = lazy(() => import("../../common/ContactModal/ContactModal"));

const SERVICES_DROPDOWN_DATA = [
  {
    to: "/services/architectural-design",
    title: "Architectural Design",
    short: "3D House modeling, floor plans & elevation drawings",
    icon: FaDraftingCompass,
    iconColor: "#D97706",
    iconBg: "rgba(217, 119, 6, 0.12)",
  },
  {
    to: "/services/structural-engineering",
    title: "Structural Engineering",
    short: "Seismic Zone V load analysis & STAAD structural models",
    icon: FaBuilding,
    iconColor: "#2563EB",
    iconBg: "rgba(37, 99, 235, 0.12)",
  },
  {
    to: "/services/turnkey-construction",
    title: "Turnkey Construction",
    short: "End-to-end civil execution, procurement & site supervision",
    icon: FaHardHat,
    iconColor: "#CA8A04",
    iconBg: "rgba(202, 138, 4, 0.12)",
  },
  {
    to: "/services/interior-modular-design",
    title: "Interior & Modular Design",
    short: "Bespoke modular kitchens, custom wardrobes & woodwork",
    icon: FaCouch,
    iconColor: "#BE185D",
    iconBg: "rgba(190, 24, 93, 0.12)",
  },
  {
    to: "/services/regulatory-approvals",
    title: "Regulatory Approvals",
    short: "Municipal sanction drawings, FAR calculations & clearances",
    icon: FaFileContract,
    iconColor: "#059669",
    iconBg: "rgba(5, 150, 105, 0.12)",
  },
];

const CATEGORY_META_CONFIG = {
  Residential: {
    icon: FaHome,
    desc: "Luxury villas, duplexes & alpine valley residences",
    iconColor: "#2563EB",
    iconBg: "rgba(37, 99, 235, 0.12)",
  },
  Commercial: {
    icon: FaBuilding,
    desc: "Shopping complexes, corporate offices & retail plazas",
    iconColor: "#059669",
    iconBg: "rgba(5, 150, 105, 0.12)",
  },
  Institutional: {
    icon: FaLandmark,
    desc: "Educational campuses & public government buildings",
    iconColor: "#7C3AED",
    iconBg: "rgba(124, 58, 237, 0.12)",
  },
  Religious: {
    icon: FaMosque,
    desc: "Heritage mosques & cultural sanctuary structures",
    iconColor: "#D97706",
    iconBg: "rgba(217, 119, 6, 0.12)",
  },
  Industrial: {
    icon: FaIndustry,
    desc: "Warehouses & pre-engineered steel buildings",
    iconColor: "#475569",
    iconBg: "rgba(71, 85, 105, 0.12)",
  },
  Infrastructure: {
    icon: FaRoad,
    desc: "Retaining walls, slope stabilization & civil works",
    iconColor: "#0891B2",
    iconBg: "rgba(8, 145, 178, 0.12)",
  },
  "Interior & Fit-Out": {
    icon: FaCouch,
    desc: "Turnkey luxury woodwork & modular joinery",
    iconColor: "#DB2777",
    iconBg: "rgba(219, 39, 119, 0.12)",
  },
  "Renovation & Restoration": {
    icon: FaTools,
    desc: "Heritage conservation & structural retrofits",
    iconColor: "#CA8A04",
    iconBg: "rgba(202, 138, 4, 0.12)",
  },
};

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [liveProjects, setLiveProjects] = useState([]);
  const [liveBlogs, setLiveBlogs] = useState([]);

  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [projectsDropdownOpen, setProjectsDropdownOpen] = useState(false);

  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileProjectsOpen, setMobileProjectsOpen] = useState(false);

  const [availableCategories, setAvailableCategories] = useState([
    { name: "Residential", count: 6, ...CATEGORY_META_CONFIG["Residential"] },
    { name: "Commercial", count: 4, ...CATEGORY_META_CONFIG["Commercial"] },
    { name: "Institutional", count: 2, ...CATEGORY_META_CONFIG["Institutional"] },
  ]);
  const [totalProjectCount, setTotalProjectCount] = useState(12);

  const searchIndex = useMemo(() => {
    const items = [];

    STATIC_SEARCH_PAGES.forEach((page) => {
      items.push({
        title: page.title,
        to: page.to,
        category: page.category || "Page",
        snippet: page.snippet || "",
      });
    });

    SERVICES_DATA.forEach((s) => {
      items.push({
        title: s.title,
        to: `/services/${s.slug}`,
        category: "Service",
        snippet: s.shortDesc || "",
      });
    });

    liveProjects.forEach((p) => {
      items.push({
        title: p.title,
        to: `/projects/${p.slug || p.id}`,
        category: "Project",
        snippet: `${p.category || "Project"} • ${p.location || "Design District"}`,
      });
    });

    liveBlogs.forEach((b) => {
      items.push({
        title: b.title,
        to: `/blog/${b.slug || b.id}`,
        category: "Article",
        snippet: b.excerpt || b.meta_description || b.category || "Technical engineering paper",
      });
    });

    return items;
  }, [liveProjects, liveBlogs]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const tokens = query.split(/\s+/).filter(Boolean);
    const scored = [];

    for (const item of searchIndex) {
      const titleLower = item.title.toLowerCase();
      const snippetLower = (item.snippet || "").toLowerCase();
      const catLower = item.category.toLowerCase();

      const allTokensMatch = tokens.every(
        (t) =>
          titleLower.includes(t) ||
          snippetLower.includes(t) ||
          catLower.includes(t)
      );

      if (allTokensMatch) {
        let score = 0;
        if (titleLower === query) score += 100;
        else if (titleLower.startsWith(query)) score += 60;
        else if (titleLower.includes(query)) score += 35;
        else if (catLower.includes(query)) score += 20;
        else score += 10;

        scored.push({ item, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 8).map((s) => s.item);
  }, [searchQuery, searchIndex]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      closeMenu();
      navigate(searchResults[0].to);
      setSearchQuery("");
    } else if (searchQuery.trim()) {
      closeMenu();
      navigate(`/projects?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleSearchResultClick = (result) => {
    closeMenu();
    navigate(result.to);
    setSearchQuery("");
  };

  const [modalOpen, setModalOpen] = useState(
    () => typeof window !== "undefined" && window.location.hash === "#contact-form"
  );
  const [modalService, setModalService] = useState("Turnkey Construction");

  const lastScrollY = useRef(0);
  const servicesDropdownRef = useRef(null);
  const projectsDropdownRef = useRef(null);
  const servicesTimerRef = useRef(null);
  const projectsTimerRef = useRef(null);

  useScrollLock(isOpen);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        prefetchRoute("/blog");
        const [projectsRes, blogsRes] = await Promise.allSettled([
          fetchLiveProjects(),
          fetchLiveBlogs(),
        ]);

        if (!isMounted) return;

        if (projectsRes.status === "fulfilled" && Array.isArray(projectsRes.value) && projectsRes.value.length > 0) {
          const data = projectsRes.value;
          setLiveProjects(data);

          const counts = {};
          let total = 0;
          data.forEach((p) => {
            const rawCat = p.category?.trim();
            if (rawCat && rawCat.toLowerCase() !== "all") {
              counts[rawCat] = (counts[rawCat] || 0) + 1;
              total += 1;
            }
          });

          const dynamicCategories = Object.keys(counts).map((catName) => {
            const meta = CATEGORY_META_CONFIG[catName] || {
              icon: FaLayerGroup,
              desc: `${catName} projects & civil works`,
              iconColor: "#2563EB",
              iconBg: "rgba(37, 99, 235, 0.12)",
            };
            return {
              name: catName,
              count: counts[catName],
              ...meta,
            };
          });

          if (dynamicCategories.length > 0) {
            setAvailableCategories(dynamicCategories);
            setTotalProjectCount(total || data.length);
          }
        }

        if (blogsRes.status === "fulfilled" && Array.isArray(blogsRes.value)) {
          setLiveBlogs(blogsRes.value);
        }
      } catch {
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleHashSync = () => {
      if (window.location.hash === "#contact-form") {
        setModalOpen(true);
      } else {
        setModalOpen(false);
      }
    };

    const handleCustomOpen = (e) => {
      if (e.detail?.service) {
        setModalService(e.detail.service);
      }
      setModalOpen(true);
    };

    if (window.location.hash === "#contact-form") {
      setModalOpen(true);
    }

    window.addEventListener("hashchange", handleHashSync);
    window.addEventListener("popstate", handleHashSync);
    window.addEventListener("openContactModal", handleCustomOpen);

    return () => {
      window.removeEventListener("hashchange", handleHashSync);
      window.removeEventListener("popstate", handleHashSync);
      window.removeEventListener("openContactModal", handleCustomOpen);
    };
  }, []);

  const isLightHero =
    pathname === "/" ||
    pathname === "/services" ||
    pathname === "/about" ||
    pathname === "/projects" ||
    pathname === "/contact" ||
    pathname === "/careers" ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/blog" ||
    pathname.startsWith("/blog/") ||
    pathname.startsWith("/services/");

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setServicesDropdownOpen(false);
    setProjectsDropdownOpen(false);
    setMobileServicesOpen(false);
    setMobileProjectsOpen(false);
  }, []);

  const dismissDrawer = useCallback(() => {
    if (isOpen && typeof window !== "undefined" && window.history.state?.appMobileDrawer) {
      window.history.back();
    }
    closeMenu();
  }, [isOpen, closeMenu]);

  const toggleMenu = () => {
    if (isOpen) {
      dismissDrawer();
    } else {
      if (typeof window !== "undefined") {
        window.history.pushState({ appMobileDrawer: true }, "");
      }
      setIsOpen(true);
    }
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePopState = () => {
      setIsOpen(false);
      setServicesDropdownOpen(false);
      setProjectsDropdownOpen(false);
      setMobileServicesOpen(false);
      setMobileProjectsOpen(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isOpen]);

  const handleAllProjectsClick = () => {
    closeMenu();
    window.dispatchEvent(new CustomEvent("resetProjectFilters"));
  };

  const openConsultModal = (serviceName = "Turnkey Construction") => {
    closeMenu();
    setModalService(serviceName);
    setModalOpen(true);
  };

  useEffect(() => {
    setIsOpen(false);
    setServicesDropdownOpen(false);
    setProjectsDropdownOpen(false);
    setMobileServicesOpen(false);
    setMobileProjectsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      prefetchRoute("/services");
      prefetchRoute("/projects");
      prefetchRoute("/about");
      prefetchRoute("/blog");
      prefetchRoute("/contact");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") dismissDrawer();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, dismissDrawer]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        servicesDropdownRef.current &&
        !servicesDropdownRef.current.contains(event.target)
      ) {
        setServicesDropdownOpen(false);
      }
      if (
        projectsDropdownRef.current &&
        !projectsDropdownRef.current.contains(event.target)
      ) {
        setProjectsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleServicesEnter = () => {
    prefetchRoute("/services");
    prefetchRoute("services-detail");
    if (servicesTimerRef.current) clearTimeout(servicesTimerRef.current);
    if (projectsTimerRef.current) clearTimeout(projectsTimerRef.current);
    setProjectsDropdownOpen(false);
    setServicesDropdownOpen(true);
  };

  const handleServicesLeave = () => {
    servicesTimerRef.current = setTimeout(() => {
      setServicesDropdownOpen(false);
    }, 180);
  };

  const handleProjectsEnter = () => {
    prefetchRoute("/projects");
    prefetchRoute("project-detail");
    if (projectsTimerRef.current) clearTimeout(projectsTimerRef.current);
    if (servicesTimerRef.current) clearTimeout(servicesTimerRef.current);
    setServicesDropdownOpen(false);
    setProjectsDropdownOpen(true);
  };

  const handleProjectsLeave = () => {
    projectsTimerRef.current = setTimeout(() => {
      setProjectsDropdownOpen(false);
    }, 180);
  };

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY || window.pageYOffset || 0;
        const isScrolledNow = currentScrollY > 30;

        setScrolled((prev) => (prev !== isScrolledNow ? isScrolledNow : prev));

        const isBlogDetail = pathname.startsWith("/blog/") && pathname !== "/blog";

        if (isOpen || currentScrollY <= 40 || isBlogDetail) {
          setIsVisible(true);
          lastScrollY.current = currentScrollY;
        } else {
          const delta = currentScrollY - lastScrollY.current;
          if (delta > 14) {
            setIsVisible((prev) => (prev ? false : prev));
            setServicesDropdownOpen((prev) => (prev ? false : prev));
            setProjectsDropdownOpen((prev) => (prev ? false : prev));
            lastScrollY.current = currentScrollY;
          } else if (delta < -14) {
            setIsVisible((prev) => (!prev ? true : prev));
            lastScrollY.current = currentScrollY;
          }
        }

        ticking = false;
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen, pathname]);

  const isServicesActive = pathname.startsWith("/services");
  const isProjectsActive = pathname.startsWith("/projects");
  const isBlogDetail = pathname.startsWith("/blog/") && pathname !== "/blog";
  const shouldHideNavbar = !isBlogDetail && !isVisible;

  return (
    <>
      <header
        className={`${styles.navbar} ${
          isLightHero ? styles.navbarLightHero : ""
        } ${shouldHideNavbar ? styles.navbarHidden : ""} ${
          scrolled ? styles.navbarScrolled : ""
        }`.trim()}
      >
        <div className={styles.navbarContainer}>
          <NavLink
            to="/"
            className={styles.navbarLogo}
            onClick={closeMenu}
            aria-label="Structura Home"
          >
            <img
              src={logo}
              alt="Structura Architecture and Construction"
              className={styles.navbarLogoImg}
              width="150"
              height="32"
              decoding="async"
            />
          </NavLink>

          <nav
            className={styles.navbarLinksDesktop}
            aria-label="Primary navigation"
          >
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.activeLink : ""}`.trim()
              }
              onClick={closeMenu}
              onMouseEnter={() => prefetchRoute("/")}
              onFocus={() => prefetchRoute("/")}
            >
              <FaHome className={styles.navIcon} aria-hidden="true" />
              <span>Home</span>
            </NavLink>

            <div
              className={styles.dropdownContainer}
              ref={servicesDropdownRef}
              onMouseEnter={handleServicesEnter}
              onMouseLeave={handleServicesLeave}
            >
              <NavLink
                to="/services"
                className={`${styles.navItem} ${
                  isServicesActive ? styles.activeLink : ""
                }`.trim()}
              >
                <FaTools className={styles.navIcon} aria-hidden="true" />
                <span>Services</span>
                <FaChevronDown
                  className={`${styles.chevronIcon} ${
                    servicesDropdownOpen ? styles.chevronRotated : ""
                  }`}
                  aria-hidden="true"
                />
              </NavLink>

              <div
                className={`${styles.megaDropdown} ${styles.servicesMegaDropdown} ${
                  servicesDropdownOpen ? styles.dropdownOpen : ""
                }`}
                data-lenis-prevent="true"
              >
                <div className={styles.megaMainContent}>
                  <div className={styles.megaGrid}>
                    {SERVICES_DROPDOWN_DATA.map((service) => {
                      const IconComponent = service.icon;
                      return (
                        <NavLink
                          key={service.to}
                          to={service.to}
                          className={styles.megaItem}
                          onClick={closeMenu}
                        >
                          <div
                            className={styles.megaIconBadge}
                            style={{
                              backgroundColor: service.iconBg,
                              color: service.iconColor,
                            }}
                          >
                            <IconComponent aria-hidden="true" />
                          </div>
                          <div className={styles.megaItemText}>
                            <div className={styles.megaItemTitle}>
                              <span>{service.title}</span>
                              <FaArrowRight className={styles.itemArrow} aria-hidden="true" />
                            </div>
                            <p className={styles.megaItemDesc}>{service.short}</p>
                          </div>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.megaSideBanner}>
                  <div className={styles.sideBannerContent}>
                    <h3 className={styles.sideBannerTitle}>Get a Quote</h3>
                    <p className={styles.sideBannerText}>
                      Share your project specifications and receive an engineering estimate within 24 hours.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.sideBannerBtn}
                    onClick={() => openConsultModal("Turnkey Construction")}
                  >
                    <span>Book a Call</span>
                    <FaArrowRight aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <div
              className={styles.dropdownContainer}
              ref={projectsDropdownRef}
              onMouseEnter={handleProjectsEnter}
              onMouseLeave={handleProjectsLeave}
            >
              <NavLink
                to="/projects"
                className={`${styles.navItem} ${
                  isProjectsActive ? styles.activeLink : ""
                }`.trim()}
                onClick={handleAllProjectsClick}
              >
                <FaBuilding className={styles.navIcon} aria-hidden="true" />
                <span>Projects</span>
                <FaChevronDown
                  className={`${styles.chevronIcon} ${
                    projectsDropdownOpen ? styles.chevronRotated : ""
                  }`}
                  aria-hidden="true"
                />
              </NavLink>

              <div
                className={`${styles.megaDropdown} ${styles.projectsMegaDropdown} ${
                  projectsDropdownOpen ? styles.dropdownOpen : ""
                }`}
                data-lenis-prevent="true"
              >
                <div className={styles.megaMainContent}>
                  <div className={styles.megaGrid}>
                    <NavLink
                      to="/projects"
                      className={styles.megaItem}
                      onClick={handleAllProjectsClick}
                    >
                      <div
                        className={styles.megaIconBadge}
                        style={{
                          backgroundColor: "rgba(10, 10, 10, 0.08)",
                          color: "#0A0A0A",
                        }}
                      >
                        <FaThLarge aria-hidden="true" />
                      </div>
                      <div className={styles.megaItemText}>
                        <div className={styles.megaItemTitle}>
                          <span>All Projects ({totalProjectCount})</span>
                          <FaArrowRight className={styles.itemArrow} aria-hidden="true" />
                        </div>
                        <p className={styles.megaItemDesc}>
                          Comprehensive engineered portfolio showcase
                        </p>
                      </div>
                    </NavLink>

                    {availableCategories.map((cat) => {
                      const IconComponent = cat.icon || FaLayerGroup;
                      return (
                        <NavLink
                          key={cat.name}
                          to={`/projects?category=${encodeURIComponent(cat.name)}`}
                          className={styles.megaItem}
                          onClick={closeMenu}
                        >
                          <div
                            className={styles.megaIconBadge}
                            style={{
                              backgroundColor: cat.iconBg,
                              color: cat.iconColor,
                            }}
                          >
                            <IconComponent aria-hidden="true" />
                          </div>
                          <div className={styles.megaItemText}>
                            <div className={styles.megaItemTitle}>
                              <span>{cat.name} ({cat.count})</span>
                              <FaArrowRight className={styles.itemArrow} aria-hidden="true" />
                            </div>
                            <p className={styles.megaItemDesc}>{cat.desc}</p>
                          </div>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>

                <div className={`${styles.megaSideBanner} ${styles.projectsSideBanner}`}>
                  <div className={styles.sideBannerContent}>
                    <h3 className={styles.sideBannerTitle}>View Portfolio</h3>
                    <p className={styles.sideBannerText}>
                      Discover completed case studies, structural layouts, and high-altitude site execution.
                    </p>
                  </div>
                  <NavLink
                    to="/projects"
                    className={styles.sideBannerBtn}
                    onClick={handleAllProjectsClick}
                  >
                    <span>Browse All</span>
                    <FaArrowRight aria-hidden="true" />
                  </NavLink>
                </div>
              </div>
            </div>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.activeLink : ""}`.trim()
              }
              onClick={closeMenu}
              onMouseEnter={() => prefetchRoute("/about")}
              onFocus={() => prefetchRoute("/about")}
            >
              <FaUsers className={styles.navIcon} aria-hidden="true" />
              <span>About</span>
            </NavLink>

            <NavLink
              to="/blog"
              className={({ isActive }) =>
                `${styles.navItem} ${isActive || pathname.startsWith("/blog") ? styles.activeLink : ""}`.trim()
              }
              onClick={closeMenu}
              onMouseEnter={() => prefetchRoute("/blog")}
              onFocus={() => prefetchRoute("/blog")}
            >
              <FaBookOpen className={styles.navIcon} aria-hidden="true" />
              <span>Blog</span>
            </NavLink>

            <NavLink
              to="/careers"
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.activeLink : ""}`.trim()
              }
              onClick={closeMenu}
              onMouseEnter={() => prefetchRoute("/careers")}
              onFocus={() => prefetchRoute("/careers")}
            >
              <FaBriefcase className={styles.navIcon} aria-hidden="true" />
              <span>Careers</span>
            </NavLink>

            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.activeLink : ""}`.trim()
              }
              onClick={closeMenu}
              onMouseEnter={() => prefetchRoute("/contact")}
              onFocus={() => prefetchRoute("/contact")}
            >
              <FaEnvelope className={styles.navIcon} aria-hidden="true" />
              <span>Contact</span>
            </NavLink>
          </nav>

          <div className={styles.navbarActions}>
            <button
              type="button"
              className={`${styles.navbarContactBtn} ${styles.navbarContactDesktop}`}
              onClick={() => openConsultModal("Turnkey Construction")}
            >
              <FaPhoneAlt aria-hidden="true" />
              <span>Get a Quote</span>
            </button>

            <button
              className={`${styles.menuToggleBtn} ${isOpen ? styles.menuOpen : ""}`}
              onClick={toggleMenu}
              aria-label="Toggle navigation menu"
              aria-expanded={isOpen}
              aria-controls="navbar-mobile-panel"
            >
              {isOpen ? (
                <FiX className={styles.menuIconSvg} aria-hidden="true" />
              ) : (
                <FiMenu className={styles.menuIconSvg} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      <nav
        id="navbar-mobile-panel"
        className={`${styles.navbarMobilePanel} ${
          isOpen ? styles.active : ""
        }`}
        data-lenis-prevent="true"
        aria-label="Mobile navigation"
      >
        <div className={styles.sidebarHeader}>
          <NavLink to="/" className={styles.sidebarBrandLink} onClick={closeMenu} aria-label="Structura Home">
            <img
              src={logo}
              alt="Structura Architecture and Construction"
              className={styles.sidebarBrandLogo}
              width="135"
              height="28"
              decoding="async"
            />
          </NavLink>
          <button
            type="button"
            className={styles.sidebarCloseBtn}
            onClick={dismissDrawer}
            aria-label="Close navigation menu"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>

        <div className={styles.sidebarScrollBody} data-lenis-prevent="true">
          <NavLink
            to="/about?member=studio-0102"
            className={styles.sidebarProfileCard}
            onClick={closeMenu}
          >
            <img
              src="/images/team/avatar-02.svg"
              alt="Elena Cho"
              className={styles.sidebarProfileAvatar}
              width="44"
              height="44"
              loading="lazy"
            />
            <div className={styles.sidebarProfileInfo}>
              <span className={styles.sidebarProfileName}>Elena Cho</span>
              <span className={styles.sidebarProfileRole}>Structural Engineering Lead</span>
            </div>
          </NavLink>

          <form onSubmit={handleSearchSubmit} className={styles.sidebarSearchForm}>
            <FiSearch className={styles.sidebarSearchIcon} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search pages, services, projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.sidebarSearchInput}
              aria-label="Search across all pages, services, projects, and articles"
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.sidebarSearchClearBtn}
                onClick={() => setSearchQuery("")}
                aria-label="Clear search query"
              >
                <FiX aria-hidden="true" />
              </button>
            )}
          </form>

          {searchQuery.trim().length > 0 ? (
            <div className={styles.searchResultsContainer}>
              <div className={styles.searchResultsHeader}>
                <span className={styles.searchResultsTitle}>
                  Findings ({searchResults.length})
                </span>
                <button
                  type="button"
                  className={styles.searchClearTextBtn}
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </button>
              </div>

              {searchResults.length > 0 ? (
                <div className={styles.searchResultsList}>
                  {searchResults.map((result, idx) => (
                    <div
                      key={`${result.to}-${idx}`}
                      className={styles.searchResultItem}
                      onClick={() => handleSearchResultClick(result)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={styles.searchResultBadgeGroup}>
                        <span
                          className={`${styles.searchResultBadge} ${
                            styles[`badge_${result.category.toLowerCase()}`] || ""
                          }`}
                        >
                          {result.category}
                        </span>
                      </div>
                      <div className={styles.searchResultContent}>
                        <div className={styles.searchResultTitle}>{result.title}</div>
                        {result.snippet && (
                          <div className={styles.searchResultSnippet}>{result.snippet}</div>
                        )}
                      </div>
                      <FiChevronRight className={styles.searchResultArrow} aria-hidden="true" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.searchNoResults}>
                  <FiSearch className={styles.searchNoResultsIcon} />
                  <p className={styles.searchNoResultsText}>
                    No matches found for &ldquo;<strong>{searchQuery}</strong>&rdquo;
                  </p>
                  <span className={styles.searchNoResultsTip}>
                    Try searching for <em>residential</em>, <em>turnkey</em>, <em>structural</em>, <em>about</em>, or <em>contact</em>.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className={styles.sidebarNavList}>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `${styles.sidebarNavItem} ${isActive ? styles.sidebarItemActive : ""}`.trim()
                }
                onClick={closeMenu}
                onTouchStart={() => prefetchRoute("/")}
              >
                <FiHome className={styles.sidebarItemIcon} aria-hidden="true" />
                <span className={styles.sidebarItemLabel}>Home</span>
              </NavLink>

              <div className={styles.sidebarAccordionGroup}>
                <div
                  className={`${styles.sidebarNavItemRow} ${isServicesActive ? styles.sidebarItemActive : ""}`.trim()}
                >
                  <NavLink
                    to="/services"
                    className={styles.sidebarNavItemLink}
                    onClick={closeMenu}
                    onTouchStart={() => prefetchRoute("/services")}
                  >
                    <FiLayers className={styles.sidebarItemIcon} aria-hidden="true" />
                    <span className={styles.sidebarItemLabel}>Services</span>
                  </NavLink>
                  <button
                    type="button"
                    className={styles.sidebarChevronBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMobileServicesOpen((prev) => !prev);
                    }}
                    aria-label={mobileServicesOpen ? "Collapse services menu" : "Expand services menu"}
                    aria-expanded={mobileServicesOpen}
                  >
                    <FiChevronDown
                      className={`${styles.sidebarItemChevron} ${mobileServicesOpen ? styles.chevronRotated : ""}`.trim()}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                {mobileServicesOpen && (
                  <div className={styles.sidebarSubList}>
                    <NavLink
                      to="/services"
                      end
                      className={styles.sidebarSubItem}
                      onClick={closeMenu}
                      onTouchStart={() => prefetchRoute("/services")}
                    >
                      <span>All Services</span>
                    </NavLink>
                    {SERVICES_DROPDOWN_DATA.map((service) => (
                      <NavLink
                        key={service.to}
                        to={service.to}
                        className={styles.sidebarSubItem}
                        onClick={closeMenu}
                        onTouchStart={() => prefetchRoute(service.to)}
                      >
                        <span>{service.title}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.sidebarAccordionGroup}>
                <div
                  className={`${styles.sidebarNavItemRow} ${isProjectsActive ? styles.sidebarItemActive : ""}`.trim()}
                >
                  <NavLink
                    to="/projects"
                    className={styles.sidebarNavItemLink}
                    onClick={handleAllProjectsClick}
                    onTouchStart={() => prefetchRoute("/projects")}
                  >
                    <FiGrid className={styles.sidebarItemIcon} aria-hidden="true" />
                    <span className={styles.sidebarItemLabel}>Projects</span>
                    <span className={styles.sidebarBadgeCount}>{totalProjectCount}</span>
                  </NavLink>
                  <button
                    type="button"
                    className={styles.sidebarChevronBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMobileProjectsOpen((prev) => !prev);
                    }}
                    aria-label={mobileProjectsOpen ? "Collapse projects menu" : "Expand projects menu"}
                    aria-expanded={mobileProjectsOpen}
                  >
                    <FiChevronDown
                      className={`${styles.sidebarItemChevron} ${mobileProjectsOpen ? styles.chevronRotated : ""}`.trim()}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                {mobileProjectsOpen && (
                  <div className={styles.sidebarSubList}>
                    <NavLink
                      to="/projects"
                      end
                      className={styles.sidebarSubItem}
                      onClick={handleAllProjectsClick}
                      onTouchStart={() => prefetchRoute("/projects")}
                    >
                      <span>All Projects</span>
                      <span className={styles.sidebarSubCount}>{totalProjectCount}</span>
                    </NavLink>
                    {availableCategories.map((cat) => (
                      <NavLink
                        key={cat.name}
                        to={`/projects?category=${encodeURIComponent(cat.name)}`}
                        className={styles.sidebarSubItem}
                        onClick={closeMenu}
                      >
                        <span>{cat.name}</span>
                        <span className={styles.sidebarSubCount}>{cat.count}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>

              <NavLink
                to="/blog"
                className={({ isActive }) =>
                  `${styles.sidebarNavItem} ${isActive || pathname.startsWith("/blog") ? styles.sidebarItemActive : ""}`.trim()
                }
                onClick={closeMenu}
                onTouchStart={() => prefetchRoute("/blog")}
              >
                <FiBookOpen className={styles.sidebarItemIcon} aria-hidden="true" />
                <span className={styles.sidebarItemLabel}>Blog</span>
                <span className={styles.sidebarBadgeNew}>New</span>
              </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `${styles.sidebarNavItem} ${isActive ? styles.sidebarItemActive : ""}`.trim()
              }
              onClick={closeMenu}
              onTouchStart={() => prefetchRoute("/about")}
            >
              <FiUsers className={styles.sidebarItemIcon} aria-hidden="true" />
              <span className={styles.sidebarItemLabel}>About Us</span>
            </NavLink>

            <NavLink
              to="/careers"
              className={({ isActive }) =>
                `${styles.sidebarNavItem} ${isActive ? styles.sidebarItemActive : ""}`.trim()
              }
              onClick={closeMenu}
              onTouchStart={() => prefetchRoute("/careers")}
            >
              <FiBriefcase className={styles.sidebarItemIcon} aria-hidden="true" />
              <span className={styles.sidebarItemLabel}>Careers</span>
            </NavLink>

            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `${styles.sidebarNavItem} ${isActive ? styles.sidebarItemActive : ""}`.trim()
              }
              onClick={closeMenu}
              onTouchStart={() => prefetchRoute("/contact")}
            >
              <FiMail className={styles.sidebarItemIcon} aria-hidden="true" />
              <span className={styles.sidebarItemLabel}>Contact</span>
            </NavLink>
          </div>

          <div className={styles.sidebarPromoCard}>
            <div className={styles.promoCardHeader}>
              <span className={styles.promoTitle}>Start a Project</span>
            </div>
            <p className={styles.promoDesc}>
              Get a site inspection and transparent engineering estimate for your build.
            </p>
            <button
              type="button"
              className={styles.promoBtn}
              onClick={() => {
                closeMenu();
                openConsultModal("Turnkey Construction");
              }}
            >
              Get a Quote
            </button>
          </div>

          <div className={styles.sidebarBottomSection}>
            <NavLink
              to="/privacy"
              className={styles.sidebarBottomLink}
              onClick={closeMenu}
            >
              <FiShield className={styles.sidebarBottomIcon} aria-hidden="true" />
              <span>Privacy Policy</span>
            </NavLink>

            <NavLink
              to="/terms"
              className={styles.sidebarBottomLink}
              onClick={closeMenu}
            >
              <FiFileText className={styles.sidebarBottomIcon} aria-hidden="true" />
              <span>Terms &amp; Conditions</span>
            </NavLink>

            <a
              href="tel:+15550100000"
              className={styles.sidebarBottomLink}
            >
              <FiPhoneCall className={styles.sidebarBottomIcon} aria-hidden="true" />
              <span>+1 (555) 010-0000</span>
            </a>

            <div className={styles.sidebarCopyright}>
              © {new Date().getFullYear()} Structura Architecture &amp; Construction
            </div>
          </div>
          </>
          )}
        </div>
      </nav>

      <div
        className={`${styles.navbarOverlay} ${isOpen ? styles.active : ""}`}
        onClick={dismissDrawer}
      />

      {modalOpen && (
        <Suspense fallback={null}>
          <ContactModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            initialService={modalService}
          />
        </Suspense>
      )}
    </>
  );
};

export default Navbar;