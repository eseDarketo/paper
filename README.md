# Paper

A minimal text editor that tries to recreate, as faithfully as possible, the experience of writing on a physical notebook.

Conventional editors are dense with toolbars, panels, counts and suggestions — and that density is exactly what kills the calm of writing. Paper treats the *absence* of interface as the core feature. At first glance you see a sheet of paper and nothing else.

## Principles

- **Paper first.** On open, the screen is a sheet — ruled, dotted, or blank — and nothing else. No chrome until you invoke it.
- **Text lives on the lines.** The baseline grid is real; characters sit *on* the rule like ink. Everything derives from a single line-height unit.
- **Formatting is rare and contextual.** No persistent formatting UI — select text and a tiny popup appears.
- **Configuration is concealed.** Controls stay invisible until summoned.

See [`SPEC.md`](./SPEC.md) for the full design rationale.

## Features so far

- Warm paper sheet with switchable ruling: **ruled · dotted · blank**
- Text locked to a baseline grid, with a clean notebook-style top margin
- A metadata header that floats off the grid — **title** (left) and **date** (right)
- Two body text styles, both exactly one line tall — **Normal** and **Bigger**
- A selection popup for **bold · underline · strikethrough** and style assignment
- **Zoom / fit-to-screen**, with the whole sheet scaling proportionally
- Silent autosave to local storage — no save button, ever

## Controls

| Action | How |
|---|---|
| Bold / Underline / Strikethrough | Select text → popup |
| Normal / Bigger style | Select text → popup (A↓ / A↑) |
| Change ruling / zoom | Hover the top edge of the window |
| Zoom in / out | `⌘ =` / `⌘ -`, or `⌘ + scroll` |
| Fit to screen | `⌘ 0` |
| Title / Date | Click the top blank band |

## Running locally

```bash
npm install
npm run dev
```

Then open the printed local URL.

## Tech

Web-first (Vite + React + TypeScript), designed to be wrapped as a desktop app (Tauri) later without a rewrite. No backend — everything is local.

## Status

Early and evolving. The core writing experience works; paper-model (endless roll vs discrete pages), a concealed settings surface, and a desktop build are on the roadmap.
