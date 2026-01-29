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

// Pre-built template designs - GENUINE SKATE CULTURE
const TEMPLATES: Template[] = [
  {
    id: 'tag-city',
    name: 'Tag City',
    description: 'Layered graffiti tags - NYC underground',
    thumbnail: '✍️',
    category: 'street',
    featured: true,
    objects: [
      // Black background
      {
        id: 'bg-black',
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
      // Main tag diagonal
      {
        id: 'tag-main',
        type: 'text',
        text: 'SKATE',
        x: 50,
        y: 900,
        width: 650,
        height: 200,
        scaleX: 1,
        scaleY: 1,
        rotation: -8,
        opacity: 1,
        fontFamily: 'Impact',
        fontSize: 140,
        fontWeight: 'bold',
        fill: '#ff0000',
        stroke: '#ffffff',
        strokeWidth: 6,
      },
      // Background tag
      {
        id: 'tag-bg',
        type: 'text',
        text: 'FRESH',
        x: 80,
        y: 400,
        width: 600,
        height: 150,
        scaleX: 1,
        scaleY: 1,
        rotation: 5,
        opacity: 0.4,
        fontFamily: 'Arial',
        fontSize: 100,
        fontWeight: 'bold',
        fill: '#00ff00',
        stroke: '#000000',
        strokeWidth: 3,
      },
      // Drip effects
      {
        id: 'drip-1',
        type: 'sticker',
        icon: '💧',
        emoji: '💧',
        x: 200,
        y: 1100,
        width: 40,
        height: 40,
        rotation: 0,
        scaleX: 1,
        scaleY: 1.5,
        opacity: 0.8,
        colorize: '#ff0000',
      },
      {
        id: 'drip-2',
        type: 'sticker',
        icon: '💧',
        emoji: '💧',
        x: 500,
        y: 1120,
        width: 35,
        height: 35,
        rotation: 0,
        scaleX: 1,
        scaleY: 1.8,
        opacity: 0.7,
        colorize: '#ff0000',
      },
    ],
  },
  {
    id: 'thrasher-flames',
    name: 'Thrasher Flames',
    description: 'Classic flame logo - magazine vibes',
    thumbnail: '🔥',
    category: 'edgy',
    featured: true,
    objects: [
      // Orange gradient background
      {
        id: 'bg-gradient',
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
        fillType: 'linear-gradient',
        gradientStops: [
          { offset: 0, color: '#ff4500' },
          { offset: 1, color: '#000000' },
        ],
        gradientAngle: 180,
        fill: '#ff4500',
      },
      // Flame stickers
      {
        id: 'flame-1',
        type: 'sticker',
        icon: '🔥',
        emoji: '🔥',
        x: 50,
        y: 200,
        width: 120,
        height: 120,
        rotation: -20,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.6,
        colorize: '#ffff00',
      },
      {
        id: 'flame-2',
        type: 'sticker',
        icon: '🔥',
        emoji: '🔥',
        x: 580,
        y: 300,
        width: 100,
        height: 100,
        rotation: 15,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.6,
        colorize: '#ffff00',
      },
      // Bold text
      {
        id: 'text-mag',
        type: 'text',
        text: 'BURN',
        x: 120,
        y: 1000,
        width: 510,
        height: 180,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        fontFamily: 'Impact',
        fontSize: 120,
        fontWeight: 'bold',
        fill: '#000000',
        stroke: '#ffff00',
        strokeWidth: 10,
      },
      {
        id: 'flame-3',
        type: 'sticker',
        icon: '🔥',
        emoji: '🔥',
        x: 300,
        y: 2100,
        width: 150,
        height: 150,
        rotation: 180,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.5,
        colorize: '#ffff00',
      },
    ],
  },
  {
    id: 'tokyo-drift',
    name: 'Tokyo Drift',
    description: 'Japanese street culture aesthetic',
    thumbnail: '🗾',
    category: 'street',
    featured: true,
    objects: [
      // Rising sun pattern
      {
        id: 'rising-sun',
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
        fillType: 'linear-gradient',
        gradientStops: [
          { offset: 0, color: '#ffffff' },
          { offset: 0.2, color: '#ff0000' },
          { offset: 0.4, color: '#ffffff' },
          { offset: 0.6, color: '#ff0000' },
          { offset: 0.8, color: '#ffffff' },
          { offset: 1, color: '#ff0000' },
        ],
        gradientAngle: 0,
        fill: '#ffffff',
      },
      // Bold kanji-style text (using western letters)
      {
        id: 'text-jp',
        type: 'text',
        text: 'TOKYO',
        x: 100,
        y: 800,
        width: 550,
        height: 200,
        scaleX: 1,
        scaleY: 1,
        rotation: 90,
        opacity: 1,
        fontFamily: 'Impact',
        fontSize: 100,
        fontWeight: 'bold',
        fill: '#000000',
        stroke: '#ffffff',
        strokeWidth: 4,
      },
      // Circle badge
      {
        id: 'circle',
        type: 'shape',
        shapeType: 'circle',
        x: 250,
        y: 1000,
        width: 250,
        height: 250,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 8,
      },
    ],
  },
  {
    id: 'vhs-glitch',
    name: 'VHS Glitch',
    description: '90s nostalgia - analog errors',
    thumbnail: '📼',
    category: 'retro',
    featured: true,
    objects: [
      // Scan line pattern
      {
        id: 'scanlines',
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
        patternType: 'speed-lines',
        patternPrimaryColor: '#000000',
        patternSecondaryColor: '#0a0a0a',
        patternScale: 3,
        fill: '#000000',
      },
      // Glitchy text offset
      {
        id: 'text-glitch-bg',
        type: 'text',
        text: 'ANALOG',
        x: 93,
        y: 1003,
        width: 600,
        height: 150,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 0.5,
        fontFamily: 'Courier New',
        fontSize: 80,
        fontWeight: 'bold',
        fill: '#00ffff',
      },
      {
        id: 'text-glitch-main',
        type: 'text',
        text: 'ANALOG',
        x: 90,
        y: 1000,
        width: 600,
        height: 150,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        fontFamily: 'Courier New',
        fontSize: 80,
        fontWeight: 'bold',
        fill: '#ff00ff',
      },
      // Timestamp
      {
        id: 'timestamp',
        type: 'text',
        text: 'REC 03:14',
        x: 50,
        y: 2300,
        width: 200,
        height: 40,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 0.8,
        fontFamily: 'Courier New',
        fontSize: 20,
        fill: '#ff0000',
      },
    ],
  },
  {
    id: 'death-metal',
    name: 'Death Metal',
    description: 'Gothic band logo vibes',
    thumbnail: '🤘',
    category: 'edgy',
    objects: [
      // Black background
      {
        id: 'bg-black-metal',
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
      // Skull center
      {
        id: 'skull-main',
        type: 'sticker',
        icon: '💀',
        emoji: '💀',
        x: 175,
        y: 800,
        width: 400,
        height: 400,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        colorize: '#ffffff',
      },
      // Swords crossed
      {
        id: 'sword-1',
        type: 'sticker',
        icon: '🗡️',
        emoji: '🗡️',
        x: 100,
        y: 900,
        width: 150,
        height: 150,
        rotation: -45,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.8,
        colorize: '#808080',
      },
      {
        id: 'sword-2',
        type: 'sticker',
        icon: '🗡️',
        emoji: '🗡️',
        x: 500,
        y: 900,
        width: 150,
        height: 150,
        rotation: 45,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.8,
        colorize: '#808080',
      },
      // Gothic text
      {
        id: 'text-metal',
        type: 'text',
        text: 'VOID',
        x: 180,
        y: 1400,
        width: 400,
        height: 120,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        fontFamily: 'Impact',
        fontSize: 90,
        fontWeight: 'bold',
        fill: '#ffffff',
        stroke: '#ff0000',
        strokeWidth: 3,
      },
    ],
  },
  {
    id: 'sticker-bomb',
    name: 'Sticker Bomb',
    description: 'Chaotic sticker collage',
    thumbnail: '✨',
    category: 'street',
    objects: [
      // White base
      {
        id: 'bg-white',
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
        fill: '#f0f0f0',
      },
      // Scattered stickers (randomized positions and rotations)
      {
        id: 'st-1',
        type: 'sticker',
        icon: '⚡',
        emoji: '⚡',
        x: 100,
        y: 300,
        width: 80,
        height: 80,
        rotation: -15,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        colorize: '#ffff00',
      },
      {
        id: 'st-2',
        type: 'sticker',
        icon: '💀',
        emoji: '💀',
        x: 550,
        y: 400,
        width: 90,
        height: 90,
        rotation: 20,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        colorize: '#000000',
      },
      {
        id: 'st-3',
        type: 'sticker',
        icon: '🔥',
        emoji: '🔥',
        x: 300,
        y: 600,
        width: 70,
        height: 70,
        rotation: -30,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        colorize: '#ff6600',
      },
      {
        id: 'st-4',
        type: 'sticker',
        icon: '👁️',
        emoji: '👁️',
        x: 150,
        y: 800,
        width: 100,
        height: 100,
        rotation: 10,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        colorize: '#0000ff',
      },
      {
        id: 'st-5',
        type: 'sticker',
        icon: '🎸',
        emoji: '🎸',
        x: 500,
        y: 1000,
        width: 110,
        height: 110,
        rotation: -20,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        colorize: '#ff0000',
      },
      {
        id: 'st-6',
        type: 'sticker',
        icon: '🌙',
        emoji: '🌙',
        x: 200,
        y: 1200,
        width: 85,
        height: 85,
        rotation: 45,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        colorize: '#ffff00',
      },
      {
        id: 'st-7',
        type: 'sticker',
        icon: '☠️',
        emoji: '☠️',
        x: 600,
        y: 1400,
        width: 95,
        height: 95,
        rotation: -10,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        colorize: '#000000',
      },
      {
        id: 'st-8',
        type: 'sticker',
        icon: '🎯',
        emoji: '🎯',
        x: 350,
        y: 1600,
        width: 75,
        height: 75,
        rotation: 25,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        colorize: '#ff0000',
      },
      {
        id: 'st-9',
        type: 'sticker',
        icon: '⚔️',
        emoji: '⚔️',
        x: 100,
        y: 1800,
        width: 90,
        height: 90,
        rotation: -35,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        colorize: '#808080',
      },
      {
        id: 'st-10',
        type: 'sticker',
        icon: '🍕',
        emoji: '🍕',
        x: 550,
        y: 2000,
        width: 80,
        height: 80,
        rotation: 15,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
      },
    ],
  },
  {
    id: 'xerox-punk',
    name: 'Xerox Punk',
    description: 'High contrast photocopied zine',
    thumbnail: '📋',
    category: 'edgy',
    objects: [
      // White background
      {
        id: 'bg-xerox',
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
        fill: '#ffffff',
      },
      // Black noise texture
      {
        id: 'noise',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width: 750,
        height: 2450,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 0.1,
        patternType: 'halftone',
        patternPrimaryColor: '#000000',
        patternSecondaryColor: '#ffffff',
        patternScale: 5,
        fill: '#000000',
      },
      // Bold black text
      {
        id: 'text-xerox',
        type: 'text',
        text: 'NO GODS',
        x: 80,
        y: 800,
        width: 600,
        height: 160,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        fontFamily: 'Impact',
        fontSize: 100,
        fontWeight: 'bold',
        fill: '#000000',
        contrast: 200,
        brightness: 120,
      },
      {
        id: 'text-xerox-2',
        type: 'text',
        text: 'NO MASTERS',
        x: 50,
        y: 1100,
        width: 650,
        height: 140,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        fontFamily: 'Impact',
        fontSize: 80,
        fontWeight: 'bold',
        fill: '#000000',
        contrast: 200,
        brightness: 120,
      },
      // Distressed edges with threshold
      {
        id: 'distress-1',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width: 750,
        height: 100,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 0.3,
        fill: '#000000',
      },
      {
        id: 'distress-2',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 2350,
        width: 750,
        height: 100,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 0.3,
        fill: '#000000',
      },
    ],
  },
  {
    id: 'palace-tri',
    name: 'Palace Tri',
    description: 'Geometric triangle patterns - London',
    thumbnail: '🔺',
    category: 'pro',
    featured: true,
    objects: [
      // Gradient background (Palace colors)
      {
        id: 'bg-palace',
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
        fillType: 'linear-gradient',
        gradientStops: [
          { offset: 0, color: '#ffffff' },
          { offset: 1, color: '#e0e0e0' },
        ],
        gradientAngle: 180,
        fill: '#ffffff',
      },
      // Triangle 1 (top)
      {
        id: 'tri-1',
        type: 'shape',
        shapeType: 'star',
        x: 225,
        y: 400,
        width: 300,
        height: 300,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        fill: '#000080',
      },
      // Triangle 2 (middle, offset)
      {
        id: 'tri-2',
        type: 'shape',
        shapeType: 'star',
        x: 250,
        y: 900,
        width: 250,
        height: 250,
        scaleX: 1,
        scaleY: 1,
        rotation: 60,
        opacity: 0.8,
        fill: '#ff0000',
      },
      // Triangle 3 (bottom)
      {
        id: 'tri-3',
        type: 'shape',
        shapeType: 'star',
        x: 200,
        y: 1500,
        width: 350,
        height: 350,
        scaleX: 1,
        scaleY: 1,
        rotation: 180,
        opacity: 1,
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 4,
      },
      // Text
      {
        id: 'text-palace',
        type: 'text',
        text: 'TRI-FERG',
        x: 150,
        y: 2100,
        width: 450,
        height: 80,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        fontFamily: 'Arial',
        fontSize: 50,
        fontWeight: 'bold',
        fill: '#000000',
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
