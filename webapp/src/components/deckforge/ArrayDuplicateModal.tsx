import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Grid3x3, X } from 'lucide-react';

interface ArrayDuplicateModalProps {
  open: boolean;
  onClose: () => void;
  onDuplicate: (rows: number, cols: number, gapX: number, gapY: number) => void;
}

export function ArrayDuplicateModal({ open, onClose, onDuplicate }: ArrayDuplicateModalProps) {
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [gapX, setGapX] = useState(10);
  const [gapY, setGapY] = useState(10);

  const handleDuplicate = () => {
    if (rows > 0 && cols > 0 && rows <= 20 && cols <= 20) {
      onDuplicate(rows, cols, gapX, gapY);
      onClose();
      // Reset to defaults
      setRows(2);
      setCols(2);
      setGapX(10);
      setGapY(10);
    }
  };

  const totalCopies = (rows * cols) - 1; // Subtract 1 for original

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-primary" />
            Array Duplicate
          </DialogTitle>
          <DialogDescription>
            Create a grid of duplicates from the selected object
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Grid Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rows">Rows</Label>
              <Input
                id="rows"
                type="number"
                min="1"
                max="20"
                value={rows}
                onChange={(e) => setRows(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cols">Columns</Label>
              <Input
                id="cols"
                type="number"
                min="1"
                max="20"
                value={cols}
                onChange={(e) => setCols(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="font-mono"
              />
            </div>
          </div>

          {/* Spacing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gapX">Horizontal Gap (px)</Label>
              <Input
                id="gapX"
                type="number"
                min="0"
                max="500"
                value={gapX}
                onChange={(e) => setGapX(Math.max(0, Math.min(500, parseInt(e.target.value) || 0)))}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gapY">Vertical Gap (px)</Label>
              <Input
                id="gapY"
                type="number"
                min="0"
                max="500"
                value={gapY}
                onChange={(e) => setGapY(Math.max(0, Math.min(500, parseInt(e.target.value) || 0)))}
                className="font-mono"
              />
            </div>
          </div>

          {/* Preview Info */}
          <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Grid Size:</span>
              <span className="font-mono font-semibold">
                {rows} × {cols}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-muted-foreground">Total Copies:</span>
              <span className="font-mono font-semibold text-primary">
                {totalCopies}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            onClick={handleDuplicate}
            className="gap-2 btn-brutal bg-primary text-primary-foreground"
            disabled={rows < 1 || cols < 1 || rows > 20 || cols > 20}
          >
            <Grid3x3 className="w-4 h-4" />
            Create {totalCopies} {totalCopies === 1 ? 'Copy' : 'Copies'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
