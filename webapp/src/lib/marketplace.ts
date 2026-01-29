import { supabase } from './api';

export interface MarketplaceDesign {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  file_url: string;
  thumbnail_url: string | null;
  price: number;
  license_type: 'personal' | 'commercial' | 'unlimited';
  tags: string[];
  category: 'street' | 'retro' | 'minimal' | 'edgy' | 'pro';
  views: number;
  downloads: number;
  favorites: number;
  featured_until: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  designer?: {
    email: string;
    bio: string | null;
    verified: boolean;
  };
  is_favorited?: boolean;
  is_purchased?: boolean;
}

export interface DesignerProfile {
  id: string;
  user_id: string;
  bio: string | null;
  social_links: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  verified: boolean;
  total_sales: number;
  total_earnings: number;
  payout_method: string | null;
  payout_email: string | null;
  created_at: string;
  updated_at: string;
}

export const marketplaceAPI = {
  // Browse designs
  async browseDesigns(params: {
    category?: string;
    search?: string;
    sortBy?: 'newest' | 'popular' | 'trending';
    priceMin?: number;
    priceMax?: number;
    tags?: string[];
    limit?: number;
    offset?: number;
  }) {
    let query = supabase
      .from('marketplace_designs')
      .select(`
        *,
        designer:designer_profiles!inner(bio, verified)
      `)
      .eq('published', true);

    // Filters
    if (params.category && params.category !== 'all') {
      query = query.eq('category', params.category);
    }

    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }

    if (params.priceMin !== undefined) {
      query = query.gte('price', params.priceMin);
    }

    if (params.priceMax !== undefined) {
      query = query.lte('price', params.priceMax);
    }

    if (params.tags && params.tags.length > 0) {
      query = query.contains('tags', params.tags);
    }

    // Sorting
    if (params.sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (params.sortBy === 'popular') {
      query = query.order('downloads', { ascending: false });
    } else if (params.sortBy === 'trending') {
      // Trending = recent + popular (downloads in last 7 days)
      query = query
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('downloads', { ascending: false });
    }

    // Pagination
    query = query.range(params.offset || 0, (params.offset || 0) + (params.limit || 20) - 1);

    const { data, error } = await query;

    if (error) throw error;
    return data as MarketplaceDesign[];
  },

  // Get single design
  async getDesign(id: string) {
    const { data: design, error } = await supabase
      .from('marketplace_designs')
      .select(`
        *,
        designer:designer_profiles!inner(bio, verified)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Increment view count
    await supabase.rpc('increment_views', { design_id: id });

    // Check if user has favorited
    const { data: session } = await supabase.auth.getSession();
    if (session.session) {
      const { data: favorite } = await supabase
        .from('marketplace_favorites')
        .select('design_id')
        .eq('user_id', session.session.user.id)
        .eq('design_id', id)
        .single();

      design.is_favorited = !!favorite;

      // Check if user has purchased
      const { data: purchase } = await supabase
        .from('marketplace_purchases')
        .select('design_id')
        .eq('buyer_id', session.session.user.id)
        .eq('design_id', id)
        .single();

      design.is_purchased = !!purchase;
    }

    return design as MarketplaceDesign;
  },

  // Upload design
  async uploadDesign(params: {
    title: string;
    description: string;
    file: File; // .deckforge file
    thumbnail: File; // PNG preview
    price: number;
    license_type: 'personal' | 'commercial' | 'unlimited';
    tags: string[];
    category: 'street' | 'retro' | 'minimal' | 'edgy' | 'pro';
  }) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) throw new Error('Not authenticated');

    // Upload design file
    const fileExt = 'deckforge';
    const fileName = `${session.session.user.id}/${Date.now()}.${fileExt}`;
    const { data: fileData, error: fileError } = await supabase.storage
      .from('marketplace-designs')
      .upload(fileName, params.file);

    if (fileError) throw fileError;

    // Upload thumbnail
    const thumbExt = 'png';
    const thumbName = `${session.session.user.id}/${Date.now()}_thumb.${thumbExt}`;
    const { data: thumbData, error: thumbError } = await supabase.storage
      .from('marketplace-designs')
      .upload(thumbName, params.thumbnail);

    if (thumbError) throw thumbError;

    // Get public URLs
    const { data: { publicUrl: fileUrl } } = supabase.storage
      .from('marketplace-designs')
      .getPublicUrl(fileName);

    const { data: { publicUrl: thumbUrl } } = supabase.storage
      .from('marketplace-designs')
      .getPublicUrl(thumbName);

    // Create design record
    const { data: design, error: designError } = await supabase
      .from('marketplace_designs')
      .insert({
        user_id: session.session.user.id,
        title: params.title,
        description: params.description,
        file_url: fileUrl,
        thumbnail_url: thumbUrl,
        price: params.price,
        license_type: params.license_type,
        tags: params.tags,
        category: params.category,
        published: true,
      })
      .select()
      .single();

    if (designError) throw designError;

    return design as MarketplaceDesign;
  },

  // Purchase design
  async purchaseDesign(designId: string) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) throw new Error('Not authenticated');

    // Get design price
    const { data: design, error: designError } = await supabase
      .from('marketplace_designs')
      .select('price, user_id')
      .eq('id', designId)
      .single();

    if (designError) throw designError;

    // Can't buy your own design
    if (design.user_id === session.session.user.id) {
      throw new Error('Cannot purchase your own design');
    }

    // Check if already purchased
    const { data: existing } = await supabase
      .from('marketplace_purchases')
      .select('id')
      .eq('buyer_id', session.session.user.id)
      .eq('design_id', designId)
      .single();

    if (existing) {
      throw new Error('Already purchased');
    }

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('marketplace_purchases')
      .insert({
        design_id: designId,
        buyer_id: session.session.user.id,
        price_paid: design.price,
      })
      .select()
      .single();

    if (purchaseError) throw purchaseError;

    return purchase;
  },

  // Get user's purchases
  async getMyPurchases() {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('marketplace_purchases')
      .select(`
        *,
        design:marketplace_designs(*)
      `)
      .eq('buyer_id', session.session.user.id)
      .order('purchased_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Toggle favorite
  async toggleFavorite(designId: string) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) throw new Error('Not authenticated');

    // Check if already favorited
    const { data: existing } = await supabase
      .from('marketplace_favorites')
      .select('design_id')
      .eq('user_id', session.session.user.id)
      .eq('design_id', designId)
      .single();

    if (existing) {
      // Remove favorite
      const { error } = await supabase
        .from('marketplace_favorites')
        .delete()
        .eq('user_id', session.session.user.id)
        .eq('design_id', designId);

      if (error) throw error;
      return false;
    } else {
      // Add favorite
      const { error } = await supabase
        .from('marketplace_favorites')
        .insert({
          user_id: session.session.user.id,
          design_id: designId,
        });

      if (error) throw error;
      return true;
    }
  },

  // Get designer profile
  async getDesignerProfile(userId: string) {
    const { data, error } = await supabase
      .from('designer_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data as DesignerProfile;
  },

  // Update designer profile
  async updateDesignerProfile(params: {
    bio?: string;
    social_links?: {
      instagram?: string;
      twitter?: string;
      website?: string;
    };
    payout_method?: string;
    payout_email?: string;
  }) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) throw new Error('Not authenticated');

    // Check if profile exists
    const { data: existing } = await supabase
      .from('designer_profiles')
      .select('id')
      .eq('user_id', session.session.user.id)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('designer_profiles')
        .update(params)
        .eq('user_id', session.session.user.id)
        .select()
        .single();

      if (error) throw error;
      return data as DesignerProfile;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('designer_profiles')
        .insert({
          user_id: session.session.user.id,
          ...params,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DesignerProfile;
    }
  },

  // Get designer's designs
  async getDesignerDesigns(userId: string) {
    const { data, error } = await supabase
      .from('marketplace_designs')
      .select('*')
      .eq('user_id', userId)
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as MarketplaceDesign[];
  },
};

// Helper function to increment views (needs to be added as Supabase function)
// CREATE OR REPLACE FUNCTION increment_views(design_id UUID)
// RETURNS VOID AS $$
// BEGIN
//   UPDATE marketplace_designs SET views = views + 1 WHERE id = design_id;
// END;
// $$ LANGUAGE plpgsql SECURITY DEFINER;
