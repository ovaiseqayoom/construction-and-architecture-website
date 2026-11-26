import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  const lastReload = window.sessionStorage.getItem("app_chunk_reload");
  const now = Date.now();
  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
    window.sessionStorage.setItem("app_chunk_reload", now.toString());
    window.location.reload();
  }
});

window.addEventListener(
  "error",
  (e) => {
    const target = e.target;
    if (target && (target.tagName === "SCRIPT" || (target.tagName === "LINK" && target.rel === "stylesheet"))) {
      const src = target.src || target.href || "";
      if (src.includes("/assets/")) {
        const lastReload = window.sessionStorage.getItem("app_asset_reload");
        const now = Date.now();
        if (!lastReload || now - parseInt(lastReload, 10) > 8000) {
          window.sessionStorage.setItem("app_asset_reload", now.toString());
          window.location.reload();
        }
      }
    }
  },
  true
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);