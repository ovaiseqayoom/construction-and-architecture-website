import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);

    const msg = String(error?.message || error || "");
    const isChunkOrImportError =
      msg.includes("reading 'default'") ||
      msg.includes("dynamically imported module") ||
      msg.includes("Failed to fetch") ||
      msg.includes("Importing a module script failed") ||
      msg.includes("Loading chunk");

    if (isChunkOrImportError && typeof window !== "undefined") {
      const lastReload = window.sessionStorage.getItem("app_eb_chunk_reload");
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        window.sessionStorage.setItem("app_eb_chunk_reload", now.toString());
        window.location.reload();
        return;
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <h1>Something went wrong.</h1>
          <p>Please refresh the page. If the problem continues, contact support.</p>
          <button
            type="button"
            onClick={() => {
              window.sessionStorage.clear();
              window.location.reload();
            }}
            style={{
              marginTop: "1rem",
              padding: "0.6rem 1.25rem",
              background: "#18181b",
              color: "#fff",
              border: "1px solid #3f3f46",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}