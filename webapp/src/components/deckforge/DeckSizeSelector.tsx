import { memo, useState } from 'react';
import { Ruler, Check } from 'lucide-react';
import { useDeckForgeStore } from '@/store/deckforge';
import { DECK_SIZES, getDeckSize } from '@/lib/deck-sizes';
import { Button } from '@/components/ui/button';
import { EnhancedTooltip } from '@/components/ui/enhanced-tooltip';
import { toastUtils } from '@/lib/toast-utils';
import { logger } from '@/lib/logger';

export const DeckSizeSelector = memo(function DeckSizeSelector() {
  const { deckSizeId, setDeckSize } = useDeckForgeStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentSize = getDeckSize(deckSizeId);

  logger.log('[DeckSizeSelector] Render - isOpen:', isOpen, 'currentSize:', currentSize.name);

  return (
    <div className="relative">
      <EnhancedTooltip content="Change deck size - Click to choose your board width!" shortcut="">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            logger.log('[DeckSizeSelector] Button clicked, isOpen:', isOpen);
            setIsOpen(!isOpen);
          }}
          className="gap-2 border-primary/30 hover:border-primary relative"
        >
          <Ruler className="w-4 h-4 text-primary" />
          <span className="text-xs font-mono font-semibold">{currentSize.name}</span>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
        </Button>
      </EnhancedTooltip>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-black/20"
            onClick={() => {
              logger.log('[DeckSizeSelector] Backdrop clicked');
              setIsOpen(false);
            }}
          />

          {/* Dropdown menu */}
          <div className="fixed right-4 top-20 bg-card border-2 border-primary shadow-2xl z-[9999] w-80 max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 mb-1">
                <Ruler className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Deck Size</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Choose your fingerboard deck width
              </p>
            </div>

            {/* Size options */}
            <div className="max-h-96 overflow-y-auto">
              {DECK_SIZES.map((size) => {
                const isSelected = size.id === deckSizeId;
                
                return (
                  <button
                    key={size.id}
                    onClick={() => {
                      logger.log('[DeckSizeSelector] Size clicked:', size.id);
                      setDeckSize(size.id);
                      setIsOpen(false);
                      logger.log('[DeckSizeSelector] Deck size changed to:', size.name);
                      toastUtils.success(
                        `Deck size changed to ${size.name}`,
                        `${size.width}mm × ${size.length}mm • ${size.recommended}`
                      );
                    }}
                    className={`w-full p-4 text-left hover:bg-secondary transition-colors border-b border-border last:border-b-0 ${
                      isSelected ? 'bg-secondary/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-semibold text-sm">
                            {size.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({size.width}mm × {size.length}mm)
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {size.description}
                        </p>
                        <p className="text-xs text-primary/80">
                          → {size.recommended}
                        </p>
                      </div>
                      
                      {isSelected && (
                        <Check className="w-5 h-5 text-primary shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Info footer */}
            <div className="p-3 bg-secondary/30 border-t border-border">
              <p className="text-xs text-muted-foreground">
                💡 32mm is the industry standard. Most pro riders use 32-34mm.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
});
