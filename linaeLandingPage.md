# Landing Page Redesign (Linear-Inspired)

This plan outlines the steps to refactor your **landing page** to achieve the clean, sharp, and highly functional aesthetic known in tools like Linear.app. We will focus purely on the public-facing landing components, leaving the actual application dashboard untouched.

## Proposed Changes

Linear's landing pages rely on dark, high-contrast backgrounds (`#000000` or `#08090A`), extremely subtle 1px borders, beautiful typography (stark white headers, dim gray descriptions), and flat, sleek components with minimal, highly-intentional animations (like subtle glows or clean SVG lines).

---

### [MODIFY] [globals.css](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/app/globals.css)
*Note: We will only add utility classes specific to the landing page, without breaking the main app dashboard.*
- Add new utility classes for the landing page:
  - `.landing-btn-primary`: A sleek, solid high-contrast button (e.g., solid white background, black text) instead of the loud purple/indigo gradient, mimicking Linear's primary CTA.
  - `.landing-card`: Update to use `rounded-xl`, an ultra-dark background (e.g., `#0F1115`), and a sharp 1px border (`rgba(255, 255, 255, 0.08)`) with a subtle hover effect (no heavy drop shadows).

### [MODIFY] [Navbar.tsx](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/components/landing/Navbar.tsx)
- **Logo:** Replace the `bg-gradient-to-br from-violet-600 to-indigo-600` logo background with a stark, monochrome, or high-contrast subtle icon.
- **Background:** Make the navbar background perfectly transparent at the top, fading into a sleek, dark blurred background only when scrolled.
- **Buttons:** Swap `.btn-primary` for the new `.landing-btn-primary`.

### [MODIFY] [HeroSection.tsx](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/components/landing/HeroSection.tsx)
- **Typography:** Change the main header to stark white or a very subtle, clean metallic gradient. Remove the heavy `violet-to-indigo` gradient text to keep it looking premium and understated.
- **Graphic/Mockup:** Flatten the large shadow on the hero graphic (`shadow-[0_0_60px...]`). We'll wrap the graphic in a very clean 1px border container with a subtle inner glow, heavily inspired by Linear's crisp hero graphics.
- **Badges:** Update the "Now with automatic critical-path" badge to be a sharp, muted gray pill with a pure white border and a tiny, crisp indicator dot.

### [MODIFY] [BentoGrid.tsx](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/components/landing/BentoGrid.tsx)
- **Cards:** Replace the `bg-app-surface` and `hover:border-indigo-500/30` with the new `.landing-card` style. The cards will have a near-black background with a very crisp, subtle white/gray border.
- **Hover Effects:** Implement a very subtle background lightness shift on hover, avoiding bright colored borders.
- **Typography:** Ensure headers are stark white and descriptions are a precise, dim gray (`text-slate-400`).
- **Accent Elements:** For the small visual elements inside the bento grid (like the CPI score or the resource bars), use subdued, monochromatic, or strictly controlled accent colors instead of bright indigo and rose.

## User Review Required

> [!WARNING]
> **Aesthetic Shift:** This change will remove the current "purple/indigo" gradient theme from your landing page, replacing it with a very stark, professional, high-contrast dark theme (similar to Linear). The actual app dashboard (`/dashboard`) will remain exactly as it is now.

## Open Questions

> [!IMPORTANT]
> 1. Are you okay with the primary Call-To-Action buttons becoming solid white (with black text) to match the stark Linear feel, replacing the purple gradients?
> 2. Should we keep the background pitch black (`#000000`) or a very deep gray (e.g., `#08090A`)?
> 3. Do you want to keep the current glowing SVG animations in the Hero section, or should we make those strictly monochromatic/flat as well?

## Verification Plan

### Manual Verification
- Run the Next.js dev server.
- Visit `http://localhost:3000/`.
- Verify the landing page components (Hero, Navbar, BentoGrid) reflect the new stark, high-contrast dark theme.
- Ensure the `/dashboard` routes still look exactly the same as before, preserving the app's existing theme.
