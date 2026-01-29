import { create } from 'zustand';

export type ToolType = 'templates' | 'graphics' | 'text' | 'uploads' | 'background' | 'finishes' | 'stickers' | 'patterns' | 'textures' | 'lines' | 'pen';

export type TextureType = 'scratched-wood' | 'grip-tape-dust' | 'halftone-dots';

export interface TextureOverlay {
  id: TextureType;
  name: string;
  enabled: boolean;
  opacity: number;
  blendMode: 'multiply' | 'overlay' | 'soft-light' | 'color-burn';
}

// Procedural background pattern
export interface BackgroundPattern {
  type: 'checkerboard' | 'speed-lines' | 'halftone' | 'noise' | 'tie-dye' | 'solid';
  primaryColor: string;
  secondaryColor: string;
  scale: number;
}

export interface PathPoint {
  x: number;
  y: number;
  cp1x?: number; // Control point 1 x (for bezier curves)
  cp1y?: number; // Control point 1 y
  cp2x?: number; // Control point 2 x (for bezier curves)
  cp2y?: number; // Control point 2 y
}

export interface CanvasObject {
  id: string;
  type: 'image' | 'text' | 'shape' | 'sticker' | 'texture' | 'line' | 'path';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  scaleX: number;
  scaleY: number;
  // For text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  // Gradient support
  fillType?: 'solid' | 'linear-gradient' | 'radial-gradient';
  gradientStops?: Array<{ offset: number; color: string }>; // e.g., [{offset: 0, color: '#ff0000'}, {offset: 1, color: '#0000ff'}]
  gradientAngle?: number; // 0-360 degrees for linear gradient
  // For images
  src?: string;
  // For shapes
  shapeType?: 'rect' | 'circle' | 'star';
  // For paths (pen tool / bezier curves)
  pathPoints?: PathPoint[];
  pathClosed?: boolean; // Whether path is closed (connects back to start)
  // For stickers (Lucide icons)
  iconName?: string;
  strokeWidth?: number;
  solidFill?: boolean;
  stroke?: string;
  strokeDashStyle?: 'solid' | 'dashed' | 'dotted';
  // For textures
  textureUrl?: string;
  blendMode?: 'multiply' | 'overlay' | 'soft-light' | 'color-burn' | 'normal';
  // For lines
  lineType?: 'straight' | 'curved' | 'zigzag' | 'dashed';
  lineEndX?: number;      // End point relative to x
  lineEndY?: number;      // End point relative to y
  lineCurve?: number;     // Curve amount for bezier (-100 to 100)
  lineCapStyle?: 'butt' | 'round' | 'square';
  // Filters (punk zine aesthetic)
  contrast?: number;      // 0-200, default 100
  brightness?: number;    // 0-200, default 100
  grayscale?: number;     // 0-100, default 0
  threshold?: boolean;    // high-contrast B&W effect
  colorize?: string | null; // null = off, or hex color like '#00ff00'
  // Remix filters
  hueRotate?: number;     // 0-360 degrees
  invert?: boolean;
  pixelate?: boolean;
  // Advanced filters (bonus)
  blur?: number;          // 0-20px gaussian blur
  saturate?: number;      // 0-200%, default 100
  sepia?: number;         // 0-100%, sepia tone
  posterize?: number;     // 2-32 color levels (lower = more posterized)
  duotone?: {
    enabled: boolean;
    color1: string;       // Shadow color
    color2: string;       // Highlight color
  };
  // Layer effects
  dropShadow?: {
    enabled: boolean;
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
    opacity: number;
  };
  glow?: {
    enabled: boolean;
    radius: number;
    color: string;
    intensity: number;
  };
  innerShadow?: {
    enabled: boolean;
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
}

interface HistoryState {
  objects: CanvasObject[];
}

export interface DesignVersion {
  id: string;
  name: string;
  timestamp: number;
  objects: CanvasObject[];
  textureOverlays: TextureOverlay[];
  thumbnail?: string; // base64 thumbnail image
  autoSaved: boolean; // true if auto-saved, false if manually saved
}

interface DeckForgeState {
  // Canvas objects
  objects: CanvasObject[];
  selectedId: string | null;

  // Tool state
  activeTool: ToolType | null;
  drawerOpen: boolean;

  // Zoom/Pan
  stageScale: number;
  stagePosition: { x: number; y: number };

  // History for undo/redo (in-session only)
  past: HistoryState[];
  future: HistoryState[];

  // Version history (persistent snapshots)
  versions: DesignVersion[];
  currentVersionId: string | null;

  // Texture overlays
  textureOverlays: TextureOverlay[];

  // Hardware guide (visual only, not exported)
  showHardwareGuide: boolean;

  // Design metadata
  currentDesignId: string | null;
  designName: string;
  isSaving: boolean;

  // Actions
  addObject: (obj: Omit<CanvasObject, 'id'>) => void;
  addObjects: (objs: Omit<CanvasObject, 'id'>[]) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  deleteObject: (id: string) => void;
  selectObject: (id: string | null) => void;
  setActiveTool: (tool: ToolType | null) => void;
  toggleDrawer: (open?: boolean) => void;
  setStageScale: (scale: number) => void;
  setStagePosition: (pos: { x: number; y: number }) => void;
  moveLayer: (id: string, direction: 'up' | 'down') => void;
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  toggleTexture: (id: TextureType) => void;
  updateTexture: (id: TextureType, updates: Partial<TextureOverlay>) => void;
  generatePattern: (sourceId: string, gap: number, randomRotation: number, deckWidth: number, deckHeight: number) => void;
  toggleHardwareGuide: () => void;
  
  // Design management
  loadDesign: (designData: any) => void;
  setDesignName: (name: string) => void;
  setDesignId: (id: string | null) => void;
  setSaving: (saving: boolean) => void;
  resetCanvas: () => void;
  getCanvasState: () => any;

  // Version management
  createVersion: (name?: string, autoSaved?: boolean) => void;
  restoreVersion: (versionId: string) => void;
  deleteVersion: (versionId: string) => void;
  renameVersion: (versionId: string, newName: string) => void;
}

const generateId = () => `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const defaultTextureOverlays: TextureOverlay[] = [
  { id: 'scratched-wood', name: 'Scratched Wood', enabled: false, opacity: 0.4, blendMode: 'multiply' },
  { id: 'grip-tape-dust', name: 'Grip Tape Dust', enabled: false, opacity: 0.3, blendMode: 'overlay' },
  { id: 'halftone-dots', name: 'Halftone Dots', enabled: false, opacity: 0.25, blendMode: 'soft-light' },
];

export const useDeckForgeStore = create<DeckForgeState>((set, get) => ({
  objects: [],
  selectedId: null,
  activeTool: null,
  drawerOpen: false,
  stageScale: 1,
  stagePosition: { x: 0, y: 0 },
  past: [],
  future: [],
  versions: [],
  currentVersionId: null,
  textureOverlays: defaultTextureOverlays,
  showHardwareGuide: false,
  currentDesignId: null,
  designName: 'Untitled Design',
  isSaving: false,

  saveToHistory: () => {
    const { objects, past } = get();
    set({
      past: [...past, { objects: JSON.parse(JSON.stringify(objects)) }],
      future: [],
    });
  },

  addObject: (obj) => {
    const state = get();
    state.saveToHistory();
    const newObj: CanvasObject = {
      ...obj,
      id: generateId(),
    };
    set({
      objects: [...state.objects, newObj],
      selectedId: newObj.id,
    });
  },

  addObjects: (objs) => {
    const state = get();
    state.saveToHistory();
    const newObjs = objs.map((obj) => ({
      ...obj,
      id: generateId(),
    }));
    set({
      objects: [...state.objects, ...newObjs],
      selectedId: null,
    });
  },

  updateObject: (id, updates) => {
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...updates } : obj
      ),
    }));
  },

  deleteObject: (id) => {
    const state = get();
    state.saveToHistory();
    set({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    });
  },

  selectObject: (id) => set({ selectedId: id }),

  setActiveTool: (tool) => set({
    activeTool: tool,
    drawerOpen: tool !== null
  }),

  toggleDrawer: (open) => set((state) => ({
    drawerOpen: open !== undefined ? open : !state.drawerOpen
  })),

  setStageScale: (scale) => set({ stageScale: Math.max(0.25, Math.min(3, scale)) }),

  setStagePosition: (pos) => set({ stagePosition: pos }),

  moveLayer: (id, direction) => {
    const state = get();
    state.saveToHistory();
    const index = state.objects.findIndex((obj) => obj.id === id);
    if (index === -1) return;

    const newObjects = [...state.objects];
    const targetIndex = direction === 'up' ? index + 1 : index - 1;

    if (targetIndex < 0 || targetIndex >= newObjects.length) return;

    [newObjects[index], newObjects[targetIndex]] = [newObjects[targetIndex], newObjects[index]];
    set({ objects: newObjects });
  },

  undo: () => {
    const { past, objects, future } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    set({
      past: newPast,
      objects: previous.objects,
      future: [{ objects: JSON.parse(JSON.stringify(objects)) }, ...future],
      selectedId: null,
    });
  },

  redo: () => {
    const { past, objects, future } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      past: [...past, { objects: JSON.parse(JSON.stringify(objects)) }],
      objects: next.objects,
      future: newFuture,
      selectedId: null,
    });
  },

  toggleTexture: (id) => {
    set((state) => ({
      textureOverlays: state.textureOverlays.map((t) =>
        t.id === id ? { ...t, enabled: !t.enabled } : t
      ),
    }));
  },

  updateTexture: (id, updates) => {
    set((state) => ({
      textureOverlays: state.textureOverlays.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  },

  generatePattern: (sourceId, gap, randomRotation, deckWidth, deckHeight) => {
    const state = get();
    const sourceObj = state.objects.find((obj) => obj.id === sourceId);
    if (!sourceObj) return;

    state.saveToHistory();

    // Calculate tile size with gap
    const tileWidth = (sourceObj.width * sourceObj.scaleX) + gap;
    const tileHeight = (sourceObj.height * sourceObj.scaleY) + gap;

    // Calculate how many tiles fit in each direction
    const cols = Math.ceil(deckWidth / tileWidth) + 1;
    const rows = Math.ceil(deckHeight / tileHeight) + 1;

    // Generate pattern tiles
    const newObjects: Omit<CanvasObject, 'id'>[] = [];

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        // Skip the original position
        const baseX = col * tileWidth;
        const baseY = row * tileHeight;

        // Add random rotation if enabled
        const rotation = randomRotation > 0
          ? (Math.random() - 0.5) * 2 * randomRotation
          : 0;

        newObjects.push({
          type: sourceObj.type,
          x: baseX,
          y: baseY,
          width: sourceObj.width,
          height: sourceObj.height,
          rotation: sourceObj.rotation + rotation,
          opacity: sourceObj.opacity,
          scaleX: sourceObj.scaleX,
          scaleY: sourceObj.scaleY,
          fill: sourceObj.fill,
          shapeType: sourceObj.shapeType,
          text: sourceObj.text,
          fontSize: sourceObj.fontSize,
          fontFamily: sourceObj.fontFamily,
          src: sourceObj.src,
          contrast: sourceObj.contrast,
          brightness: sourceObj.brightness,
          grayscale: sourceObj.grayscale,
          threshold: sourceObj.threshold,
          colorize: sourceObj.colorize,
          // Sticker properties
          iconName: sourceObj.iconName,
          strokeWidth: sourceObj.strokeWidth,
          solidFill: sourceObj.solidFill,
          stroke: sourceObj.stroke,
          // Remix filters
          hueRotate: sourceObj.hueRotate,
          invert: sourceObj.invert,
          pixelate: sourceObj.pixelate,
        });
      }
    }

    // Remove the original object and add all pattern tiles
    const filteredObjects = state.objects.filter((obj) => obj.id !== sourceId);
    const tiledObjects = newObjects.map((obj) => ({
      ...obj,
      id: generateId(),
    }));

    set({
      objects: [...filteredObjects, ...tiledObjects],
      selectedId: null,
    });
  },

  toggleHardwareGuide: () => {
    set((state) => ({ showHardwareGuide: !state.showHardwareGuide }));
  },

  // Design management
  loadDesign: (designData) => {
    set({
      objects: designData.objects || [],
      textureOverlays: designData.textureOverlays || defaultTextureOverlays,
      selectedId: null,
      past: [],
      future: [],
      designName: designData.name || 'Untitled Design',
      currentDesignId: designData.id || null,
    });
  },

  setDesignName: (name) => set({ designName: name }),
  
  setDesignId: (id) => set({ currentDesignId: id }),
  
  setSaving: (saving) => set({ isSaving: saving }),
  
  resetCanvas: () => {
    set({
      objects: [],
      selectedId: null,
      past: [],
      future: [],
      textureOverlays: defaultTextureOverlays,
      stageScale: 1,
      stagePosition: { x: 0, y: 0 },
      currentDesignId: null,
      designName: 'Untitled Design',
    });
  },
  
  getCanvasState: () => {
    const state = get();
    return {
      objects: state.objects,
      textureOverlays: state.textureOverlays,
      name: state.designName,
      id: state.currentDesignId,
    };
  },

  // Version management
  createVersion: (name, autoSaved = false) => {
    const state = get();
    const timestamp = Date.now();
    const versionName = name || (autoSaved ? `Auto-save ${new Date(timestamp).toLocaleTimeString()}` : `Version ${state.versions.length + 1}`);
    
    const newVersion: DesignVersion = {
      id: `ver_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      name: versionName,
      timestamp,
      objects: JSON.parse(JSON.stringify(state.objects)),
      textureOverlays: JSON.parse(JSON.stringify(state.textureOverlays)),
      autoSaved,
    };

    set({
      versions: [...state.versions, newVersion],
      currentVersionId: newVersion.id,
    });

    // Keep only last 50 versions to prevent memory bloat
    const { versions } = get();
    if (versions.length > 50) {
      set({ versions: versions.slice(-50) });
    }
  },

  restoreVersion: (versionId) => {
    const state = get();
    const version = state.versions.find((v) => v.id === versionId);
    
    if (!version) return;

    // Save current state as a version before restoring
    state.createVersion('Before restore', true);

    set({
      objects: JSON.parse(JSON.stringify(version.objects)),
      textureOverlays: JSON.parse(JSON.stringify(version.textureOverlays)),
      selectedId: null,
      past: [],
      future: [],
      currentVersionId: versionId,
    });
  },

  deleteVersion: (versionId) => {
    const state = get();
    set({
      versions: state.versions.filter((v) => v.id !== versionId),
      currentVersionId: state.currentVersionId === versionId ? null : state.currentVersionId,
    });
  },

  renameVersion: (versionId, newName) => {
    const state = get();
    set({
      versions: state.versions.map((v) =>
        v.id === versionId ? { ...v, name: newName } : v
      ),
    });
  },
}));
