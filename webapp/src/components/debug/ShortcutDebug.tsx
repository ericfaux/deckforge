import { useState } from 'react';
import { validateShortcuts, checkShortcutConflict } from '@/lib/shortcut-validator';
import { SHORTCUTS } from '@/lib/shortcuts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Check, Info } from 'lucide-react';

/**
 * Debug component to visualize keyboard shortcut conflicts
 * Only rendered in development mode
 */
export function ShortcutDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [testShortcut, setTestShortcut] = useState('');
  const [testResult, setTestResult] = useState<string[]>([]);

  const conflicts = validateShortcuts();
  const totalShortcuts = Object.keys(SHORTCUTS).length;

  const handleTest = () => {
    if (!testShortcut) return;
    const result = checkShortcutConflict(testShortcut);
    setTestResult(result);
  };

  // Only render in development
  if (!import.meta.env.DEV) return null;

  return (
    <>
      {/* Floating debug button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] bg-yellow-500 text-black px-3 py-2 rounded-lg shadow-lg hover:bg-yellow-400 transition-colors text-xs font-mono"
        title="Debug: Keyboard Shortcuts"
      >
        🔍 Shortcuts
      </button>

      {/* Debug dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Keyboard Shortcut Debug
            </DialogTitle>
            <DialogDescription>
              Development-only tool to validate and test keyboard shortcuts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-secondary/50 p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Shortcuts:</span>
                <span className="font-mono font-semibold">{totalShortcuts}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">Conflicts Found:</span>
                <span className={`font-mono font-semibold ${conflicts.length > 0 ? 'text-destructive' : 'text-success'}`}>
                  {conflicts.length}
                </span>
              </div>
            </div>

            {/* Conflict list */}
            {conflicts.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <h3 className="font-semibold text-sm">Shortcut Conflicts</h3>
                </div>
                {conflicts.map((conflict, idx) => (
                  <div key={idx} className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                    <div className="font-mono text-sm font-semibold mb-2">
                      "{conflict.shortcut}"
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Used by: {conflict.actions.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-success bg-success/10 p-4 rounded-lg border border-success/30">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">No conflicts detected</span>
              </div>
            )}

            {/* Test shortcut */}
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="font-semibold text-sm">Test Shortcut</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter shortcut (e.g., Ctrl+Z)"
                  value={testShortcut}
                  onChange={(e) => setTestShortcut(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTest();
                  }}
                />
                <Button onClick={handleTest} size="sm">
                  Test
                </Button>
              </div>
              {testResult.length > 0 && (
                <div className="bg-secondary p-3 rounded-lg text-sm">
                  <div className="font-semibold mb-1">Conflicts with:</div>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {testResult.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
              {testShortcut && testResult.length === 0 && (
                <div className="text-sm text-success">
                  ✅ No conflicts found
                </div>
              )}
            </div>

            {/* All shortcuts list */}
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="font-semibold text-sm">All Shortcuts ({totalShortcuts})</h3>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-auto">
                {Object.entries(SHORTCUTS).map(([action, shortcut]) => (
                  <div key={action} className="text-xs bg-secondary/30 p-2 rounded">
                    <div className="font-mono text-primary">{action}</div>
                    <div className="text-muted-foreground">
                      {Array.isArray(shortcut) ? shortcut.join(' or ') : shortcut}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
