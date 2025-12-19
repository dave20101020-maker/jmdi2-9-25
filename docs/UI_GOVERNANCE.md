# NorthStar UI Governance (Phase 0)

This document defines non-negotiable UI guardrails for NorthStar.
The goal is a calm, premium, science-backed "Life OS" experience that
prioritizes user outcomes and agency over engagement tricks.

## Principles (Locked)

### 1) Minimal by design

- Mission Control is a decision surface, not a menu.
- One dominant Priority Action at a time.
- One narrative insight max.

### 2) Feature availability ≠ visibility

- Features exist without clutter.
- Features surface only when AI recommends or user pins.

### 3) Agency-first

- Suggestions over commands.
- Users can pin/hide/reorder.
- No punishment mechanics.

### 4) Calm, premium feel

- Navy/gold is the primary hierarchy.
- Pillar colors are secondary signals only (borders, charts, icon strokes).
- Motion is restrained (opacity/transform only) and purposeful.

## Feature flags

- FEATURE_MISSION_CONTROL_V2
- FEATURE_AI_INVOCATION
- FEATURE_PROGRESSIVE_SURFACING
- FEATURE_GAMIFICATION_B2B

## Copy guardrails

- Prefer tentative language ("tends to", "often", "may help").
- Avoid urgency/shame/compulsion framing.
- Avoid absolute claims.

See: `src/config/scienceRules.js`
