import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../services/auth.service.js';
import { deleteFile } from '../lib/upload.js';

const {
  mockWithGraphFetched,
  mockFindById,
  mockFindOne,
  mockPatchAndFetchById,
  mockSelect,
  mockRoleFindOne
} = vi.hoisted(() => {
  const mockWithGraphFetched = vi.fn();
  return {
    mockWithGraphFetched,
    mockFindById: vi.fn().mockReturnValue({ withGraphFetched: mockWithGraphFetched }),
    mockFindOne: vi.fn().mockReturnValue({ withGraphFetched: mockWithGraphFetched }),
    mockPatchAndFetchById: vi.fn().mockReturnValue({ withGraphFetched: mockWithGraphFetched }),
    mockSelect: vi.fn().mockReturnValue({ withGraphFetched: mockWithGraphFetched }),
    mockRoleFindOne: vi.fn()
  };
});

vi.mock('../models/index.js', () => {
  const mockQueryBuilder = {
    findById: mockFindById,
    findOne: mockFindOne,
    patchAndFetchById: mockPatchAndFetchById,
    select: mockSelect,
    withGraphFetched: mockWithGraphFetched,
    then: vi.fn((resolve) => resolve([])) 
  };
  
  return {
    User: { query: vi.fn(() => mockQueryBuilder) },
    Role: {
      query: vi.fn(() => ({
        findOne: mockRoleFindOne,
        then: vi.fn((resolve) => resolve([{ id: 1, name: 'user' }]))
      }))
    }
  };
});

vi.mock('../lib/upload.js', () => ({
  deleteFile: vi.fn().mockResolvedValue(true)
}));

describe('AuthService', () => {
  let authService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
  });

  it('getUserById should fetch user and role', async () => {
    mockWithGraphFetched.mockResolvedValueOnce({ id: 1, name: 'Test' });
    
    const result = await authService.getUserById(1);
    
    expect(mockFindById).toHaveBeenCalledWith(1);
    expect(mockWithGraphFetched).toHaveBeenCalledWith('role');
    expect(result).toEqual({ id: 1, name: 'Test' });
  });

  it('getUserByEmail should fetch user by email and role', async () => {
    mockWithGraphFetched.mockResolvedValueOnce({ id: 1, email: 'test@test.com' });
    
    const result = await authService.getUserByEmail('test@test.com');
    
    expect(mockFindOne).toHaveBeenCalledWith({ email: 'test@test.com' });
    expect(mockWithGraphFetched).toHaveBeenCalledWith('role');
    expect(result.email).toBe('test@test.com');
  });

  it('updateUserRole should patch user and fetch role', async () => {
    mockWithGraphFetched.mockResolvedValueOnce({ id: 1, role_id: 2 });
    
    const result = await authService.updateUserRole(1, 2);
    
    expect(mockPatchAndFetchById).toHaveBeenCalledWith(1, { role_id: 2 });
    expect(mockWithGraphFetched).toHaveBeenCalledWith('role');
    expect(result.role_id).toBe(2);
  });

  describe('updateUser', () => {
    it('should update user without image deletion if no image provided', async () => {
      mockWithGraphFetched.mockResolvedValueOnce({ id: 1, name: 'Updated' });
      
      const result = await authService.updateUser(1, { name: 'Updated' });
      
      expect(deleteFile).not.toHaveBeenCalled();
      expect(mockPatchAndFetchById).toHaveBeenCalledWith(1, { name: 'Updated' });
      expect(mockWithGraphFetched).toHaveBeenCalledWith('role');
      expect(result.name).toBe('Updated');
    });

    it('should delete old local image before updating', async () => {
      // Mock getUserById
      vi.spyOn(authService, 'getUserById').mockResolvedValueOnce({ 
        id: 1, 
        image: '/uploads/old.jpg' 
      });
      mockWithGraphFetched.mockResolvedValueOnce({ id: 1, image: '/uploads/new.jpg' });
      
      await authService.updateUser(1, { image: '/uploads/new.jpg' });
      
      expect(deleteFile).toHaveBeenCalledWith('/uploads/old.jpg');
      expect(mockPatchAndFetchById).toHaveBeenCalledWith(1, { image: '/uploads/new.jpg' });
    });

    it('should not delete external image URL before updating', async () => {
      // Mock getUserById
      vi.spyOn(authService, 'getUserById').mockResolvedValueOnce({ 
        id: 1, 
        image: 'https://google.com/image.jpg' 
      });
      mockWithGraphFetched.mockResolvedValueOnce({ id: 1, image: '/uploads/new.jpg' });
      
      await authService.updateUser(1, { image: '/uploads/new.jpg' });
      
      expect(deleteFile).not.toHaveBeenCalled();
      expect(mockPatchAndFetchById).toHaveBeenCalledWith(1, { image: '/uploads/new.jpg' });
    });

    it('should handle deleteFile errors gracefully', async () => {
      vi.spyOn(authService, 'getUserById').mockResolvedValueOnce({ 
        id: 1, 
        image: '/uploads/old.jpg' 
      });
      deleteFile.mockRejectedValueOnce(new Error('Delete DB err'));
      mockWithGraphFetched.mockResolvedValueOnce({ id: 1, image: '/uploads/new.jpg' });
      
      await expect(authService.updateUser(1, { image: '/uploads/new.jpg' })).resolves.not.toThrow();
      
      expect(deleteFile).toHaveBeenCalled();
      expect(mockPatchAndFetchById).toHaveBeenCalled();
    });
  });

  it('getAllUsers should fetch selected fields and role', async () => {
    mockWithGraphFetched.mockResolvedValueOnce([{ id: 1 }]);
    
    await authService.getAllUsers();
    
    expect(mockSelect).toHaveBeenCalledWith('id', 'email', 'name', 'role_id', 'image', 'createdAt');
    expect(mockWithGraphFetched).toHaveBeenCalledWith('role');
  });

  it('getAllRoles should return all roles', async () => {
    const roles = await authService.getAllRoles();
    expect(roles).toEqual([{ id: 1, name: 'user' }]);
  });

  it('getRoleByName should return requested role', async () => {
    mockRoleFindOne.mockResolvedValueOnce({ id: 2, name: 'admin' });
    
    const result = await authService.getRoleByName('admin');
    
    expect(mockRoleFindOne).toHaveBeenCalledWith({ name: 'admin' });
    expect(result.name).toBe('admin');
  });
});
