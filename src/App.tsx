import { useCallback, useEffect, useRef, useState } from "react";
import SelectionPopup from "./SelectionPopup";
import "./Paper.css";

type Ruling = "ruled" | "dotted" | "blank";
type PageMode = "roll" | "pages";

const RULINGS: Ruling[] = ["ruled", "dotted", "blank"];
const PAGE_MODES: PageMode[] = ["roll", "pages"];
const STORAGE_KEY = "paper:doc:v1";
const TITLE_KEY = "paper:title:v1";
const DATE_KEY = "paper:date:v1";
const MODE_KEY = "paper:mode:v1";

// Base page size at 100% — must match --paper-width-base × A4 ratio in index.css.
const PAGE_W = 660;
const PAGE_H = PAGE_W * 1.414;

// Pages mode — must match index.css.
const LINE_BASE = 34;
const VISIBLE_LINES = 27;

const ZOOM_MIN = 0.3;
const ZOOM_MAX = 3;
const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

export default function App() {
  const pageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const [ruling, setRuling] = useState<Ruling>("ruled");
  const [pageMode, setPageMode] = useState<PageMode>("roll");
  const [zoom, setZoom] = useState(1);
  // When true, the page re-fits itself to the window on resize.
  const [fitMode, setFitMode] = useState(true);
  // Pages mode navigation.
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Load saved content once, on mount.
  useEffect(() => {
    const savedBody = localStorage.getItem(STORAGE_KEY);
    if (savedBody && pageRef.current) pageRef.current.innerHTML = savedBody;
    const savedTitle = localStorage.getItem(TITLE_KEY);
    if (savedTitle && titleRef.current) titleRef.current.innerHTML = savedTitle;
    const savedDate = localStorage.getItem(DATE_KEY);
    if (savedDate && dateRef.current) dateRef.current.innerHTML = savedDate;
    const savedMode = localStorage.getItem(MODE_KEY);
    if (savedMode === "roll" || savedMode === "pages") setPageMode(savedMode);
  }, []);

  // Persist the page model.
  useEffect(() => {
    localStorage.setItem(MODE_KEY, pageMode);
  }, [pageMode]);

  // Push the zoom multiplier to CSS — the whole sheet scales from this.
  useEffect(() => {
    document.documentElement.style.setProperty("--zoom", String(zoom));
  }, [zoom]);

  // Push the current page index to CSS — the body translates by whole pages.
  useEffect(() => {
    document.documentElement.style.setProperty("--current-page", String(currentPage));
  }, [currentPage]);

  const pageStepPx = useCallback(() => VISIBLE_LINES * LINE_BASE * zoom, [zoom]);

  // How many whole pages the current content spans.
  const recountPages = useCallback(() => {
    const el = pageRef.current;
    if (!el) return;
    const total = Math.max(1, Math.ceil(el.scrollHeight / pageStepPx() - 0.01));
    setTotalPages(total);
    setCurrentPage((p) => Math.min(p, total - 1));
  }, [pageStepPx]);

  // Jump to the page the caret is on, so typing past the bottom auto-flips.
  const followCaret = useCallback(() => {
    const el = pageRef.current;
    const sel = document.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return;
    const caret = sel.getRangeAt(0).getBoundingClientRect();
    if (caret.height === 0 && caret.top === 0) return;
    // Caret position in the body's own (untranslated) coordinate space.
    const docTop = caret.top - el.getBoundingClientRect().top;
    setCurrentPage(Math.max(0, Math.floor(docTop / pageStepPx())));
  }, [pageStepPx]);

  // Recount whenever the model or zoom changes.
  useEffect(() => {
    recountPages();
  }, [recountPages, pageMode]);

  const fitToScreen = useCallback(() => {
    const availW = window.innerWidth - 96; // breathing room left/right
    const availH = window.innerHeight - 112; // top/bottom
    setZoom(clampZoom(Math.min(availW / PAGE_W, availH / PAGE_H)));
    setFitMode(true);
  }, []);

  const zoomBy = useCallback((factor: number) => {
    setFitMode(false);
    setZoom((z) => clampZoom(z * factor));
  }, []);

  // Keep a ref of fitMode so the resize listener reads the latest value.
  const fitModeRef = useRef(fitMode);
  useEffect(() => {
    fitModeRef.current = fitMode;
  }, [fitMode]);

  // Fit on first load, and keep fitting on resize while in fit mode.
  useEffect(() => {
    fitToScreen();
    const onResize = () => {
      if (fitModeRef.current) fitToScreen();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fitToScreen]);

  // Entering pages mode, fit the whole page to the screen.
  useEffect(() => {
    if (pageMode === "pages") fitToScreen();
  }, [pageMode, fitToScreen]);

  // Keyboard: ⌘/Ctrl + = / - / 0
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        zoomBy(1.1);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomBy(1 / 1.1);
      } else if (e.key === "0") {
        e.preventDefault();
        fitToScreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomBy, fitToScreen]);

  // ⌘/Ctrl + scroll to zoom.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1.05 : 1 / 1.05);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  // Silent autosave — no save button, ever.
  const save = () => {
    if (pageRef.current) localStorage.setItem(STORAGE_KEY, pageRef.current.innerHTML);
    if (titleRef.current) localStorage.setItem(TITLE_KEY, titleRef.current.innerHTML);
    if (dateRef.current) localStorage.setItem(DATE_KEY, dateRef.current.innerHTML);
    if (pageMode === "pages") {
      recountPages();
      followCaret();
    }
  };

  const goToPage = useCallback(
    (p: number) => setCurrentPage(Math.min(Math.max(0, p), totalPages - 1)),
    [totalPages],
  );

  // Pages mode: PageUp / PageDown to flip.
  useEffect(() => {
    if (pageMode !== "pages") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "PageDown") {
        e.preventDefault();
        setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
      } else if (e.key === "PageUp") {
        e.preventDefault();
        setCurrentPage((p) => Math.max(p - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pageMode, totalPages]);

  return (
    <div className="desk">
      <TopBar
        ruling={ruling}
        onRuling={setRuling}
        pageMode={pageMode}
        onPageMode={setPageMode}
        zoom={zoom}
        onZoomIn={() => zoomBy(1.1)}
        onZoomOut={() => zoomBy(1 / 1.1)}
        onFit={fitToScreen}
      />

      <div className="paper" data-mode={pageMode} data-page={currentPage}>
        <div className="page-meta">
          <div
            ref={titleRef}
            className="meta-title"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onInput={save}
          />
          <div
            ref={dateRef}
            className="meta-date"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onInput={save}
          />
        </div>
        <div
          ref={pageRef}
          className="page"
          data-ruling={ruling}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onInput={save}
        />
      </div>

      {pageMode === "pages" && (
        <div className="pager">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            title="Previous page (PageUp)"
          >
            ‹
          </button>
          <span className="pager-count">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            title="Next page (PageDown)"
          >
            ›
          </button>
        </div>
      )}

      <SelectionPopup pageRef={pageRef} onAfterChange={save} />
    </div>
  );
}

function TopBar({
  ruling,
  onRuling,
  pageMode,
  onPageMode,
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
}: {
  ruling: Ruling;
  onRuling: (r: Ruling) => void;
  pageMode: PageMode;
  onPageMode: (m: PageMode) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}) {
  return (
    <div className="edge-reveal">
      {RULINGS.map((r) => (
        <button key={r} data-active={r === ruling} onClick={() => onRuling(r)}>
          {r}
        </button>
      ))}
      <span className="edge-divider" />
      {PAGE_MODES.map((m) => (
        <button key={m} data-active={m === pageMode} onClick={() => onPageMode(m)}>
          {m}
        </button>
      ))}
      <span className="edge-divider" />
      <button onClick={onZoomOut} title="Zoom out (⌘−)">
        −
      </button>
      <button onClick={onFit} title="Fit to screen (⌘0)">
        {Math.round(zoom * 100)}%
      </button>
      <button onClick={onZoomIn} title="Zoom in (⌘=)">
        +
      </button>
    </div>
  );
}
