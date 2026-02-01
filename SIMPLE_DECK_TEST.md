# Simple Deck Geometry Test

## What a Real Deck Should Be

**From Top View (XZ plane):**
- Rectangular outline: 96mm × 32mm
- Truck holes visible

**From Side View (XY plane, looking along Z axis):**
- Flat center section
- Nose kicks up at end
- Tail kicks up at end
- ALL at the SAME baseline (no trough, no boat shape)

**From End View (YZ plane, looking along X axis):**
- Subtle concave: edges at top, center dips slightly
- U-shaped cross-section

## Current Problem

Even with concave=0, the model shows:
- Edges HIGHER than centerline along entire length
- Creates "boat" or "canoe" shape
- Does NOT match real deck

## Test Plan

Build geometry step by step:
1. Start with FLAT rectangular slab (no kicks, no concave)
2. Add kicks (should only affect centerline height along X)
3. Add concave (should only affect Y relative to centerline across Z)

If step 1 looks right, problem is in step 2 or 3.
If step 1 looks WRONG, the basic mesh generation is broken.
