# DeckForge

> Professional fingerboard deck graphics editor and park builder

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/deckforge)

## 🎨 Features

### Deck Designer
- **Advanced Canvas Editor** - Create custom fingerboard deck graphics
- **70+ Keyboard Shortcuts** - Power user workflow
- **Real-time Preview** - See your design as you work
- **Smart Guides & Snapping** - Pixel-perfect alignment
- **Layer Management** - Full control over object ordering
- **Undo/Redo System** - Never lose your work
- **Group Objects** - Organize complex designs

### Tools & Assets
- **Pen Tool** - Draw custom shapes (click-to-point or freehand)
- **1000+ Stickers** - Vector icons and decals
- **Custom Fonts** - Upload and use your own fonts
- **SVG Import** - Import vector graphics
- **Image Upload** - Use your own photos and artwork
- **Patterns & Textures** - Procedural patterns and realistic textures
- **Lines & Shapes** - Circles, rectangles, stars, lines with dash styles

### Export & Sharing
- **High-Resolution Export** - PNG up to 4K
- **PDF Export** - Print-ready files
- **Social Media Presets** - Instagram, Twitter, Facebook optimized
- **3D Print Generator** - Export STL files for 3D printing
- **Public Gallery** - Share designs with the community
- **Design Marketplace** - Buy and sell designs

### Fingerpark Builder ⭐ UNIQUE FEATURE
- **2D Park Planner** - Design fingerboard obstacle layouts
- **14 Obstacle Types** - Rails, ledges, stairs, ramps, boxes
- **Materials Calculator** - Automatic cost estimation
- **Shopping List Generator** - Plywood, lumber, screws, sandpaper
- **Save/Load Projects** - Iterate on your park designs
- **Export Blueprints** - PNG downloads for building

### Professional Features
- **Auto-Save** - Never lose your work
- **Version History** - Time travel through design changes
- **Collaborative Tools** - Share and remix designs
- **Brand Kits** - Save color palettes for consistency
- **Batch Export** - Export multiple designs at once
- **Keyboard Shortcuts** - Press `?` to view all shortcuts

## 🚀 Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Canvas:** Konva.js (HTML5 Canvas wrapper)
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Deployment:** Vercel
- **State:** Zustand

## 🎯 Getting Started

### Prerequisites
- Node.js 18+
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/deckforge.git
cd deckforge

# Install dependencies
cd webapp
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials

# Start development server
npm run dev
```

### Database Setup

Run the SQL migrations in order:

```bash
# In Supabase SQL Editor:
# 1. Run supabase/migrations/001_initial_schema.sql
# 2. Run supabase/migrations/002_designs.sql
# 3. Run supabase/migrations/003_marketplace.sql
# 4. Run supabase/migrations/004_fingerpark_projects.sql
```

## 📦 Project Structure

```
deckforge/
├── webapp/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   └── deckforge/   # App-specific components
│   │   ├── hooks/           # Custom React hooks (15+)
│   │   ├── lib/             # Utilities and helpers
│   │   ├── pages/           # Route pages
│   │   ├── store/           # Zustand stores
│   │   └── styles/          # Global CSS
│   ├── supabase/            # Database migrations
│   └── public/              # Static assets
└── docs/                    # Documentation
```

## 🎨 UI Components (15+)

**State Management:**
- `LoadingState` - Spinner with message
- `EmptyState` - Icon + title + description + action
- `ErrorState` - Error display with retry
- `Skeleton` - Shimmer loading placeholders
- `ButtonLoading` - Button with loading state
- `ProgressIndicator` - Animated progress bar

**Form Elements:**
- `InputWithIcon` - Input with left/right icons
- `FormField` - Label + error + hint wrapper
- `CopyButton` - Copy to clipboard with feedback
- `NotificationBadge` - Animated count badge

**Images:**
- `OptimizedImage` - Lazy loading with Intersection Observer

**Typography:**
- `Kbd` - Keyboard shortcut display

## 🪝 Custom Hooks (15+)

**Storage & State:**
- `useLocalStorage` - Persistent localStorage with cross-tab sync
- `useSessionStorage` - Session-only storage
- `useClipboard` - Copy to clipboard with feedback
- `useToggle` - Boolean toggle with helpers
- `usePrevious` - Track previous values

**Responsive & Media:**
- `useMediaQuery` - Detect media query matches
- `useIsMobile/Tablet/Desktop` - Breakpoint helpers
- `useWindowSize` - Window dimensions
- `usePrefersReducedMotion/DarkMode/HighContrast` - User preferences
- `useIsTouchDevice` - Touch vs mouse detection

**Performance:**
- `useDebounce` - Debounce values
- `useDebouncedCallback` - Debounce functions
- `useThrottle` - Throttle callbacks

**Utilities:**
- `useOnClickOutside` - Detect outside clicks
- `useInterval` - Declarative setInterval
- `useDocumentTitle` - Dynamic page titles

## ⌨️ Keyboard Shortcuts

Press `?` in the app to view all shortcuts.

**Essential:**
- `Ctrl+S` - Save
- `Ctrl+Z` / `Ctrl+Shift+Z` - Undo/Redo
- `Ctrl+C` / `Ctrl+V` - Copy/Paste
- `Delete` - Delete selected
- `T` - Text tool
- `S` - Stickers
- `G` - Graphics

[View all 70+ shortcuts in-app]

## 🎯 Roadmap

- [x] Canvas editor with layers
- [x] Export to PNG/PDF
- [x] Design marketplace
- [x] Fingerpark builder with materials calculator
- [x] 70+ keyboard shortcuts
- [x] Mobile responsive design
- [x] Accessibility (WCAG 2.1)
- [ ] Real-time collaboration
- [ ] Mobile app (React Native)
- [ ] API for third-party integrations

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- [Konva.js](https://konvajs.org/) - Canvas library
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Lucide](https://lucide.dev/) - Icons
- [Supabase](https://supabase.com/) - Backend

## 📧 Contact

- GitHub: [@your-username](https://github.com/your-username)
- Twitter: [@your-handle](https://twitter.com/your-handle)
- Email: support@deckforge.com

---

Built with ❤️ for the fingerboarding community
