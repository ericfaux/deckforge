/**
 * Centralized keyboard shortcuts for consistent display across the app
 * Use these constants to ensure tooltips show the correct shortcuts
 */

export const SHORTCUTS = {
  // Editing
  UNDO: 'Ctrl+Z',
  REDO: 'Ctrl+Shift+Z',
  DUPLICATE: 'Ctrl+D',
  ARRAY_DUPLICATE: 'Ctrl+Shift+D',
  COPY: 'Ctrl+C',
  PASTE: 'Ctrl+V',
  DELETE: ['Delete', 'Backspace'],
  SELECT_ALL: 'Ctrl+A',
  LOCK_TOGGLE: 'Ctrl+L',
  GROUP: 'Ctrl+G',
  UNGROUP: 'Ctrl+Shift+G',
  
  // Layers
  BRING_FORWARD: 'Ctrl+]',
  SEND_BACKWARD: 'Ctrl+[',
  BRING_TO_FRONT: 'Ctrl+Shift+]',
  SEND_TO_BACK: 'Ctrl+Shift+[',
  
  // Alignment
  ALIGN_LEFT: 'Ctrl+Shift+L',
  ALIGN_RIGHT: 'Ctrl+Shift+R',
  ALIGN_CENTER: 'Ctrl+Shift+C',
  ALIGN_TOP: 'Ctrl+Shift+T',
  ALIGN_BOTTOM: 'Ctrl+Shift+B',
  ALIGN_MIDDLE: 'Ctrl+Shift+M',
  
  // View
  ZOOM_RESET: 'Ctrl+0',
  ZOOM_FIT: 'Ctrl+1',
  TOGGLE_RULERS: 'Ctrl+Shift+R',
  TOGGLE_GRID: 'Ctrl+\'',
  PAN_CANVAS: 'Space+Drag',
  
  // Tools
  TEXT_TOOL: 'T',
  RECTANGLE_TOOL: 'R',
  CIRCLE_TOOL: 'C',
  LINE_TOOL: 'L',
  MOVE_TOOL: 'V',
  PEN_TOOL: 'P',
  
  // File
  SAVE: 'Ctrl+S',
  EXPORT: 'Ctrl+E',
  NEW: 'Ctrl+N',
  OPEN: 'Ctrl+O',
  
  // Selection
  DESELECT: 'Esc',
  SELECT_NEXT: 'Tab',
  SELECT_PREV: 'Shift+Tab',
  
  // Transform
  NUDGE_UP: '↑',
  NUDGE_DOWN: '↓',
  NUDGE_LEFT: '←',
  NUDGE_RIGHT: '→',
  NUDGE_BIG_UP: 'Shift+↑',
  NUDGE_BIG_DOWN: 'Shift+↓',
  NUDGE_BIG_LEFT: 'Shift+←',
  NUDGE_BIG_RIGHT: 'Shift+→',
} as const;

/**
 * Format shortcut for display in kbd element
 * Handles arrays (e.g., ['Delete', 'Backspace']) and strings
 */
export function formatShortcut(shortcut: string | string[]): string {
  if (Array.isArray(shortcut)) {
    return shortcut.join(' or ');
  }
  return shortcut;
}

/**
 * Parse shortcut into display keys
 * e.g., "Ctrl+Shift+Z" -> ["Ctrl", "Shift", "Z"]
 */
export function parseShortcut(shortcut: string): string[] {
  return shortcut.split('+');
}
