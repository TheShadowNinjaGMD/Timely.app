# Changelog

All notable changes to the **Timely.app** workspace will be documented in this file.

The format is strictly based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this repository adheres to [Semantic Versioning](https://semver.org).

---

## [Unreleased]

### Added
- *Planned for next patch:* LocalStorage synchronization script to persist light/dark neon theme states across browser reloads.
- *Planned for next patch:* Active document title state updating to reflect current counting minutes directly inside the browser tab title.

---

## [0.0.1-alpha] - 2026-06-16

This is the baseline pre-release build introducing the structural layout, visual canvas engine, and core counting functionalities.

### Added
- **Dual Tracking Modules:** Implemented separate state loops for standard continuous stopwatch counters and dedicated interval countdowns (compatible with Pomodoro techniques).
- **Glow Theme Architecture:** Integrated responsive CSS variables with neon animation styling for high-contrast visibility.
- **Ambient Audio Layer:** Bundled internal logic to layer loops of ambient workspace audio files over current counting sessions.
- **Dynamic File Ingestion:** Enabled drag-and-drop or path selection hooks allowing users to provision local sound files to trigger upon completion events.

### Fixed
- Fixed layout overflowing bugs across smaller responsive dynamic layouts by switching tracking panels to CSS Flexbox layouts.

### Security
- Forced global script protocol alignment to mandate HTTPS execution across static assets hosted on GitHub Pages.

---

<!-- Version Reference Links to GitHub Comparison views -->
[Unreleased]: https://github.com
[0.0.1-alpha]: https://github.com
