# UI / UX Rationale

This MVP intentionally uses **plain HTML + CSS** (no UI library) to keep:
- dependency surface small
- security review simpler
- performance predictable

## Brand direction

- Calm, professional palette (neutral background + deep navy primary)
- Strong typography and generous spacing
- High contrast and focus outlines
- White-label branding via `/public/branding/*` placeholders

## Navigation

- Authenticated pages share a consistent **App Shell**:
  - left sidebar with role-based nav links
  - top user bar (role + logout)

## Accessibility

- Visible focus rings
- Semantic headings
- Simple forms with labels
- No color-only status cues (we use badges + text)
