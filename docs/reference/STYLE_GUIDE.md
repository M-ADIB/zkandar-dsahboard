# 🎨 Zkandar AI Masterclass Hub - Style Guide

**Official Brand Guidelines for Dashboard Implementation**

---

## 🎯 Brand Identity

### Logo Usage
- **Primary Logo:** Gold emblem with "Z" center mark (uploaded image)
- **Placement:** Top-left corner of sidebar/navbar
- **Minimum Size:** 40px height (maintain aspect ratio)
- **Clear Space:** 20px padding around logo
- **Background:** Always on pure black (#000000) or dark surfaces

**Logo Variants:**
- Full logo (with emblem + text): Use in sidebar
- Icon only (emblem): Use in mobile navbar, favicons
- Never distort, rotate, or change colors

---

## 🎨 Color System

### Primary Palette

#### Backgrounds
```css
--bg-primary: #000000;      /* Pure black - main background */
--bg-elevated: #0A0A0A;     /* Slightly lighter - elevated surfaces */
--bg-card: #111111;         /* Cards, modals, panels */
```

**Usage:**
- Page background: `bg-primary`
- Sidebar, navbar: `bg-elevated`
- Cards, modals, dropdowns: `bg-card`

#### Brand Colors (The "Zkandar Lime")
```css
--lime: #D0FF71;            /* Primary accent */
--lime-hsl: 75, 100%, 72%;  /* HSL for opacity variants */
--green: #5A9F2E;           /* Secondary accent */
--green-hsl: 91, 55%, 40%;
```

**Usage Rules:**
- **Lime (#D0FF71):** 
  - Primary CTAs ("Submit Assignment", "Create Cohort")
  - Active states (selected nav item, focused inputs)
  - Badges (completion status, new notifications)
  - Progress bar fills
  - Highlights in text (sparingly)
  
- **Green (#5A9F2E):**
  - Gradient backgrounds (lime to green)
  - Hover states (buttons, cards)
  - Success messages (combined with lime)
  - Secondary buttons

**DO NOT use lime for:**
- Large background areas (overwhelming)
- Body text (readability issue)
- Borders (too harsh)

#### Text Colors
```css
--text-primary: #FFFFFF;    /* Main text */
--text-muted: #666666;      /* Secondary text, labels */
--text-disabled: #333333;   /* Disabled state */
```

**Hierarchy:**
- Headings, important labels: `text-primary`
- Body text, descriptions: `text-primary` at 90% opacity
- Timestamps, meta info: `text-muted`
- Disabled inputs, inactive items: `text-disabled`

#### UI Elements
```css
--border: hsl(0, 0%, 15%);         /* Borders, dividers */
--selection: rgba(208, 255, 113, 0.3);  /* Text selection */
--glow: rgba(208, 255, 113, 0.15);      /* Glow effects */
```

---

## 📝 Typography

### Font Families

#### Headings: Base Neue Trial
**File Requirements:**
- Base Neue Trial Black (900) - for h1, h2, hero text
- Base Neue Trial Bold (700) - for h3, h4
- Base Neue Trial Expanded (500) - for special emphasis

**Font-face declarations:**
```css
@font-face {
  font-family: 'Base Neue Trial';
  src: url('/fonts/BaseNeueTrial-Black.woff2') format('woff2');
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Base Neue Trial';
  src: url('/fonts/BaseNeueTrial-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

#### Body: FK Grotesk Neue Trial
**File Requirements:**
- FK Grotesk Neue Regular (400) - body text
- FK Grotesk Neue Medium (500) - buttons, labels
- FK Grotesk Neue Bold (700) - emphasis
- FK Grotesk Neue Black (900) - heavy emphasis

**Font-face declarations:**
```css
@font-face {
  font-family: 'FK Grotesk Neue Trial';
  src: url('/fonts/FKGroteskNeueTrial-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'FK Grotesk Neue Trial';
  src: url('/fonts/FKGroteskNeueTrial-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
```

### Type Scale

#### Hero Text (Dashboard Welcomes)
```css
.hero-text {
  font-family: 'Base Neue Trial', sans-serif;
  font-size: clamp(2rem, 6vw, 4.5rem);
  font-weight: 900;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.01em;
}
```

**Example:**
```html
<h1 class="hero-text">Hey Alex, Welcome Back</h1>
```

#### Display (Section Headings)
```css
.display {
  font-family: 'Base Neue Trial', sans-serif;
  font-size: 4.5rem; /* 72px */
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.01em;
}
```

#### Headings (h1-h6)
```css
h1 {
  font-family: 'Base Neue Trial', sans-serif;
  font-size: 3rem; /* 48px */
  font-weight: 900;
  letter-spacing: 0.01em;
}

h2 {
  font-family: 'Base Neue Trial', sans-serif;
  font-size: 2.25rem; /* 36px */
  font-weight: 900;
  letter-spacing: 0.01em;
}

h3 {
  font-family: 'Base Neue Trial', sans-serif;
  font-size: 1.875rem; /* 30px */
  font-weight: 700;
  letter-spacing: 0.01em;
}

h4 {
  font-family: 'Base Neue Trial', sans-serif;
  font-size: 1.5rem; /* 24px */
  font-weight: 700;
  letter-spacing: 0.01em;
}

h5 {
  font-family: 'FK Grotesk Neue Trial', sans-serif;
  font-size: 1.25rem; /* 20px */
  font-weight: 700;
  letter-spacing: 0.02em;
}

h6 {
  font-family: 'FK Grotesk Neue Trial', sans-serif;
  font-size: 1rem; /* 16px */
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

#### Body Text
```css
body {
  font-family: 'FK Grotesk Neue Trial', system-ui, -apple-system, sans-serif;
  font-size: 1rem; /* 16px */
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: 0.01em;
}

.large-body {
  font-size: 1.125rem; /* 18px */
  line-height: 1.7;
}

.small-text {
  font-size: 0.875rem; /* 14px */
  line-height: 1.5;
}
```

#### Micro Labels (Badges, Tags, Nav Labels)
```css
.micro {
  font-family: 'FK Grotesk Neue Trial', sans-serif;
  font-size: 0.6875rem; /* 11px */
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.2em;
}
```

**Example:**
```html
<span class="micro">In Progress</span>
<span class="micro">3 Days Left</span>
```

#### Buttons & Interactive Elements
```css
button, .button {
  font-family: 'FK Grotesk Neue Trial', sans-serif;
  font-size: 0.875rem; /* 14px */
  font-weight: 500;
  letter-spacing: 0.02em;
}
```

---

## 📐 Spacing & Layout

### Border Radius
```css
--radius-sm: 0.5rem;    /* 8px - small elements */
--radius: 1.5rem;       /* 24px - default cards, buttons */
--radius-xl: 1.5rem;    /* 24px - large cards */
--radius-2xl: 2rem;     /* 32px - modals, major sections */
--radius-full: 9999px;  /* Full round - avatars, badges */
```

**Usage:**
- Buttons: `radius-sm` or `radius`
- Cards: `radius` or `radius-xl`
- Modals: `radius-2xl`
- Avatars: `radius-full`
- Inputs: `radius-sm`

### Padding Scale
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-24: 6rem;    /* 96px */
```

**Common Patterns:**
- Card padding: `space-6` (24px)
- Section padding: `space-12` or `space-16`
- Button padding: `space-3 space-6` (12px 24px)
- Input padding: `space-3 space-4`

### Grid System
```css
/* Container widths */
.container-sm { max-width: 640px; }
.container-md { max-width: 768px; }
.container-lg { max-width: 1024px; }
.container-xl { max-width: 1280px; }
.container-2xl { max-width: 1536px; }

/* Grid gaps */
.gap-sm { gap: 1rem; }      /* 16px */
.gap-md { gap: 1.5rem; }    /* 24px */
.gap-lg { gap: 2rem; }      /* 32px */
.gap-xl { gap: 3rem; }      /* 48px */
```

---

## ✨ Effects & Treatments

### Noise Texture Overlay
**Purpose:** Adds subtle grain to prevent flat, digital look

```css
.noise-overlay {
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  z-index: 9999;
}
```

**Implementation:**
Add to `<body>` as first child:
```html
<div class="noise-overlay"></div>
```

### Gradient Orb (Ambient Background)
**Purpose:** Adds depth and atmosphere

```css
.gradient-orb {
  position: fixed;
  top: -10%;
  right: -10%;
  width: 800px;
  height: 800px;
  background: radial-gradient(
    circle at center,
    rgba(208, 255, 113, 0.15),
    rgba(90, 159, 46, 0.08),
    transparent
  );
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-50px, 50px) scale(1.1); }
}
```

### Glow Effects
**For buttons, active states, progress bars:**

```css
.glow-lime {
  box-shadow: 0 0 20px rgba(208, 255, 113, 0.3),
              0 0 40px rgba(208, 255, 113, 0.15);
}

.glow-lime-sm {
  box-shadow: 0 0 10px rgba(208, 255, 113, 0.2);
}
```

### Text Selection
```css
::selection {
  background-color: rgba(208, 255, 113, 0.3);
  color: #FFFFFF;
}
```

### Gradients

#### Lime to Green (Background gradients)
```css
.gradient-lime-green {
  background: linear-gradient(135deg, #D0FF71 0%, #5A9F2E 100%);
}

.gradient-lime-green-radial {
  background: radial-gradient(circle at top right, #D0FF71 0%, #5A9F2E 50%, transparent 100%);
}
```

#### Text Gradients (Headings)
```css
.gradient-text {
  background: linear-gradient(135deg, #D0FF71 0%, #5A9F2E 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## 🧩 Component Patterns

### Buttons

#### Primary Button (Lime)
```css
.btn-primary {
  background: #D0FF71;
  color: #000000;
  font-family: 'FK Grotesk Neue Trial', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #5A9F2E;
  box-shadow: 0 0 20px rgba(208, 255, 113, 0.3);
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(0);
}
```

#### Secondary Button (Outlined)
```css
.btn-secondary {
  background: transparent;
  color: #D0FF71;
  border: 1px solid #D0FF71;
  /* Rest same as primary */
}

.btn-secondary:hover {
  background: rgba(208, 255, 113, 0.1);
}
```

#### Ghost Button
```css
.btn-ghost {
  background: transparent;
  color: #FFFFFF;
  border: 1px solid var(--border);
}

.btn-ghost:hover {
  border-color: #D0FF71;
  color: #D0FF71;
}
```

### Cards

#### Default Card
```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.card::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* noise */
  opacity: 0.03;
  pointer-events: none;
}
```

#### Elevated Card (Hover effect)
```css
.card-elevated {
  background: var(--bg-elevated);
  transition: all 0.3s ease;
}

.card-elevated:hover {
  transform: translateY(-4px);
  border-color: rgba(208, 255, 113, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
```

### Progress Bars

```css
.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-card);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #D0FF71 0%, #5A9F2E 100%);
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
  box-shadow: 0 0 10px rgba(208, 255, 113, 0.5);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
```

### Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-family: 'FK Grotesk Neue Trial', sans-serif;
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.2em;
}

.badge-success {
  background: rgba(208, 255, 113, 0.2);
  color: #D0FF71;
  border: 1px solid rgba(208, 255, 113, 0.3);
}

.badge-warning {
  background: rgba(255, 193, 7, 0.2);
  color: #FFC107;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.badge-error {
  background: rgba(239, 68, 68, 0.2);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
```

### Inputs

```css
.input {
  width: 100%;
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-family: 'FK Grotesk Neue Trial', sans-serif;
  font-size: 0.875rem;
  letter-spacing: 0.01em;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: #D0FF71;
  box-shadow: 0 0 0 3px rgba(208, 255, 113, 0.1);
}

.input::placeholder {
  color: var(--text-muted);
}
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile first approach */
/* Default: Mobile (< 640px) */

/* Tablet */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }

/* Desktop */
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

**Typography scaling example:**
```css
.hero-text {
  font-size: 2rem; /* Mobile */
}

@media (min-width: 768px) {
  .hero-text {
    font-size: 3rem; /* Tablet */
  }
}

@media (min-width: 1024px) {
  .hero-text {
    font-size: 4.5rem; /* Desktop */
  }
}

/* Or use clamp for fluid scaling */
.hero-text {
  font-size: clamp(2rem, 6vw, 4.5rem);
}
```

---

## 🎭 Animation Guidelines

### Timing Functions
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Duration
- **Fast:** 150ms - hover states, button presses
- **Normal:** 200-300ms - card transitions, modals
- **Slow:** 500ms+ - page transitions, major state changes

### Micro-interactions
```css
/* Hover lift */
.hover-lift {
  transition: transform 0.2s ease;
}
.hover-lift:hover {
  transform: translateY(-4px);
}

/* Scale on click */
.scale-click {
  transition: transform 0.1s ease;
}
.scale-click:active {
  transform: scale(0.95);
}

/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.3s ease forwards;
}
```

---

## ♿ Accessibility

### Focus States
```css
*:focus-visible {
  outline: 2px solid #D0FF71;
  outline-offset: 2px;
}

button:focus-visible {
  box-shadow: 0 0 0 3px rgba(208, 255, 113, 0.3);
}
```

### Contrast Ratios
- **Lime on black:** 12.46:1 ✅ (WCAG AAA)
- **White on black:** 21:1 ✅ (WCAG AAA)
- **Muted text (#666) on black:** 4.55:1 ✅ (WCAG AA)

### Screen Readers
```html
<!-- Always include ARIA labels for icon-only buttons -->
<button aria-label="Send message">
  <SendIcon />
</button>

<!-- Use semantic HTML -->
<nav aria-label="Main navigation">...</nav>
<main>...</main>
<aside aria-label="Chat sidebar">...</aside>
```

---

## 🚫 Don'ts

### Typography
- ❌ Don't use lime for body text (readability issue)
- ❌ Don't mix too many font weights in one section
- ❌ Don't use all-caps for body text (only headings/labels)
- ❌ Don't use letter-spacing >0.2em except for micro labels

### Color
- ❌ Don't use lime for large background areas
- ❌ Don't use more than 2 accent colors in one view
- ❌ Don't use pure white (#FFF) for borders (use --border)
- ❌ Don't use gradients on text smaller than 16px

### Layout
- ❌ Don't center-align everything (embrace asymmetry)
- ❌ Don't use tight spacing (<12px) between sections
- ❌ Don't use more than 3 levels of nesting for cards

### Animation
- ❌ Don't animate on page load (except fade-in)
- ❌ Don't use transitions longer than 500ms
- ❌ Don't animate layout shifts (causes reflow)

---

## 📦 Implementation Checklist

### Phase 1: Foundation
- [ ] Add font files to `/public/fonts/`
- [ ] Import font-face declarations in `globals.css`
- [ ] Set CSS custom properties for colors
- [ ] Add noise overlay to `<body>`
- [ ] Add gradient orb (optional, for atmosphere)

### Phase 2: Typography
- [ ] Apply Base Neue Trial to all headings
- [ ] Apply FK Grotesk Neue to body text
- [ ] Set letter-spacing values
- [ ] Test responsive type scaling

### Phase 3: Components
- [ ] Style buttons (primary, secondary, ghost)
- [ ] Style cards with noise texture
- [ ] Style inputs with lime focus state
- [ ] Style badges with lime success variant
- [ ] Style progress bars with lime gradient

### Phase 4: Theme Toggle
- [ ] Create theme context (light/dark)
- [ ] Add toggle button in navbar
- [ ] Define light mode color variables
- [ ] Test all components in both modes

### Phase 5: Refinement
- [ ] Add hover/focus states to all interactive elements
- [ ] Test keyboard navigation
- [ ] Verify contrast ratios
- [ ] Add micro-animations (hover lift, fade-in)
- [ ] Test on mobile (responsiveness)

---

## 🎨 Style Guide Page (Component)

Create a `/style-guide` route in the app that showcases all components:

**Structure:**
1. **Colors** - Swatches of all colors with hex values
2. **Typography** - Display all heading levels, body text sizes
3. **Buttons** - All button variants with states (default, hover, active, disabled)
4. **Cards** - Card variants (default, elevated, gradient)
5. **Forms** - Inputs, textareas, selects with different states
6. **Badges** - All badge types
7. **Progress Bars** - Different progress states
8. **Icons** - Icon library preview
9. **Animations** - Examples of micro-interactions

This page serves as:
- Developer reference during implementation
- QA checklist for design consistency
- Client demo of the design system

---

**End of Style Guide. All design decisions documented.**
