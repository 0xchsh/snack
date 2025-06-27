import { getExploreLists } from '@/lib/explore';

jest.mock('@/lib/supabase', () => {
  // Helper to build a full mock chain
  function buildChain(finalPromise: any) {
    return {
      select: function () { return this; },
      eq: function () { return this; },
      order: function () { return this; },
      range: function () { return finalPromise; },
      or: function () { return finalPromise; },
    };
  }
  return {
    supabase: {
      from: jest.fn(),
    },
    buildChain,
  };
});

const mockLists = [
  {
    id: 1,
    public_id: 'abc',
    title: 'Public List',
    emoji: '📚',
    description: 'A public list',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    items: [{}, {}],
    users: { username: 'alice', image_url: 'img1.png' },
  },
  {
    id: 2,
    public_id: 'def',
    title: 'Another List',
    emoji: '🎵',
    description: 'Music stuff',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
    items: [{}],
    users: { username: 'bob', image_url: 'img2.png' },
  },
];

describe('getExploreLists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated public lists', async () => {
    const { supabase, buildChain } = require('@/lib/supabase');
    supabase.from.mockReturnValue(buildChain(Promise.resolve({ data: mockLists, error: null, count: 2 })));
    const result = await getExploreLists({ limit: 2, offset: 0, sort: 'updated_at', order: 'desc' });
    expect(Array.isArray(result.lists)).toBe(true);
    expect(result.lists.length).toBe(2);
    expect(result.count).toBe(2);
  });

  it('supports search by title/description', async () => {
    const { supabase, buildChain } = require('@/lib/supabase');
    // The or() method is called in this case
    supabase.from.mockReturnValue({
      select: function () { return this; },
      eq: function () { return this; },
      order: function () { return this; },
      range: function () { return this; },
      or: function () { return Promise.resolve({ data: [mockLists[0]], error: null, count: 1 }); },
    });
    const result = await getExploreLists({ limit: 20, offset: 0, sort: 'updated_at', order: 'desc', search: 'Public' });
    expect(result.lists.length).toBe(1);
    expect(result.lists[0].title).toMatch(/Public/);
  });

  it('supports sorting by created_at', async () => {
    const { supabase, buildChain } = require('@/lib/supabase');
    supabase.from.mockReturnValue(buildChain(Promise.resolve({ data: mockLists, error: null, count: 2 })));
    const result = await getExploreLists({ limit: 20, offset: 0, sort: 'created_at', order: 'asc' });
    expect(result.lists.length).toBe(2);
  });

  it('never returns private lists', async () => {
    const { supabase, buildChain } = require('@/lib/supabase');
    const privateList = { ...mockLists[0], is_public: false };
    supabase.from.mockReturnValue(buildChain(Promise.resolve({ data: [privateList], error: null, count: 1 })));
    const result = await getExploreLists({ limit: 20, offset: 0, sort: 'updated_at', order: 'desc' });
    // Should not include the private list
    expect(result.lists.every((l: any) => l.is_public !== false)).toBe(true);
  });
}); 