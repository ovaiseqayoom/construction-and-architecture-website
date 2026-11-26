import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import mermaid from "mermaid";
import {
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";
import useScrollLock from "../../hooks/useScrollLock";
import { getMermaidTheme } from "./mermaidTheme";
import styles from "./MermaidDiagram.module.css";

let mermaidInitialized = false;

function sanitizeRenderedSvg(rawSvg = "") {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return rawSvg;
  const doc = new DOMParser().parseFromString(rawSvg, "image/svg+xml");
  doc.querySelectorAll("script, iframe, object, embed").forEach((node) => node.remove());
  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const val = attr.value.trim().toLowerCase();
      if (name.startsWith("on") || ((name === "href" || name === "xlink:href") && /^(javascript|data|vbscript):/i.test(val))) {
        el.removeAttribute(attr.name);
      }
    }
  });
  return doc.documentElement ? new XMLSerializer().serializeToString(doc.documentElement) : "";
}

function initMermaid() {
  if (mermaidInitialized) return;
  try {
    const config = getMermaidTheme(false);
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      ...config,
    });
    mermaidInitialized = true;
  } catch (err) {
    console.warn("[Mermaid] Initialization notice:", err);
  }
}

function sanitizeMermaidCode(raw) {
  if (!raw) return "";
  let code = raw.trim();

  code = code.replace(/^```(?:mermaid)?\s*[\r\n]+/i, "").replace(/[\r\n]+```\s*$/i, "").trim();

  if (!/^(flowchart|graph|sequenceDiagram|mindmap|timeline|gantt|classDiagram|stateDiagram|erDiagram|journey|pie|gitGraph)/i.test(code)) {
    code = `flowchart TD\n${code}`;
  }

  code = code.replace(/(\b[a-zA-Z0-9_]+)\[([^"\]\r\n][^\]\r\n]*?)\]/g, (match, id, text) => {
    return `${id}["${text.replace(/"/g, "'")}"]`;
  });

  code = code.replace(/(\b[a-zA-Z0-9_]+)\{([^"}\r\n][^}\r\n]*?)\}/g, (match, id, text) => {
    return `${id}{"${text.replace(/"/g, "'")}"}`;
  });

  code = code.replace(/(\b[a-zA-Z0-9_]+)\((?!\()([^")\r\n][^)\r\n]*?)\)/g, (match, id, text) => {
    return `${id}("${text.replace(/"/g, "'")}")`;
  });

  code = code.replace(/(\b[a-zA-Z0-9_]+)\(\(([^")\r\n][^)\r\n]*?)\)\)/g, (match, id, text) => {
    return `${id}(("${text.replace(/"/g, "'")}"))`;
  });

  code = code.replace(/-->\|([^"|\r\n][^|\r\n]*?)\|/g, (match, text) => {
    return `-->|"${text.replace(/"/g, "'")}"|`;
  });

  return code;
}

function applySvgStyles(svgEl, isFullscreen = false) {
  if (!svgEl) return;
  svgEl.removeAttribute("width");
  svgEl.removeAttribute("height");
  svgEl.style.removeProperty("max-width");

  // Subgraph clusters - fully transparent, zero card box
  svgEl.querySelectorAll(".cluster rect").forEach((rect) => {
    rect.setAttribute("fill", "transparent");
    rect.setAttribute("stroke", "transparent");
    rect.setAttribute("stroke-width", "0");
    rect.style.fill = "transparent";
    rect.style.stroke = "transparent";
    rect.style.strokeWidth = "0";
  });

  // Standard process rectangles
  svgEl.querySelectorAll(".node rect").forEach((rect) => {
    rect.setAttribute("fill", "#F8FAFC");
    rect.setAttribute("stroke", "#1E293B");
    rect.setAttribute("stroke-width", "1.75");
    rect.setAttribute("rx", "8");
    rect.setAttribute("ry", "8");
    rect.style.fill = "#F8FAFC";
    rect.style.stroke = "#1E293B";
    rect.style.strokeWidth = "1.75px";
    rect.style.filter = "drop-shadow(0 2px 5px rgba(15, 23, 42, 0.08))";
  });

  // Decision diamonds (polygons) - Warm Amber accent
  svgEl.querySelectorAll(".node polygon").forEach((poly) => {
    poly.setAttribute("fill", "#FEF3C7");
    poly.setAttribute("stroke", "#D97706");
    poly.setAttribute("stroke-width", "2");
    poly.style.fill = "#FEF3C7";
    poly.style.stroke = "#D97706";
    poly.style.strokeWidth = "2px";
    poly.style.filter = "drop-shadow(0 2px 7px rgba(217, 119, 6, 0.16))";
  });

  // Circular / terminal nodes - Sky blue accent
  svgEl.querySelectorAll(".node circle, .node ellipse").forEach((circ) => {
    circ.setAttribute("fill", "#EFF6FF");
    circ.setAttribute("stroke", "#2563EB");
    circ.setAttribute("stroke-width", "2");
    circ.style.fill = "#EFF6FF";
    circ.style.stroke = "#2563EB";
    circ.style.strokeWidth = "2px";
    circ.style.filter = "drop-shadow(0 2px 6px rgba(37, 99, 235, 0.14))";
  });

  // Node text styling - crisp, high-contrast typography
  svgEl.querySelectorAll(".node .nodeLabel, .node text, .node span").forEach((txt) => {
    txt.style.fontFamily = "var(--app-font-body, 'Inter', sans-serif)";
    txt.style.fontSize = "13px";
    txt.style.fontWeight = "600";
    txt.style.fill = "#0F172A";
    txt.style.color = "#0F172A";
    txt.style.letterSpacing = "-0.01em";
  });

  // Decision node text
  svgEl.querySelectorAll(".node:has(polygon) text, .node:has(polygon) .nodeLabel, .node:has(polygon) span").forEach((txt) => {
    txt.style.fill = "#78350F";
    txt.style.color = "#78350F";
    txt.style.fontWeight = "700";
  });

  // Connector paths (edges)
  svgEl.querySelectorAll(".edgePath path").forEach((edge) => {
    edge.setAttribute("stroke", "#475569");
    edge.setAttribute("stroke-width", "1.75");
    edge.style.stroke = "#475569";
    edge.style.strokeWidth = "1.75px";
  });

  // Markers (arrowheads)
  svgEl.querySelectorAll("marker path").forEach((markerPath) => {
    markerPath.setAttribute("fill", "#475569");
    markerPath.setAttribute("stroke", "#475569");
    markerPath.style.fill = "#475569";
    markerPath.style.stroke = "#475569";
  });

  // Edge labels (condition tags like Yes / No)
  svgEl.querySelectorAll(".edgeLabel").forEach((lbl) => {
    lbl.style.backgroundColor = "#FFFFFF";
    lbl.style.color = "#334155";
    lbl.style.fontFamily = "var(--app-font-body, 'Inter', sans-serif)";
    lbl.style.fontSize = "11.5px";
    lbl.style.fontWeight = "600";
    lbl.style.padding = "2px 6px";
    lbl.style.borderRadius = "4px";
    lbl.style.border = "1px solid #CBD5E1";
  });

  if (isFullscreen) {
    svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svgEl.style.cssText =
      "width: auto; max-width: min(94vw, 1400px); height: auto; max-height: 78vh; display: block; margin: 0 auto;";
  } else {
    svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");

    // Extract natural viewBox dimensions
    const vb = svgEl.getAttribute("viewBox");
    let vbWidth = 0;
    let vbHeight = 0;
    if (vb) {
      const parts = vb.trim().split(/[\s,]+/);
      if (parts.length === 4) {
        vbWidth = parseFloat(parts[2]);
        vbHeight = parseFloat(parts[3]);
      }
    }

    // Wide or horizontal diagrams:
    // Render at natural readable scale, aligned to left = 0 (zero clipping)
    const isWide = vbWidth >= 520 || (vbWidth > 0 && vbHeight > 0 && vbWidth / vbHeight >= 1.35);

    if (isWide) {
      const targetWidth = Math.max(Math.round(vbWidth), 780);
      svgEl.style.cssText = `width: ${targetWidth}px !important; min-width: ${targetWidth}px !important; max-width: none !important; height: auto !important; display: block !important; margin: 0 !important; margin-left: 0 !important; margin-right: auto !important;`;
    } else {
      svgEl.style.cssText = `width: auto !important; max-width: 100% !important; min-width: ${Math.min(Math.round(vbWidth) || 300, 320)}px !important; height: auto !important; max-height: 520px !important; display: block !important; margin: 0 !important; margin-left: 0 !important; margin-right: auto !important;`;
    }
  }
}

const MermaidFullscreenModal = memo(({ diagramCode, onClose }) => {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const dragOriginRef = useRef({ x: 0, y: 0 });

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  useScrollLock(true);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") {
        setZoom((z) => Math.min(4, parseFloat((z + 0.25).toFixed(2))));
      }
      if (e.key === "-" || e.key === "_") {
        setZoom((z) => Math.max(0.3, parseFloat((z - 0.25).toFixed(2))));
      }
      if (e.key === "0") {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !diagramCode) return;
    let cancelled = false;

    initMermaid();
    const uniqueId = `mm_fs_${Math.random().toString(36).substring(2, 9)}`;

    mermaid
      .render(uniqueId, diagramCode)
      .then(({ svg }) => {
        if (cancelled || !containerRef.current) return;
        el.innerHTML = sanitizeRenderedSvg(svg);
        applySvgStyles(el.querySelector("svg"), true);
      })
      .catch((err) => {
        if (!cancelled && containerRef.current) {
          const pre = document.createElement("pre");
          pre.style.cssText = "color:#ef4444;font-size:12px;padding:1rem";
          pre.textContent = err?.message || "Invalid diagram syntax";
          containerRef.current.replaceChildren(pre);
        }
      });

    return () => {
      cancelled = true;
      const stray = document.getElementById(uniqueId);
      if (stray && stray.parentNode) stray.parentNode.removeChild(stray);
    };
  }, [diagramCode]);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    dragOriginRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    e.preventDefault();
  }, [pan]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragOriginRef.current.x, y: e.clientY - dragOriginRef.current.y });
  }, [isDragging]);

  const stopDrag = useCallback(() => {
    setIsDragging(false);
  }, []);

  const touchDistRef = useRef(null);
  const touchStartZoomRef = useRef(1);
  const lastTapRef = useRef(0);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchDistRef.current = Math.hypot(dx, dy);
        touchStartZoomRef.current = zoom;
        setIsDragging(false);
      } else if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          setZoom((z) => (z > 1.2 ? 1 : 2.2));
          setPan({ x: 0, y: 0 });
          lastTapRef.current = 0;
          return;
        }
        lastTapRef.current = now;

        const t = e.touches[0];
        setIsDragging(true);
        dragOriginRef.current = { x: t.clientX - pan.x, y: t.clientY - pan.y };
        touchDistRef.current = null;
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && touchDistRef.current) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        if (touchDistRef.current > 0) {
          const factor = currentDist / touchDistRef.current;
          const nextZoom = Math.min(5, Math.max(0.35, parseFloat((touchStartZoomRef.current * factor).toFixed(2))));
          setZoom(nextZoom);
        }
      } else if (e.touches.length === 1 && isDragging) {
        e.preventDefault();
        const t = e.touches[0];
        setPan({ x: t.clientX - dragOriginRef.current.x, y: t.clientY - dragOriginRef.current.y });
      }
    };

    const onTouchEnd = () => {
      setIsDragging(false);
      touchDistRef.current = null;
    };

    stage.addEventListener("touchstart", onTouchStart, { passive: false });
    stage.addEventListener("touchmove", onTouchMove, { passive: false });
    stage.addEventListener("touchend", onTouchEnd);
    stage.addEventListener("touchcancel", onTouchEnd);

    return () => {
      stage.removeEventListener("touchstart", onTouchStart);
      stage.removeEventListener("touchmove", onTouchMove);
      stage.removeEventListener("touchend", onTouchEnd);
      stage.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [pan, zoom, isDragging]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((z) => {
      const next = parseFloat((z + delta).toFixed(2));
      return Math.min(4, Math.max(0.3, next));
    });
  }, []);

  const zoomOut = useCallback((e) => {
    e?.stopPropagation();
    setZoom((z) => Math.max(0.3, parseFloat((z - 0.25).toFixed(2))));
  }, []);

  const zoomIn = useCallback((e) => {
    e?.stopPropagation();
    setZoom((z) => Math.min(4, parseFloat((z + 0.25).toFixed(2))));
  }, []);

  const resetZoom = useCallback((e) => {
    e?.stopPropagation();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleCopyCode = (e) => {
    e?.stopPropagation();
    if (!diagramCode) return;
    navigator.clipboard?.writeText(diagramCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.fullscreenBackdrop} role="dialog" aria-modal="true">
      <header className={styles.fullscreenTopHeader}>
        <div className={styles.fullscreenTitleGroup}>
          <span className={styles.badgePulseDot} />
          <div>
            <h3 className={styles.fullscreenTitle}>Engineering Process Architecture</h3>
            <span className={styles.fullscreenSubtitle}>Interactive High-Resolution Flow Diagram</span>
          </div>
        </div>

        <div className={styles.fullscreenControlsGroup}>
          <button
            type="button"
            onClick={handleCopyCode}
            className={styles.headerActionBtn}
            title="Copy diagram source"
          >
            {copied ? <Check size={13} className={styles.checkIcon} /> : <Copy size={13} />}
            <span>{copied ? "Copied" : "Source"}</span>
          </button>

          <div className={styles.zoomPillBox}>
            <button type="button" onClick={zoomOut} className={styles.zoomCtrlBtn} title="Zoom out (−)" aria-label="Zoom out">
              <ZoomOut size={14} />
            </button>
            <button
              type="button"
              onClick={resetZoom}
              className={styles.zoomValueBtn}
              title="Reset zoom to 100% (0)"
              aria-label="Reset zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button type="button" onClick={zoomIn} className={styles.zoomCtrlBtn} title="Zoom in (+)" aria-label="Zoom in">
              <ZoomIn size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={styles.modalCloseCircleBtn}
            title="Close Fullscreen (Esc)"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <div
        ref={stageRef}
        className={styles.fullscreenDisplayStage}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onWheel={handleWheel}
      >
        <div
          className={styles.canvasTransformMount}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)",
            willChange: isDragging ? "transform" : "auto",
          }}
        >
          <div className={styles.fullscreenSvgMount} ref={containerRef} />
        </div>
      </div>

      <div className={styles.mobileFloatingZoomBar}>
        <button type="button" onClick={zoomOut} className={styles.mobileZoomBtn} aria-label="Zoom out">
          <ZoomOut size={16} />
        </button>
        <button type="button" onClick={resetZoom} className={styles.mobileResetBtn} aria-label="Reset zoom">
          <RotateCcw size={13} />
          <span>{Math.round(zoom * 100)}%</span>
        </button>
        <button type="button" onClick={zoomIn} className={styles.mobileZoomBtn} aria-label="Zoom in">
          <ZoomIn size={16} />
        </button>
      </div>

      <footer className={styles.fullscreenFooterHelp}>
        <span>Drag to pan • Pinch or +/- to zoom • Double-tap to reset • Esc to exit</span>
      </footer>
    </div>
  );
});
MermaidFullscreenModal.displayName = "MermaidFullscreenModal";

export default function MermaidDiagram({ code = "", id = "" }) {
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [renderError, setRenderError] = useState(null);

  const inlineContainerRef = useRef(null);
  const scrollWrapperRef = useRef(null);

  // Desktop mouse drag-to-slide state
  const isDraggingMouse = useRef(false);
  const startMouseX = useRef(0);
  const startScrollLeft = useRef(0);

  const sanitizedCode = sanitizeMermaidCode(code);

  useEffect(() => {
    const el = inlineContainerRef.current;
    const wrapper = scrollWrapperRef.current;
    if (!el || !sanitizedCode) return;
    let cancelled = false;

    initMermaid();
    const uniqueId = `mm_inline_${id || Math.random().toString(36).substring(2, 9)}`;

    mermaid
      .render(uniqueId, sanitizedCode)
      .then(({ svg }) => {
        if (cancelled || !inlineContainerRef.current) return;
        el.innerHTML = sanitizeRenderedSvg(svg);
        applySvgStyles(el.querySelector("svg"), false);
        setRenderError(null);

        if (wrapper) {
          wrapper.scrollLeft = 0;
        }
      })
      .catch((err) => {
        if (!cancelled && inlineContainerRef.current) {
          const msg = err?.message || "Failed to render diagram";
          setRenderError(msg);
          const pre = document.createElement("pre");
          pre.style.cssText = "color:#f97316;font-size:12px;padding:0.75rem;";
          pre.textContent = msg;
          inlineContainerRef.current.replaceChildren(pre);
        }
      });

    return () => {
      cancelled = true;
      const stray = document.getElementById(uniqueId);
      if (stray && stray.parentNode) stray.parentNode.removeChild(stray);
    };
  }, [sanitizedCode, id]);

  // Open fullscreen ONLY when user clicks the Fullscreen button
  const handleOpenFullscreen = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      return;
    }
    if (!renderError) {
      setFullscreenOpen(true);
    }
  }, [renderError]);

  // Desktop mouse drag-to-slide handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left-click
    const wrapper = scrollWrapperRef.current;
    if (!wrapper) return;

    isDraggingMouse.current = true;
    startMouseX.current = e.pageX - wrapper.offsetLeft;
    startScrollLeft.current = wrapper.scrollLeft;
    wrapper.style.cursor = "grabbing";
    wrapper.style.userSelect = "none";
  };

  const handleMouseMove = (e) => {
    if (!isDraggingMouse.current) return;
    const wrapper = scrollWrapperRef.current;
    if (!wrapper) return;

    e.preventDefault();
    const x = e.pageX - wrapper.offsetLeft;
    const walk = (x - startMouseX.current) * 1.35; // Smooth slide multiplier
    wrapper.scrollLeft = startScrollLeft.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    if (isDraggingMouse.current) {
      isDraggingMouse.current = false;
      const wrapper = scrollWrapperRef.current;
      if (wrapper) {
        wrapper.style.cursor = "grab";
        wrapper.style.removeProperty("user-select");
      }
    }
  };

  const handleWheel = (e) => {
    const wrapper = scrollWrapperRef.current;
    if (!wrapper) return;
    // Shift+wheel or trackpad horizontal scroll
    if (e.shiftKey && e.deltaY !== 0) {
      wrapper.scrollLeft += e.deltaY;
    }
  };

  return (
    <>
      <div className={styles.openDiagramContainer}>
        {/* Minimal Open Top Bar */}
        <div className={styles.openDiagramTopBar}>
          <div className={styles.diagramMetaLeft}>
            <span className={styles.diagramIndicatorDot} />
            <span className={styles.diagramMetaTitle}>Process Architecture</span>
          </div>

          {/* Desktop-only fullscreen button: ONLY clicking this opens full screen */}
          <button
            type="button"
            onClick={handleOpenFullscreen}
            className={styles.openFullscreenActionBtn}
            title="Expand diagram in full display view"
            aria-label="View Fullscreen"
          >
            <Maximize2 size={12} />
            <span>Fullscreen</span>
          </button>
        </div>

        {/* Smooth horizontal scroll viewport:
            - Desktop: Click and drag with mouse slides left/right smoothly!
            - Mobile: Touch swiping slides left/right smoothly!
            - Starts at left = 0 (zero clipping)
            - No empty space below
        */}
        <div
          ref={scrollWrapperRef}
          className={styles.diagramScrollWrapper}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onWheel={handleWheel}
          role="region"
          aria-label="Process Diagram Canvas (Drag or swipe to slide)"
        >
          <div ref={inlineContainerRef} className={styles.diagramSvgMount} />
        </div>
      </div>

      {fullscreenOpen && (
        <MermaidFullscreenModal
          diagramCode={sanitizedCode}
          onClose={() => setFullscreenOpen(false)}
        />
      )}
    </>
  );
}
