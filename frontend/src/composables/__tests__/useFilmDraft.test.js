/**
 * Unit tests for useFilmDraft composable
 * Run with: pnpm test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Create a fake localStorage for testing to bypass happy-dom issues
const createMockStorage = () => {
  let store = {}
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString() }),
    removeItem: vi.fn(key => { delete store[key] }),
    clear: vi.fn(() => { store = {} })
  }
}

describe('useFilmDraft', () => {
  let originalLocalStorage;

  beforeEach(() => {
    originalLocalStorage = global.localStorage;
    global.localStorage = createMockStorage();
  })

  afterEach(() => {
    global.localStorage = originalLocalStorage;
  })

  it('should save draft to localStorage', async () => {
    const { useFilmDraft } = await import('../useFilmDraft')
    const { saveDraft } = useFilmDraft()
    
    const formData = {
      judul: 'Test Film',
      sinopsis: 'Test sinopsis',
      category_id: 1
    }
    
    saveDraft(formData)
    
    expect(global.localStorage.setItem).toHaveBeenCalledWith('draft-film', JSON.stringify(formData))
    expect(global.localStorage.setItem).toHaveBeenCalledWith('draft-film-timestamp', expect.any(String))
  })

  it('should load draft from localStorage', async () => {
    const { useFilmDraft } = await import('../useFilmDraft')
    const { saveDraft, loadDraft } = useFilmDraft()
    
    const formData = {
      judul: 'Test Film',
      sinopsis: 'Test sinopsis'
    }
    
    global.localStorage.getItem.mockImplementation((key) => {
      if (key === 'draft-film') return JSON.stringify(formData)
      if (key === 'draft-film-timestamp') return new Date().toISOString()
      return null
    })
    
    const loaded = loadDraft()
    
    expect(loaded).toEqual(formData)
  })

  it('should clear draft from localStorage', async () => {
    const { useFilmDraft } = await import('../useFilmDraft')
    const { clearDraft } = useFilmDraft()
    
    clearDraft()
    
    expect(global.localStorage.removeItem).toHaveBeenCalledWith('draft-film')
    expect(global.localStorage.removeItem).toHaveBeenCalledWith('draft-film-timestamp')
  })

  it('should check if draft exists', async () => {
    const { useFilmDraft } = await import('../useFilmDraft')
    const { checkDraft } = useFilmDraft()
    
    global.localStorage.getItem.mockImplementation((key) => {
      if (key === 'draft-film') return '{}'
      if (key === 'draft-film-timestamp') return new Date().toISOString()
      return null
    })
    
    expect(checkDraft()).toBe(true)
  })

  it('should return null for expired draft', async () => {
    const { useFilmDraft } = await import('../useFilmDraft')
    const { loadDraft } = useFilmDraft()
    
    const expiredDate = new Date()
    expiredDate.setDate(expiredDate.getDate() - 8)
    
    global.localStorage.getItem.mockImplementation((key) => {
      if (key === 'draft-film') return '{}'
      if (key === 'draft-film-timestamp') return expiredDate.toISOString()
      return null
    })
    
    const loaded = loadDraft()
    
    expect(loaded).toBeNull()
    expect(global.localStorage.removeItem).toHaveBeenCalledWith('draft-film')
  })

  it('should format draft time correctly', async () => {
    const { useFilmDraft } = await import('../useFilmDraft')
    const { saveDraft, formatDraftTime } = useFilmDraft()
    
    saveDraft({ judul: 'Test' })
    
    const formatted = formatDraftTime()
    
    expect(formatted).toBe('Baru saja')
  })

  it('should handle localStorage errors gracefully', async () => {
    const { useFilmDraft } = await import('../useFilmDraft')
    const { saveDraft } = useFilmDraft()
    
    global.localStorage.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    
    expect(() => saveDraft({ judul: 'Test' })).not.toThrow()
  })
})
