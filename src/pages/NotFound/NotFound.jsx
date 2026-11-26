// Page: NotFound — src/pages/NotFound/NotFound.jsx
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Compass } from "lucide-react";
import MetaTags from "../../components/common/SEO/MetaTags";
import { PAGE_SEO } from "../../config/seo.config";
import styles from "./NotFound.module.css";

const NOT_FOUND_IMAGE = "/images/404.svg";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <section className={styles.container} aria-labelledby="not-found-title">
      <MetaTags
        title={PAGE_SEO.notFound.title}
        description={PAGE_SEO.notFound.description}
        canonical={PAGE_SEO.notFound.canonical}
        noindex={true}
      />
      <div className={styles.content}>
        <figure className={styles.imageWrapper}>
          <img
            src={NOT_FOUND_IMAGE}
            alt="404 Page Not Found - Structura Architecture and Construction"
            className={styles.image}
            width="320"
            height="338"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </figure>

        <h1 id="not-found-title" className={styles.title}>
          Oops, You’re Lost.
        </h1>

        <p className={styles.description}>
          The page you are looking for doesn’t exist, has been removed, or the
          URL was typed incorrectly.
        </p>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={styles.secondaryBtn}
            aria-label="Go back to the previous page"
          >
            <ArrowLeft size={18} className={styles.btnIcon} aria-hidden="true" />
            <span>Go Back</span>
          </button>
          <Link to="/" className={styles.primaryBtn} aria-label="Return to homepage">
            <Home size={18} className={styles.btnIcon} aria-hidden="true" />
            <span>Return Home</span>
          </Link>
          <Link to="/projects" className={styles.secondaryBtn} aria-label="Explore our project portfolio">
            <Compass size={18} className={styles.btnIcon} aria-hidden="true" />
            <span>Explore Projects</span>
          </Link>
        </div>
      </div>
    </section>
  );
}