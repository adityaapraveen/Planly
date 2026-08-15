# Planly UI Design System

This document is the permanent visual and interaction contract for Planly. Every new screen, feature, and refactor must follow it. The goal is not to imitate another company. The goal is to apply the product craft visible in excellent SaaS products to a distinct architectural-intelligence workspace.

Last reviewed: August 15, 2026.

## Product UI north star

Planly should feel like a calm review room for high-stakes technical work: precise, evidence-led, fast, and trustworthy.

The visual direction is **technical editorial**:

- warm paper-like application backgrounds;
- deep ink text and navigation;
- blueprint blue reserved for primary actions, selection, links, and AI focus;
- green, amber, and red used only for meaningful status;
- subtle drawing-grid and annotation cues, never decorative noise;
- crisp borders and shallow elevation instead of floating glass cards everywhere;
- compact information density with generous separation between major sections.

The product must look professional enough for an architecture practice and remain understandable during a deadline-driven QA review.

## What the reference products teach us

These are principles to reinterpret, not visual assets to copy.

| Reference | Useful principle for Planly | What not to copy |
| --- | --- | --- |
| [Linear](https://linear.app/) | Quiet chrome, compact navigation, strong keyboard-first hierarchy, and product UI shown as the proof | Dark gradients, exact component shapes, or brand language |
| [Vercel](https://vercel.com/) | Neutral surfaces, typography-led hierarchy, and color used sparingly so state changes stand out | Monochrome for its own sake or developer-platform metaphors |
| [Attio](https://attio.com/) | Dense data can still feel approachable when tables, filters, and AI actions share one visual grammar | CRM-specific layouts or decorative brand treatments |
| [PostHog](https://posthog.com/) | Product personality can coexist with unusually clear navigation and transparent system states | Illustration style that would undermine technical-review seriousness |
| [SaaSpo project-management gallery](https://saaspo.com/industry/project-management-saas-websites-inspiration) | Study many current SaaS approaches before choosing a pattern; prioritize a clear promise and real interface evidence | Trend collages or a generic “purple SaaS” aesthetic |
| [SaaSFrame search examples](https://www.saasframe.io/categories/search) | Search should support recent context, grouping, filtering, keyboard access, and useful no-result states | A command palette when ordinary inline search is clearer |
| [21st.dev Dashboard Sidebar](https://21st.dev/@arunjdass/components/dashboard-sidebar) | A restrained charcoal-and-alabaster shell keeps dense workspace navigation calm and makes the selected task obvious | Copying source or adopting a second component system when Planly's existing primitives can express the pattern |
| [21st.dev AI Sources](https://21st.dev/@educalvolpz/components/ai-sources) | Evidence lists should be collapsible, citation-first, readable at narrow widths, and safe for reduced-motion users | Streaming effects that make completed technical evidence harder to scan |
| [Watermelon UI](https://ui.watermelon.sh/) | Compose polished sections from a small set of responsive primitives, with clear typography and deliberate whitespace | Marketing-only flourishes inside the technical review workspace |

### How external component references are used

21st.dev and Watermelon are pattern libraries, not runtime dependencies for Planly. Their strongest ideas are adapted into Planly's existing React and CSS components. We do not copy a whole block blindly, send private project data to a component service, or introduce Tailwind and animation dependencies solely to reproduce a visual effect. This keeps the bundle, maintenance surface, and interaction model coherent.

## Core principles

### 1. Evidence before spectacle

The most prominent elements should be the drawing, finding, citation, check result, or next review action. Decoration must never compete with evidence.

### 2. One clear action per surface

Every page or card gets one visually primary action. Secondary actions remain visible but quiet. Destructive actions never look primary until the user enters a confirmation flow.

### 3. Reveal complexity in layers

Show outcome and status first, evidence second, configuration and metadata third. Use disclosure panels for long check definitions and diagnostic detail, but never hide critical failures or uncertainty.

### 4. AI must look inspectable

Every AI output needs a visible state: working, answered, insufficient evidence, failed, or stale. Supported claims link to sheet/page evidence. Confidence is supporting metadata, not a substitute for a citation. Human decisions and AI suggestions must be visually distinct.

### 5. Density without clutter

Architectural teams review large sets. Prefer compact rows, aligned metadata, stable card heights, and restrained spacing within a unit. Use larger spacing only between page regions.

### 6. Motion communicates state

Motion should explain where something came from or confirm an interaction. Default transitions are 140–220 ms. Avoid continuous animation except a small progress indicator. Respect `prefers-reduced-motion`.

## Foundations

### Color roles

- **Canvas:** warm off-white; never pure gray behind the entire authenticated app.
- **Surface:** white for working panels and raised navigation.
- **Ink:** near-black navy for headings; slate for body and muted metadata.
- **Blueprint:** blue for the primary action, focused control, active navigation, selected evidence, and links.
- **Success:** confirmed, resolved, passing.
- **Warning:** uncertain, needs review, medium severity.
- **Danger:** failed, destructive, high severity, missing required evidence.

Do not assign semantic colors based only on aesthetics. Never rely on color alone; pair it with text, icon, shape, or position.

### Typography

- Use the product system sans stack so the application is fast and consistent without a font download dependency.
- Page titles: 28–32 px, tight tracking, 700 weight.
- Section titles: 16–20 px, 650–700 weight.
- Body: 14 px in the app, 16–18 px for marketing copy.
- Metadata: 11–12 px, never below 10 px.
- Use tabular numbers for scores, counts, versions, and coordinates.
- Limit text line length to roughly 60–75 characters for explanatory copy.

### Spacing and shape

- Base spacing unit: 4 px.
- Main page gap: 24–32 px; card padding: 16–24 px; compact row padding: 10–14 px.
- Controls should be at least 36 px high; primary and touch controls should generally be 40–44 px.
- Default radius: 10 px for controls and 12–14 px for panels. Avoid excessive pill shapes; reserve pills for status and filters.
- Use a one-pixel border for hierarchy. Elevation should be shallow and only increase on overlays or interactive hover.

### Layout

- Authenticated shell: persistent desktop sidebar, compact top bar, responsive overlay navigation below tablet width.
- Normal workspace content has a readable maximum width; the drawing review workspace may use the full available width.
- Page headers contain an eyebrow/context, title, concise explanation, and the primary action.
- Keep filters and status controls adjacent to the content they affect.

## Component contract

### Buttons

- Primary: blueprint fill; one per immediate decision area.
- Secondary: white surface with neutral border.
- Ghost: navigation or low-emphasis utility.
- Danger: destructive confirmation only.
- All buttons require hover, active, focus-visible, disabled, and loading states.
- Icon-only buttons require an accessible label and tooltip where meaning is not universal.

### Cards and rows

- Cards group a complete concept. Do not place every small statistic in a heavily elevated card.
- Hover lift is at most 1–2 px and applies only when the whole surface is clickable.
- Clickable rows need a visible focus state and trailing directional cue when navigation is the result.
- Actions must remain keyboard accessible; do not reveal the only edit/delete affordance on hover.

### Forms

- Labels stay visible; placeholders provide examples, not labels.
- Validation appears beside the failed field and preserves entered data.
- Explain file types, limits, expensive actions, and irreversible consequences before submission.
- Use a clear focus ring and minimum 44 px touch target on mobile.

### Empty, loading, error, and success states

Every data surface must define all four. Empty states explain the value of the next action. Loading states name the work being done. Errors offer a safe retry or recovery path. Success should usually update the relevant content rather than show a blocking modal.

### AI and review surfaces

- Label the scope of the AI operation: current sheet, drawing set, project, or external standard.
- State whether an answer is deterministic, AI-assisted, or human-confirmed.
- Display citations next to the claims they support.
- Keep insufficient-evidence results visible and useful; suggest what source is missing.
- Use progressive feedback for long work: queued, rendering, extracting, evaluating, ready.
- Preserve and label human corrections on rerun.
- Never make an unreviewed AI result visually indistinguishable from an approved decision.

### Tables and technical metadata

- Align comparable values in columns.
- Freeze important headers when long lists require scrolling.
- Put units in labels and normalize date/number formats.
- Truncate only when the full value is available through expansion or an accessible title.

## Motion and smoothness

- Hover/focus: 140–160 ms.
- Panel entrance or disclosure: 180–220 ms.
- Route content: subtle fade/translate no more than 8 px.
- Use transform and opacity where possible to avoid layout jank.
- Do not animate large drawing canvases while the reviewer is navigating evidence.
- Scrolling to a cited region may be smooth unless reduced motion is requested.
- Skeletons should preserve final layout dimensions.

## Responsive and accessible behavior

- Design and test at 360, 768, 1024, and 1440 px widths.
- No horizontal page scroll at 360 px; technical canvases may scroll inside a clearly bounded region.
- Navigation, modals, menus, and disclosures must work with keyboard only.
- Preserve a logical heading order and descriptive accessible names.
- Meet WCAG AA contrast for normal text and interactive states.
- Never encode issue severity or confidence using color alone.
- Respect reduced motion and increased text size.

## Marketing-site rules

- Lead with one audience, one painful job, and one credible outcome.
- Show the actual product workflow early; do not rely on abstract claims.
- Use measured proof only when the source and context are defensible.
- Avoid invented logos, testimonials, customer counts, and “instant” performance claims.
- Keep one primary CTA label consistent across the page.
- Explain why Planly is different: cited drawing-set evidence, deterministic checks, and a human approval trail.

## Definition of done for every UI change

Before merging a feature, verify:

- [ ] The page has a clear primary task and primary action.
- [ ] Loading, empty, error, success, disabled, and long-content states are handled.
- [ ] AI scope, evidence, uncertainty, and human status are explicit where applicable.
- [ ] Controls work using keyboard and have visible focus.
- [ ] Mobile, tablet, and desktop layouts remain usable.
- [ ] Motion is subtle and reduced-motion-safe.
- [ ] Copy is concise, specific, and does not overclaim.
- [ ] Existing design tokens and components are reused before adding new variants.
- [ ] Lint, tests, and production build pass.
- [ ] The changed flow receives a visual check at representative viewport sizes.

## Anti-patterns

- generic gradient blobs, excessive glassmorphism, and glow effects;
- a dashboard made entirely of identical floating cards;
- icon-only navigation without labels or accessible names;
- hidden actions that cannot be discovered without hovering;
- animation that delays input or makes technical content move;
- fake activity, fake customers, fake precision, or unsupported ROI claims;
- “AI magic” copy without scope, evidence, confidence, and failure behavior;
- adding a new visual language for each feature;
- sacrificing information density to make the interface look like a landing page.

## Maintenance rule

When a new feature introduces a reusable visual pattern, update this document in the same pull request. When implementation and this guide differ, treat the difference as a design decision that must be resolved—not as permission for silent drift.
