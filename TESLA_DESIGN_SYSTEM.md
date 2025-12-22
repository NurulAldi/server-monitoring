# Tesla-Inspired Design System

## Overview
This frontend has been refactored to embody Tesla's minimalist design philosophy—clean, powerful, and uncompromisingly functional. Every pixel serves a purpose.

---

## Core Design Principles

### 1. **Minimalism First**
- Remove all unnecessary borders, shadows, and visual clutter
- Use whitespace as a primary layout tool
- Let content breathe

### 2. **High Contrast Dark Mode**
- **Pure Black** (`#000000`) for main backgrounds
- **Deep Grey** (`#171a20`) for elevated surfaces
- **High Contrast White** (`#eeeeee`) for primary text
- Ensures WCAG AA accessibility standards

### 3. **Typography Hierarchy**
```tsx
// Display (Hero Text)
text-display-xl  // 4.5rem, bold
text-display-lg  // 3.5rem, bold
text-display-md  // 2.5rem, semibold

// Headings
text-heading-lg  // 2rem, semibold
text-heading-md  // 1.5rem, semibold

// Body
text-body-lg     // 1.125rem
text-body        // 1rem
text-body-sm     // 0.875rem
text-caption     // 0.75rem
```

### 4. **Pill-Shaped Buttons**
- Fully rounded (`rounded-pill`)
- Low-profile with subtle interactions
- Active state: `scale-[0.98]` (electric feedback)
- No aggressive gradients or glows

### 5. **Glassmorphism for Depth**
```tsx
// Light glass (e.g., floating nav)
className="glass"  // backdrop-blur(12px) + semi-transparent bg

// Strong glass (e.g., modals)
className="glass-strong"  // backdrop-blur(20px) + more opacity
```

---

## Color System

### Primary Palette
```css
--pure-black: #000000        /* Main BG */
--deep-grey: #171a20         /* Cards, elevated surfaces */
--neutral-800: #222222       /* Hover states */
--neutral-700: #393c41       /* Borders */
--neutral-600: #5c5e62       /* Subtle borders */
--neutral-500: #8a8d91       /* Muted text */
--neutral-400: #b8babf       /* Secondary text */
--high-contrast: #eeeeee     /* Primary text */
--soft-white: #f4f4f4        /* Hover text */
```

### Accent Colors (Minimal Use)
```css
--accent-blue: #3e6ae1       /* Primary CTA */
--accent-red: #e31937        /* Critical/delete */
--success-green: #00d448     /* Success states */
--warning-amber: #f7c948     /* Warnings */
```

---

## Components Reference

### Button (`Tombol`)
```tsx
import { Tombol } from '@/komponen/umum/Tombol'

<Tombol variant="primary" size="lg">Get Started</Tombol>
<Tombol variant="secondary">Learn More</Tombol>
<Tombol variant="ghost">Cancel</Tombol>
<Tombol variant="glass">Floating Action</Tombol>
```

**Variants:**
- `primary`: High-contrast white, solid
- `secondary`: Deep grey with border
- `ghost`: Transparent, minimal
- `outline`: Border-only
- `glass`: Glassmorphism effect

### Card System
```tsx
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '@/komponen/umum/Card'

<Card hover glass>
  <CardHeader>
    <CardTitle>Server Status</CardTitle>
  </CardHeader>
  <CardBody>
    Content here
  </CardBody>
  <CardFooter>
    Actions
  </CardFooter>
</Card>
```

### Navigation (Floating Glassmorphism)
```tsx
import { Navigation } from '@/komponen/umum/Navigation'

// Auto-applies glass effect on scroll
<Navigation />
```

### Hero Section (Full-Screen)
```tsx
import { HeroSection } from '@/komponen/umum/HeroSection'

<HeroSection
  subtitle="Real-Time Monitoring"
  title="Server Health, Simplified"
  description="Clean, powerful, built for performance."
>
  <Tombol variant="primary" size="lg">
    Get Started
  </Tombol>
</HeroSection>
```

### Status Badge
```tsx
import { StatusBadge } from '@/komponen/umum/StatusBadge'

<StatusBadge status="online" label="Active" />
<StatusBadge status="warning" dot />
<StatusBadge status="critical" label="Down" />
```

### Input & Label
```tsx
import { Input } from '@/komponen/umum/Input'
import { Label } from '@/komponen/umum/Label'

<Label htmlFor="email" required>Email Address</Label>
<Input
  id="email"
  type="email"
  placeholder="you@example.com"
  error={!!errors.email}
/>
```

---

## Layout Patterns

### Full-Screen Hero
```tsx
<section className="min-h-screen flex items-center justify-center px-8 py-24">
  <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in-up">
    {/* Content */}
  </div>
</section>
```

### Section-Based Layout
```tsx
<div className="min-h-screen bg-pure-black">
  <Navigation />

  {/* Hero Section */}
  <HeroSection {...} />

  {/* Content Section */}
  <section className="py-24 px-8 bg-deep-grey">
    <Container>
      {/* Grid or content */}
    </Container>
  </section>

  {/* CTA Section */}
  <section className="py-24 px-8">
    {/* Final call-to-action */}
  </section>
</div>
```

### Grid System (4-unit increments)
```tsx
// 3-column grid
<div className="grid md:grid-cols-3 gap-8">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>

// Responsive spacing: p-4, p-8, p-12, p-16
```

---

## Micro-Interactions

### Hover States
```tsx
// Lift on hover
className="hover:-translate-y-1 transition-smooth"

// Scale down (active state)
className="active:scale-[0.98]"

// Border glow
className="hover:border-neutral-600"
```

### Animations
```tsx
// Fade in (entry)
className="animate-fade-in"

// Fade in up (hero text)
className="animate-fade-in-up"

// Scale in (modals)
className="animate-scale-in"

// Pulse (status indicators)
className="animate-pulse-subtle"
```

---

## Accessibility

### Focus States
All interactive elements use:
```css
focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-pure-black
```

### Contrast Ratios
- High-contrast white (`#eeeeee`) on pure black: **18.9:1** (AAA)
- Neutral-400 (`#b8babf`) on pure black: **9.8:1** (AA)

### Keyboard Navigation
- All buttons and links are focusable
- Logical tab order preserved
- Skip-to-content links available

---

## Responsive Behavior

### Breakpoints (Mobile-First)
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Ultra-wide */
```

### Mobile Patterns
```tsx
// Hide on mobile, show on desktop
className="hidden md:flex"

// Stack vertically on mobile, grid on desktop
className="flex flex-col md:grid md:grid-cols-3"

// Adjust padding
className="px-4 md:px-8 lg:px-16"
```

---

## Usage Guidelines

### Do ✅
- Use generous whitespace (p-8, p-12, py-24)
- Stick to the defined color palette
- Apply subtle animations (scale, fade)
- Ensure focus states are visible
- Test on mobile devices early

### Don't ❌
- Add unnecessary borders or shadows
- Use bright, aggressive colors
- Over-animate (keep it subtle)
- Ignore accessibility (WCAG AA minimum)
- Clutter the interface with decorative elements

---

## File Structure
```
frontend/
├── app/
│   ├── globals.css          # Tesla color vars + base styles
│   ├── layout.tsx            # Root layout with Inter font
│   └── page.tsx              # Homepage with hero + features
├── komponen/umum/
│   ├── Tombol.tsx            # Pill-shaped buttons
│   ├── Card.tsx              # Minimalist cards
│   ├── Input.tsx             # Form inputs
│   ├── Label.tsx             # Form labels
│   ├── Navigation.tsx        # Floating glass nav
│   ├── HeroSection.tsx       # Full-screen hero
│   ├── Container.tsx         # Responsive container
│   └── StatusBadge.tsx       # Status indicators
├── gaya/
│   ├── komponen.css          # Component-specific styles
│   └── animasi.css           # Animation keyframes
└── tailwind.config.js        # Tesla design tokens
```

---

## Next Steps

### Phase 1: Core Pages ✅
- [x] Homepage with hero
- [x] Navigation
- [x] Button system
- [x] Card components

### Phase 2: Dashboard Refactor
- [ ] Refactor dashboard layout to full-width sections
- [ ] Update metric cards with new Card component
- [ ] Replace old buttons with Tombol
- [ ] Add glassmorphism to floating panels

### Phase 3: Forms & Auth
- [ ] Update login/register forms
- [ ] Apply new Input/Label styling
- [ ] Add form validation feedback (minimalist)

### Phase 4: Data Visualization
- [ ] Style Recharts with dark theme
- [ ] Remove chart borders/grids (minimal)
- [ ] Use accent colors sparingly

---

## Performance Considerations
- All animations use `transform` and `opacity` (GPU-accelerated)
- Backdrop filters limited to navigation (performance-sensitive)
- Font weights lazy-loaded
- Images optimized via Next.js Image

---

## Inspiration & Credits
- **Tesla.com**: Visual DNA and interaction patterns
- **Apple.com**: Whitespace usage and typography
- **Linear.app**: Glassmorphism execution

Built with Next.js 14, Tailwind CSS, and obsessive attention to detail.
