# Career Connect — Design System & Visual Specification

This document provides the exact design system tokens, color palettes, typography specifications, component styles, and responsive layout rules implemented across Career Connect.

---

## 1. Color Palette & Semantic Tokens

Career Connect utilizes the modern **OKLCH** color space implemented via `@tailwindcss/vite` in `src/styles.css`, providing perceptually uniform lightness and chroma across themes.

### A. Semantic Theme Tokens (OKLCH & HEX Equivalents)

| Token Name | CSS Custom Property | Light Mode (OKLCH) | Approx HEX (Light) | Dark Mode (OKLCH) | Approx HEX (Dark) | Usage Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Background** | `--background` | `oklch(0.985 0.004 235)` | `#F8FAFC` | `oklch(0.19 0.032 245)` | `#0F172A` | Page canvas background |
| **Foreground** | `--foreground` | `oklch(0.22 0.035 245)` | `#0F172A` | `oklch(0.95 0.008 225)` | `#F1F5F9` | Primary text and headings |
| **Card** | `--card` | `oklch(1 0 0)` | `#FFFFFF` | `oklch(0.24 0.04 244)` | `#1E293B` | Card and modal surface |
| **Card Foreground** | `--card-foreground` | `oklch(0.22 0.035 245)` | `#0F172A` | `oklch(0.95 0.008 225)` | `#F1F5F9` | Text inside cards |
| **Primary** | `--primary` | `oklch(0.46 0.115 216)` | `#1D4ED8` | `oklch(0.72 0.12 195)` | `#38BDF8` | Deep Sapphire Blue / Cyan Accent |
| **Primary Foreground** | `--primary-foreground` | `oklch(0.985 0.005 220)` | `#FFFFFF` | `oklch(0.2 0.04 240)` | `#0F172A` | Text on primary buttons |
| **Secondary** | `--secondary` | `oklch(0.945 0.014 225)` | `#E2E8F0` | `oklch(0.3 0.04 242)` | `#334155` | Secondary buttons & tags |
| **Secondary Foreground** | `--secondary-foreground` | `oklch(0.3 0.045 240)` | `#1E293B` | `oklch(0.95 0.008 225)` | `#F1F5F9` | Text on secondary elements |
| **Muted** | `--muted` | `oklch(0.955 0.008 230)` | `#F1F5F9` | `oklch(0.3 0.04 242)` | `#334155` | Inactive backgrounds & tickers |
| **Muted Foreground** | `--muted-foreground` | `oklch(0.52 0.028 240)` | `#64748B` | `oklch(0.72 0.02 232)` | `#94A3B8` | Subtitles, helper text, timestamps |
| **Accent** | `--accent` | `oklch(0.78 0.135 72)` | `#F59E0B` | `oklch(0.8 0.13 74)` | `#FBBF24` | Warm Amber / Gold highlight |
| **Accent Foreground** | `--accent-foreground` | `oklch(0.24 0.05 60)` | `#451A03` | `oklch(0.22 0.05 60)` | `#451A03` | Text on accent elements |
| **Destructive** | `--destructive` | `oklch(0.55 0.2 25)` | `#DC2626` | `oklch(0.65 0.18 25)` | `#EF4444` | Red error banners & deletions |
| **Success** | `--success` | `oklch(0.58 0.13 158)` | `#16A34A` | `oklch(0.7 0.13 158)` | `#22C55E` | Emerald Green verification |
| **Warning** | `--warning` | `oklch(0.75 0.145 78)` | `#EAB308` | `oklch(0.8 0.14 78)` | `#FACC15` | Amber warnings & alert badges |
| **Info** | `--info` | `oklch(0.6 0.11 235)` | `#2563EB` | `oklch(0.7 0.1 235)` | `#60A5FA` | Azure Blue informational pills |
| **Border** | `--border` | `oklch(0.9 0.012 232)` | `#E2E8F0` | `oklch(1 0 0 / 12%)` | `rgba(255,255,255,0.12)` | Subtle card & input borders |
| **Input** | `--input` | `oklch(0.9 0.012 232)` | `#E2E8F0` | `oklch(1 0 0 / 16%)` | `rgba(255,255,255,0.16)` | Text fields & select borders |
| **Ring** | `--ring` | `oklch(0.46 0.115 216)` | `#1D4ED8` | `oklch(0.72 0.12 195)` | `#38BDF8` | Focus ring glow |

---

### B. Special Gradients & Shadows

```css
/* Hero Gradient: Deep Navy through Sapphire to Ocean Azure */
--gradient-hero: linear-gradient(
  140deg,
  oklch(0.26 0.055 245) 0%,
  oklch(0.36 0.09 216) 55%,
  oklch(0.5 0.11 196) 100%
);

/* Accent Gradient: Radiant Warm Gold to Coral Amber */
--gradient-accent: linear-gradient(
  100deg,
  oklch(0.78 0.135 72) 0%,
  oklch(0.72 0.13 40) 100%
);

/* Card Shadow: Multi-layer soft elevation */
--shadow-card:
  0 1px 2px oklch(0.22 0.035 245 / 0.04),
  0 8px 24px -12px oklch(0.22 0.035 245 / 0.18);

/* Lifted Interactive Hover Shadow */
--shadow-lift:
  0 2px 4px oklch(0.22 0.035 245 / 0.05),
  0 18px 40px -18px oklch(0.22 0.035 245 / 0.32);
```

---

## 2. Typography

The platform pairs an authoritative geometric display font for branding and headings with a clean, high-legibility sans-serif for UI data and long-form prose.

### A. Font Families
- **Display Headings (`--font-display`):** `"Sora", ui-sans-serif, system-ui, sans-serif`
  - Applied to `h1`, `h2`, `h3`, `h4`, `.font-display`.
  - Tight tracking: `letter-spacing: -0.02em`.
- **Body & UI Interface (`--font-sans`):** `"Manrope", ui-sans-serif, system-ui, sans-serif`
  - Applied to `html`, `body`, inputs, buttons, tables, badges.
  - Optimized anti-aliasing: `-webkit-font-smoothing: antialiased`.
- **Code & Monospace:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
  - Used for database IDs, endpoints, JDBC URLs, and XML syntax.

### B. Type Scale & Visual Hierarchy

| Element | Class Names | Font Family | Size | Weight | Line Height |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | `text-4xl sm:text-5xl lg:text-6xl` | `Sora` | 36px / 48px / 60px | Extrabold (800) | 1.1 |
| **Page H1** | `text-3xl sm:text-4xl` | `Sora` | 30px / 36px | Extrabold (800) | 1.2 |
| **Section H2** | `text-2xl sm:text-3xl` | `Sora` | 24px / 30px | Bold (700) | 1.25 |
| **Card H3** | `text-lg sm:text-xl` | `Sora` | 18px / 20px | Bold (700) | 1.3 |
| **Item H4** | `text-base` | `Sora` | 16px | Semibold (600) | 1.4 |
| **Body Large** | `text-base sm:text-lg` | `Manrope` | 16px / 18px | Regular (400) / Medium (500) | 1.6 |
| **Body Default** | `text-sm` | `Manrope` | 14px | Regular (400) | 1.5 |
| **UI Small** | `text-xs` | `Manrope` | 12px | Medium (500) / Semibold (600) | 1.4 |
| **Micro / Tag** | `text-[10px]` or `text-[11px]` | `Manrope` | 10px / 11px | Bold (700) | 1.3 |

---

## 3. Border Radii & Elevation

Base radius is defined as `--radius: 0.75rem` (12px). All other radii scale mathematically:

- `radius-sm`: `calc(12px - 4px) = 8px` (inputs, dropdown menu items)
- `radius-md`: `calc(12px - 2px) = 10px` (buttons, dialog actions)
- `radius-lg`: `12px` (standard card container, modal surfaces)
- `radius-xl`: `calc(12px + 4px) = 16px` (feature blocks, alert containers)
- `radius-2xl`: `calc(12px + 8px) = 20px` (hero cards, dashboard KPI widgets)
- `radius-3xl`: `calc(12px + 12px) = 24px` (large banners, showcase panels)
- `radius-full`: `9999px` (pills, badges, avatars, hero CTA buttons)

---

## 4. UI Components & Interaction Patterns

### A. Buttons (`src/components/ui/button.tsx`)
- **Base Style:** Inline-flex, center items, font-medium, focus-visible ring (2px offset), transition-colors, disabled pointer-events-none opacity-50.
- **Variants:**
  - `default`: Background `bg-primary text-primary-foreground shadow hover:bg-primary/90`.
  - `destructive`: Background `bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90`.
  - `outline`: Border `border border-border bg-background shadow-xs hover:bg-muted hover:text-foreground`.
  - `secondary`: Background `bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80`.
  - `ghost`: Transparent background, `hover:bg-muted hover:text-foreground`.
  - `link`: Text `text-primary underline-offset-4 hover:underline`.
- **Sizes:**
  - `sm`: Height `h-8`, padding `px-3 text-xs`, rounded-md.
  - `default`: Height `h-9`, padding `px-4 py-2 text-sm`, rounded-md.
  - `lg`: Height `h-11` or `h-12`, padding `px-8 text-sm sm:text-base`, rounded-full (used in Hero).
  - `icon`: Square `size-9` or `size-10`.

### B. Form Controls
- **Input (`src/components/ui/input.tsx`):** Height `h-10`, rounded-lg, border `border-input bg-card px-3 py-2 text-sm shadow-xs transition-all`, focus-visible: `ring-2 ring-primary/20 border-primary`.
- **Select:** Custom Radix Select with animated popover, checkmark on active item, scroll buttons.
- **Textarea:** Min-height `min-h-[100px]`, rounded-lg, resize-y, matching input borders.
- **Checkbox:** Square rounded-md, state indicator with check icon, animated checked background.

### C. Cards (`surface-card`)
- Defined via `@utility surface-card`:
  ```css
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  ```
- Hover state: `hover:shadow-md hover:border-primary/30 transition-all duration-200`.

### D. Badges & Status Pills
- **Active / Live:** `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20` with a pulsing dot `size-1.5 rounded-full bg-emerald-500 animate-pulse`.
- **Admin Clearance:** `bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25` with `ShieldCheck` icon.
- **Role Candidate:** `bg-blue-500/10 text-blue-600 dark:text-blue-400`.
- **Role Employer:** `bg-purple-500/10 text-purple-600 dark:text-purple-400`.
- **Suspended:** `bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20`.

---

## 5. Responsive Grid & Breakpoints

Tailwind CSS v4 standard breakpoints are adhered to throughout:

| Breakpoint | Min-Width | Usage in Layouts |
| :--- | :--- | :--- |
| `sm` | $640\text{px}$ | 2-column card grids, horizontal button groups in modals. |
| `md` | $768\text{px}$ | 3-column opportunity cards, horizontal form fields. |
| `lg` | $1024\text{px}$ | 12-column hero grid (7-col text + 5-col card), desktop top navigation visible, sidebar opens in AppShell. |
| `xl` | $1280\text{px}$ | Max layout width (`max-w-7xl` = 80rem / 1280px) with generous horizontal padding (`px-8`). |
| `2xl` | $1536\text{px}$ | High-density multi-pane analytics and data platform monitoring viewports. |
