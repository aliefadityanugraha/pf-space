/**
 * Unit tests for useFilmDraft composable
 * Run with: pnpm test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useFilmDraft } from '../useFilmDraft'

describe('useFilmDraft', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should save draft to localStorage', () => {
    const { saveDraft } = useFilmDraft()
    
    const formData = {
      judul: 'Test Film',
      sinopsis: 'Test sinopsis',
      category_id: 1
    }
    
    saveDraft(formData)
    
    const saved = localStorage.getItem('film_draft')
    expect(saved).toBeTruthy()
    expect(JSON.parse(saved)).toEqual(formData)
  })

  it('should load draft from localStorage', () => {
    const { saveDraft, loadDraft } = useFilmDraft()
    
    const formData = {
      judul: 'Test Film',
      sinopsis: 'Test sinopsis'
    }
    
    saveDraft(formData)
    const loaded = loadDraft()
    
    expect(loaded).toEqual(formData)
  })

  it('should clear draft from localStorage', () => {
    const { saveDraft, clearDraft } = useFilmDraft()
    
    saveDraft({ judul: 'Test' })
    clearDraft()
    
    expect(localStorage.getItem('film_draft')).toBeNull()
    expect(localStorage.getItem('film_draft_timestamp')).toBeNull()
  })

  it('should check if draft exists', () => {
    const { saveDraft, checkDraft } = useFilmDraft()
    
    expect(checkDraft()).toBe(false)
    
    saveDraft({ judul: 'Test' })
    
    expect(checkDraft()).toBe(true)
  })

  it('should return null for expired draft', () => {
    const { loadDraft } = useFilmDraft()
    
    // Set expired draft (8 days ago)
    const expiredDate = new Date()
    expiredDate.setDate(expiredDate.getDate() - 8)
    
    localStorage.setItem('film_draft', JSON.stringify({ judul: 'Test' }))
    localStorage.setItem('film_draft_timestamp', expiredDate.toISOString())
    
    const loaded = loadDraft()
    
    expect(loaded).toBeNull()
    expect(localStorage.getItem('film_draft')).toBeNull()
  })

  it('should format draft time correctly', () => {
    const { saveDraft, formatDraftTime } = useFilmDraft()
    
    saveDraft({ judul: 'Test' })
    
    const formatted = formatDraftTime()
    
    expect(formatted).toBe('Baru saja')
  })

  it('should handle localStorage errors gracefully', () => {
    const { saveDraft } = useFilmDraft()
    
    // Mock localStorage to throw error
    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    
    // Should not throw
    expect(() => saveDraft({ judul: 'Test' })).not.toThrow()
    
    // Restore
    Storage.prototype.setItem = originalSetItem
  })
})
