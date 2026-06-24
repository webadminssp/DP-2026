# Shriram Samruddhi Pujo 2026

Official website for the **Shriram Samruddhi Durga Pujo Association (SSDPA)** — Durga Pujo 2026.

## What this repo will house

The full public-facing website for SSDPA's Durga Pujo 2026 celebrations: event schedule, venue details, cultural programme, sponsor recognition, photo gallery, and any other information the association wants to share with attendees and the wider community.

## Where we're at

Early days. The site currently shows a **"Coming Soon"** landing page — the SSDPA logo, a "COMING SOON" heading, and a decorative kans grass border at the bottom. That's it.

No framework, no build step — just a single `index.html` wired up to Tailwind CSS (via CDN) and the Switzer variable font served locally.

## Project structure

```
index.html          # Coming soon landing page (the whole site, for now)
favicon/            # Favicon assets (ico, png variants, webmanifest)
fonts/              # Switzer variable font (upright + italic)
images/             # SSDPA logo + kans grass SVG tiles
```

## Running locally

No build tooling needed. Open `index.html` directly in a browser, or serve it with anything static:

```bash
python3 -m http.server
```

## Tech stack

* **Current (Coming Soon Phase):**
  - Plain HTML5
  - [Tailwind CSS v4](https://tailwindcss.com/) via browser CDN script
  - [Switzer](https://www.fontshare.com/fonts/switzer) variable font (self-hosted)
* **Future (Production website):**
  - See [TECH_STACK.md](file:///Users/dp2026/Documents/CODE/DP-2026/TECH_STACK.md) for details on the upcoming Astro, native animations, Headless CMS, and payment integration plans.
