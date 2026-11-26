import { useMemo, lazy, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import PageLoader from "../../common/PageLoader";

const EmployeeModal = lazy(async () => {
  try {
    return await import("../../team/EmployeeModal");
  } catch (err) {
    if (typeof window !== "undefined") {
      const reloaded = window.sessionStorage.getItem("app_emp_reload");
      const now = Date.now();
      if (!reloaded || now - parseInt(reloaded, 10) > 10000) {
        window.sessionStorage.setItem("app_emp_reload", now.toString());
        window.location.reload();
      }
    }
    throw err;
  }
});

const HIDDEN_NAVBAR_ROUTES = ["/team"];
const HIDDEN_FOOTER_ROUTES = ["/terms", "/privacy", "/team"];

export default function Layout() {
  const { pathname } = useLocation();

  const isNavbarHidden = useMemo(
    () =>
      HIDDEN_NAVBAR_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      ),
    [pathname]
  );

  const isFooterHidden = useMemo(
    () =>
      HIDDEN_FOOTER_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      ),
    [pathname]
  );

  return (
    <>
      {!isNavbarHidden && <Navbar />}
      <main id="main" role="main" aria-label="Main content">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      {!isFooterHidden && <Footer />}
      <Suspense fallback={null}>
        <EmployeeModal />
      </Suspense>
    </>
  );
}