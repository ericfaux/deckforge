import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'deckforge_onboarding_complete';

interface TourStep {
  target: string;
  title: string;
  description: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: TourStep[] = [
  {
    target: '[data-tour="canvas"]',
    title: 'Your Canvas',
    description: 'This is your canvas. Design your fingerboard deck graphic here!',
    placement: 'left',
  },
  {
    target: '[data-tour="tools"]',
    title: 'Design Tools',
    description: 'Use these tools to add text, stickers, shapes, and more',
    placement: 'right',
  },
  {
    target: '[data-tour="layers"]',
    title: 'Layers Panel',
    description: 'Manage your design layers here — drag to reorder',
    placement: 'left',
  },
  {
    target: '[data-tour="export"]',
    title: 'Export Your Design',
    description: "When you're done, export your design as PNG, SVG, or PDF",
    placement: 'bottom',
  },
  {
    target: '[data-tour="deck-size"]',
    title: 'Deck Size',
    description: 'Choose your deck size to match your fingerboard brand',
    placement: 'bottom',
  },
];

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check localStorage on mount + listen for reset events
  useEffect(() => {
    const shouldShow = !localStorage.getItem(STORAGE_KEY);
    if (shouldShow && window.innerWidth >= 768) {
      const timer = setTimeout(() => {
        setActive(true);
        // Fade in after a brief delay
        setTimeout(() => setVisible(true), 50);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for reset tour event
  useEffect(() => {
    const handler = () => {
      setStep(0);
      setActive(true);
      setTimeout(() => setVisible(true), 50);
    };
    window.addEventListener('deckforge-reset-tour', handler);
    return () => window.removeEventListener('deckforge-reset-tour', handler);
  }, []);

  // Update target rect when step changes or window resizes
  const updateTargetRect = useCallback(() => {
    if (!active) return;
    const currentStep = STEPS[step];
    if (!currentStep) return;
    const el = document.querySelector(currentStep.target);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      // Target not found — skip to next step
      if (step < STEPS.length - 1) {
        setStep(s => s + 1);
      } else {
        localStorage.setItem(STORAGE_KEY, 'true');
        setActive(false);
        setVisible(false);
      }
    }
  }, [active, step]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    return () => window.removeEventListener('resize', updateTargetRect);
  }, [updateTargetRect]);

  const complete = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, 'true');
      setActive(false);
    }, 200);
  }, []);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
      setVisible(false);
      setTimeout(() => {
        setStep(s => s + 1);
        setVisible(true);
      }, 150);
    } else {
      complete();
    }
  }, [step, complete]);

  if (!active || !targetRect) return null;

  const currentStep = STEPS[step];
  const pad = 6;

  // Spotlight rect with padding
  const spot = {
    top: targetRect.top - pad,
    left: targetRect.left - pad,
    width: targetRect.width + pad * 2,
    height: targetRect.height + pad * 2,
  };

  // Tooltip dimensions
  const tw = 300;
  const gap = 14;

  // Calculate tooltip position
  let tt = 0;
  let tl = 0;

  switch (currentStep.placement) {
    case 'right':
      tt = spot.top + spot.height / 2 - 80;
      tl = spot.left + spot.width + gap;
      break;
    case 'left':
      tt = spot.top + spot.height / 2 - 80;
      tl = spot.left - tw - gap;
      break;
    case 'bottom':
      tt = spot.top + spot.height + gap;
      tl = spot.left + spot.width / 2 - tw / 2;
      break;
    case 'top':
      tt = spot.top - 160 - gap;
      tl = spot.left + spot.width / 2 - tw / 2;
      break;
  }

  // Clamp to viewport
  tt = Math.max(8, Math.min(tt, window.innerHeight - 180));
  tl = Math.max(8, Math.min(tl, window.innerWidth - tw - 8));

  return (
    <div
      className={cn(
        'fixed inset-0 z-[10000] transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Click blocker */}
      <div
        className="absolute inset-0"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />

      {/* Spotlight hole with box-shadow overlay */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: spot.top,
          left: spot.left,
          width: spot.width,
          height: spot.height,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
          borderRadius: '2px',
        }}
      />

      {/* Spotlight border glow */}
      <div
        className="absolute pointer-events-none border-2 border-primary"
        style={{
          top: spot.top,
          left: spot.left,
          width: spot.width,
          height: spot.height,
          borderRadius: '2px',
          boxShadow: '0 0 24px hsl(75 100% 50% / 0.3), inset 0 0 24px hsl(75 100% 50% / 0.05)',
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute bg-card border-2 border-primary/80 p-4 shadow-2xl"
        style={{
          top: tt,
          left: tl,
          width: tw,
          borderRadius: '2px',
        }}
      >
        {/* Progress dots */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all duration-200',
                  i === step
                    ? 'bg-primary scale-125'
                    : i < step
                      ? 'bg-primary/40'
                      : 'bg-muted-foreground/30'
                )}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground font-mono tracking-wider">
            {step + 1}/{STEPS.length}
          </span>
        </div>

        {/* Content */}
        <h3 className="font-display text-sm uppercase tracking-widest text-primary mb-1.5">
          {currentStep.title}
        </h3>
        <p className="text-sm text-foreground/90 leading-relaxed mb-4">
          {currentStep.description}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={complete}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider font-medium"
          >
            Skip Tour
          </button>
          <button
            onClick={next}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors',
              'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
            style={{ borderRadius: '2px' }}
          >
            {step < STEPS.length - 1 ? (
              <>
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            ) : (
              "Let's Go!"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Call this to restart the onboarding tour */
export function resetOnboardingTour() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('deckforge-reset-tour'));
}
