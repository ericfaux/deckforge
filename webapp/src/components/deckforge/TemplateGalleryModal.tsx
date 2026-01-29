import { useState } from 'react';
import { X, Search, Download, Star } from 'lucide-react';
import { CanvasObject } from '@/store/deckforge';
import { useDeckForgeStore } from '@/store/deckforge';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'street' | 'retro' | 'minimal' | 'edgy' | 'pro';
  objects: CanvasObject[];
  featured?: boolean;
}

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Pre-built template designs
const TEMPLATES: Template[] = [
  {
    id: 'street-graffiti',
    name: 'Street Graffiti',
    description: 'Bold urban style with splatter effects',
    thumbnail: '🎨',
    category: 'street',
    featured: true,
    objects: [
      {
        id: 'bg-1',
        type: 'sticker',
        icon: '💧',
        emoji: '💧',
        x: 50,
        y: 50,
        width: 120,
        height: 120,
        rotation: -15,
        scaleX: 3,
        scaleY: 3,
        opacity: 0.3,
        colorize: '#ff6600',
      },
      {
        id: 'text-1',
        type: 'text',
        text: 'STREET',
        x: 100,
        y: 800,
        width: 550,
        height: 200,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        fontFamily: 'Impact',
        fontSize: 120,
        fontWeight: 'bold',
        fill: '#000000',
        stroke: '#ccff00',
        strokeWidth: 8,
      },
    ],
  },
  {
    id: 'retro-wave',
    name: 'Retro Wave',
    description: 'Synthwave vibes with gradients',
    thumbnail: '🌆',
    category: 'retro',
    featured: true,
    objects: [
      {
        id: 'pattern-1',
        type: 'pattern',
        patternType: 'diagonal-stripes',
        primaryColor: '#ff00ff',
        secondaryColor: '#00ffff',
        x: 0,
        y: 0,
        width: 750,
        height: 2450,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 0.3,
      },
      {
        id: 'text-2',
        type: 'text',
        text: 'RETRO',
        x: 120,
        y: 1000,
        width: 500,
        height: 150,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        fontFamily: 'Arial',
        fontSize: 100,
        fontWeight: 'bold',
        fill: '#ff00ff',
        stroke: '#00ffff',
        strokeWidth: 4,
      },
      {
        id: 'sticker-1',
        type: 'sticker',
        icon: '🎮',
        emoji: '🎮',
        x: 300,
        y: 400,
        width: 150,
        height: 150,
        rotation: 20,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        colorize: '#ff00ff',
      },
    ],
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Simple geometric shapes',
    thumbnail: '⚪',
    category: 'minimal',
    objects: [
      {
        id: 'shape-1',
        type: 'shape',
        shapeType: 'rect',
        x: 100,
        y: 800,
        width: 550,
        height: 850,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 4,
      },
      {
        id: 'shape-2',
        type: 'shape',
        shapeType: 'circle',
        x: 275,
        y: 1000,
        width: 200,
        height: 200,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        fill: '#000000',
      },
    ],
  },
  {
    id: 'edgy-skull',
    name: 'Edgy Skull',
    description: 'Dark theme with skull graphics',
    thumbnail: '💀',
    category: 'edgy',
    featured: true,
    objects: [
      {
        id: 'bg-2',
        type: 'texture',
        textureType: 'carbon-fiber',
        x: 0,
        y: 0,
        width: 750,
        height: 2450,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 0.5,
      },
      {
        id: 'sticker-2',
        type: 'sticker',
        icon: '💀',
        emoji: '💀',
        x: 225,
        y: 900,
        width: 300,
        height: 300,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        colorize: '#ffffff',
      },
      {
        id: 'sticker-3',
        type: 'sticker',
        icon: '⚡',
        emoji: '⚡',
        x: 100,
        y: 1300,
        width: 80,
        height: 80,
        rotation: -25,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        colorize: '#ccff00',
      },
      {
        id: 'sticker-4',
        type: 'sticker',
        icon: '⚡',
        emoji: '⚡',
        x: 570,
        y: 1300,
        width: 80,
        height: 80,
        rotation: 25,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        colorize: '#ccff00',
      },
    ],
  },
  {
    id: 'pro-flames',
    name: 'Pro Flames',
    description: 'Professional racing design',
    thumbnail: '🔥',
    category: 'pro',
    objects: [
      {
        id: 'bg-3',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width: 750,
        height: 2450,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        fill: '#000000',
      },
      {
        id: 'sticker-5',
        type: 'sticker',
        icon: '🔥',
        emoji: '🔥',
        x: 100,
        y: 200,
        width: 150,
        height: 150,
        rotation: -30,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.8,
        colorize: '#ff6600',
      },
      {
        id: 'sticker-6',
        type: 'sticker',
        icon: '🔥',
        emoji: '🔥',
        x: 500,
        y: 2100,
        width: 150,
        height: 150,
        rotation: 150,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.8,
        colorize: '#ff6600',
      },
      {
        id: 'line-1',
        type: 'line',
        x: 50,
        y: 1200,
        width: 650,
        height: 4,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        stroke: '#ff6600',
        strokeWidth: 4,
      },
    ],
  },
  {
    id: 'nature-zen',
    name: 'Nature Zen',
    description: 'Peaceful natural elements',
    thumbnail: '🌿',
    category: 'minimal',
    objects: [
      {
        id: 'bg-4',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width: 750,
        height: 2450,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        fill: '#e8f5e9',
      },
      {
        id: 'sticker-7',
        type: 'sticker',
        icon: '🌿',
        emoji: '🌿',
        x: 150,
        y: 500,
        width: 100,
        height: 100,
        rotation: -15,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.6,
      },
      {
        id: 'sticker-8',
        type: 'sticker',
        icon: '🌿',
        emoji: '🌿',
        x: 500,
        y: 1800,
        width: 100,
        height: 100,
        rotation: 15,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.6,
      },
      {
        id: 'text-3',
        type: 'text',
        text: 'ZEN',
        x: 250,
        y: 1100,
        width: 250,
        height: 100,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        fontFamily: 'Georgia',
        fontSize: 80,
        fill: '#2e7d32',
      },
    ],
  },
];

export function TemplateGalleryModal({ isOpen, onClose }: TemplateGalleryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { setObjects, saveToHistory } = useDeckForgeStore();

  if (!isOpen) return null;

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'street', label: 'Street' },
    { value: 'retro', label: 'Retro' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'edgy', label: 'Edgy' },
    { value: 'pro', label: 'Pro' },
  ];

  // Filter templates
  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: Template) => {
    // Deep clone objects to prevent reference issues
    const newObjects = template.objects.map((obj) => ({
      ...obj,
      id: `${obj.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));

    setObjects(newObjects);
    saveToHistory();
    toast.success(`Applied template: ${template.name}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Template Gallery</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Start with a professional design
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">No templates found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer bg-white dark:bg-gray-900"
                  onClick={() => handleUseTemplate(template)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-[3/8] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-8xl relative">
                    {template.thumbnail}
                    {template.featured && (
                      <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full flex items-center gap-1 text-xs font-bold">
                        <Star className="w-3 h-3 fill-current" />
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-blue-500 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {template.description}
                    </p>

                    {/* Use Button */}
                    <button className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            💡 Tip: Templates will replace your current design. Save your work first!
          </p>
        </div>
      </div>
    </div>
  );
}
