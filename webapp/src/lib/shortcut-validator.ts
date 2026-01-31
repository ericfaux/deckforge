import { SHORTCUTS } from './shortcuts';

interface ShortcutConflict {
  shortcut: string | string[];
  actions: string[];
}

/**
 * Validate keyboard shortcuts for conflicts
 * Returns list of conflicts where same key combo is used for multiple actions
 */
export function validateShortcuts(): ShortcutConflict[] {
  const conflicts: ShortcutConflict[] = [];
  const shortcutMap = new Map<string, string[]>();

  // Build map of shortcuts to action names
  Object.entries(SHORTCUTS).forEach(([actionName, shortcut]) => {
    const shortcuts = Array.isArray(shortcut) ? shortcut : [shortcut];
    
    shortcuts.forEach((key) => {
      const normalized = normalizeShortcut(key);
      if (!shortcutMap.has(normalized)) {
        shortcutMap.set(normalized, []);
      }
      shortcutMap.get(normalized)!.push(actionName);
    });
  });

  // Find conflicts (shortcuts with multiple actions)
  shortcutMap.forEach((actions, shortcut) => {
    if (actions.length > 1) {
      conflicts.push({
        shortcut: shortcut,
        actions: actions,
      });
    }
  });

  return conflicts;
}

/**
 * Normalize shortcut for comparison
 * Handles case insensitivity and modifier key order
 */
function normalizeShortcut(shortcut: string): string {
  const parts = shortcut.split('+').map(p => p.trim().toLowerCase());
  
  // Sort modifiers alphabetically for consistent comparison
  const modifiers = ['alt', 'ctrl', 'meta', 'shift'];
  const sortedModifiers = parts.filter(p => modifiers.includes(p)).sort();
  const keys = parts.filter(p => !modifiers.includes(p));
  
  return [...sortedModifiers, ...keys].join('+');
}

/**
 * Check if a specific shortcut conflicts with existing ones
 */
export function checkShortcutConflict(shortcut: string): string[] {
  const normalized = normalizeShortcut(shortcut);
  const conflicts: string[] = [];

  Object.entries(SHORTCUTS).forEach(([actionName, existingShortcut]) => {
    const existing = Array.isArray(existingShortcut) ? existingShortcut : [existingShortcut];
    
    existing.forEach((key) => {
      if (normalizeShortcut(key) === normalized) {
        conflicts.push(actionName);
      }
    });
  });

  return conflicts;
}

/**
 * Get all shortcuts for an action
 */
export function getShortcutsForAction(actionName: keyof typeof SHORTCUTS): string[] {
  const shortcut = SHORTCUTS[actionName];
  return Array.isArray(shortcut) ? shortcut : [shortcut];
}

/**
 * Validate and log conflicts to console (dev mode)
 */
export function logShortcutConflicts() {
  const conflicts = validateShortcuts();
  
  if (conflicts.length === 0) {
    console.log('✅ No keyboard shortcut conflicts detected');
    return;
  }

  console.warn(`⚠️ Found ${conflicts.length} keyboard shortcut conflicts:`);
  conflicts.forEach(({ shortcut, actions }) => {
    console.warn(`  "${shortcut}" is used by:`, actions);
  });
}
