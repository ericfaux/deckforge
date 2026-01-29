import { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, RotateCw, Settings } from 'lucide-react';
import { useDeckForgeStore } from '@/store/deckforge';
import { WorkbenchStage } from './WorkbenchStage';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface AnimationPreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnimationPreview({ isOpen, onClose }: AnimationPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(2); // degrees per frame
  const [currentRotation, setCurrentRotation] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (isOpen && isPlaying) {
      const animate = () => {
        setCurrentRotation((prev) => (prev + rotationSpeed) % 360);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOpen, isPlaying, rotationSpeed]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-black/80 backdrop-blur-sm border-b border-white/10 flex items-center px-4 z-10">
        <div className="flex items-center gap-2">
          <RotateCw className="w-5 h-5 text-primary" />
          <h2 className="font-display text-sm uppercase tracking-wider text-white">
            Animation Preview
          </h2>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors rounded"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white" />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors rounded ${
              showSettings ? 'bg-white/10' : ''
            }`}
            title="Settings"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors rounded"
            title="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute top-14 right-4 w-64 bg-card border border-border shadow-xl z-10 p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Rotation Speed</Label>
            <Slider
              value={[rotationSpeed]}
              onValueChange={([val]) => setRotationSpeed(val)}
              min={0.5}
              max={10}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Slow</span>
              <span>{rotationSpeed}°/frame</span>
              <span>Fast</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Current Angle</Label>
            <div className="text-lg font-mono text-center">
              {Math.round(currentRotation)}°
            </div>
          </div>

          <button
            onClick={() => setCurrentRotation(0)}
            className="w-full btn-brutal text-xs py-2"
          >
            Reset Rotation
          </button>
        </div>
      )}

      {/* Preview container */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle, rgba(40,40,40,1) 0%, rgba(0,0,0,1) 100%)',
        }}
      >
        <div
          className="relative"
          style={{
            transform: `perspective(1000px) rotateY(${currentRotation}deg)`,
            transformStyle: 'preserve-3d',
            transition: isPlaying ? 'none' : 'transform 0.3s ease',
          }}
        >
          {/* Shadow under deck */}
          <div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-8 rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 70%)',
              filter: 'blur(8px)',
            }}
          />

          {/* Deck preview - scaled up for visibility */}
          <div
            className="relative"
            style={{
              transform: 'scale(2.5)',
              filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))',
            }}
          >
            <WorkbenchStage />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center space-y-2">
        <p className="text-sm text-white/60 uppercase tracking-wider">
          {isPlaying ? 'Rotating...' : 'Paused'}
        </p>
        <p className="text-xs text-white/40">
          Use settings to adjust speed
        </p>
      </div>
    </div>
  );
}
