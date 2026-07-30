<p align="center">
  <img src="logo.png" alt="Group G09 presentation logo" width="110">
</p>

<h1 align="center">Weighted Multi-Skill Project Scheduling</h1>

<p align="center">
  An interactive academic presentation of the Greedy and Parallel Scheduling approach
</p>

<p align="center">
  <a href="https://pc.g09.ir/">Open Live Presentation</a>
  ·
  <a href="https://github.com/PC-G09/PC-G09.github.io">Repository</a>
  ·
  <a href="weighted-multi-skill-gps-paper.pdf">Source Paper</a>
</p>

---

## Overview

An interactive academic presentation of the Greedy and Parallel Scheduling approach for weighted multi-skill project scheduling.

This repository contains a responsive, browser-based academic presentation based on the paper **Weighted Multi-Skill Resource Constrained Project Scheduling: A Greedy and Parallel Scheduling Approach**.

The current version contains **30 slides** and is designed to remain usable and visually consistent across desktop, laptop, tablet and mobile displays.

## Features

- Responsive academic presentation designed for desktop, laptop and mobile screens
- A structured presentation of weighted multi-skill resource-constrained project scheduling
- Greedy and Parallel Scheduling algorithm visualisations and experimental evidence
- Dedicated desktop and mobile presentation layouts
- No framework, package manager or build process required
- Locally hosted MathJax for mathematical notation
- Interactive slide overview and direct navigation
- Browser fullscreen presentation mode
- Expandable figures and diagrams
- Keyboard-based slide navigation
- Mouse-wheel navigation on desktop
- Horizontal swipe navigation on mobile
- Direct links to individual slides through URL hashes
- Live slide counter and progress indicators

## Presentation Structure

| Chapter | Slide range | Number of slides |
|:--|:--:|--:|
| Opening | 1–2 | 2 |
| Problem | 3–7 | 5 |
| Model | 8–14 | 7 |
| Method | 15–21 | 7 |
| Evidence | 22–27 | 6 |
| Assessment | 28–29 | 2 |
| Closing | 30 | 1 |

## Running the Presentation

No installation, npm package or build step is required.

### Option 1 — Open directly

Open the file <code>index.html</code> in a modern browser.

### Option 2 — Run through a local server

Running a small local HTTP server is recommended:

<pre><code>python -m http.server 8000</code></pre>

Then open:

<pre><code>http://localhost:8000</code></pre>

The presentation starts from <code>index.html</code>, which loads <code>presentation.html</code> inside the responsive viewer.

## Controls

| Action | Keyboard or gesture |
|:--|:--|
| Next slide | <kbd>Right Arrow</kbd>, <kbd>Down Arrow</kbd>, <kbd>Page Down</kbd>, or <kbd>Space</kbd> |
| Previous slide | <kbd>Left Arrow</kbd>, <kbd>Up Arrow</kbd>, or <kbd>Page Up</kbd> |
| First slide | <kbd>Home</kbd> |
| Last slide | <kbd>End</kbd> |
| Slide overview | <kbd>O</kbd> |
| Fullscreen | <kbd>F</kbd> |
| Close overview, image, or fullscreen | <kbd>Esc</kbd> |
| Desktop navigation | Mouse wheel |
| Mobile navigation | Horizontal swipe |

The Previous, Next and Overview controls are also available directly in the mobile interface.

## Project Structure

<pre><code>.
├── index.html                     # Outer browser viewer and responsive iframe
├── presentation.html              # Presentation content and slide markup
├── styles.css                     # Main desktop and laptop presentation styles
├── mobile-presentation.css        # Mobile presentation redesign and overrides
├── mobile-viewer.css              # Mobile rules for the outer viewer
├── script.js                      # Navigation, overview, fullscreen and gestures
├── mobile-presentation.js         # Mobile navigation controls
├── presentation-cursor.css        # Custom desktop presentation cursor styles
├── presentation-cursor.js         # Custom desktop cursor behaviour
├── assets/                        # Figures, diagrams and experimental results
├── vendor/mathjax/                # Locally hosted MathJax distribution
├── logo.png                       # University or project logo
├── favicon.svg                    # Browser favicon
├── CNAME                          # GitHub Pages custom-domain configuration
└── weighted-multi-skill-gps-paper.pdf # Source research paper</code></pre>

## Technical Stack

- Semantic HTML5
- Responsive CSS
- Vanilla JavaScript
- Local MathJax rendering
- GitHub Pages
- No external JavaScript framework
- No package manager or compilation step

## Source Paper

**Weighted Multi-Skill Resource Constrained Project Scheduling: A Greedy and Parallel Scheduling Approach**

- Publication: IEEE Access
- Year: 2024
- Repository copy: [weighted-multi-skill-gps-paper.pdf](weighted-multi-skill-gps-paper.pdf)

## Academic Context

- **Presented by:** Ghazal Zolfi Moselo and MohammadMahdi Montazeri Hedesh
- **Course instructor:** Prof. Mohsen Varmazyar
- **Group:** G09
- **Course area:** Project Control and Scheduling

## Deployment

The repository is suitable for direct deployment through GitHub Pages.

The production entry point is:

<pre><code>index.html</code></pre>

The outer viewer preserves the presentation scale on larger screens and allows the internal presentation to use the device native viewport on mobile displays.

## Development Notes

- Keep slide content inside presentation.html.
- Keep shared desktop and laptop styling inside styles.css.
- Keep mobile-specific presentation overrides inside mobile-presentation.css.
- Keep outer mobile viewer rules inside mobile-viewer.css.
- Store presentation figures and charts inside assets.
- Preserve sequential slide IDs using the slide-N format.
- When inserting or removing slides, update any slide-number-specific CSS selectors and data-go navigation targets.
- Test all visual changes in both desktop and mobile layouts.

## Repository

[PC-G09/PC-G09.github.io](https://github.com/PC-G09/PC-G09.github.io)
