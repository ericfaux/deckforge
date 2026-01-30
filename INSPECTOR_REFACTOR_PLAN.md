# Inspector Refactor Plan

## Problem
- Inspector.tsx is 1377 lines
- 30+ individual control sections
- Requires 2000px+ of scrolling
- Hard to find specific properties
- No organization or grouping

## Solution
Group controls into collapsible accordion sections:

### 1. Transform (Always Visible)
- Position (X, Y)
- Size (Width, Height) 
- Rotation
- Scale (X, Y)
- Lock/Unlock button

### 2. Appearance (Default: Open)
- Color / Gradient
- Opacity
- Blend Mode
- Background (if applicable)

### 3. Typography (Text Only, Default: Open)
- Font Family
- Font Size
- Weight & Style
- Alignment
- Letter Spacing
- Line Height
- Text Transform
- Text Decoration

### 4. Layer (Default: Open)
- Layer Order (Forward, Back, Front, Back buttons)
- Visibility
- Lock state

### 5. Effects (Default: Closed)
- Filters (Contrast, Brightness, Grayscale, etc.)
- Text Shadow
- Drop Shadow  
- Glow
- Outline Stroke

### 6. Advanced (Default: Closed)
- Pattern Settings (if pattern shape)
- Advanced Effects
- Remix Effects
- Colorize, Pixelate, etc.

## Implementation
- Use shadcn/ui Accordion (already imported)
- Default open: Transform, Appearance, Typography (if text), Layer
- Default closed: Effects, Advanced
- Persist user's open/closed state to localStorage
- Smooth animations
