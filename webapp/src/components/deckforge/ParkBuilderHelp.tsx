import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Info } from 'lucide-react';

interface ParkBuilderHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ParkBuilderHelp({ open, onOpenChange }: ParkBuilderHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            What is Fingerpark Builder?
          </DialogTitle>
          <DialogDescription className="text-left space-y-4 pt-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">📐 Design Your Own Fingerboard Park</h3>
              <p className="text-sm">
                Fingerpark Builder is a top-down blueprint designer for fingerboarding skateparks. 
                Create custom park layouts with realistic obstacles, then export blueprints to build your own physical mini parks!
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">🛹 How It Works</h3>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li><strong>Pick obstacles</strong> from the left toolbar (quarter pipes, rails, stairs, ramps, boxes)</li>
                <li><strong>Click to add</strong> obstacles to your canvas</li>
                <li><strong>Drag to position</strong> and rotate obstacles to create your layout</li>
                <li><strong>Adjust properties</strong> on the right (size, height, rotation, color)</li>
                <li><strong>Export</strong> as PNG or PDF blueprint for building</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">🎨 Obstacle Types</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="font-medium text-primary">Ramps:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>Quarter Pipe (curved transition)</li>
                    <li>Half Pipe (dual quarters)</li>
                    <li>Bank Ramp (angled)</li>
                    <li>Launch Ramp (kicker)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-primary">Rails & Obstacles:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>Flat/Round/Kinked Rails</li>
                    <li>Ledges & Curbs</li>
                    <li>Stair Sets & Gaps</li>
                    <li>Boxes & Pyramids</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">💡 Pro Tips</h3>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Use the <strong>grid and ruler</strong> for precise alignment</li>
                <li>Each obstacle shows <strong>realistic geometry</strong> (curves on quarter pipes, angles on ramps)</li>
                <li>Dimensions are in <strong>inches</strong> (standard for fingerboard obstacles)</li>
                <li>Click <strong>Materials Estimate</strong> to see what you need to build it!</li>
                <li>Save your designs to iterate and share</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                ✨ <strong>New:</strong> Obstacles now render with realistic shapes! 
                Quarter pipes have curved transitions, ramps are angled, stairs have steps.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
