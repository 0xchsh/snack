import { NextResponse } from 'next/server';
import { getExploreLists } from '@/lib/explore';

// GET /api/explore?limit=20&offset=0&sort=created_at|updated_at&order=desc|asc&search=foo
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const sort = searchParams.get('sort') || 'updated_at';
  const order = searchParams.get('order') || 'desc';
  const search = searchParams.get('search')?.trim() || '';

  try {
    const result = await getExploreLists({ limit, offset, sort, order, search });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 