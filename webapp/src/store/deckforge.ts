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
  type: 'image' | 'text' | 'shape' | 'sticker' | 'texture' | 'line' | 'path' | 'group';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  scaleX: number;
  scaleY: number;
  locked?: boolean; // Lock object to prevent moving/editing
  hidden?: boolean; // Hide object from canvas (still in layers)
  mixBlendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';
  // For groups
  children?: CanvasObject[]; // Child objects in a group
  // For text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  align?: 'left' | 'center' | 'right';
  letterSpacing?: number; // px
  lineHeight?: number; // multiplier (1.0 = normal, 1.5 = 1.5x, etc.)
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textDecoration?: 'none' | 'underline' | 'line-through';
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic';
  textShadow?: {
    enabled: boolean;
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
  // Gradient support
  fillType?: 'solid' | 'linear-gradient' | 'radial-gradient';
  gradientStops?: Array<{ offset: number; color: string }>; // e.g., [{offset: 0, color: '#ff0000'}, {offset: 1, color: '#0000ff'}]
  gradientAngle?: number; // 0-360 degrees for linear gradient
  // For images
  src?: string;
  // For shapes
  shapeType?: 'rect' | 'circle' | 'star' | 'polygon';
  polygonSides?: number; // For polygon: 3-20 sides
  // For patterns (CSS background patterns)
  patternType?: 'checkerboard' | 'speed-lines' | 'halftone' | 'noise' | 'tie-dye' | 'diagonal-stripes' | 'hexagons' | 'crosshatch';
  patternPrimaryColor?: string;
  patternSecondaryColor?: string;
  patternScale?: number;
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
  // Object effects
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
    blur: number;
    color: string;
    opacity: number;
  };
  outlineStroke?: {
    enabled: boolean;
    width: number;
    color: string;
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
  selectedIds: string[]; // Multi-select support

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
  showRulers: boolean; // Ruler overlay toggle

  // Background color
  backgroundColor: string;

  // Design metadata
  currentDesignId: string | null;
  designName: string;
  isSaving: boolean;

  // Visual feedback for copy/paste
  copiedObjectId: string | null;
  pastedObjectId: string | null;

  // Actions
  addObject: (obj: Omit<CanvasObject, 'id'>) => void;
  addObjects: (objs: Omit<CanvasObject, 'id'>[]) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  deleteObject: (id: string) => void;
  selectObject: (id: string | null) => void;
  toggleSelectObject: (id: string) => void; // Multi-select toggle
  setSelectedIds: (ids: string[]) => void; // Set multiple selections
  clearSelection: () => void; // Clear all selections
  alignObjects: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeObjects: (direction: 'horizontal' | 'vertical') => void;
  groupObjects: (ids: string[]) => void;
  ungroupObject: (groupId: string) => void;
  setActiveTool: (tool: ToolType | null) => void;
  toggleDrawer: (open?: boolean) => void;
  setStageScale: (scale: number) => void;
  setStagePosition: (pos: { x: number; y: number }) => void;
  moveLayer: (id: string, direction: 'up' | 'down') => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  toggleTexture: (id: TextureType) => void;
  updateTexture: (id: TextureType, updates: Partial<TextureOverlay>) => void;
  generatePattern: (sourceId: string, gap: number, randomRotation: number, deckWidth: number, deckHeight: number) => void;
  arrayDuplicate: (sourceId: string, rows: number, cols: number, gapX: number, gapY: number) => void;
  toggleHardwareGuide: () => void;
  toggleRulers: () => void;
  setBackgroundColor: (color: string) => void;
  
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

  // Visual feedback
  flashCopiedObject: (id: string) => void;
  flashPastedObject: (id: string) => void;
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
  selectedIds: [],
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
  showRulers: false,
  backgroundColor: '#ffffff',
  currentDesignId: null,
  designName: 'Untitled Design',
  isSaving: false,
  copiedObjectId: null,
  pastedObjectId: null,

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

  selectObject: (id) => set({ selectedId: id, selectedIds: id ? [id] : [] }),

  toggleSelectObject: (id) => {
    const { selectedIds } = get();
    const isSelected = selectedIds.includes(id);
    const newSelectedIds = isSelected
      ? selectedIds.filter(selectedId => selectedId !== id)
      : [...selectedIds, id];
    set({ 
      selectedIds: newSelectedIds,
      selectedId: newSelectedIds.length === 1 ? newSelectedIds[0] : null
    });
  },

  setSelectedIds: (ids) => set({ 
    selectedIds: ids,
    selectedId: ids.length === 1 ? ids[0] : null
  }),

  clearSelection: () => set({ selectedId: null, selectedIds: [] }),

  alignObjects: (alignment) => {
    const { selectedIds, objects } = get();
    if (selectedIds.length < 2) return;

    const state = get();
    state.saveToHistory();

    const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));
    
    if (alignment === 'left') {
      const minX = Math.min(...selectedObjects.map(obj => obj.x));
      selectedObjects.forEach(obj => {
        state.updateObject(obj.id, { x: minX });
      });
    } else if (alignment === 'center') {
      const centerX = selectedObjects.reduce((sum, obj) => sum + obj.x + (obj.width * obj.scaleX) / 2, 0) / selectedObjects.length;
      selectedObjects.forEach(obj => {
        state.updateObject(obj.id, { x: centerX - (obj.width * obj.scaleX) / 2 });
      });
    } else if (alignment === 'right') {
      const maxX = Math.max(...selectedObjects.map(obj => obj.x + obj.width * obj.scaleX));
      selectedObjects.forEach(obj => {
        state.updateObject(obj.id, { x: maxX - obj.width * obj.scaleX });
      });
    } else if (alignment === 'top') {
      const minY = Math.min(...selectedObjects.map(obj => obj.y));
      selectedObjects.forEach(obj => {
        state.updateObject(obj.id, { y: minY });
      });
    } else if (alignment === 'middle') {
      const centerY = selectedObjects.reduce((sum, obj) => sum + obj.y + (obj.height * obj.scaleY) / 2, 0) / selectedObjects.length;
      selectedObjects.forEach(obj => {
        state.updateObject(obj.id, { y: centerY - (obj.height * obj.scaleY) / 2 });
      });
    } else if (alignment === 'bottom') {
      const maxY = Math.max(...selectedObjects.map(obj => obj.y + obj.height * obj.scaleY));
      selectedObjects.forEach(obj => {
        state.updateObject(obj.id, { y: maxY - obj.height * obj.scaleY });
      });
    }
  },

  distributeObjects: (direction) => {
    const { selectedIds, objects } = get();
    if (selectedIds.length < 3) return; // Need at least 3 objects to distribute

    const state = get();
    state.saveToHistory();

    const selectedObjects = objects
      .filter(obj => selectedIds.includes(obj.id))
      .sort((a, b) => direction === 'horizontal' ? a.x - b.x : a.y - b.y);

    if (direction === 'horizontal') {
      const first = selectedObjects[0];
      const last = selectedObjects[selectedObjects.length - 1];
      const totalWidth = (last.x + last.width * last.scaleX) - first.x;
      const objectsWidth = selectedObjects.reduce((sum, obj) => sum + obj.width * obj.scaleX, 0);
      const totalGap = totalWidth - objectsWidth;
      const gap = totalGap / (selectedObjects.length - 1);

      let currentX = first.x + first.width * first.scaleX + gap;
      for (let i = 1; i < selectedObjects.length - 1; i++) {
        state.updateObject(selectedObjects[i].id, { x: currentX });
        currentX += selectedObjects[i].width * selectedObjects[i].scaleX + gap;
      }
    } else {
      const first = selectedObjects[0];
      const last = selectedObjects[selectedObjects.length - 1];
      const totalHeight = (last.y + last.height * last.scaleY) - first.y;
      const objectsHeight = selectedObjects.reduce((sum, obj) => sum + obj.height * obj.scaleY, 0);
      const totalGap = totalHeight - objectsHeight;
      const gap = totalGap / (selectedObjects.length - 1);

      let currentY = first.y + first.height * first.scaleY + gap;
      for (let i = 1; i < selectedObjects.length - 1; i++) {
        state.updateObject(selectedObjects[i].id, { y: currentY });
        currentY += selectedObjects[i].height * selectedObjects[i].scaleY + gap;
      }
    }
  },

  groupObjects: (ids) => {
    const { objects } = get();
    if (ids.length < 2) return;

    const state = get();
    state.saveToHistory();

    // Get all objects to group
    const childObjects = objects.filter(obj => ids.includes(obj.id));
    if (childObjects.length < 2) return;

    // Calculate bounding box
    const minX = Math.min(...childObjects.map(obj => obj.x));
    const minY = Math.min(...childObjects.map(obj => obj.y));
    const maxX = Math.max(...childObjects.map(obj => obj.x + obj.width * obj.scaleX));
    const maxY = Math.max(...childObjects.map(obj => obj.y + obj.height * obj.scaleY));
    
    const groupWidth = maxX - minX;
    const groupHeight = maxY - minY;

    // Create child objects with relative positions
    const children = childObjects.map(obj => ({
      ...obj,
      x: obj.x - minX, // Convert to relative position
      y: obj.y - minY,
    }));

    // Create group object
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const groupObject: CanvasObject = {
      id: groupId,
      type: 'group',
      x: minX,
      y: minY,
      width: groupWidth,
      height: groupHeight,
      rotation: 0,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      children,
    };

    // Remove individual objects and add group
    const remainingObjects = objects.filter(obj => !ids.includes(obj.id));
    set({
      objects: [...remainingObjects, groupObject],
      selectedIds: [groupId],
      selectedId: groupId,
    });
  },

  ungroupObject: (groupId) => {
    const { objects } = get();
    const groupObj = objects.find(obj => obj.id === groupId);
    
    if (!groupObj || groupObj.type !== 'group' || !groupObj.children) return;

    const state = get();
    state.saveToHistory();

    // Convert children back to absolute positions
    const ungroupedChildren = groupObj.children.map(child => ({
      ...child,
      id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // New IDs
      x: groupObj.x + child.x * groupObj.scaleX, // Convert back to absolute
      y: groupObj.y + child.y * groupObj.scaleY,
      // Apply group's scale and rotation to children
      scaleX: child.scaleX * groupObj.scaleX,
      scaleY: child.scaleY * groupObj.scaleY,
      rotation: child.rotation + groupObj.rotation,
    }));

    // Remove group and add children
    const remainingObjects = objects.filter(obj => obj.id !== groupId);
    const newChildIds = ungroupedChildren.map(c => c.id);
    
    set({
      objects: [...remainingObjects, ...ungroupedChildren],
      selectedIds: newChildIds,
      selectedId: null,
    });
  },

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

  bringToFront: (id) => {
    const state = get();
    state.saveToHistory();
    const index = state.objects.findIndex((obj) => obj.id === id);
    if (index === -1 || index === state.objects.length - 1) return;

    const newObjects = [...state.objects];
    const [obj] = newObjects.splice(index, 1);
    newObjects.push(obj);
    set({ objects: newObjects });
  },

  sendToBack: (id) => {
    const state = get();
    state.saveToHistory();
    const index = state.objects.findIndex((obj) => obj.id === id);
    if (index === -1 || index === 0) return;

    const newObjects = [...state.objects];
    const [obj] = newObjects.splice(index, 1);
    newObjects.unshift(obj);
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

  arrayDuplicate: (sourceId, rows, cols, gapX, gapY) => {
    const state = get();
    const sourceObj = state.objects.find((obj) => obj.id === sourceId);
    if (!sourceObj) return;

    state.saveToHistory();

    // Calculate spacing
    const objWidth = sourceObj.width * sourceObj.scaleX;
    const objHeight = sourceObj.height * sourceObj.scaleY;
    const offsetX = objWidth + gapX;
    const offsetY = objHeight + gapY;

    // Generate grid of duplicates
    const newObjects: Omit<CanvasObject, 'id'>[] = [];
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Skip the original position (0,0)
        if (row === 0 && col === 0) continue;
        
        const { id, ...objWithoutId } = sourceObj;
        newObjects.push({
          ...objWithoutId,
          x: sourceObj.x + (col * offsetX),
          y: sourceObj.y + (row * offsetY),
        });
      }
    }

    // Add all duplicates
    const duplicatedObjects = newObjects.map((obj) => ({
      ...obj,
      id: generateId(),
    }));

    set({
      objects: [...state.objects, ...duplicatedObjects],
      selectedId: null,
    });
  },

  toggleHardwareGuide: () => {
    set((state) => ({ showHardwareGuide: !state.showHardwareGuide }));
  },

  toggleRulers: () => {
    set((state) => ({ showRulers: !state.showRulers }));
  },

  setBackgroundColor: (color) => {
    set({ backgroundColor: color });
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

  flashCopiedObject: (id) => {
    set({ copiedObjectId: id });
    setTimeout(() => set({ copiedObjectId: null }), 400);
  },

  flashPastedObject: (id) => {
    set({ pastedObjectId: id });
    setTimeout(() => set({ pastedObjectId: null }), 600);
  },
}));
