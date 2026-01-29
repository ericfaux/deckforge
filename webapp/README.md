# DeckForge - Fingerboard Deck Graphics Editor

A digital brutalist web-based graphic design tool for creating custom fingerboard deck graphics.

## Visual Style

- **Aesthetic**: Digital brutalism x 90s skate zine
- **Background**: Deep charcoal (#121212)
- **Accents**: Acid green (primary) + safety orange (accent)
- **Typography**: JetBrains Mono (data), Oswald (headers)
- **Borders**: Sharp, 1px light gray borders

## Features

### Tool Shed (Left Sidebar)

- **Stickers**: Vector stickers from Lucide icons organized by category (Edgy, Retro, Shapes, Nature)
- **Lines**: Straight lines, curved bezier paths, zigzag lines, and dashed lines with customizable stroke
- **Patterns**: Procedural CSS gradient backgrounds (Checkerboard, Speed Lines, Halftone, Noise, Tie-Dye) with color pickers
- **Textures**: Realistic image textures (Concrete, Rust, Graffiti, Wood, Sticker Bomb) with blend modes
- **Graphics**: Basic shapes (circle, square, star)
- **Text**: Add custom text elements
- **Uploads**: Drag and drop image support
- **Finishes**: Texture overlay system (Scratched Wood, Grip Tape Dust, Halftone Dots)

### Workbench (Center)

- SVG-based canvas with deck silhouette
- 32:98 aspect ratio deck shape with clip mask
- Dot-grid background
- Drag objects to position
- Scroll to zoom
- Hardware guide overlay (Show Hardware toggle)

### Inspector (Right Sidebar)

- Export to PNG at 6x resolution
- Object properties (opacity, rotation, scale)
- Color picker for shapes/text

#### Sticker Controls
- Stroke color picker with presets
- Stroke width slider (1-8px)
- Solid Fill toggle (outline vs filled)

#### Texture Controls
- Blend mode selector (multiply, overlay, soft-light, color-burn, normal)

#### Line Controls
- Line type selector (straight, curved, zigzag, dashed)
- Stroke color with presets
- Stroke width slider (1-12px)
- Length X/Y sliders for endpoint positioning
- Curve amount slider (for curved lines)
- Cap style (butt, round, square)

#### Punk Zine Filters
- Contrast slider (0-200%)
- Brightness slider (0-200%)
- Grayscale slider (0-100%)
- Threshold toggle (xerox effect)
- Colorize with preset colors

#### Remix Effects
- Hue Shift slider (0-360°)
- Invert toggle
- Pixelate toggle
- Reset All Filters button

#### Pattern Generator
- Gap (spacing) control
- Random Rotation control (0° = neat grid, 180° = chaotic sticker bomb)
- Make Pattern button - tiles selected sticker across entire deck

### Layer List
- View all objects
- Reorder layers (up/down)
- Delete objects

### Keyboard Shortcuts
- `Delete/Backspace`: Remove selected object
- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Shift + Z`: Redo

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Pure SVG canvas (no external canvas library)
- Zustand (state management)
- Lucide React (vector icons)

## Getting Started

The development server runs automatically on port 8000.
