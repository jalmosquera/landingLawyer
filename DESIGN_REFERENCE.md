# Design Reference - Landing Lawyer

This document contains the visual design specifications extracted from the existing landing page project.

## Color Palette

### Primary Colors (Navy Blue)
```css
primary: #013048       /* Main navy blue */
primary-dark: #001f2e  /* Darker navy */
primary-light: #024563 /* Lighter navy */
```

### Accent Colors (Gold/Orange)
```css
accent: #fbb03c        /* Main gold/orange */
accent-dark: #e09a1f   /* Darker gold */
accent-light: #fcc066  /* Lighter gold */
```

## Tailwind Configuration

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#013048',
        dark: '#001f2e',
        light: '#024563',
      },
      accent: {
        DEFAULT: '#fbb03c',
        dark: '#e09a1f',
        light: '#fcc066',
      },
    },
  },
}
```

## Component Classes

### Buttons
```css
/* Primary Button */
.btn-primary {
  @apply bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300;
}

/* Accent Button */
.btn-accent {
  @apply bg-accent hover:bg-accent-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300;
}
```

## Icons Library

**Package:** `react-icons` v5.5.0
- Wide variety of icon sets available
- Import example: `import { FaIcon } from 'react-icons/fa'`

## Custom Components

### WaveDivider
- Visual separator component with wave effect
- Used between sections for smooth transitions
- Props: `position` (top/bottom)

## Typography

- **Font:** Default sans-serif with antialiased rendering
- **Hero heading:** text-5xl md:text-6xl lg:text-7xl
- **Hero subtext:** text-xl md:text-2xl
- **Body:** Standard responsive sizing

## Layout Patterns

### Hero Section
- Full screen height (h-screen)
- Gradient background: `from-primary to-primary-light`
- Dark overlay (opacity-50)
- Centered content
- Two CTA buttons (accent + white)
- Animated scroll indicator
- Wave divider at bottom

### Sections Structure
```jsx
<section id="home" className="relative h-screen">
  {/* Background */}
  {/* Content */}
  {/* Wave Divider */}
</section>
```

## Design System Notes

1. **Consistency:** All buttons use the same border-radius (rounded-lg)
2. **Transitions:** Smooth 300ms color transitions on hover
3. **Responsiveness:** Mobile-first with md: and lg: breakpoints
4. **Spacing:** Consistent padding/margin system
5. **Shadows:** Minimal use, clean design
6. **Overlays:** Black with opacity for image backgrounds

## Features in Existing Landing

- Hero section with gradient background
- Header with navigation
- About section
- Practice areas showcase
- Testimonials
- Contact form
- Footer
- Wave dividers between sections

## Frontend Stack (Reference)

- React 18.3.1
- Vite 5.4.2
- Tailwind CSS 3.4.13
- React Icons 5.5.0
- Vitest (testing)

---

**Source:** `/Users/jalberth/Documents/js/reactProjects/projectsInProductions/landingPageLawyer`

**Note:** This is only for visual reference. We will implement new functionality with the same design language.
