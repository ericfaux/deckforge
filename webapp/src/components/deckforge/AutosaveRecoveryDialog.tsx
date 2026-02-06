import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Trash2, RotateCcw } from 'lucide-react';
import { formatAutosaveTimestamp, type AutosaveData } from '@/lib/autosave';

interface AutosaveRecoveryDialogProps {
  open: boolean;
  autosaveData: AutosaveData | null;
  onRecover: () => void;
  onDiscard: () => void;
}

export function AutosaveRecoveryDialog({
  open,
  autosaveData,
  onRecover,
  onDiscard,
}: AutosaveRecoveryDialogProps) {
  if (!autosaveData) return null;

  const objectCount = autosaveData.objects.length;
  const timestamp = formatAutosaveTimestamp(autosaveData.timestamp);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onDiscard(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-primary" />
            Recover unsaved design?
          </DialogTitle>
          <DialogDescription>
            We found an unsaved design from <strong>{timestamp}</strong> with{' '}
            {objectCount} object{objectCount !== 1 ? 's' : ''}.
            {autosaveData.designName !== 'Untitled Design' && (
              <> Design name: <strong>{autosaveData.designName}</strong>.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border text-sm text-muted-foreground">
          <Clock className="w-4 h-4 shrink-0" />
          <span>This design was auto-saved locally on your device.</span>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onDiscard} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Discard
          </Button>
          <Button onClick={onRecover} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Recover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
