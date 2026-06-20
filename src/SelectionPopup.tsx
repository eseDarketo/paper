import { useEffect, useState, type RefObject } from "react";

type Pos = { top: number; left: number } | null;

/** Replace an element with its children. */
function unwrap(el: Element) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

/** Collapse style markup to a single layer: no nesting, no empty spans. */
function normalizeStyles(root: HTMLElement) {
  // A style span inside another style span is redundant — unwrap the inner one.
  root.querySelectorAll("[data-style] [data-style]").forEach(unwrap);
  // Empty wrappers left over from edits do nothing but cause trouble.
  root.querySelectorAll("[data-style]").forEach((el) => {
    if (!el.textContent) unwrap(el);
  });
  root.normalize();
}

/**
 * Watches the text selection inside `pageRef`. When the writer selects a
 * non-empty range, it surfaces a tiny popup centered above the selection.
 * Hidden whenever the selection collapses, leaves the page, or Esc is pressed.
 */
export default function SelectionPopup({
  pageRef,
  onAfterChange,
}: {
  pageRef: RefObject<HTMLDivElement | null>;
  onAfterChange: () => void;
}) {
  const [pos, setPos] = useState<Pos>(null);

  useEffect(() => {
    const place = () => {
      const sel = document.getSelection();
      const page = pageRef.current;
      if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !page) {
        setPos(null);
        return;
      }
      const range = sel.getRangeAt(0);
      // Only show when the selection lives inside the page.
      if (!page.contains(range.commonAncestorContainer)) {
        setPos(null);
        return;
      }
      const r = range.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) {
        setPos(null);
        return;
      }
      setPos({ top: r.top - 10, left: r.left + r.width / 2 });
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPos(null);
    };

    document.addEventListener("selectionchange", place);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("selectionchange", place);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      document.removeEventListener("keydown", onKey);
    };
  }, [pageRef]);

  if (!pos) return null;

  // execCommand is deprecated but remains the simplest reliable way to toggle
  // inline formatting across a contenteditable selection. Good enough here;
  // can be swapped for a Range-based implementation later.
  const exec = (cmd: string) => {
    document.execCommand(cmd);
    onAfterChange();
  };

  // Apply a style to the selection. normalizeStyles() then flattens nesting
  // and removes empties so repeated clicks can't stack.
  const applyStyle = (style: "normal" | "bigger") => {
    const sel = document.getSelection();
    const page = pageRef.current;
    if (!sel || sel.rangeCount === 0 || !page) return;
    const range = sel.getRangeAt(0);

    if (style === "normal") {
      // Strip every bigger span the selection touches — including a wrapper
      // that surrounds the selection, which is the whole point.
      Array.from(page.querySelectorAll("[data-style]"))
        .filter((el) => range.intersectsNode(el))
        .forEach(unwrap);
      normalizeStyles(page);
      onAfterChange();
      return;
    }

    // bigger: wrap the selection once.
    const frag = range.extractContents();
    frag.querySelectorAll("[data-style]").forEach(unwrap); // avoid double-wrap
    const span = document.createElement("span");
    span.setAttribute("data-style", "bigger");
    span.appendChild(frag);
    range.insertNode(span);

    normalizeStyles(page);

    // Keep the popup alive by re-selecting the affected text.
    if (span.isConnected) {
      const after = document.createRange();
      after.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(after);
    }
    onAfterChange();
  };

  return (
    <div
      className="sel-popup"
      style={{ top: pos.top, left: pos.left }}
      // Keep the text selection alive when a button is pressed.
      onMouseDown={(e) => e.preventDefault()}
    >
      <button title="Bold" onClick={() => exec("bold")} style={{ fontWeight: 700 }}>
        B
      </button>
      <button title="Underline" onClick={() => exec("underline")} style={{ textDecoration: "underline" }}>
        U
      </button>
      <button title="Strikethrough" onClick={() => exec("strikeThrough")} style={{ textDecoration: "line-through" }}>
        S
      </button>
      <span className="sel-popup-divider" />
      <button title="Normal" onClick={() => applyStyle("normal")} style={{ fontSize: "13px" }}>
        A
      </button>
      <button title="Bigger" onClick={() => applyStyle("bigger")} style={{ fontSize: "17px" }}>
        A
      </button>
    </div>
  );
}
