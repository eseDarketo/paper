# Paper — a writing tool that feels like a notebook

> A minimal text editor whose first principle is: *at first glance, you see a piece of paper and nothing else.*
> Built for long-form creative writing, designed to protect the writing "vibe" that software UI usually destroys.

---

## 1. Why this exists

Conventional editors are dense with information — toolbars, panels, counts, suggestions. That density is exactly what kills the calm of writing. Paper has none of it: a bounded surface, ruling to guide the hand, and ink. This project recreates *that* feeling digitally, and treats the absence of UI as the core feature, not a missing one.

**Design north star:** every pixel that isn't paper or text has to justify its existence. When in doubt, hide it.

---

## 2. Core principles (non-negotiable)

1. **Paper first.** On open, the screen is a sheet — ruled, dotted, or blank — and nothing else. No chrome until the user invokes it.
2. **Text lives on the lines.** The baseline grid is real. Characters sit *on* the rule like ink. This constraint defines the entire typographic system (see §5).
3. **Formatting is rare and contextual.** No persistent formatting UI. Select text → tiny popup → a few actions. That's the only way to style.
4. **Configuration is concealed.** Settings exist but are invisible until summoned by gesture/shortcut/edge-reveal.
5. **Ruthless about chrome.** Saving, switching ruling, page mode, styles — all invoked, never parked on screen.

---

## 3. The paper object

- The page is a **bounded object**, not an infinite canvas: fixed proportional width (≈A5/A4 ratio), centered, subtle shadow so it reads as a physical sheet on a desk.
- **Ruling modes:** `ruled` (horizontal lines), `dotted` (dot grid), `blank`. Switchable.
- **Paper model (switchable, per user's choice):**
  - **Endless roll** — one continuous sheet, scroll down forever. Most honest to writing flow. Default.
  - **Discrete pages** — fixed-height sheets that fill and "turn" to the next page. More nostalgic / object-like.
- Background: warm off-white, not pure `#fff`. Optional faint paper texture (toggle, off by default).

---

## 4. Writing surface behavior

- Cursor and text snap to the **baseline grid**. Line height is fixed and authoritative.
- Typing past the bottom: roll mode grows the sheet; page mode creates/turns a page.
- No spellcheck squiggles, no autocomplete, no grammar hints by default (they're visual noise). Optional later, off by default.
- Margins respected like a real page; ruling can optionally include a margin line.

---

## 5. Typography & the line-grid rule (the hard, important part)

The illusion breaks the moment text stops aligning to the ruling. So the rule is:

> **Every text style occupies exactly one base line-height, and its baseline sits on a rule. Styles differ only in how much of that line the glyphs fill.**

- **Base unit** = one line-height (e.g. 28px). All ruling is drawn at this interval. Every line of text — regardless of style — advances by exactly one base unit, so text always lands on the rules.
- **Two styles, both one line tall:**
  - **Base (`Normal`)** — glyphs sized so the type fills **80%** of the line-height.
  - **Bigger** — glyphs sized so the type fills **95%** of the line-height.
- The difference between styles is font size *within* the fixed line, not line count. Nothing ever takes two lines or offsets the grid.
- Font: a single, well-chosen text face (a humanist serif or a calm mono — TBD by feel). Tunable in concealed settings.

---

## 6. Formatting popup (selection-triggered)

- Trigger: select text → small popup appears near the selection.
- **Default actions:** **strikethrough**, **underline**, **bold**.
- Icons only, no labels. Disappears on deselect or Esc.
- Minimal, monochrome, no borders fighting the paper.

---

## 7. Styles system (concealed, configurable)

- A style = a named typographic preset (font size as a % of line-height, weight, etc.).
- **Exactly 2 styles** — `Normal` (fills 80% of the line) and `Bigger` (fills 95% of the line). Both are one line tall.
- The same selection popup (or a sibling control) lets the writer assign a selection to one of the two styles.

---

## 8. Concealed controls — how you summon the hidden stuff

(Proposed; refine by feel.)
- **Ruling / paper mode / settings:** keyboard shortcut or a reveal at a screen edge (e.g. hover top edge → faint controls fade in, fade out when you return to writing).
- **Save:** automatic, silent, local-first. No save button. (Manual export available but hidden.)
- **Command surface (optional later):** a single keypress opens a minimal command list for everything — very iA-Writer-meets-Raycast, but bare.

---

## 9. Tech direction

- **Web-first, desktop-ready.** Build as a web app; wrap in **Tauri** later for a true desktop writing app. Inner dev loop stays web-fast (Vite HMR); only the thin native layer ever needs compiling.
- **Stack (proposed):**
  - Vite + React + TypeScript (familiar, fast iteration).
  - The editor surface: start by evaluating whether a contenteditable layer or a CodeMirror/ProseMirror base best supports the *strict baseline grid* — the grid constraint is unusual and may be easier with a custom contenteditable than fighting a framework's layout. **Open question, decide via spike.**
  - Local-first persistence: start with IndexedDB; files-on-disk via Tauri later.
- **No backend** in v1. Everything local.

---

## 10. Roadmap

**Phase 0 — Spike (prove the hard thing):**
- One ruled sheet, fixed baseline grid, you can type and text genuinely sits on the lines. Decide the editor-engine question here. *Nothing else.*

**Phase 1 — The paper:**
- Ruling modes (ruled/dotted/blank). Roll vs page model. Warm paper aesthetic. Autosave to IndexedDB.

**Phase 2 — Formatting:**
- Selection popup with strike / underline / bold. The 2 default styles + assignment.

**Phase 3 — Concealment & config:**
- Edge-reveal / shortcut system for ruling, mode, settings. Hidden styles configuration (N styles).

**Phase 4 — Desktop:**
- Tauri wrap, files on disk, native window feel, export.

**Later / maybe:**
- Paper texture, multiple "notebooks," focus/typewriter scrolling, optional spellcheck.

---

## 11. Open questions to resolve

1. **Editor engine:** custom contenteditable vs CodeMirror/ProseMirror — which makes the strict baseline grid easiest? (Decide in Phase 0 spike.)
2. **Font:** serif vs calm mono for the default writing face.
3. **Concealed-control gesture:** edge-reveal, shortcut, or command surface — which feels least intrusive?
4. **Style fill %:** 80% / 95% are the starting values — confirm by eye once text is on the page; both glyph sets sit on the same baseline within their shared one-line box.
5. **Page proportion:** A-series ratio vs something more screen-native.

---

*Status: draft v0.1 — concept locked, ready to spike Phase 0 when you are.*
