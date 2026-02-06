import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Search, ChevronDown, Upload, Clock, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  GoogleFont,
  FontCategory,
  FontSort,
  getGoogleFonts,
  filterByCategory,
  searchFonts,
  sortFonts,
  loadGoogleFontPreview,
  loadGoogleFont,
  isFontLoaded,
  getRecentFonts,
  addRecentFont,
  CATEGORY_LABELS,
} from '@/lib/google-fonts';
import { Font } from '@/lib/fonts';

interface GoogleFontPickerProps {
  value: string;
  onChange: (fontFamily: string) => void;
  userFonts: Font[];
  onUploadClick: () => void;
}

// Individual font item with Intersection Observer for lazy loading preview
const FontItem = memo(function FontItem({
  font,
  isSelected,
  onSelect,
}: {
  font: GoogleFont;
  isSelected: boolean;
  onSelect: (family: string) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [previewLoaded, setPreviewLoaded] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFontLoaded(font.family)) {
          loadGoogleFontPreview(font.family).then(() => setPreviewLoaded(true));
          observer.disconnect();
        } else if (entries[0].isIntersecting) {
          setPreviewLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [font.family]);

  return (
    <button
      ref={ref}
      onClick={() => onSelect(font.family)}
      className={`w-full text-left px-3 py-2 transition-colors flex items-center justify-between group ${
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-secondary/80'
      }`}
    >
      <span
        className="text-sm truncate flex-1"
        style={{
          fontFamily: previewLoaded || isFontLoaded(font.family) ? `"${font.family}", sans-serif` : 'inherit',
        }}
      >
        {font.family}
      </span>
      <span className={`text-[9px] uppercase tracking-wider ml-2 shrink-0 ${
        isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
      }`}>
        {font.category}
      </span>
    </button>
  );
});

// Custom font item (user-uploaded)
const CustomFontItem = memo(function CustomFontItem({
  font,
  isSelected,
  onSelect,
}: {
  font: Font;
  isSelected: boolean;
  onSelect: (fontFamily: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(font.font_family)}
      className={`w-full text-left px-3 py-2 transition-colors flex items-center justify-between ${
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-secondary/80'
      }`}
    >
      <span
        className="text-sm truncate flex-1"
        style={{ fontFamily: font.font_family }}
      >
        {font.name}
      </span>
      <span className={`text-[9px] uppercase tracking-wider ml-2 shrink-0 ${
        isSelected ? 'text-primary-foreground/70' : 'text-accent'
      }`}>
        Custom
      </span>
    </button>
  );
});

const CATEGORIES: (FontCategory | 'all')[] = ['all', 'sans-serif', 'serif', 'display', 'handwriting', 'monospace'];
const SORTS: { value: FontSort; label: string }[] = [
  { value: 'popular', label: 'Popular' },
  { value: 'trending', label: 'Trending' },
  { value: 'recent', label: 'Recent' },
];

export function GoogleFontPicker({ value, onChange, userFonts, onUploadClick }: GoogleFontPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<FontCategory | 'all'>('all');
  const [sort, setSort] = useState<FontSort>('popular');
  const [showRecent, setShowRecent] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const allFonts = getGoogleFonts();
  const recentFamilies = getRecentFonts();

  // Filter and sort
  let filteredFonts = allFonts;
  if (search) {
    filteredFonts = searchFonts(filteredFonts, search);
  } else {
    filteredFonts = filterByCategory(filteredFonts, category);
    filteredFonts = sortFonts(filteredFonts, sort);
  }

  // Recent fonts resolved to GoogleFont objects
  const recentFonts = recentFamilies
    .map(family => allFonts.find(f => f.family === family))
    .filter((f): f is GoogleFont => !!f)
    .slice(0, 10);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen]);

  // Focus search when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch('');
      setShowRecent(false);
    }
  }, [isOpen]);

  const handleSelect = useCallback((family: string) => {
    // Load the full font (all weights) when selected
    const gFont = allFonts.find(f => f.family === family);
    if (gFont) {
      loadGoogleFont(family, gFont.variants);
    }
    addRecentFont(family);
    onChange(family);
    setIsOpen(false);
  }, [allFonts, onChange]);

  // Resolve current display name
  const displayName = value || 'Select font';
  const isGoogleFont = allFonts.some(f => f.family === value);
  const isCustomFont = userFonts.some(f => f.font_family === value);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-8 text-xs bg-secondary border border-border px-2 cursor-pointer hover:border-primary transition-colors flex items-center justify-between"
      >
        <span
          className="truncate"
          style={{
            fontFamily: isGoogleFont || isCustomFont ? `"${value}", sans-serif` : undefined,
          }}
        >
          {displayName}
        </span>
        <ChevronDown className={`w-3 h-3 shrink-0 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border-2 border-border shadow-xl max-h-[400px] flex flex-col">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowRecent(false);
                }}
                placeholder="Search fonts..."
                className="h-7 text-xs pl-7 pr-7 bg-secondary border-border"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Category filters & sort - only show when not searching */}
          {!search && (
            <div className="px-2 py-1.5 border-b border-border space-y-1.5">
              {/* Categories */}
              <div className="flex flex-wrap gap-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setCategory(cat); setShowRecent(false); }}
                    className={`px-2 py-0.5 text-[9px] uppercase tracking-wider border transition-colors ${
                      category === cat && !showRecent
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary text-muted-foreground'
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
                {recentFonts.length > 0 && (
                  <button
                    onClick={() => setShowRecent(!showRecent)}
                    className={`px-2 py-0.5 text-[9px] uppercase tracking-wider border transition-colors flex items-center gap-0.5 ${
                      showRecent
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary text-muted-foreground'
                    }`}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    Recent
                  </button>
                )}
              </div>

              {/* Sort */}
              {!showRecent && (
                <div className="flex gap-1">
                  {SORTS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSort(s.value)}
                      className={`px-2 py-0.5 text-[9px] tracking-wider transition-colors ${
                        sort === s.value
                          ? 'text-foreground font-bold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Font list */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Custom fonts section */}
            {userFonts.length > 0 && !search && !showRecent && category === 'all' && (
              <div>
                <div className="px-3 py-1.5 bg-secondary/50 border-b border-border">
                  <span className="text-[9px] uppercase tracking-widest text-accent font-bold">
                    Your Custom Fonts
                  </span>
                </div>
                {userFonts.map((font) => (
                  <CustomFontItem
                    key={font.id}
                    font={font}
                    isSelected={value === font.font_family}
                    onSelect={(family) => {
                      onChange(family);
                      setIsOpen(false);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Recent fonts */}
            {showRecent && recentFonts.length > 0 && (
              <div>
                <div className="px-3 py-1.5 bg-secondary/50 border-b border-border">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                    Recently Used
                  </span>
                </div>
                {recentFonts.map((font) => (
                  <FontItem
                    key={font.family}
                    font={font}
                    isSelected={value === font.family}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}

            {/* Google Fonts */}
            {!showRecent && (
              <div>
                {(search || category !== 'all' || userFonts.length > 0) && (
                  <div className="px-3 py-1.5 bg-secondary/50 border-b border-border">
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                      Google Fonts
                      {search && ` (${filteredFonts.length} results)`}
                    </span>
                  </div>
                )}
                {filteredFonts.length === 0 ? (
                  <div className="px-3 py-6 text-center">
                    <p className="text-xs text-muted-foreground">No fonts found</p>
                  </div>
                ) : (
                  filteredFonts.map((font) => (
                    <FontItem
                      key={font.family}
                      font={font}
                      isSelected={value === font.family}
                      onSelect={handleSelect}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Upload button at bottom */}
          <div className="border-t border-border p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onUploadClick();
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] uppercase tracking-wider text-accent hover:text-accent/80 transition-colors border border-dashed border-border hover:border-accent"
            >
              <Upload className="w-3 h-3" />
              Upload Custom Font
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
