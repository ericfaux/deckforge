# Deck Geometry Rewrite - The Real Problem

## What's Wrong (Eric's Screenshot)
- **Ripple/wave artifacts** across the top
- **Nose/tail are BULGING** sideways
- **Overall shape is distorted** - doesn't look like a skateboard at all

## Root Cause
Current code does: `y = concave + kickY` for EVERY vertex

This means:
- Concave curve INTERFERES with kick curve
- Creates wave/ripple patterns
- Kick formula adds XZ distortion (bulging)

## What a Real Deck Should Be

**From Top View:**
- RECTANGULAR outline (or slight popsicle nose/tail rounding)
- NO bulging or waves
- Straight sides

**From Side View:**
- Flat center
- Clean upward kicks at nose/tail (simple curves going UP)
- NO horizontal bulging

**From End View:**
- Subtle concave (U-shape across width)
- Edges slightly higher than center

## Correct Approach

### 1. Deck Outline (XZ plane)
Keep it SIMPLE and RECTANGULAR:
```
- Length: 96mm
- Width: 32mm
- NO XZ distortion from kicks
- Maybe slight nose/tail rounding (optional)
```

### 2. Concave (affects Y, varies with Z)
```javascript
// ONLY across width, same for all X positions
concaveY = concaveDepth * (4 * (z/width - 0.5)^2)
// At center (z=width/2): concaveY = 0 (lowest)
// At edges (z=0 or z=width): concaveY = concaveDepth (highest)
```

### 3. Kicks (affects Y, varies with X)
```javascript
// ONLY along length, same for all Z positions
// Tail kick (X < 15% of length)
if (x < length * 0.15) {
  t = x / (length * 0.15)  // 0 to 1
  kickY = kickHeight * smoothCurve(t)
}
// Nose kick (X > 85% of length)
if (x > length * 0.85) {
  t = (x - length * 0.85) / (length * 0.15)
  kickY = kickHeight * smoothCurve(t)
}
```

### 4. Final Y Position
```javascript
// NO interaction between concave and kicks
// Bottom surface: always at -thickness
// Top surface: baseY + concaveY + kickY

if (isTop) {
  y = 0 + concaveY(z) + kickY(x)
} else {
  y = -thickness
}
```

## Key Changes Needed

1. **Separate concave and kick functions** - no interference
2. **Keep XZ outline rectangular** - no bulging
3. **Simple smooth curves** for kicks (not complex trig)
4. **Concave only affects cross-section** - not lengthwise

This will produce a clean deck shape that actually looks like a skateboard.
