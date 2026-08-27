import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../services/user.service.js';
import { FILM_STATUS } from '../config/constants.js';

const {
  mockOrderBy,
  mockWithGraphFetched,
  mockWhere,
  mockRelatedQuery,
  mockSelect,
  mockUserWithGraphFetched,
  mockFindById,
  mockFilmOrderBy,
  mockFilmWithGraphFetched,
  mockFilmWhere,
  mockFilmSelect
} = vi.hoisted(() => {
  const mockOrderBy = vi.fn();
  const mockWithGraphFetched = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
  const mockWhere = vi.fn().mockReturnValue({ withGraphFetched: mockWithGraphFetched });
  const mockRelatedQuery = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ where: mockWhere }),
    where: mockWhere
  });
  const mockUserWithGraphFetched = vi.fn();
  const mockSelect = vi.fn().mockReturnValue({ withGraphFetched: mockUserWithGraphFetched });

  const mockFilmOrderBy = vi.fn().mockResolvedValue([]);
  const mockFilmWithGraphFetched = vi.fn().mockReturnValue({ orderBy: mockFilmOrderBy });
  const mockFilmWhere2 = vi.fn().mockReturnValue({ withGraphFetched: mockFilmWithGraphFetched, whereNotNull: vi.fn().mockReturnValue({ count: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue({ total: 0 }) }) }) });
  const mockFilmWhere = vi.fn().mockReturnValue({ where: mockFilmWhere2, withGraphFetched: mockFilmWithGraphFetched, whereNotNull: vi.fn().mockReturnValue({ count: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue({ total: 0 }) }) }) });
  const mockFilmSelect = vi.fn().mockReturnValue({ where: mockFilmWhere });

  return {
    mockOrderBy,
    mockWithGraphFetched,
    mockWhere,
    mockRelatedQuery,
    mockSelect,
    mockUserWithGraphFetched,
    mockFindById: vi.fn().mockReturnValue({ select: mockSelect }),
    mockFilmOrderBy,
    mockFilmWithGraphFetched,
    mockFilmWhere,
    mockFilmSelect
  };
});

vi.mock('../models/index.js', () => ({
  User: { query: vi.fn(() => ({ findById: mockFindById })) },
  Film: { 
    query: vi.fn(() => ({ 
      select: mockFilmSelect,
      where: mockFilmWhere
    })),
    relatedQuery: vi.fn().mockReturnValue({ count: vi.fn().mockReturnValue({ as: vi.fn() }) })
  },
  Discussion: {
    query: vi.fn(() => ({
      where: vi.fn().mockReturnValue({
        count: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ total: 0 })
        })
      })
    }))
  }
}));

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    vi.clearAllMocks();
    userService = new UserService();
  });

  it('should return null if user is not found', async () => {
    mockUserWithGraphFetched.mockResolvedValueOnce(null);
    const result = await userService.getProfileById('invalid-id');
    expect(result).toBeNull();
  });

  it('should generate a profile payload with mapped skills and aggregated stats', async () => {
    // Mocked User
    const mockUser = {
      id: 1,
      name: 'Aditya',
      createdAt: '2023-01-01',
      $relatedQuery: mockRelatedQuery
    };
    mockUserWithGraphFetched.mockResolvedValueOnce(mockUser);

    // Mocked Films
    mockOrderBy.mockResolvedValueOnce([
      { 
        id: 10, 
        views: 50, 
        crew: [
          { jabatan: 'Sutradara', anggota: [{ user_id: 1, name: 'Aditya' }] },
          { jabatan: 'Editor', anggota: [{ user_id: 2, name: 'Other' }] }
        ] 
      },
      { 
        id: 11, 
        views: 100, 
        crew: { 
          crew: [
            { jabatan: 'Sutradara', anggota: [{ name: 'Aditya', user_id: null }] }, // matched by name
            { jabatan: 'Penulis', anggota: [{ name: 'Aditya' }] }
          ] 
        } 
      },
      {
        id: 12, // User not in crew
        views: 10,
        crew: [ { jabatan: 'Aktor', anggota: [{ name: 'Other' }] } ]
      },
      {
        id: 13, // Malformed crew format (ignored properly)
        views: null
      }
    ]);

    const result = await userService.getProfileById(1);

    expect(mockFindById).toHaveBeenCalledWith(1);
    expect(mockRelatedQuery).toHaveBeenCalledWith('films');
    expect(mockWhere).toHaveBeenCalledWith('status', FILM_STATUS.PUBLISHED);

    // Verify User properties preservation
    expect(result.name).toBe('Aditya');
    expect(result.created_at).toBe('2023-01-01');
    expect(result.films.length).toBe(4);

    // Verify Aggregated Stats
    expect(result.stats.totalFilms).toBe(4);
    expect(result.stats.totalViews).toBe(160); // 50 + 100 + 10 + 0

    // Verify Skills Aggregation mapping and sorting based on occurrences
    // Aditya is Sutradara (2x), Penulis (1x)
    expect(result.topSkills).toEqual(['Sutradara', 'Penulis']);
  });
});
