# Campus Placement Management System — UI/UX Redesign Blueprint

> **Product**: CampusHire (Campus Placement Management System)
> **Source of truth**: `ui_ux_redesign_specification.md` (dated October 31, 2026). I have not inspected the code or the live site; everything below is derived from that document.
> **Scope**: Visual and UX redesign only. No change to roles, permissions, business rules, API contracts, or workflow meaning.
> **Labeling**: Items marked **[Assumption]** or **[Beyond source]** are design recommendations not stated in the analysis. Gaps are listed in "Open Questions / Assumptions" at the end.

---

## 1. Recommended design direction

### 1.1 Concept: "Quiet Ledger"

The product is a record-keeping system first (students, applications, interviews, offers), and an emotional one second (a student waiting to hear whether they got selected). "Quiet Ledger" treats the interface like a well-set institutional ledger: calm surfaces, precise alignment, strong typographic hierarchy, and color reserved strictly for meaning.

### 1.2 Visual personality

- **Trustworthy and unhurried.** Neutral slate surfaces carry 90% of the screen. Indigo is the only brand color and is used for primary actions, active navigation, and focus.
- **Numerically precise.** IDs, CGPA, CTC (LPA), and dates are set in tabular figures so columns line up and records feel verified.
- **Status-driven color.** Green, amber, red, blue, and grey appear only on status badges, deadlines, and outcome callouts. Decorative color is avoided.
- **Flat with light elevation.** Hierarchy comes from borders, spacing, and type weight. Shadows appear only on overlays and on hover for interactive cards.
- **Two registers on one system.** Officer/admin pages are dense, scannable, and keyboard-friendly. Student pages are the same components at looser density, with plainer language and one clear "what's next" per page.

### 1.3 Why it fits

| Need | How Quiet Ledger answers it |
| :--- | :--- |
| Officers handle 10-column tables, status progressions, and CSV exports | Compact density, sticky headers, sticky first column, consistent toolbar, predictable action placement |
| Students are anxious about status | Status always has a text label plus an icon or dot (never color alone). The "next step" is surfaced first on each student page |
| Three roles share many pages (`/companies`, `/jobs`, `/statistics`) | One component system. Role differences are expressed by which actions appear, not by different styling |
| Institutional credibility | Restrained palette, no decorative gradients, consistent chrome |
| Existing stack is vanilla CSS tokens | Everything below maps to CSS custom properties and plain classes. No new framework needed |

### 1.4 Main experience improvements over the current design

1. **One token set, no inline styles.** Eliminates the undefined-token defects (`--color-bg`, `--color-primary-dark`, `--color-bg-secondary`) and the 12+ pages of ad-hoc inline styling.
2. **Dense tables become manageable.** Priority-based columns, a row-actions menu, and a card-list alternative below 768px replace the 8-10 column horizontal-scroll matrices.
3. **Status vs category is no longer ambiguous.** Outcome badges (filled pill with dot) are visually distinct from category tags (outlined, no dot) such as round type, job type, and CTC.
4. **Consistent toolbars.** One `FilterBar` pattern replaces five search/filter variants. `SearchInput`, `ConfirmDialog`, and tab strips are used everywhere.
5. **Linear workflows look linear.** The application funnel (APPLIED → SHORTLISTED → SELECTED/REJECTED) is shown as a stepper in the status modal and as a segmented summary on student pages.
6. **Shorter, clearer pages.** Eligibility reasons move out of table cells into a popover or detail panel. Jobs page is restructured into smaller sub-components.
7. **Feedback states are complete.** Every data page has defined loading, empty, filtered-empty, error, and success states, including a slow-backend state **[Beyond source]**.
8. **Accessibility baseline.** Contrast-corrected text tokens, 44px touch targets on mobile, visible focus rings, and semantic table/dialog markup.

---

## 2. Design system

### 2.1 Color

The analysis already proposes an Indigo/Slate palette. I keep it as the base and make these corrections for contrast: muted and placeholder text are darkened in light mode, and dark-mode secondary text is lightened.

#### Brand (Indigo)

| Token | Light | Dark | Use |
| :--- | :--- | :--- | :--- |
| `--color-primary-50` | `#EEF2FF` | `#1A2035` | Selected row tint, subtle hover |
| `--color-primary-100` | `#E0E7FF` | `#222D4A` | Chip/tab-count background |
| `--color-primary-200` | `#C7D2FE` | `#2D3B62` | Subtle brand border |
| `--color-primary-300` | `#A5B4FC` | `#435587` | Outline-button border |
| `--color-primary-500` | `#6366F1` | `#818CF8` | Focus accent, chart series 1 (dark) |
| `--color-primary-600` | `#4F46E5` | `#6366F1` | Primary buttons, links, active tab underline |
| `--color-primary-700` | `#4338CA` | `#4F46E5` | Primary hover |
| `--color-primary-800` | `#3730A3` | `#4338CA` | Primary pressed |
| `--color-primary-900` | `#312E81` | `#3730A3` | Hero banner base (solid, no gradient) |

Link and text-on-surface brand color: light `#4338CA` (7.5:1 on white), dark `#A5B4FC`.

#### Neutrals

| Token | Light | Dark | Use |
| :--- | :--- | :--- | :--- |
| `--color-page-bg` | `#F8FAFC` | `#0B1120` | App canvas |
| `--color-surface` | `#FFFFFF` | `#131C2E` | Cards, tables, inputs |
| `--color-surface-elevated` | `#FFFFFF` | `#1A253B` | Modals, popovers, menus |
| `--color-surface-hover` | `#F1F5F9` | `#1A253B` | Row hover, ghost hover |
| `--color-surface-active` | `#E2E8F0` | `#22304C` | Pressed |
| `--color-border-subtle` | `#F1F5F9` | `#162033` | Row dividers |
| `--color-border` | `#E2E8F0` | `#1E293B` | Card/input borders |
| `--color-border-strong` | `#CBD5E1` | `#334155` | Hovered/focused-adjacent borders |
| `--color-text-primary` | `#0F172A` | `#F8FAFC` | Headings, table body |
| `--color-text-secondary` | `#475569` | `#CBD5E1` | Labels, body copy (**dark changed from `#94A3B8`**) |
| `--color-text-muted` | `#64748B` | `#94A3B8` | Placeholders, helper text, timestamps (**light changed from `#94A3B8`**) |
| `--color-text-disabled` | `#94A3B8` | `#64748B` | Disabled only (exempt from contrast) |
| `--color-text-inverse` | `#FFFFFF` | `#0B1120` | On solid fills |

Rationale: `#94A3B8` on white is about 2.6:1 and fails WCAG AA for text. `#64748B` on white is about 4.8:1 and passes.

#### Semantic status

| Role | Solid | Bg (light / dark) | Border (light / dark) | Text (light / dark) |
| :--- | :--- | :--- | :--- | :--- |
| Success | `#10B981` / `#34D399` | `#ECFDF5` / `rgba(16,185,129,.14)` | `#A7F3D0` / `rgba(52,211,153,.30)` | `#065F46` / `#6EE7B7` |
| Warning | `#F59E0B` / `#FBBF24` | `#FFFBEB` / `rgba(245,158,11,.14)` | `#FDE68A` / `rgba(251,191,36,.30)` | `#92400E` / `#FCD34D` |
| Danger | `#EF4444` / `#F87171` | `#FEF2F2` / `rgba(239,68,68,.14)` | `#FECACA` / `rgba(248,113,113,.30)` | `#991B1B` / `#FCA5A5` |
| Info | `#3B82F6` / `#60A5FA` | `#EFF6FF` / `rgba(59,130,246,.14)` | `#BFDBFE` / `rgba(96,165,250,.30)` | `#1E40AF` / `#93C5FD` |
| Neutral | `#64748B` / `#94A3B8` | `#F1F5F9` / `rgba(148,163,184,.14)` | `#CBD5E1` / `rgba(148,163,184,.25)` | `#334155` / `#CBD5E1` |

Danger button fill (white text): use `#DC2626` light, `#EF4444` dark. `#EF4444` with white text is about 3.8:1, which fails for 14px text.

#### Sidebar (dark navy in both modes — decision on Open Question 1: Option A)

| Token | Value |
| :--- | :--- |
| `--color-sidebar-bg` | `#0F172A` (light) / `#0B1120` (dark) |
| `--color-sidebar-border` | `#1E293B` |
| `--color-sidebar-text` | `#F8FAFC` |
| `--color-sidebar-text-muted` | `#94A3B8` (6.9:1 on `#0F172A`, passes) |
| `--color-sidebar-hover` | `rgba(255,255,255,.06)` |
| `--color-sidebar-active-bg` | `rgba(99,102,241,.16)` (dark mode: `rgba(129,140,248,.16)`) |
| `--color-sidebar-active-accent` | `#818CF8` (3px left bar and icon color) |

#### Chart palette (replaces hardcoded hex in Recharts)

Expose as tokens and read via `getComputedStyle` so charts respond to theme.

| Token | Light | Dark | Use |
| :--- | :--- | :--- | :--- |
| `--chart-1` | `#4F46E5` | `#818CF8` | Primary series, bars |
| `--chart-success` | `#10B981` | `#34D399` | Placed, selected |
| `--chart-warning` | `#F59E0B` | `#FBBF24` | Shortlisted, pending |
| `--chart-danger` | `#EF4444` | `#F87171` | Rejected, failed |
| `--chart-info` | `#3B82F6` | `#60A5FA` | Applied |
| `--chart-neutral` | `#94A3B8` | `#64748B` | Unplaced, other |
| `--chart-grid` | `#E2E8F0` | `#1E293B` | Gridlines (1px, dashed `3 3`) |

Chart rule: every segment is also identified by a legend label with its count, so color is never the only carrier.

### 2.2 Typography

| Role | Family |
| :--- | :--- |
| UI | `Inter`, system fallbacks. Enable `font-feature-settings: "cv11", "ss01"` optional; **always** `font-variant-numeric: tabular-nums` on tables, metrics, and dates |
| Mono | `JetBrains Mono` (add the Google Fonts link in `index.html`; weights 400, 500). **Limited use**: record IDs (`Student ID`, `Placement ID`, `Application #`) and the CSV/ID chips. Do **not** set CTC, CGPA, or dates in mono; use Inter tabular-nums so they harmonize with surrounding text **[Beyond source: modifies source Open Question 4 proposal]** |

| Token | Size / line height | Weight | Use |
| :--- | :--- | :--- | :--- |
| `--text-xs` | 12px / 16px | 500-600 | Badges, helper text, table header |
| `--text-sm` | 14px / 20px | 400-500 | Table body, inputs, labels, buttons (md) |
| `--text-base` | 16px / 24px | 400 | Paragraphs, modal body, student-facing copy |
| `--text-md` | 18px / 28px | 600 | Card title, modal title |
| `--text-lg` | 20px / 28px | 600 | Section heading (H2) |
| `--text-xl` | 24px / 32px | 700 | Page title (H1), 28px/36px at ≥1024px |
| `--text-2xl` | 30px / 36px | 700 | KPI values, hero heading |
| `--text-3xl` | 36px / 40px | 700 | Offer package (state A), clamp to 28px on mobile |

Rules:
- One H1 per page, rendered in the page header (not duplicated by the top bar).
- Table header: 12px, uppercase, 600, letter-spacing `0.04em`, `--color-text-secondary`.
- Minimum text size anywhere: 12px. Badge text is 12px/600 (the source's 0.725rem is raised).
- Letter-spacing only on uppercase micro-labels.
- Fluid headings: `--text-3xl: clamp(1.75rem, 1.4rem + 1.5vw, 2.25rem)`.

### 2.3 Spacing (4px grid)

`--space-1` 4 · `-2` 8 · `-3` 12 · `-4` 16 · `-5` 20 · `-6` 24 · `-8` 32 · `-10` 40 · `-12` 48 · `-16` 64.

Usage rules:
- Inside compact controls: 8/12. Inside cards: 20 (24 on ≥1024px).
- Between cards in a grid: 16 (mobile) / 20 (desktop).
- Between page sections: 24 (mobile) / 32 (desktop).
- Page gutter: 16px (<640), 24px (640-1023), 32px (≥1024).
- Toolbar gap: 12px. Button group gap: 8px.

### 2.4 Layout, containers, breakpoints

| Breakpoint | Min width | Behavior |
| :--- | :--- | :--- |
| `xs` | 0 | Single column. Off-canvas nav. Card-list tables |
| `sm` | 640px | 2-col metric grid. Filter bar wraps to two rows |
| `md` | 768px | Table view replaces card-list. Modals become centered dialogs (below: bottom sheet) |
| `lg` | 1024px | Sidebar becomes persistent. 3-4 col grids |
| `xl` | 1280px | Full density. Side-by-side chart rows |
| `2xl` | 1536px | Content capped, centered |

- Max content width: `1480px`, centered, within `.main-content`.
- Sidebar: 260px expanded, 72px collapsed. Header: 64px. Mobile header: 56px.
- Page header block: H1 + optional subtitle on the left, primary action on the right. Bottom margin 24px.
- Standard grids: metric strip = `repeat(auto-fit, minmax(200px, 1fr))`; two-up chart row = `1fr 1fr` ≥1024px, stacked below. Dashboard 7-card KPI uses a 4+3 arrangement at `xl` (see §8).

### 2.5 Radius, borders, shadows, separators

| Token | Value | Use |
| :--- | :--- | :--- |
| `--radius-xs` | 4px | Tag chips, table checkboxes |
| `--radius-sm` | 6px | Small buttons, kbd hints |
| `--radius-md` | 8px | Inputs, buttons, menus |
| `--radius-lg` | 12px | Cards, table containers |
| `--radius-xl` | 16px | Modals, hero banner |
| `--radius-full` | 9999px | Badges, avatars, theme toggle |

Borders: 1px `--color-border` on every card and input. Thick (2px) only for focus (via ring) and the active-tab underline.

Elevation:

| Level | Light | Use |
| :--- | :--- | :--- |
| 0 | none | Page, tables |
| 1 | `0 1px 2px rgba(15,23,42,.05)` | Cards at rest |
| 2 | `0 4px 6px -1px rgba(15,23,42,.07), 0 2px 4px -2px rgba(15,23,42,.04)` | Card hover, dropdowns, popovers |
| 3 | `0 10px 15px -3px rgba(15,23,42,.08), 0 4px 6px -4px rgba(15,23,42,.04)` | Toasts, sticky bulk bars |
| 4 | `0 20px 25px -5px rgba(15,23,42,.10), 0 8px 10px -6px rgba(15,23,42,.04)` | Modals, drawers |

Dark-mode shadows use the source values; in dark mode elevation is communicated primarily by lighter surfaces (`--color-surface-elevated`) plus border, not shadow.

Separators: 1px `--color-border-subtle` inside tables and lists; `--color-border` between page header and content only when a sticky header is active.

### 2.6 Iconography

- Library: Lucide React (already installed). One stroke weight: `1.75` (set `strokeWidth={1.75}`).
- Sizes: 14px (small button, badge), 16px (default inline, table row actions, inputs), 18px (nav, card headers), 20px (empty-state header, toast), 40-48px in empty states inside a 80px tinted circle.
- Icons never carry meaning alone. Icon-only buttons need `aria-label` and a tooltip.
- Fixed icon assignments (consistency): Students `Users`, Departments `Building2`, Companies `Briefcase`, Jobs `ClipboardList`, Applications `FileText`, Interviews `CalendarClock`, Placements `Award`, Statistics `BarChart3`, Reports `FileBarChart`, Officers `ShieldCheck`, Profile `UserCircle`. Use the same icon wherever the entity appears (metric cards, nav, empty states, modal titles). **[Assumption]** The source lists some icons by name only (`GraduationCap`, `Hash`, `Mail`, `Lock`, `Pencil`, `Archive`, `Trash2`, `Eye`, `UserX`, `UserCheck`, `KeyRound`, `ShieldCheck`, `Sparkles`, `CheckCircle`); keep those. The rest are recommendations.
- Row actions: `Eye` view, `Pencil` edit, `Archive`/`ArchiveRestore` archive/restore, `Trash2` delete (danger on hover only).

### 2.7 Motion

| Token | Value | Use |
| :--- | :--- | :--- |
| `--duration-fast` | 120ms | Hover, focus, checkbox |
| `--duration-base` | 200ms | Dropdowns, tab underline, toast in |
| `--duration-slow` | 280ms | Modal/drawer in, sidebar collapse |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Enter |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exit (shorter, 70% of enter duration) |

Rules:
- Animate only `opacity`, `transform`, `background-color`, `border-color`, `box-shadow`.
- Drop the bounce easing (`--transition-bounce`) and card lift of `-2px`. Use a `-1px` lift only on clickable cards.
- Skeleton shimmer: 1.4s linear loop. Spinner: 700ms linear.
- `@media (prefers-reduced-motion: reduce)`: remove transforms and shimmer; keep opacity fades at 1ms.
- No page-transition animations, no count-up numbers, no decorative motion.

### 2.8 Interaction states (all interactive elements)

| State | Rule |
| :--- | :--- |
| Hover | Background steps one level (`surface` → `surface-hover`); text steps to primary; cursor pointer |
| Focus-visible | `outline: 2px solid transparent; box-shadow: 0 0 0 2px var(--color-page-bg), 0 0 0 4px var(--color-primary-500)` (double ring, works on any background). Never remove without replacement |
| Active/pressed | `surface-active` or primary-800; no transform |
| Selected | `--color-primary-50` background + `--color-primary-600` 2px left bar (rows/nav) or underline (tabs); `aria-selected` / `aria-current` set |
| Disabled | 50% opacity, `cursor: not-allowed`, `aria-disabled="true"`; explain *why* via tooltip when the reason is not obvious (e.g. "Student has active applications") |
| Loading | Preserve button width, swap label for spinner + label ("Saving…") |
| Error | 1px `--color-danger` border, ring `0 0 0 3px rgba(239,68,68,.20)`, message with `AlertCircle` below the field, `aria-invalid` + `aria-describedby` |
| Read-only | Surface-hover background, normal-contrast text, no focus ring change; shown with `Lock` icon where it's a policy lock (student profile) |

### 2.9 Light/dark mode rules

- Keep both modes (already implemented via `data-theme`). Default to the OS preference on first visit, then persist the user's choice **[Beyond source; confirm current default]**.
- Every color goes through a token. No raw hex in components or inline styles.
- Dark mode uses `#0B1120` canvas and `#131C2E` surfaces. Never pure black.
- Borders are always present in dark mode (shadows are weak against dark).
- Images/illustrations are not used, so no inversion rules are needed.
- Status backgrounds use the translucent dark variants above so they sit on any dark surface.
- Test every page in both modes before sign-off.

---

## 3. Application shell and navigation

### 3.1 Structure

```
┌──────────┬──────────────────────────────────────────────┐
│          │ TopHeader (64px, sticky)                      │
│ Sidebar  ├──────────────────────────────────────────────┤
│ 260/72px │ .main-content (padding per gutter rules)     │
│ fixed    │   Page header (H1 + actions)                  │
│          │   Page body (max 1480px, centered)            │
└──────────┴──────────────────────────────────────────────┘
```

### 3.2 Sidebar

- **Dimensions**: 260px expanded, 72px collapsed, full height, fixed. Background `--color-sidebar-bg`, 1px right border `--color-sidebar-border`.
- **Top (64px)**: logo mark (`GraduationCap` in a 32px indigo rounded square) + "CampusHire" wordmark (16px/700, hidden when collapsed). Aligns with the header height.
- **Nav groups** with 12px uppercase muted section labels (hidden when collapsed; a 1px divider replaces them).
- **Item**: 40px height, 12px horizontal padding, 10px icon-label gap, 14px/500 label, radius 8px. Collapsed: 40x40 centered icon with a tooltip on hover/focus (label) and `aria-label`.
- **Active item**: `--color-sidebar-active-bg`, text `#F8FAFC`, icon `#818CF8`, 3px left accent bar, `aria-current="page"`.
- **Hover**: `--color-sidebar-hover`.
- **Bottom**: user card (initials avatar 32px, email truncated, role label) and Sign out button (ghost, full width; icon-only when collapsed). The existing user profile card and logout stay here.
- **Collapse control**: chevron button at the sidebar's right edge on the header line (≥1024px only). Persist the state in `localStorage` **[Beyond source]**.

### 3.3 Role-specific navigation

Routes come from the analysis. Grouping is a recommendation.

**Student (`ROLE_STUDENT`)**
- *Overview*: Dashboard `/`
- *My Placement Journey*: My Profile `/my-profile`, My Applications `/my-applications`, My Interviews `/my-interviews`, My Placement `/my-placement`
- *Explore*: Jobs `/jobs`, Companies `/companies`, Statistics `/statistics`

**Placement Officer (`ROLE_PLACEMENT_OFFICER`)**
- *Overview*: Dashboard `/`
- *Records*: Students `/students`, Departments `/departments`, Companies `/companies`
- *Recruitment*: Jobs `/jobs`, Applications `/applications`, Interviews `/interviews`, Placements `/placements`
- *Insights*: Statistics `/statistics`, Reports `/reports`

**Admin (`ROLE_ADMIN`)**
- Same as officer, plus a fourth group:
- *Administration*: Officer Accounts `/officers`

Rules:
- Items the role cannot access are **not rendered** (no disabled links). Direct URL access to a forbidden route shows the 403 "no access" state (see §4.15).
- Order in each group follows the workflow order (Jobs → Applications → Interviews → Placements).

### 3.4 Top header

- 64px (56px on mobile), sticky, `--color-surface` with 1px bottom border. Content aligned to the same max width as the page body.
- Left: hamburger (<1024px only, 44px target), breadcrumbs.
- Right (in order): "Active Season 2026–27" info chip (≥768px only; hidden on mobile), theme toggle (see below), role badge (neutral outline pill), account menu.
- **Account menu**: avatar button with initials opens a popover containing the user's email, role, and Sign out. This replaces the standalone sign-out button on small screens; the sidebar keeps its own Sign out too.
- **Theme toggle** (decision on Open Question 3): move to the header as a 36px ghost icon button (`Sun`/`Moon`) with `aria-pressed` and tooltip. This removes the floating button overlapping pagination and mobile content. **[Assumption]** The source recommends keeping the floating toggle "to satisfy existing UI requirements." If that requirement is firm, keep the floating toggle and apply the fallback: on `<768px` raise it to `bottom: 80px` and hide it while a modal is open. Login and Register pages keep a toggle in their top-right corner either way.
- **Notifications**: the analysis describes no notification feature, so **none is designed**. The header reserves no slot for it.

### 3.5 Page title and breadcrumb pattern

- Breadcrumb in the top header: `Section › Page` using the group name from the nav (e.g. `Recruitment › Interviews`). The Dashboard shows just `Dashboard`. The source mentions breadcrumbs and `PAGE_METADATA`; keep that data source.
- The page H1 sits in the content area (page header block), not in the top bar. The top bar carries navigation context, the page header carries the title. This prevents duplicate titles.
- Page header block: H1 (24-28px/700), one-line subtitle in `--color-text-secondary` (14px, optional), primary action as a right-aligned `primary` button; secondary actions (Refresh, Export CSV) to its left as `secondary`/`ghost`. On mobile the primary action goes full-width beneath the title.
- Modal and drawer titles use sentence case, e.g. "Record interview outcome".

### 3.6 Content area

- `.main-content`: page-bg canvas, padding per gutter rules, top padding 24px.
- Vertical order for data pages: Page header → (Metric strip, if any) → Toolbar → Data → Pagination.
- Sticky pieces: top header only. Table headers stick within their scroll container.
- Bottom padding 48px so the last element never touches the viewport edge.

### 3.7 Mobile navigation behavior

- `<1024px`: sidebar becomes an off-canvas drawer (width `min(300px, 85vw)`), slides from the left over 280ms, with a `rgba(11,17,32,.65)` backdrop.
- Opens via hamburger. Closes via backdrop tap, Escape, nav-item tap, or swipe left **[Beyond source]**.
- Focus moves into the drawer on open and returns to the hamburger on close. Focus is trapped while open. Body scroll is locked.
- Nav items are 48px tall in the drawer.
- Sidebar collapse control is hidden at this size.
- No bottom tab bar. The destination count is too high and varies by role.

---

## 4. Shared component system

### 4.1 Buttons and icon buttons

| Variant | Default | Hover | Pressed | Use |
| :--- | :--- | :--- | :--- | :--- |
| `primary` | bg `primary-600`, white text | `primary-700` | `primary-800` | One per view region: the main create/submit action |
| `secondary` | surface, 1px border, primary text | `surface-hover`, `border-strong` | `surface-active` | Cancel, Refresh, Export |
| `outline-primary` | transparent, `primary-300` border, `primary-700` text | `primary-50` | `primary-100` | Secondary affirmative (e.g. "Apply" in table rows) |
| `ghost` | transparent, secondary text | `surface-hover` | `surface-active` | Toolbar and low-emphasis |
| `danger` | `#DC2626`, white | `#B91C1C` | `#991B1B` | Confirm destructive actions only |

Sizes: `sm` 32px / 12-13px text; `md` 40px / 14px; `lg` 48px / 16px (auth submit only). On touch devices (`pointer: coarse`) `sm` and `md` have a minimum 44px hit area (use padding or a pseudo-element, visually unchanged for `sm` in tables).

Rules:
- Max one `primary` per page header and per modal footer. Destructive confirm is `danger`, never `primary`.
- Icon left of label, 16px, 8px gap. Right icon only for navigation (`ArrowRight`).
- Loading: spinner replaces icon, label stays ("Saving…"), width preserved, `aria-busy="true"`.
- Button labels are verb + object ("Register student", "Record outcome"). Avoid "Submit"/"OK".
- Remove the hover lift on buttons. Use color change only.
- `IconButton`: 36px square (44px on touch) with radius 8px, always with `aria-label` and tooltip. Danger icon buttons are neutral at rest and turn danger-tinted on hover/focus.

### 4.2 Inputs, selects, search, textareas, date controls

- **Field anatomy**: label above (13px/600, `--color-text-primary`; sentence case, **not** uppercase, to improve readability of long labels like "Institutional email") → control → help text (12px, muted) or error (12px, danger, `AlertCircle` 14px). Required fields: red asterisk plus `aria-required`. Optional is unmarked.
- **Control**: 40px high (44px on touch), 12px horizontal padding, radius 8px, 1px border, `--color-surface` bg, 14px text. Textarea: min 96px, vertical resize only.
- **Select**: native `<select>` with the custom chevron (inline SVG background image, themed via two CSS variants). Keep native for mobile reliability and accessibility.
- **Search**: shared `SearchInput` everywhere (replacing the bespoke inputs on Departments, Reports, Officer Accounts). `Search` icon at 12px inset, clear button `X` appears when non-empty (`aria-label="Clear search"`), debounce 250ms, `role="search"` on the wrapper. Width: flexible, min 240px, max 360px in toolbars; full width on mobile.
- **Date controls**: use native `<input type="date">` / `datetime-local` styled with the same control chrome, with `color-scheme` set per theme so the picker follows dark mode. Format display of dates in tables as `12 Nov 2026`. **[Assumption]** The source does not specify which date inputs exist beyond interview and job deadline dates.
- **Password**: show/hide toggle button inside the control (right, 36px, vertically centered, `aria-pressed`). Fixes the misalignment noted on Officer Accounts and adds it to Login/Register.
- **Validation**: validate on blur and on submit, not on every keystroke. On submit failure, focus the first invalid field and show a form-level summary at the top of the modal when more than one error. Error text says what to do ("Enter a CGPA between 0 and 10").
- **Form layout**: single column in modals by default; two columns at `md+` for short paired fields (e.g. CGPA + Backlogs). Group related fields under a 12px/600 muted group heading.
- **Auto/manual ID fields** (Departments, Companies, Placements): present as a "ID" field with helper text "Leave blank to auto-assign" **only if** the existing behavior permits; otherwise keep the existing manual-entry rule and clearly label it with a helper text. **[Assumption]** The source notes that manual numeric entry is required on Companies and Placements and a toggle exists on Departments. Preserve the behavior; improve the labeling only.

### 4.3 Cards and summary metrics

- **Card**: surface, 1px border, radius 12px, shadow-1. Optional header (title 16-18px/600 + right-aligned action, 16-20px padding, bottom border `--color-border-subtle`), body (20px padding), footer (tinted bg, top border).
- **Clickable card**: hover shadow-2 and border-strong, whole card is one link/button with a visible focus ring. No lift beyond `translateY(-1px)`.
- **MetricCard**: padding 20px. Row 1: label (12px/600, secondary, sentence case or uppercase with tracking .04em — pick uppercase consistently) and a 36px icon tile (radius 8px, semantic 100-tint bg, 18px icon). Row 2: value (30px/700, tabular-nums, line-height 1.1). Row 3: optional context line (12px muted, e.g. "of 482 students") — never invented trends. **[Assumption]** Show a trend only if the data already exists (the source mentions a `trend` prop).
- **Variants**: `default` (above), `compact` (value 24px, padding 16px, used on student pages and Reports strip), `inline` (label + value on one line for the Reports overview).
- Metric cards are not decorative: each must map to an existing metric in the analysis.
- Loading: `SkeletonMetricsGrid` with the same height as the real card to prevent layout shift.

### 4.4 Tables and mobile data-list alternatives

**Desktop table (≥768px)**
- Container: radius 12px, 1px border, `overflow-x: auto`, horizontal scroll shadow hints (inset gradient on the scrolling edge **[Beyond source]**).
- `thead`: 40px, `--color-surface-hover` bg, uppercase 12px/600 secondary text, sticky top inside the container when the container is height-limited; otherwise `position: sticky; top: 64px` below the app header.
- `tbody td`: 52px row (comfortable), 12px/16px padding, 14px text, bottom border subtle. Offer a **Compact (44px)** density toggle only on Students, Applications, and Reports. **[Beyond source]**
- Row hover: `surface-hover`. Clickable rows (open View modal) show pointer cursor and also contain an explicit View button for keyboard users.
- Numeric columns (CGPA, CTC, counts) right-aligned with tabular-nums. Text left-aligned. Status/badge columns left-aligned. Actions right-aligned.
- Primary column (name/title) is bold-ish (500) with a muted secondary line beneath (e.g. student name + roll no; job title + company), which **replaces two columns with one** and reduces the column count.
- **Sticky first column** on tables with horizontal overflow (Students, Jobs, Applications, Placements, Reports): first column sticks left with a 1px right border when scrolled (decision on Open Question 2: Option A, plus the card-list below).
- **Row actions**: ≤3 actions → inline icon buttons (View, Edit, Delete). More than 3 (Students: View, Edit, Archive/Restore, Delete) → View stays visible, rest move into a `MoreHorizontal` kebab menu with labeled items, destructive item last, separated by a divider. Menu is keyboard operable (arrow keys, Escape).
- Sorting: sortable headers are buttons with `aria-sort` and an up/down chevron; default sort stated in the toolbar caption. Only add sort where the analysis indicates a need (Reports has sort; others keep current order unless noted).
- Column priority: each table defines which columns drop first at narrower widths (see §5 per page). Columns hide at `<1280px` and `<1024px` via CSS classes, and their content moves to the View modal.

**Mobile data-list (<768px) — decision on Open Question 2**
- The five dense operational tables (Students, Jobs, Applications, Interviews, Placements) render as a **stacked list of entity cards**. Simple tables (Departments, Officers, Companies, student pages' tables, Reports) keep horizontal scroll with sticky first column. **[Assumption]** This is a hybrid of both options in the source. If cost must be minimal, use Option A only.
- Card anatomy: line 1: primary name (16px/600) + status badge (right). Line 2: secondary identity (muted, 14px). Lines 3-4: up to 4 key-value pairs in a 2-column grid (label 12px muted above value 14px). Footer: primary action button (View) + kebab menu. Whole card tappable → opens the same View modal/sheet.
- Implementation hint: render both a `<table>` and the card list from the same data, toggling visibility by media query; ensure only one is exposed to assistive tech (`display: none` on the hidden one).

### 4.5 Tabs, filters, badges, status indicators

**Tabs (one component, used by Interviews, Student Interviews, Reports, Statistics mode toggle where it is a view switch, Students roster Active/Archived/All)**
- Underline tabs: 44px high, 14px/500 text, 20px gap, bottom border `--color-border`; active tab has 2px `primary-600` underline and primary text.
- Count pill after the label: 12px/600, `primary-100` bg when active, `surface-hover` otherwise, `aria-label` includes the count ("Upcoming, 4").
- Proper `role="tablist"`, `role="tab"`, `aria-selected`, roving tabindex, arrow-key navigation. On mobile the strip scrolls horizontally with edge fade; it does not shrink labels.
- Statistics "Single Department / All Departments" is a **segmented control** (2 options, pill-in-pill), not tabs, because it switches a view mode of the same data. Segmented control: 36px, `surface-hover` track, selected segment `surface` with shadow-1.

**FilterBar (one pattern for all list pages)**
- A single row (wraps): search (flex 1), then selects (160-200px each), then a "Clear filters" ghost button that appears only if any filter is active.
- Below the bar, a muted result caption: "Showing 8 of 124 students" with active-filter chips (removable) when ≥1 filter is active **[Beyond source; chips only reflect existing filters]**.
- On mobile: search on its own row; filters collapse behind a "Filters (n)" secondary button opening a bottom sheet with the same controls and Apply/Reset. The count n reflects active filters.
- Filter state resets pagination to page 1.

**Badges**
- **Status badge (outcome/state)**: 24px high, filled-tint pill with 6px dot + text, 12px/600, **sentence-case label** ("Shortlisted", not "SHORTLISTED"; the uppercase in the source is a data key, not display text). Mapping per source:
  - Success: Placed, Passed, Selected, Active
  - Warning: Shortlisted, Pending
  - Danger: Rejected, Failed, Expired, Disabled
  - Info: Applied
  - Neutral: Not placed
- **Category tag (not a status)**: 24px, **outlined** (1px `--color-border-strong`, transparent bg, secondary text), radius 6px (not full), no dot. Used for round type (Technical, HR…), job type, role label, industry. This resolves the round-type vs result ambiguity noted on Interviews.
- **Metric/compensation text**: CTC is plain semibold text with tabular-nums (`₹12.5 LPA`), not a badge, so it doesn't compete with status.
- **Eligibility indicator** (Jobs, students): `Eligible` (success), `Ineligible` (danger), `Applied` (info), `Expired` (danger/neutral per existing mapping). The long ineligibility reason moves to a popover (see §4.7) opened from an `Info` icon button next to the badge.
- Relative-time pill (Student Interviews): neutral small pill (`Today`, `Tomorrow`, `In 3 days`, `2 days ago`), 12px.

### 4.6 Modals, drawers, popovers, tooltips

**Modal** (existing `Modal.jsx`)
- Sizes: `sm` 440px (confirmations, outcome recording), `md` 580px (forms), `lg` 780px (view/details with nested tables).
- Shell: radius 16px, surface-elevated, 1px border, shadow-4, `max-height: 88vh`, header/body/footer structure per source. Header: title (18px/600) + close icon button; body scrolls; header and footer are fixed.
- Footer: tinted bg, right-aligned buttons, cancel (secondary) left of confirm. `Enter` submits forms; `Escape` closes unless there are unsaved changes (then confirm discard) **[Beyond source]**.
- Below 768px: becomes a **bottom sheet** (full width, radius 16px top corners, max-height 92vh, drag handle visual only, footer buttons full-width stacked with primary first).
- Accessibility: `role="dialog"`, `aria-modal`, `aria-labelledby` (title), focus trapped, focus returns to the trigger, initial focus on the first field or the title for read-only modals.
- Backdrop `rgba(11,17,32,.65)` + `blur(4px)`.

**View-details modals (Student, Job, Application, Interview, Placement, Company)**
- Layout: header with the entity name + status badge; body as a **definition grid** (2 columns at md+: label 12px muted / value 14px) in titled groups ("Academic", "Contact", "Compensation"). Long text (job description) in a bordered block with `max-width: 65ch`, 14-16px, line-height 1.6, preserving paragraphs. This replaces unformatted text blocks.

**Drawer**: **not introduced.** The source does not require one. Use bottom sheets on mobile only.

**Popover**: surface-elevated, shadow-2, radius 12px, 12-16px padding, max-width 320px, arrow optional, closes on Escape/outside click, focus returns to trigger. Uses: ineligibility reasons, account menu, row kebab menus, mobile filters (sheet).

**Tooltip**: 12px/500, dark chip (`#0F172A` bg, `#F8FAFC` text; inverted in dark mode), radius 6px, 6px/8px padding, 300ms hover delay, appears on keyboard focus too, `role="tooltip"` linked with `aria-describedby`. Used for icon-only buttons, collapsed nav, disabled-button reasons. Never carries essential content on its own.

### 4.7 Alerts, toasts, banners, confirmations

- **Inline alert** (form errors, policy notices): radius 8px, 12-16px padding, semantic bg + border + text color, 16px icon left, optional action link. `role="alert"` for errors, `role="status"` for info.
- **Banner** (page-level: student eligibility banner on Jobs, read-only notice on Profile, seeking-placement banner): same as an alert but full-width at the top of the page body, may contain two or three inline metric chips.
- **Toast** (existing `ToastContext`): top-right desktop, top-center full width minus 16px on mobile; max-width 420px; card with 4px semantic left border, 20px icon, title 14px/600 + message 13-14px, dismiss `X`. Auto-dismiss: success/info 4s, warning 6s, error stays until dismissed or 8s. Pause on hover/focus. Container `aria-live="polite"` (errors `assertive`). Cap at 3 visible; queue the rest.
- **Toast API consistency**: all pages must use `toast.success/error/warning/info`. The audit found Departments and Officer Accounts calling an undefined `showToast`; this must be corrected as part of the visual-consistency pass (a defect fix, not a behavior change).
- **ConfirmDialog** (the only confirmation pattern; Departments and Officer Accounts adopt it instead of bespoke modals): `sm` modal, tinted icon circle (danger for delete, warning for archive/disable, info otherwise), title as a question ("Delete this department?"), body naming the entity and the consequence, footer Cancel + action button labeled with the verb ("Delete department"). Destructive actions need no typing. Safeguard warnings (e.g. department has enrolled students) appear as a warning alert in the dialog **and** the confirm button is disabled with the reason stated, preserving the existing rule.
- **Success feedback**: toast for create/update/delete; for status changes also update the row in place and briefly highlight it (`primary-50` fade over 1.5s, suppressed under reduced motion).

### 4.8 Pagination

- Placement: below the table, inside the table container footer: left caption "Showing 1-8 of 124" (13px muted); right the controls.
- Controls: Previous / page numbers / Next as 36px square buttons (44px touch), active page filled `primary-600`, ellipsis for gaps (show first, last, current ±1), `nav aria-label="Pagination"`, `aria-current="page"`.
- Mobile (<500px): caption on its own line; controls reduce to Previous, "Page 3 of 16", Next.
- Page sizes follow the source (Students 8, Applications 10); do not add a page-size selector. **[Gap]** the source gives no page size for other tables; keep whatever exists.
- Changing filters/search resets to page 1; page changes scroll the table container to the top.

### 4.9 Loading skeletons and progress indicators

- **Page load**: page header renders immediately; skeletons replace metric strip and table body at their final dimensions (no layout shift). Skeleton blocks: `surface-hover` base with 1.4s shimmer.
- **Table skeleton**: header real, 6 rows of shimmer bars with column-appropriate widths.
- **Inline loading** (refresh): header "Refresh" button shows spinner; existing data stays visible at 100% opacity with a thin 2px indeterminate progress line under the toolbar.
- **Button loading**: see 4.1.
- **Slow backend** **[Beyond source]**: if a request exceeds 5s on first load, show an info alert above the skeleton: "Waking up the server — this can take up to a minute on the first load." with a spinner. Do **not** claim a cause the app cannot verify; keep the copy generic enough to be accurate ("This is taking longer than usual…") if the cold-start behavior is not confirmed (see Open Questions).
- **Export CSV** (Reports): button shows spinner for the generation duration and then a success toast "CSV downloaded". Client-side export is near-instant, so the spinner is shown for at least 300ms to give feedback.
- No determinate progress bars are needed; none of the existing workflows have measurable progress.

### 4.10 Empty and error states

**Empty state** (existing `EmptyState`)
- Centered, vertical padding 48px, 48px icon in an 80px `surface-hover` circle, title 16px/600, description 14px secondary, max-width 40ch, optional single CTA.
- Two types: **No data yet** (explains what the page holds and offers the create action for roles allowed to create it; for students, a navigation action such as "Browse open jobs") and **No results** (names the active filters and offers "Clear filters").
- CTAs respect roles: students never see create actions they can't perform.

**Error state** (existing `ErrorState`)
- Card with danger tint icon, title ("Couldn't load students"), a one-line human reason if available, `Try again` primary-outline button (retries the same request), and a muted "If this keeps happening, contact the placement cell" **[Beyond source copy]**. Never expose stack traces. Form-submit errors stay in the modal as an inline alert, preserving user input.

---

## 5. Page-by-page redesign

Common conventions used below (not repeated on every page):
- **Page header** = H1 + subtitle + primary action(s) as in §3.5.
- **States**: *Loading* = skeletons per §4.9. *Error* = `ErrorState` with Try again. *Empty* = §4.10. *Success* = toast + in-place row update.
- **Mobile table** = card list (§4.4) where stated, else horizontal scroll with sticky first column.

### 5.1 `/login` — `LoginPage.jsx`
- **Role / purpose**: Public. JWT sign-in with email and password. Redirects to `/` when already authenticated.
- **Layout**: Full-height page on `--color-page-bg` (fix the undefined `--color-bg`). Centered 440px card. At `≥1024px` use a **split layout**: left 45% brand panel (solid `primary-900` background, logo, product name, one sentence "Campus placement, managed in one place", and no marketing claims), right 55% the form. Below 1024px the brand panel is hidden and the logo sits above the card. **[Beyond source]**; if a minimal approach is preferred, keep the centered card only.
- **Section order**: logo + title → error banner (inline alert, `role="alert"`, animated height fade) → Email → Password (with show/hide toggle) → Sign in (`lg`, full width) → divider → "New student? Create an account" link → policy footer note (12px muted).
- **Hierarchy**: Title "Sign in to CampusHire" (H1 24px) > fields > primary button > secondary link.
- **Actions**: Submit, navigate to `/register`, theme toggle (top-right corner).
- **Search/filter/pagination**: none.
- **Responsive**: Card padding 24px on mobile, inputs 44px, button full width.
- **States**: Submitting → button loading, fields disabled. Error → alert above the form (keeps entered email, clears password, focuses password). No empty state.
- **Improvements**: token fix, visibility toggle, accessible error announcement, proper `autocomplete` (`username`, `current-password`) and `type="email"`, inline styles replaced by classes.

### 5.2 `/register` — `RegisterPage.jsx`
- **Role / purpose**: Public. Student self-registration validated against the pre-loaded roster.
- **Layout**: Same shell as Login (split or centered card, max 460px).
- **Section order**: logo + title "Create your student account" → one-line explanation "Use the Student ID and email held by the placement cell" **[Assumption: copy reflects the roster-validation rule in the source]** → error alert → Student ID (`Hash`) → Institutional email (`Mail`) → Password (with toggle) → Confirm password → Create account → "Already registered? Sign in".
- **Password guidance**: helper text listing the rules the backend enforces. **[Gap]** the source gives no password policy; show a strength meter only if the rules are provided. Do not invent rules.
- **Validation**: on blur; "Passwords don't match" shown under Confirm; submit disabled only while loading (not while invalid, so users can discover errors).
- **Responsive / states**: As Login. Backend rejection (e.g. ID not found on the roster) appears as the form-level alert with the server's message.
- **Improvements**: token fix, toggles, consistent field spacing, shared auth layout component.

### 5.3 `/` — Officer/Admin Dashboard (`DashboardPage.jsx` → `OfficerDashboardContent`)
- **Role / purpose**: Officer and Admin. Operations overview of the recruitment pipeline.
- **Layout (≥1280px)**: Page header (H1 "Dashboard", subtitle "Updated 2 min ago" using the existing refresh indicator, `Refresh` ghost button) → **KPI strip** → **chart row** (two-up) → **recent activity row** (two-up tables).
- **KPI strip** (7 metrics): Row 1: *Placement rate* as a wider lead card (spans 2 of 4 columns: value 30px, label, plus "of N students" context and a thin 6px progress bar in success color). Row 1 continues with Students, Companies; Row 2: Jobs, Applications, Interviews, Placements. At `lg`: 4+3 with the lead card spanning two columns; `md`: 2 columns; `xs`: 1 column with the lead card first. Each KPI card is a link to its module (Students → `/students`, etc.) with a visible focus ring; show `ArrowUpRight` 14px on hover/focus. **[Assumption]** The source mentions "quick-navigation links to modules"; making cards the link target is a recommendation.
- **Charts**: *Application status* donut (Applied/Shortlisted/Selected/Rejected using chart tokens) with a legend table on the right (label, count, %) rather than a wrapped legend below; centered total in the donut hole. *Students by department* bar chart: horizontal bars sorted descending when >6 departments (labels readable), vertical otherwise; bars `--chart-1`, gridlines dashed, tooltips themed. Chart cards have a title and one-line description; 280px chart height.
- **Recent tables**: *Recent applications* (candidate + job/company in one cell, status badge, date) and *Upcoming interviews* (candidate, role, round tag, date with relative label). Each card shows 5 rows with a "View all" link in the card header. Mobile: compact list rows, not tables.
- **Actions**: Refresh, module links, retry on error.
- **Search/filter/sort/pagination**: none.
- **States**: *Loading*: skeleton KPI strip + two chart skeletons + two table skeletons. *Error*: single `ErrorState` replacing the body with Try again. *Empty*: chart cards show an inline "No data yet" message with muted icon; tables show a one-line empty message.
- **Improvements**: token-driven chart colors, lead metric emphasis, legible chart legend, no wrapping at <768px, consistent card heights.

### 5.4 `/` — Student Dashboard (`StudentDashboardPage.jsx`)
- **Role / purpose**: Student. Personal hub: where do I stand, what's next.
- **Layout**: Page header → **hero identity banner** (solid `primary-900`, no gradient; the source's hero watermark is removed or reduced to a 5% opacity `GraduationCap`; text white) containing name (H1 in white), department, CGPA, backlogs, and the placement-status pill → **"What's next" card** (the Next Interview alert, or a prompt such as "Browse open jobs" when none) → **metric strip** (Applications, Interviews, Offers, Backlogs; compact) → **Active applications funnel table** → **quick links** (Jobs, My Profile).
- **Information hierarchy**: Next step > numbers > history. The next interview card shows date/time (large), role and company, round tag, and a relative pill ("In 2 days"); it uses info tint, not warning, unless the date is today (then warning).
- **Actions**: View all applications (link), Browse jobs, Open profile.
- **Applications table**: up to 5 most recent: job + company, stage as a **mini stepper** (4 dots: Applied → Shortlisted → Selected/Rejected) with the badge; on mobile a list.
- **States**: *Loading*: hero skeleton + metrics + table. *Empty (no applications)*: empty state "You haven't applied yet" with "Browse open jobs". *No upcoming interview*: card shows "No interviews scheduled." *Error*: `ErrorState`. *Placed*: hero pill shows Placed (success) and the "What's next" card becomes the offer summary linking to `/my-placement`.
- **Improvements**: undefined-token fix, inline-style removal, clearer "next action", more space between hero and metrics (24px).

### 5.5 `/students` — `StudentsPage.jsx`
- **Role / purpose**: Officer/Admin. Directory, record editing, archive lifecycle, registration.
- **Layout**: Page header ("Students", subtitle with active count; primary "Register student") → **roster tabs** (Active / Archived / All, with counts) → FilterBar (search by name/ID, Department, Placement status) → table → pagination.
- **Table (reduce 10 columns to 6 visible)**:
  1. Student (name + roll/ID in muted mono) — sticky
  2. Department
  3. CGPA (right, tabular)
  4. Backlogs (right; shows danger text when >0)
  5. Placement status (badge)
  6. Actions (View + kebab: Edit, Archive/Restore, Delete)
  - Remaining source fields (email, phone, graduation class, etc.) move to the View modal. **[Assumption]** The source does not list the 10 columns; confirm which fields are essential.
- **Actions placement**: Register (header), View (inline), Edit/Archive/Restore/Delete (kebab). Delete is visually separated and requires `ConfirmDialog`; Archive uses a warning dialog; Restore executes with a toast and an "Undo" no — **no undo is added** since it is not in the source.
- **Modals**: Create / Edit share one `StudentForm` with the same layout (Identity group, Academic group, Contact group). View modal is a read-only definition grid. Archive/Restore and Hard Delete use `ConfirmDialog`; Hard Delete copy states permanence.
- **Search/filter/sort/pagination**: client behavior as existing; page size 8; caption "Showing 1-8 of N".
- **Responsive**: <768px card list (name, ID, department, CGPA, status); filters in a sheet.
- **States**: *Archived tab empty*: "No archived students". *Filtered empty*: names filters + Clear. *Error*: `ErrorState`.
- **Improvements**: 10 → 6 columns, kebab menu, grouped forms, no inline validation popping (validate on blur), shared form component across create/edit.

### 5.6 `/departments` — `DepartmentsPage.jsx`
- **Role / purpose**: Officer/Admin. Department catalog; deletion blocked when students are enrolled.
- **Layout**: Page header ("Departments"; actions: Refresh ghost, "Add department" primary) → **compact metric strip** (Total departments, Enrolled students, Active departments; `compact` variant, reduces the oversized values) → FilterBar (shared `SearchInput`) → table (ID, Name, Students, Actions).
- **Students count**: right-aligned number with a muted "students" label; zero shown as `0` in muted. A department with students shows a small lock icon in the Delete button's tooltip explaining why delete is unavailable. Keep the existing guard: confirmation modal shows a warning alert and the destructive action is blocked per the existing rule.
- **Modals**: Create/Edit modal (`md` → `sm` size, as only a few fields). ID field behavior (auto/manual toggle) preserved; present as a labeled switch "Assign ID automatically". Delete via `ConfirmDialog` (replacing the bespoke modal; yellow box replaced with the warning alert).
- **Toasts**: switch to `toast.success/error` (fixes `showToast`).
- **Responsive**: 4 columns fit; metric strip collapses 3 → 1 column; Students count moves under the name on <640px.
- **States**: standard.
- **Improvements**: shared search, shared dialog, toast fix, calmer metric scale.

### 5.7 `/companies` — `CompaniesPage.jsx`
- **Role / purpose**: All roles. Recruitment partner registry. Students view only.
- **Layout**: Page header ("Companies"; "Add company" primary **visible only to officer/admin**, fixing the student-visibility issue) → FilterBar (search, Industry select) → **table** (Company, Industry tag, Location, Website, Open jobs count, Actions).
- **Pattern**: table on desktop. The Website renders as a muted link with `ExternalLink` 14px (opens in a new tab with `rel="noopener noreferrer"`, `aria-label` states "opens in new tab"). Industry is a category tag. Open-jobs count is a number linking to the View modal.
- **View modal (`lg`)**: company header (name, industry tag, location, website) + "Open job drives" list: each row shows title, CTC, deadline, and a status badge, with a "View jobs" link to `/jobs`. Nested table padding raised to match standard cells.
- **Create modal**: fields per source (manual numeric ID preserved with helper text). **[Gap]** other fields not listed.
- **Actions**: View (all roles), Delete (officer/admin; blocked when drives exist per existing rule; tooltip explains).
- **Responsive**: simple table with sticky first column; metric-free page.
- **States**: standard; *empty for student*: "No companies listed yet" with no CTA.
- **Improvements**: role-correct actions, link styling, nested list formatting.

### 5.8 `/jobs` — `JobsPage.jsx`
- **Role / purpose**: All roles. Drives with eligibility evaluation and apply workflow.
- **Layout**: Page header ("Jobs"; "Post job" primary for officer/admin) → *(student only)* **Eligibility banner** (info tint: "Your profile: CGPA 8.85 · 0 backlogs · [Dept]" as chips and a one-line explanation "Eligibility is checked against each drive's minimum CGPA and backlog limit") → FilterBar (search, Company, Status: Active/Expired) → table → pagination.
- **Table columns (9 → 6 visible)**: Job (title + company muted) — sticky; Type (category tag); CTC (right, "₹ X LPA"); Criteria (min CGPA / max backlogs stacked, e.g. `≥ 7.5 · ≤ 0`); Deadline (date + relative text, danger if within 3 days or passed); Status/Eligibility + Actions. Role column differences: students see an Eligibility badge and "Apply"; officers/admins see Drive status and View/Delete.
- **Ineligibility**: badge "Ineligible" plus an `Info` icon button opening a popover that lists reasons as bullets (CGPA, backlogs, etc. exactly as the existing evaluation returns). No more inline comma-separated text.
- **Apply modal (role-adaptive)**: *Student*: job summary, an eligibility summary panel (success or danger alert), Confirm "Apply" (disabled if ineligible with the reason). *Officer/Admin*: same but with a candidate picker (searchable select) at the top. Preserve the existing validation.
- **View modal**: definition grid + formatted description.
- **Create modal**: grouped fields (Role details, Compensation, Eligibility criteria, Dates). Delete: `ConfirmDialog`.
- **Code-structure note for implementers**: this is the longest page (1237 lines); split by modal/section into components when restyling, without changing behavior.
- **Responsive**: <768px card list; the eligibility banner stacks with chips wrapping; Apply button full width in the card footer.
- **States**: *Applied* rows show "Applied" info badge and disable Apply. *Expired* rows are muted with the "Expired" danger badge. Filtered empty/Empty/Error standard. Apply success toast "Application submitted".
- **Improvements**: lighter rows, popover reasons, consistent LPA display, role-appropriate controls.

### 5.9 `/applications` — `ApplicationsPage.jsx`
- **Role / purpose**: Officer/Admin (students redirected to `/my-applications`). Lifecycle management of applications.
- **Layout**: Page header ("Applications"; "New application" primary) → **status summary strip** (clickable segmented counts: All · Applied · Shortlisted · Selected · Rejected, acting as a quick filter synchronized with the Status select **[Beyond source; only if the counts are derivable from loaded data]**) → FilterBar (search student/job/company, Status) → table → pagination (10/page).
- **Table (8 → 6)**: Candidate (name + roll no) — sticky; Job (title + company); Applied date; Status badge; ID (muted mono, optional at `<1280px` hidden); Actions (View, Update status, kebab: Delete).
- **Status progression modal**: show a horizontal **stepper** (Applied → Shortlisted → Selected | Rejected) with the current step highlighted and the allowed next steps as selectable radio cards; steps not allowed by the existing transition validation are disabled with a tooltip. The placement-integrity guard message shows as a warning alert when relevant. Confirm button text reflects the action ("Move to Shortlisted"). Preserves existing rules; no new transitions.
- **Create application modal**: Candidate picker + Job picker (searchable selects), eligibility as validated today.
- **Responsive**: card list <768px; pagination collapses per §4.8.
- **States**: standard; on success the row updates in place with a highlight.
- **Improvements**: stepper clarity, quick-filter counts, fewer columns.

### 5.10 `/interviews` — `InterviewsPage.jsx`
- **Role / purpose**: Officer/Admin (students → `/my-interviews`). Scheduling and outcomes.
- **Layout**: Page header ("Interviews"; "Schedule interview" primary) → tabs (All / Upcoming / Completed with counts) → FilterBar (search, Round type, Result) → table → pagination.
- **Table**: Candidate (name + roll) — sticky; Role & company; Round (number + **outlined category tag** for type); Date & time (`12 Nov 2026, 10:30` with relative label "Tomorrow" beneath, muted); Result (status badge: Pending warning, Passed success, Failed danger); Actions (View, Record outcome, kebab: Delete).
- **Record outcome modal (`sm`)**: three large radio cards (Pending, Passed, Failed) with icons and colors, plus the interview summary on top; Save. Preserves the existing options.
- **Schedule modal**: Candidate/Application picker, Round number, Round type, Date-time; group "Who" and "When". **[Gap]** the exact fields are not in the source; keep the current set.
- **Date-based cues**: today's interviews get a subtle info left border on the row and a "Today" pill.
- **Responsive**: tab strip scrolls; card list <768px with Result badge top-right.
- **States**: *Upcoming empty*: "No upcoming interviews". Others standard.
- **Improvements**: category vs outcome separation, relative dates, shared tab component.

### 5.11 `/placements` — `PlacementsPage.jsx`
- **Role / purpose**: Officer/Admin (students → `/my-placement`). Official placement record register.
- **Layout**: Page header ("Placements"; "Record placement" primary) → FilterBar (search, Company) → table → pagination.
- **Table (8 → 6)**: Student (name + roll) — sticky; Company & role; Package (right, semibold, `₹ X LPA`, the only accentuated numeric, success-tinted text `--color-success-text` optional **[Assumption]** — use neutral primary text if tinting seems noisy); Offer date; Joining date; Actions (View, Delete). Placement ID moves to the View modal.
- **Create modal**: Student picker + Job/Company, package, offer date, joining date; manual numeric ID preserved with helper text.
- **View modal**: "offer letter"-style summary: large package value (`--text-2xl`), definition grid for dates and IDs.
- **Delete**: `ConfirmDialog` stating the student's status will be affected only if the existing business rule does so **[Gap]**; do not claim side effects not confirmed.
- **Responsive**: card list <768px with package prominent.
- **States**: standard.
- **Improvements**: package emphasis, fewer columns, consistent dialogs.

### 5.12 `/statistics` — `StatisticsPage.jsx`
- **Role / purpose**: All roles. Placement statistics via the `PlacementStatistics` procedure; department drill-down.
- **Layout**: Page header ("Statistics") → **control bar** in a card: segmented control (Single department / All departments) on the left, Department select + "Refresh" on the right (select hidden in the all-departments mode).
- **Single department view**: 4 KPI cards (Enrolled, Placed, Unplaced, Placement rate) then a two-up: donut (Placed vs Unplaced, using `--chart-success` / `--chart-neutral`, center label = rate) and a **summary list** (Placed: n (x%), Unplaced: n (y%)) replacing the wrapping legend.
- **All departments view**: a bar chart of placement % by department (horizontal bars, sorted descending, value labels at bar end, axis 0-100%), plus a compact table below with Department, Enrolled, Placed, Rate, so the numbers are readable without hovering. **[Assumption]** the data for the table exists in the same response; if not, omit the table.
- **Student access**: same page, read-only by nature; no role-specific differences stated in the source.
- **Responsive**: KPI 4 → 2×2 → 1; charts stack; chart height 240px on mobile.
- **States**: *Loading*: skeleton KPI + chart. *Procedure running*: inline progress line + "Calculating statistics…". *Empty department* (0 enrolled): "No students enrolled in this department" instead of a 0% donut. *Error*: `ErrorState`.
- **Improvements**: token colors, numbers visible without hover, consistent segmented control.

### 5.13 `/reports` — `ReportsPage.jsx`
- **Role / purpose**: Officer/Admin (students receive 403). Unapplied students, jobs by popularity, interview pipeline.
- **Layout**: Page header ("Reports"; "Export CSV" secondary with `Download`, exports the **active tab**; tab name appears in the button's tooltip/label: "Export CSV (Unapplied students)") → **overview strip** (inline metric variant: Total unapplied, Top in-demand job, Candidates in pipeline) → tabs (shared Tabs component with counts) → per-tab toolbar → table.
- **Tab A — Unapplied students**: toolbar: search, sort select (ID, CGPA), "Include archived" switch (a real toggle with `role="switch"`). Table: Student (name + ID), Department, CGPA, Backlogs, (Archived tag when included).
- **Tab B — Jobs ranked by applicants**: search, sort (applicants). Table: rank number, Job + company, CTC, Applicants (with an inline proportional bar, 6px, primary color, relative to the max in the list) — visual ranking without extra charts.
- **Tab C — Interview pipeline**: search, round filter. Table: Candidate, Job + company, rounds status as a compact row of round chips (R1 ✓ passed, R2 pending, etc.; each has text + icon, not color alone). **[Assumption]** The source says "multi-round status"; confirm the data shape.
- **Sorting controls** use the shared select style (resolving divergence).
- **Export feedback**: spinner ≥300ms, toast "CSV downloaded: unapplied-students.csv" (filename pattern follows the existing exporter).
- **Responsive**: tabs scroll; tables use horizontal scroll with sticky first column; overview strip stacks.
- **States**: per-tab empty states ("Every active student has applied to at least one job" is a *success-flavored* empty message for Tab A **[copy assumption]**); error with retry.
- **Improvements**: shared tabs/switch/selects, inline bars, export feedback, explicit export scope.

### 5.14 `/officers` — `OfficerAccountsPage.jsx`
- **Role / purpose**: Admin only. Provision and govern officer accounts.
- **Layout**: Page header ("Officer accounts"; "Provision officer" primary) → **governance strip** (Total, Active, Disabled; compact metrics) → FilterBar (shared `SearchInput`, Status) → table (Officer email + user ID muted, Role tag, Status badge, Created date, Actions).
- **Row actions**: icon buttons with tooltips: `KeyRound` Reset password, `UserX`/`UserCheck` Disable/Enable. Enable/Disable uses `ConfirmDialog` with a warning icon; copy states the existing consequence ("They won't be able to sign in; active sessions are revoked.") as in the source description.
- **Provision modal**: Email, Password (toggle), Confirm password; helper text for any known password rules **[Gap]**. Reset password modal: Password + Confirm with toggles aligned (fix misalignment).
- **Safety**: the current admin's own row has Disable hidden or disabled with tooltip "You can't disable your own account" **[Assumption: only if the existing rule matches; otherwise omit]**.
- **Responsive**: 6 columns fit down to tablet; mobile: horizontal scroll with sticky first column.
- **States**: standard; non-admin access → the 403 state (§7.8).
- **Improvements**: toast fix, shared dialogs and search, consistent toggles.

### 5.15 `/my-applications` — `StudentApplicationsPage.jsx`
- **Role / purpose**: Student. Track own applications.
- **Layout**: Page header ("My applications", subtitle) → **funnel summary strip**: a segmented control row of counts (Total · Under review · Shortlisted · Selected · Rejected), each acting as a filter; uses status tokens rather than ad-hoc opacities. "Under review" = Applied status per source naming **[Assumption: confirm mapping]** → FilterBar (search, Status select) → table (Job + company, Applied date, CTC, Status badge, View).
- **View modal (`lg`)**: top: job title, company, status badge; a **progress stepper** showing the student's current stage; then Compensation, Eligibility criteria (CGPA/backlogs), Company overview, and the formatted description.
- **Responsive**: card list on mobile (job, company, status, date).
- **States**: *Empty*: "You haven't applied to any jobs yet" + "Browse open jobs" (`/jobs`). Filtered-empty standard.
- **Improvements**: consistent funnel chips, readable description block, stepper.

### 5.16 `/my-interviews` — `StudentInterviewsPage.jsx`
- **Role / purpose**: Student. Interview schedule and history.
- **Layout**: Page header → tabs (All / Upcoming / Completed with counts; the same Tabs component as the officer page) → FilterBar (search, Round type, Result) → table.
- **Upcoming first treatment**: in the Upcoming tab, show a **list of schedule cards** ordered by date (date block on the left: day number + month; role/company, round tag, time, relative pill, "Pending" badge) instead of a table; other tabs use the table (Job + company, Round & tag, Date, Result, View). **[Beyond source]** The source says "no visual calendar or timeline view"; this card list is a lightweight improvement, not a calendar feature. If it adds scope, use the table everywhere.
- **View modal**: schedule details, round description if available **[Gap]**, company details.
- **States**: *Upcoming empty*: "No interviews scheduled. We'll show them here as soon as the placement cell schedules one." *Completed empty*: "No completed interviews yet". Standard filtered-empty.
- **Responsive**: cards on mobile in all tabs.
- **Improvements**: shared tabs, date-forward display, clearer outcome vs round type.

### 5.17 `/my-placement` — `StudentPlacementPage.jsx`
- **Role / purpose**: Student. Official placement confirmation (State A) or seeking status (State B).
- **State A — Placed**: Page header ("My placement") → **Offer card** (white surface with 4px success top border; no gradient): `Sparkles`-free "Verified" success badge with `CheckCircle`, company name (H2), position, **package** (`--text-3xl` clamp, tabular-nums, label "Annual package (LPA)"), definition grid (Joining date, Placement ID in muted mono, Offer date if available) → **Next steps** card (checklist-style plain list; **[Gap]** the source says "next steps and onboarding guidelines" exist but gives no content; keep existing content, restyle only).
- **State B — Not placed**: Page header → **Status banner** (neutral/warning tint: "You're currently seeking placement") → **Pipeline summary** (compact metric strip: Applications, Shortlisted, Interviews) → **CTA card** "Browse open jobs" (primary).
- **Consistency fix**: both states use the same page grid and card radius/padding so weight differs by content, not by styling.
- **Responsive**: single column in both states; package scales with clamp.
- **States**: *Loading* skeleton card. *Error*: `ErrorState`.
- **Improvements**: no hard-coded font size, calmer verification styling, parity between states.

### 5.18 `/my-profile` — `StudentProfilePage.jsx`
- **Role / purpose**: Student. Read-only academic credentials and account details.
- **Layout**: Page header → **identity card** (solid `primary-900` header band 96px with white initials avatar 72px on `primary-600`, name H1, roll ID in mono, Department and Graduation class as chips; fix `--color-primary-dark`) → **academic metrics** (CGPA "8.85 / 10.00", Backlogs, Placement status pill; compact cards; backlogs >0 gets a danger tint with text label) → **Contact & account card** (definition list with consistent 1px dividers: Institutional email, Phone, Linked account status) → **read-only notice** (info alert with `ShieldCheck`: "To change these details, contact the placement cell.").
- **Actions**: none (read-only). No edit buttons, no photo upload.
- **Responsive**: identity card stacks (avatar above name, centered text on <640px); metrics 3 → 1.
- **States**: loading skeleton; error `ErrorState`.
- **Improvements**: consistent field rows, token fixes, clear read-only communication with `Lock` icons on fields.

---

## 6. Workflow and interaction design

### 6.1 Authentication and role-based navigation
1. Login success → route to `/`, which renders the officer/admin or student dashboard by role.
2. Navigation shows only permitted routes (§3.3). Student redirects (`/applications` → `/my-applications`, etc.) stay silent redirects; no flash of the wrong page (show the page skeleton until the role is known).
3. Forbidden direct access (Reports for a student, Officers for non-admin) shows the **No access** state: lock icon, "You don't have access to this page", button "Go to dashboard". No redirect loops.
4. Session expiry (JWT invalid) → return to `/login` with an info alert "Your session has ended. Please sign in again." **[Beyond source; use only if the existing app signals expiry]**.
5. Disabled officer accounts are blocked by the backend; Login shows the server's message verbatim in the form alert.

### 6.2 Student application flow
Browse `/jobs` (eligibility banner + badges) → check eligibility (badge + popover reason) → Apply (modal with eligibility summary) → toast "Application submitted" → job row shows "Applied" → track in `/my-applications` (funnel strip, stepper in the view modal) → interviews appear in `/my-interviews` → final outcome on `/my-placement`.
UX rules: never allow Apply when ineligible (disabled with reason); the confirm step restates job and company; double-submit is prevented by the loading state.

### 6.3 Job and student management (officer/admin)
- Student lifecycle: Register → Edit → Archive (warning dialog, moves to Archived tab) → Restore (immediate action + toast) → Delete (danger dialog, permanence stated).
- Job lifecycle: Post → (students apply) → Expire by deadline (badge changes) → Delete (confirm). Dates drive the badge; no manual "expire" action is added.
- Manual application creation (`/applications`) keeps the existing eligibility checks; failures explain which rule blocked it.

### 6.4 Interview scheduling and outcomes
Schedule (modal) → appears in Upcoming → after the date, officer records outcome (Pending/Passed/Failed) → result appears in Completed and in the student's `/my-interviews`. Visual cues: Today/Tomorrow pills; Pending-in-the-past rows get a warning "Needs outcome" hint **[Beyond source; derived only from existing date + result fields]**.

### 6.5 Placement status management
Application status progression to SELECTED is guarded by the existing placement-integrity rule: the stepper disables forbidden transitions and explains why. Recording a placement is a separate action on `/placements`. After a placement is recorded or deleted, the student's status pill and the dashboards reflect the change after refetch; do not promise instant cross-page updates beyond what exists.

### 6.6 Student archive/unarchive
Archive: `ConfirmDialog` (warning) → toast "Student archived" → the row leaves the Active tab. Restore: from the Archived tab via the row kebab → toast → row leaves Archived. Archived students are excluded from Reports Tab A unless the "Include archived" switch is on; archived rows carry an "Archived" neutral tag wherever shown in mixed lists.

### 6.7 Officer and department management
- Departments: delete is guarded by enrolled-student count (dialog with warning alert; confirm blocked).
- Officers (admin): provision, reset password, enable/disable with explicit consequences in dialog copy; password fields share the same toggle component.

### 6.8 Reports and analytics
Statistics run the stored procedure on demand: show the "Calculating" state. Reports exports reflect the current tab and current filters/sort **[Assumption: confirm the exporter uses filtered data]**; the button label states the scope.

### 6.9 Backend cold-start, retry, and error feedback **[Beyond source — the source states no cold-start behavior; confirm before building]**
- Request > 5s on initial load → inline info alert (see §4.9) above the skeleton.
- Request failure → `ErrorState` with Try again (retries the exact request). Network offline → "You appear to be offline" variant of the same state.
- Form submission failure → inline alert in the modal, inputs preserved, button re-enabled.
- Do not auto-retry mutations (create/update/delete) to avoid duplicates; auto-retry is acceptable for GET requests once after 2s **[Assumption]**.

---

## 7. Responsive design and accessibility

### 7.1 Layout by device

| Aspect | Desktop (≥1024) | Tablet (640-1023) | Mobile (<640) |
| :--- | :--- | :--- | :--- |
| Navigation | Persistent sidebar (collapsible) | Off-canvas drawer | Off-canvas drawer |
| Gutters | 32px | 24px | 16px |
| Metric grid | 4 columns (auto-fit 200px) | 2 columns | 1 column (compact variant 2 columns for ≤4 simple counts **[Assumption]**) |
| Charts | Side by side | Stacked | Stacked, 240px height |
| Modals | Centered dialog | Centered dialog (≥768) | Bottom sheet |
| Tables | Full table | Table with fewer columns / sticky first col | Card list (5 pages) or scroll with sticky first col |
| Filters | Inline bar | Wrapped bar | Search + "Filters (n)" sheet |
| Page action | Right of H1 | Right of H1 | Full width beneath H1 |

### 7.2 Tables on narrow screens
- Column hiding by priority at `<1280px` and `<1024px` (secondary columns first); hidden data lives in View modals.
- Sticky first column on every horizontally scrollable table; a fade shadow on the scrolling edge.
- Card list below 768px for Students, Jobs, Applications, Interviews, Placements (§4.4).
- Never shrink font below 14px for data; never truncate status text.

### 7.3 Forms and action layout
- Modal footers: desktop right-aligned inline; mobile stacked full-width with the primary action on top.
- Inputs 44px tall on touch; labels always visible (no placeholder-as-label).
- Numeric fields (CGPA, backlogs, package) use `inputmode="decimal"`/`numeric` for mobile keyboards.
- Keep `autocomplete` attributes for auth fields.

### 7.4 Touch targets
Minimum 44×44px for all tappable elements on `pointer: coarse`; minimum 8px spacing between adjacent targets (the row kebab replaces cramped icon clusters). Desktop minimum 32px.

### 7.5 Keyboard navigation and focus
- Logical tab order following visual order; skip link "Skip to main content" as the first focusable element.
- All interactive elements reachable and operable; menus (kebab, account) follow ARIA menu button patterns; tabs use arrow keys.
- Focus ring per §2.8 on every focusable; never `outline: none` without a replacement.
- Dialogs trap focus and return it on close; the Escape key closes dialogs, menus, popovers, and the mobile nav.
- Pagination, filters, and tab changes do not move focus unexpectedly; after a page change, focus stays on the clicked control, and the result count is announced via a polite live region.

### 7.6 Color contrast and status communication
- Text contrast ≥ 4.5:1 (body, labels, badges); large text and UI boundaries ≥ 3:1. Token values above were chosen to meet this; verify with an automated check in both modes.
- Every status has a **text label** and a **shape cue** (dot or icon). Color is never the sole indicator (also for chart legends and the required/error states).
- Error fields show an icon + text, not only a red border.
- Respect `prefers-reduced-motion` and `prefers-color-scheme` (initial default).
- Focus ring contrast ≥ 3:1 against adjacent colors (double-ring technique).

### 7.7 Semantics and screen readers
- Landmarks: `header`, `nav aria-label="Primary"`, `main id="main"`, one `h1` per page, logical `h2`/`h3` order.
- Tables: real `<table>` with `<caption>` (visually hidden) naming the dataset, `<th scope="col">`, row header for the primary column where useful; `aria-sort` on sorted headers.
- Card-list alternative uses `<ul>`/`<li>` with labeled content; the hidden alternative is `display: none`.
- Charts: provide a text summary (`aria-label` / visually hidden table or list of values) since the Recharts SVG is not self-describing; the summary list/table in §5.12 serves this.
- Dynamic content: toasts in `aria-live`; form error summary `role="alert"`; loading regions `aria-busy="true"`.
- Icon-only buttons have `aria-label`; decorative icons `aria-hidden="true"`.
- Badges announce text only; dots are decorative.

### 7.8 Permission-related states
- **No access page** (forbidden route): lock icon, title, explanation, "Go to dashboard".
- **Hidden-vs-disabled rule**: actions the role can never perform are hidden. Actions that are conditionally unavailable (blocked by data rules) are disabled with an explanatory tooltip/helper text.
- **Read-only**: the student profile uses an info notice and lock affordances.

---

## 8. Representative screen concepts

### 8.1 Officer/Admin dashboard (≥1280px)
- **Top**: header bar (breadcrumb "Dashboard", Active Season chip, theme toggle, role pill, avatar). Below, page header: left "Dashboard" with "Updated 2 min ago" (13px muted); right a ghost "Refresh" button.
- **KPI area (24px below header)**: a 4-column grid. The first card spans two columns: label "Placement rate", value "62%", a 6px progress bar in success green, and context "128 of 206 students placed". Next to it, Students and Companies cards. Second row: Jobs, Applications, Interviews, Placements. All cards are equal height (≈112px), icon tiles at top-right, hover shows an arrow.
- **Chart row (24px below)**: two cards. Left (wider, 5/12): "Application status" with a donut at left and a 4-line legend table at right (dot, label, count, %). Right (7/12): "Students by department" horizontal bars, 6-8 bars, value labels at bar ends.
- **Recent activity row**: two cards of equal width, each with a header ("Recent applications" / "Upcoming interviews") and a "View all →" link; 5 compact rows with name+detail left, status badge or date right.
- **Feel**: white cards on a pale slate canvas, little color except one indigo (bars), green (placed), amber (shortlisted).

### 8.2 Student dashboard (≥1024px)
- **Top**: page header "Dashboard" (greeting line "Hello, Aarav" as subtitle).
- **Hero band**: full-width indigo-900 rounded panel (≈140px): left, name and "Computer Science · CGPA 8.85 · 0 backlogs"; right, a status pill "Not placed" (neutral on dark) or "Placed" (success). No decorative gradient or watermark beyond a faint icon.
- **Next step card** directly beneath: left a date block ("14 Nov"), center "Technical round · Acme Corp · Software Engineer, 10:30 AM", right a "In 2 days" pill and a View button. If none: an outline card "No interviews scheduled · Browse open jobs →".
- **Metrics**: four compact cards in one row (Applications, Interviews, Offers, Backlogs).
- **Applications**: card with a five-row table: job + company, mini stepper, status badge; footer link "View all applications".
- **Quick links**: two clickable cards at the bottom: "Browse jobs" and "View my profile".

### 8.3 Job/application management (Applications, officer view)
- **Header**: "Applications" left; "New application" primary right.
- **Summary strip**: a single bordered bar with five segments: All 214 · Applied 96 · Shortlisted 41 · Selected 38 · Rejected 39; the active segment has an indigo underline and bold count.
- **Toolbar**: search (wide), Status select, "Clear filters" appears when active; caption "Showing 1-10 of 214".
- **Table**: sticky header; first column "Priya Nair / 1UV22CS045"; second "Software Engineer / Acme Corp"; third date; fourth status badge; last column icon buttons View, Update status (arrow-right-circle), kebab. Zebra striping is not used; hover tint only.
- **Footer**: pagination right, caption left.
- **Status modal**: left-to-right stepper across the top; below, two selectable cards for allowed next steps (e.g. "Shortlisted" selected), a warning alert if a guard applies, footer "Move to Shortlisted" primary.

### 8.4 Student application view (modal from My applications)
- **Header**: "Software Engineer" (18px/600), "Acme Corp" muted, status badge right.
- **Stepper**: four-step horizontal progress (Applied ● Shortlisted ● Decision), current step ringed; on mobile it becomes vertical.
- **Body**: left column "Compensation & criteria" (CTC ₹12.5 LPA, Min CGPA 7.5, Max backlogs 0, Deadline); right column "About the company". Below, "Job description" in a bordered block with readable line length.
- **Footer**: Close (secondary). If interview(s) exist for this application **[Assumption]**, show "View interviews" link to `/my-interviews`.

### 8.5 Reports/analytics (Reports, Tab B)
- **Header**: "Reports" with "Export CSV (Jobs by applicants)" at right.
- **Overview strip**: three inline stats in one card separated by dividers: "Unapplied students 24", "Top job: Backend Dev, Acme (41 applicants)", "In pipeline 57".
- **Tabs**: "Unapplied students 24 | Jobs by applicants 18 | Interview pipeline 57" with an indigo underline on the active tab.
- **Toolbar**: search left, sort select right.
- **Table**: rank (#1…), job/company, CTC, applicants count with a proportional inline bar (indigo-500 on `surface-hover`), reading as a leaderboard.
- **Statistics page companion**: segmented control, then KPI cards and donut/bars with visible numbers.

---

## 9. Implementation handoff roadmap

Every phase ends with a review in light and dark mode at 1440, 1024, 768, and 390 px widths. Do not change business logic in any phase. Defect fixes that affect visuals (undefined tokens, `showToast`) are allowed and should be noted in the PR.

### Phase 0 — Audit fixes and tokens
- **Scope**: Replace `variables.css` with the token set in §2; load JetBrains Mono in `index.html`; add `--chart-*` tokens; fix undefined token references (`--color-bg`, `--color-primary-dark`, `--color-bg-secondary`); add `:focus-visible` base styles and reduced-motion rules.
- **Affects**: `styles/variables.css`, `base.css`, `index.html`, `LoginPage`, `RegisterPage`, `StudentDashboardPage`, `StudentProfilePage`, `components.css` line referencing `--color-bg-secondary`.
- **Dependencies**: none.
- **Must remain consistent**: token names; light/dark parity.
- **Acceptance**: no undefined `var()` references; no raw hex in CSS outside `variables.css`; contrast checks pass for text tokens; both themes render without visual regressions on existing pages.
- **Visual review**: login, dashboard, one table page in both modes.

### Phase 1 — Application shell
- **Scope**: Sidebar (groups, collapse, tooltips, active state), TopHeader (breadcrumb, season chip, theme toggle, account menu), mobile drawer, skip link, page header component, content container.
- **Affects**: `AppLayout`, `Sidebar`, `TopHeader`, `FloatingThemeToggle` (moved or adjusted per Open Question 3), `PAGE_METADATA`.
- **Dependencies**: Phase 0.
- **Consistent**: nav groups per role; dimensions 260/72/64.
- **Acceptance**: all three roles show the correct nav items; keyboard operable; drawer traps focus; no horizontal page scroll at 360px.
- **Review**: all three roles at desktop and mobile; collapsed sidebar.

### Phase 2 — Core shared components
- **Scope**: Button/IconButton, Form controls (with password toggle, custom select arrow), SearchInput, Card, MetricCard, StatusBadge (+ category Tag), Modal/bottom sheet, ConfirmDialog, Toast, Tabs and Segmented control, Pagination, Skeletons, EmptyState, ErrorState, Tooltip, Popover, Menu, Alert/Banner. Build a temporary **component gallery route/page for review only** **[Assumption: dev-only, remove after approval]**.
- **Dependencies**: Phase 0-1.
- **Consistent**: variants, sizes, and states from §2.8 and §4.
- **Acceptance**: every component has all states; focus ring consistent; accessibility attributes present; no inline styles in component files.
- **Review**: gallery in both themes and at 390px.

### Phase 3 — Data table system and FilterBar
- **Scope**: Table classes (sticky header/first column, density, row actions kebab, numeric alignment), mobile card-list component, FilterBar (with mobile sheet and chips), caption + pagination integration, scroll shadows.
- **Dependencies**: Phase 2.
- **Consistent**: column priority rules; actions placement.
- **Acceptance**: table and card list render from the same data; only one exposed to assistive tech; keyboard row actions work.
- **Review**: a sample table at 1440/1024/768/390.

### Phase 4 — Auth and student experience
- **Scope**: `/login`, `/register`, Student Dashboard, `/my-profile`, `/my-applications`, `/my-interviews`, `/my-placement`.
- **Dependencies**: Phases 0-3.
- **Consistent**: student density, "next step first" pattern, read-only treatment.
- **Acceptance**: no inline-style clutter; both states of `/my-placement` share structure; all student empty/loading/error states exist.
- **Review**: walk the student journey end-to-end on mobile and desktop.

### Phase 5 — Officer/admin dashboards and lightweight pages
- **Scope**: Officer dashboard (KPI strip, charts with token colors, recent lists), `/departments`, `/officers`, `/statistics`, `/companies`. Fix toast API use on Departments and Officers; adopt `ConfirmDialog` and shared `SearchInput` there; hide "Add company" for students.
- **Dependencies**: Phases 2-3.
- **Consistent**: chart tokens; metric scale; dialog patterns.
- **Acceptance**: toasts fire on Departments and Officers actions; charts follow the theme; role-correct actions on Companies.
- **Review**: dashboard in both themes; statistics both modes.

### Phase 6 — Data-heavy operational pages
- **Scope**: `/students`, `/jobs`, `/applications`, `/interviews`, `/placements`, `/reports`: reduced columns, kebab menus, status stepper, outcome radio cards, eligibility popover, report inline bars, export feedback. Split `JobsPage` into sub-components while preserving behavior.
- **Dependencies**: Phases 2-3 (and the Phase 5 dialog adoption).
- **Consistent**: category tag vs status badge; date formatting; CTC formatting.
- **Acceptance**: each page's workflow works as before (create, edit, archive, progress, record outcome, export); columns hide predictably; pagination resets on filter changes.
- **Review**: each page with data, empty, filtered-empty, error, and loading.

### Phase 7 — Responsive and accessibility pass
- **Scope**: Verify breakpoints, card lists, bottom sheets, touch targets, keyboard paths, screen-reader labels, chart text alternatives, reduced motion.
- **Dependencies**: Phases 4-6.
- **Acceptance**: no horizontal page scroll ≥320px; all interactive targets ≥44px on touch; automated accessibility scan reports no critical issues; tab order verified on every page.
- **Review**: device-width matrix; keyboard-only walkthrough of one flow per role.

### Phase 8 — Final consistency review
- **Scope**: Walk the QA checklist (§10), remove the component gallery, delete unused CSS, confirm no inline styles remain except truly dynamic values.
- **Acceptance**: checklist fully ticked; before/after screenshots of all 18 routes in both themes archived.

---

## 10. Final design QA checklist

**Route coverage**
- [ ] All 18 routes restyled: `/login`, `/register`, `/` (officer/admin), `/` (student), `/students`, `/departments`, `/companies`, `/jobs`, `/applications`, `/interviews`, `/placements`, `/statistics`, `/reports`, `/officers`, `/my-applications`, `/my-interviews`, `/my-placement`, `/my-profile`.
- [ ] Forbidden-route "No access" state exists and is reachable.

**Design-system usage**
- [ ] No raw hex or undefined `var()` in components/pages; no inline `style` except dynamic values.
- [ ] Spacing, radius, shadow, and type use tokens only.
- [ ] JetBrains Mono loaded and used only for IDs.
- [ ] Chart colors come from `--chart-*` tokens.

**Information hierarchy**
- [ ] One H1 per page; page header pattern identical everywhere.
- [ ] One primary button per region; destructive actions use `danger` only in confirmations.
- [ ] Category tags and status badges are visually distinct.
- [ ] Primary column + secondary line pattern used in tables.

**Role navigation and permissions**
- [ ] Student, Officer, Admin sidebars match §3.3.
- [ ] Students see no create/delete actions on Companies and Jobs.
- [ ] Reports denied to students; Officers page admin-only.
- [ ] Student redirects to `/my-*` still work.

**Responsive**
- [ ] Verified at 1536, 1280, 1024, 768, 640, 390, 360 px.
- [ ] Card lists on 5 operational tables; sticky first column on other scrolling tables.
- [ ] Modals become bottom sheets <768px; mobile nav drawer behaves per §3.7.
- [ ] Theme toggle position doesn't overlap pagination or content.

**Accessibility**
- [ ] Contrast ≥ 4.5:1 for text in both modes; focus rings visible everywhere.
- [ ] Keyboard-only completion of login, apply to a job, update an application status, and record an outcome.
- [ ] Dialog focus trap/return; tab and menu arrow-key behavior.
- [ ] Charts have text alternatives; status never color-only.
- [ ] Reduced-motion respected.

**States**
- [ ] Every data page has loading, empty, filtered-empty, error states.
- [ ] Forms show inline errors, loading buttons, and preserve input on failure.
- [ ] Toasts used consistently (`toast.*`); Departments and Officers fixed.
- [ ] Slow-load notice present (if cold-start confirmed).

**Workflows preserved**
- [ ] Eligibility evaluation and apply flow unchanged.
- [ ] Application status transitions and the placement-integrity guard unchanged.
- [ ] Department and company delete guards unchanged.
- [ ] Student archive/restore/delete behavior unchanged.
- [ ] Interview outcome recording, placement recording, CSV export unchanged.
- [ ] Officer provisioning, enable/disable, reset password unchanged.

**Visual restraint**
- [ ] No gradients except none (solid fills only); no decorative animations.
- [ ] Shadows only on overlays and hover of clickable cards.
- [ ] Color used only for brand actions and status meaning.

**Cross-product consistency**
- [ ] Same search, filter bar, tab, dialog, and empty-state patterns on all pages.
- [ ] Same date and LPA formatting everywhere.
- [ ] Same icon for each entity everywhere.

---

## Open Questions / Assumptions

**Gaps in the source analysis (not guessed; confirm before implementation)**
1. **Students table columns**: the 10 columns are not enumerated. Confirm which fields are essential in the list vs the View modal.
2. **Create/edit form fields** for Companies, Jobs, Interviews, Placements, Students beyond those named are not listed.
3. **Password rules** for registration and officer provisioning are not specified, so no strength meter is designed.
4. **Interview Pipeline data shape** (Reports Tab C): "multi-round status" is not described in detail; round chips assume per-round result data is available.
5. **My Placement "Next steps" content** is mentioned but not described.
6. **Funnel mapping**: "Under review" on My Applications is assumed to equal the Applied status.
7. **Page sizes** are known only for Students (8) and Applications (10).
8. **Notifications**: not in the source; no notification UI is designed.
9. **Cold-start behavior**: the requested cold-start/retry feedback is not described in the source; §4.9 and §6.9 are recommendations and should be confirmed with how the backend actually behaves.
10. **Theme toggle**: the source recommends keeping the floating toggle "to satisfy existing UI requirements." This blueprint moves it to the header; revert to the documented fallback if that requirement is firm.

**Design decisions that go beyond the source (labeled in the text)**
- Hybrid mobile table strategy (card lists for five tables; scroll + sticky first column elsewhere).
- Split login/register layout at ≥1024px; solid indigo hero on student pages instead of gradients.
- Removing uppercase from status labels and form labels; sentence-case display text.
- Changed text tokens for contrast (`--color-text-muted`, dark `--color-text-secondary`, danger button fill).
- Inline proportional bars on Reports Tab B; mini-steppers; quick-filter summary strips; filter chips; unsaved-changes confirmation on dialogs; sidebar-collapse persistence.
- Component gallery as a temporary review aid in Phase 2.

**Source statements relied on as given**: roles and route list, permission model, page contents, shared component inventory, and the defect audit (undefined tokens, `showToast` mismatch, inline-style prevalence, search/dialog divergence, missing JetBrains Mono, mobile table overflow). I did not verify these against the code.
