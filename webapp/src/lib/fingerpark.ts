import { supabase } from './api';

export interface ParkObject {
  id: string;
  type: 'rail' | 'ledge' | 'stairs' | 'ramp' | 'box';
  subtype: string;
  x: number;
  y: number;
  width: number;
  length: number;
  height: number;
  rotation: number;
  color: string;
}

export interface FingerparkProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  objects: ParkObject[];
  thumbnail_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaterialsEstimate {
  plywood: {
    sheets: number;
    type: string;
    cost: number;
  };
  lumber: {
    boards: number;
    type: string;
    cost: number;
  };
  screws: {
    count: number;
    type: string;
    cost: number;
  };
  sandpaper: {
    sheets: number;
    cost: number;
  };
  total: number;
}

/**
 * Save a fingerpark project
 */
export async function saveProject(
  name: string,
  objects: ParkObject[],
  description?: string,
  isPublic: boolean = false,
  projectId?: string
): Promise<{ success: boolean; error?: string; projectId?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const projectData = {
      name,
      description,
      objects,
      is_public: isPublic,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (projectId) {
      // Update existing
      const { error } = await supabase
        .from('fingerpark_projects')
        .update(projectData)
        .eq('id', projectId);

      if (error) throw error;
      return { success: true, projectId };
    } else {
      // Create new
      const { data, error } = await supabase
        .from('fingerpark_projects')
        .insert([projectData])
        .select()
        .single();

      if (error) throw error;
      return { success: true, projectId: data.id };
    }
  } catch (error: any) {
    console.error('Save project error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Load a single project by ID
 */
export async function loadProject(projectId: string): Promise<FingerparkProject | null> {
  try {
    const { data, error } = await supabase
      .from('fingerpark_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Load project error:', error);
    return null;
  }
}

/**
 * Get all projects for current user
 */
export async function getMyProjects(): Promise<FingerparkProject[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('fingerpark_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Get my projects error:', error);
    return [];
  }
}

/**
 * Get public projects
 */
export async function getPublicProjects(): Promise<FingerparkProject[]> {
  try {
    const { data, error } = await supabase
      .from('fingerpark_projects')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Get public projects error:', error);
    return [];
  }
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('fingerpark_projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('Delete project error:', error);
    return false;
  }
}

/**
 * Calculate materials needed for a park setup
 */
export function calculateMaterials(objects: ParkObject[]): MaterialsEstimate {
  // Constants for material calculations (all measurements in inches)
  const PLYWOOD_SHEET_SIZE = 48 * 96; // 4' × 8' sheet
  const LUMBER_LENGTH = 96; // 8 foot boards
  const SCREW_SPACING = 6; // inches between screws
  
  // Pricing (approximate)
  const PLYWOOD_COST_PER_SHEET = 35; // $35 per sheet
  const LUMBER_COST_PER_BOARD = 8; // $8 per 8ft 2×4
  const SCREW_COST_PER_100 = 12; // $12 per 100 screws
  const SANDPAPER_COST_PER_SHEET = 3; // $3 per sheet

  let totalPlywoodArea = 0;
  let totalLumberLength = 0;
  let totalScrews = 0;

  objects.forEach((obj) => {
    const lengthInches = obj.length / 20; // Convert from pixels
    const widthInches = obj.width / 20;
    const heightInches = obj.height;

    // Calculate plywood for top surface
    const surfaceArea = lengthInches * widthInches;
    totalPlywoodArea += surfaceArea;

    // Calculate lumber for structure (vertical supports + framing)
    // Assume 4 corner posts + perimeter framing
    const perimeterLength = 2 * (lengthInches + widthInches);
    const verticalSupportsLength = 4 * heightInches;
    totalLumberLength += perimeterLength + verticalSupportsLength;

    // Calculate screws (4 per corner + perimeter screws)
    const perimeterScrews = Math.ceil(perimeterLength / SCREW_SPACING);
    const cornerScrews = 16; // 4 corners × 4 screws each
    totalScrews += perimeterScrews + cornerScrews;
  });

  // Calculate final quantities
  const plywoodSheets = Math.ceil(totalPlywoodArea / PLYWOOD_SHEET_SIZE);
  const lumberBoards = Math.ceil(totalLumberLength / LUMBER_LENGTH);
  const screwBoxes = Math.ceil(totalScrews / 100);
  const sandpaperSheets = Math.max(3, objects.length); // At least 3 sheets, 1 per obstacle

  const plywoodCost = plywoodSheets * PLYWOOD_COST_PER_SHEET;
  const lumberCost = lumberBoards * LUMBER_COST_PER_BOARD;
  const screwCost = screwBoxes * SCREW_COST_PER_100;
  const sandpaperCost = sandpaperSheets * SANDPAPER_COST_PER_SHEET;

  const totalCost = plywoodCost + lumberCost + screwCost + sandpaperCost;

  return {
    plywood: {
      sheets: plywoodSheets,
      type: '1/2" plywood (4\' × 8\')',
      cost: plywoodCost,
    },
    lumber: {
      boards: lumberBoards,
      type: '2×4 lumber (8\')',
      cost: lumberCost,
    },
    screws: {
      count: totalScrews,
      type: '2" wood screws',
      cost: screwCost,
    },
    sandpaper: {
      sheets: sandpaperSheets,
      cost: sandpaperCost,
    },
    total: totalCost,
  };
}
