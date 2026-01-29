import { CanvasObject } from '@/store/deckforge';

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  tags: string[];
  objects: Omit<CanvasObject, 'id'>[];
  author?: string;
}

export const templates: Template[] = [
  {
    id: 'skull-flames',
    name: 'Skull & Flames',
    description: 'Classic skate punk aesthetic with skull and flame stickers',
    tags: ['punk', 'edgy', 'classic'],
    objects: [
      // Black background
      {
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width: 96,
        height: 294,
        rotation: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        fill: '#000000',
      },
      // Red stripe
      {
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 120,
        width: 96,
        height: 54,
        rotation: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        fill: '#ff0000',
      },
      // Skull sticker
      {
        type: 'sticker',
        x: 28,
        y: 80,
        width: 40,
        height: 40,
        rotation: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        iconName: 'Skull',
        fill: '#ffffff',
        strokeWidth: 0,
        solidFill: true,
      },
      // Flame stickers
      {
        type: 'sticker',
        x: 10,
        y: 200,
        width: 30,
        height: 30,
        rotation: -15,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        iconName: 'Flame',
        fill: '#ff4500',
        strokeWidth: 0,
        solidFill: true,
      },
      {
        type: 'sticker',
        x: 56,
        y: 200,
        width: 30,
        height: 30,
        rotation: 15,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        iconName: 'Flame',
        fill: '#ff4500',
        strokeWidth: 0,
        solidFill: true,
      },
    ],
  },
  {
    id: 'gradient-fade',
    name: 'Gradient Fade',
    description: 'Modern gradient design with smooth color transitions',
    tags: ['modern', 'gradient', 'clean'],
    objects: [
      // Gradient background
      {
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width: 96,
        height: 294,
        rotation: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        fillType: 'linear-gradient',
        gradientStops: [
          { offset: 0, color: '#667eea' },
          { offset: 0.5, color: '#764ba2' },
          { offset: 1, color: '#f093fb' },
        ],
        gradientAngle: 180,
      },
      // Center circle with glow
      {
        type: 'shape',
        shapeType: 'circle',
        x: 23,
        y: 122,
        width: 50,
        height: 50,
        rotation: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        fill: '#ffffff',
        glow: {
          enabled: true,
          radius: 20,
          color: '#ffffff',
          intensity: 0.8,
        },
      },
    ],
  },
  {
    id: 'retro-vinyl',
    name: 'Retro Vinyl',
    description: 'Vintage music-inspired design with record and music icons',
    tags: ['retro', 'music', 'vintage'],
    objects: [
      // Beige background
      {
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width: 96,
        height: 294,
        rotation: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        fill: '#f4e8d8',
      },
      // Brown stripe
      {
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 140,
        width: 96,
        height: 14,
        rotation: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        fill: '#8b4513',
      },
      // Disc icon
      {
        type: 'sticker',
        x: 23,
        y: 60,
        width: 50,
        height: 50,
        rotation: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        iconName: 'Disc',
        fill: '#2c2c2c',
        strokeWidth: 0,
        solidFill: true,
      },
      // Music notes
      {
        type: 'sticker',
        x: 12,
        y: 200,
        width: 25,
        height: 25,
        rotation: -10,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        iconName: 'Music',
        fill: '#8b4513',
        strokeWidth: 0,
        solidFill: true,
      },
      {
        type: 'sticker',
        x: 59,
        y: 195,
        width: 25,
        height: 25,
        rotation: 10,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        iconName: 'Music',
        fill: '#8b4513',
        strokeWidth: 0,
        solidFill: true,
      },
    ],
  },
  {
    id: 'neon-lightning',
    name: 'Neon Lightning',
    description: 'Electric neon design with lightning bolts',
    tags: ['neon', 'electric', 'bold'],
    objects: [
      // Dark background
      {
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width: 96,
        height: 294,
        rotation: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        fill: '#1a1a2e',
      },
      // Lightning bolts with glow
      {
        type: 'sticker',
        x: 18,
        y: 90,
        width: 60,
        height: 60,
        rotation: 15,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        iconName: 'Zap',
        fill: '#00ff88',
        strokeWidth: 0,
        solidFill: true,
        glow: {
          enabled: true,
          radius: 15,
          color: '#00ff88',
          intensity: 1,
        },
      },
      {
        type: 'sticker',
        x: 8,
        y: 180,
        width: 40,
        height: 40,
        rotation: -25,
        opacity: 0.7,
        scaleX: 1,
        scaleY: 1,
        iconName: 'Zap',
        fill: '#ff00ff',
        strokeWidth: 0,
        solidFill: true,
        glow: {
          enabled: true,
          radius: 12,
          color: '#ff00ff',
          intensity: 0.9,
        },
      },
      {
        type: 'sticker',
        x: 48,
        y: 170,
        width: 40,
        height: 40,
        rotation: 30,
        opacity: 0.7,
        scaleX: 1,
        scaleY: 1,
        iconName: 'Zap',
        fill: '#00ddff',
        strokeWidth: 0,
        solidFill: true,
        glow: {
          enabled: true,
          radius: 12,
          color: '#00ddff',
          intensity: 0.9,
        },
      },
    ],
  },
  {
    id: 'minimalist-shapes',
    name: 'Minimalist Shapes',
    description: 'Clean geometric design with simple shapes',
    tags: ['minimal', 'geometric', 'clean'],
    objects: [
      // White background
      {
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width: 96,
        height: 294,
        rotation: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        fill: '#ffffff',
      },
      // Black circle
      {
        type: 'shape',
        shapeType: 'circle',
        x: 8,
        y: 70,
        width: 80,
        height: 80,
        rotation: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        fill: '#000000',
      },
      // Red triangle
      {
        type: 'sticker',
        x: 28,
        y: 180,
        width: 40,
        height: 40,
        rotation: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        iconName: 'Triangle',
        fill: '#ff0000',
        strokeWidth: 0,
        solidFill: true,
      },
    ],
  },
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch with a clean white deck',
    tags: ['blank', 'custom'],
    objects: [
      {
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width: 96,
        height: 294,
        rotation: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        fill: '#ffffff',
      },
    ],
  },
];

export function searchTemplates(query: string): Template[] {
  if (!query) return templates;
  
  const lowerQuery = query.toLowerCase();
  return templates.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

export function getTemplateById(id: string): Template | undefined {
  return templates.find(t => t.id === id);
}
