import { supabase } from '@/lib/supabase';

export async function getExploreLists({ limit, offset, sort, order, search }: {
  limit: number;
  offset: number;
  sort: string;
  order: string;
  search?: string;
}) {
  let query = supabase
    .from('lists')
    .select(`id, public_id, title, emoji, description, created_at, updated_at, items(count), user_id, users(username, image_url)`, { count: 'exact' })
    .eq('is_public', true)
    .order(sort, { ascending: order === 'asc' })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const lists = (data || []).map((l: any) => ({
    id: l.id,
    publicId: l.public_id,
    title: l.title,
    emoji: l.emoji,
    description: l.description,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
    itemCount: Array.isArray(l.items) ? l.items.length : 0,
    user: l.users ? {
      username: l.users.username,
      imageUrl: l.users.image_url,
    } : null,
  }));

  return { lists, count };
} 