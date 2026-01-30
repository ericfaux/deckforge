# DeckForge TODO - High Priority

## From Eric (2026-01-30)

### 1. Fingerboard Deck Size Research & Toggle
**Priority:** High
**Status:** Not Started

**Requirements:**
- Research exact fingerboard deck sizes people actually use
- Verify current canvas dimensions (96x294mm, 32:98 ratio)
- Add size toggle/selector in UI
- Support multiple standard sizes (e.g., 29mm, 32mm, 33mm, 34mm widths)
- Ensure export maintains correct dimensions
- Update hardware guide overlay for different sizes

**Research needed:**
- Standard fingerboard deck dimensions
- Pro deck brands (Berlinwood, Blackriver, etc.)
- Width x Length variations
- Wheelbase measurements

---

### 2. 3D Park Builder - Realistic Shapes
**Priority:** High  
**Status:** Not Started

**Current Issue:**
- Park objects don't look like real skate park obstacles
- Ramps need proper incline geometry
- Half pipes need correct radius/transition curves
- Objects are too generic/blocky

**Requirements:**
- Research real skate park obstacle dimensions
- Quarter pipe: proper transition curve
- Half pipe: correct radius, coping placement
- Ramp: realistic incline angle (30-45°)
- Rail: proper dimensions and placement
- Box: realistic proportions
- Stairs: correct rise/run ratio

**Technical:**
- Update mesh generation in DeckGenerator3D.tsx
- Use proper curves (not just boxes)
- Add realistic textures (wood grain, metal, concrete)
- Ensure proper scale relative to fingerboard

**Reference:**
- Real skate park obstacle blueprints
- Tech Deck park sets
- Fingerboard park builder tools

---

## Polish Phase (In Progress)

Currently completing Animation & Motion polish. Next up: Visual Consistency.

**Session Progress:** 91 features delivered over 6 hours
