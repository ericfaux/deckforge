import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeckForgeStore } from '@/store/deckforge';
import { templates, templateCategories, Template } from '@/lib/templates';
import { generateThumbnail } from '@/lib/generateTemplateThumbnails';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Sparkles } from 'lucide-react';

export default function Templates() {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [templatesWithThumbnails, setTemplatesWithThumbnails] = useState<Template[]>(templates);
  const { loadDesign } = useDeckForgeStore();
  const navigate = useNavigate();

  // Generate thumbnails on mount
  useEffect(() => {
    const generateThumbnails = () => {
      const updated = templates.map(template => {
        if (!template.thumbnail) {
          return {
            ...template,
            thumbnail: generateThumbnail(template),
          };
        }
        return template;
      });
      setTemplatesWithThumbnails(updated);
    };

    // Small delay to ensure DOM is ready
    setTimeout(generateThumbnails, 100);
  }, []);

  const filteredTemplates = useMemo(() => {
    let filtered = templatesWithThumbnails;

    // Apply category filter
    if (category !== 'all') {
      filtered = filtered.filter(t => t.category === category);
    }

    // Apply search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }

    return filtered;
  }, [searchQuery, category, templatesWithThumbnails]);

  const useTemplate = (templateId: string) => {
    const template = templatesWithThumbnails.find(t => t.id === templateId);
    if (!template) return;

    loadDesign({
      objects: template.objects,
      name: template.name,
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center px-6 bg-card">
        <h1 className="font-display text-xl uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span>Templates</span>
        </h1>
        <div className="ml-auto flex items-center gap-4">
          <Button size="sm" variant="outline" onClick={() => navigate('/')}>
            Back to Editor
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-6 py-8">
        {/* Search + Category Filters */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap">
            {templateCategories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  category === cat.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates grid */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No templates found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="group border border-border hover:border-primary transition-colors bg-card overflow-hidden cursor-pointer rounded-lg"
                onClick={() => useTemplate(template.id)}
              >
                {/* Thumbnail */}
                <div className="aspect-[32/98] bg-muted flex items-center justify-center overflow-hidden relative">
                  {template.thumbnail ? (
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">
                        {template.name}
                      </p>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="sm" variant="default">
                      Use Template
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <h3 className="font-display text-sm uppercase tracking-widest">
                    {template.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {template.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 pt-2">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-primary/10 text-primary rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
