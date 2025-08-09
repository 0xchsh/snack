import { createClient } from '@/utils/supabase/client';

export async function getExploreLists({ limit, offset, sort, order, search }: {
  limit: number;
  offset: number;
  sort: string;
  order: string;
  search?: string;
}) {
  try {
    const supabase = createClient();
    // Build query with proper joins and filtering
    let query = supabase
      .from('lists')
      .select(`
        id, 
        public_id, 
        title, 
        emoji, 
        description, 
        created_at, 
        updated_at,
        user_id,
        users!user_id(username)
      `, { count: 'exact' })
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    // Add search filter if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    // Transform the data
    const lists = (data || []).map((l: any) => ({
      id: l.id,
      publicId: l.public_id,
      title: l.title,
      emoji: l.emoji,
      description: l.description,
      createdAt: l.created_at,
      updatedAt: l.updated_at,
      itemCount: 0, // Will be fetched separately for better performance
      user: l.users ? {
        username: l.users.username,
        imageUrl: null, // Will add when user avatars are implemented
      } : {
        username: 'unknown',
        imageUrl: null,
      },
    }));

    return { lists, count };
  } catch (error) {
    console.error('getExploreLists error:', error);
    throw error;
  }
} 