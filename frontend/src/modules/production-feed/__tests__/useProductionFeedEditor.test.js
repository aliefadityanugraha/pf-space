/**
 * Unit tests for production-feed/useProductionFeedEditor composable
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProductionFeedEditor } from '../useProductionFeedEditor'
import {
  createFeedPost,
  updateFeedPost,
  publishFeedPost,
  fetchPostDetail,
  fetchFeedTags,
  fetchMyFilms
} from '../api'
import { uploadFileTus } from '@/lib/uploadFileTus'
import { api } from '@/lib/api'

vi.mock('../api', () => ({
  createFeedPost: vi.fn(),
  updateFeedPost: vi.fn(),
  publishFeedPost: vi.fn(),
  fetchPostDetail: vi.fn(),
  fetchFeedTags: vi.fn(),
  fetchMyFilms: vi.fn()
}))

vi.mock('@/lib/uploadFileTus', () => ({
  uploadFileTus: vi.fn()
}))

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}))

const rawPost = (overrides = {}) => ({
  post_id: 7,
  judul: 'Judul Lama',
  isi_konten: '<p>Isi lama</p>',
  tipe: 'progress',
  category_id: null,
  film_id: null,
  visibility: 'public',
  status: 'draft',
  gambar_cover: '',
  media: [],
  tags: [],
  ...overrides
})

beforeEach(() => {
  vi.clearAllMocks()
  api.get.mockResolvedValue({ data: [] })
  fetchFeedTags.mockResolvedValue([])
  fetchMyFilms.mockResolvedValue([])
})

describe('useProductionFeedEditor — create flow', () => {
  it('saves a draft via createFeedPost and resets the dirty baseline', async () => {
    createFeedPost.mockResolvedValue({ post_id: 1, status: 'draft' })

    const editor = useProductionFeedEditor({ mode: 'create' })
    expect(editor.isDirty.value).toBe(false)

    editor.form.value.judul = 'Post baru'
    expect(editor.isDirty.value).toBe(true)

    const post = await editor.saveDraft()

    expect(post.post_id).toBe(1)
    expect(createFeedPost).toHaveBeenCalledWith(
      expect.objectContaining({ judul: 'Post baru' })
    )
    expect(editor.isDirty.value).toBe(false)
  })

  it('publishes by creating then calling publishFeedPost', async () => {
    createFeedPost.mockResolvedValue({ post_id: 1, status: 'draft' })
    publishFeedPost.mockResolvedValue({ post_id: 1, status: 'published' })

    const editor = useProductionFeedEditor({ mode: 'create' })
    editor.form.value.judul = 'Post baru'
    editor.form.value.isi_konten = '<p>isi</p>'

    const post = await editor.publish()

    expect(createFeedPost).toHaveBeenCalledTimes(1)
    expect(publishFeedPost).toHaveBeenCalledWith(1)
    expect(post.status).toBe('published')
    expect(editor.currentStatus.value).toBe('published')
    expect(editor.isDirty.value).toBe(false)
  })

  it('blocks saving without a judul and exposes validation errors', async () => {
    const editor = useProductionFeedEditor({ mode: 'create' })

    const post = await editor.saveDraft()

    expect(post).toBeNull()
    expect(createFeedPost).not.toHaveBeenCalled()
    expect(editor.errors.value.judul).toBeTruthy()
  })

  it('blocks publishing without content/media/cover', async () => {
    const editor = useProductionFeedEditor({ mode: 'create' })
    editor.form.value.judul = 'Hanya judul'

    const post = await editor.publish()

    expect(post).toBeNull()
    expect(publishFeedPost).not.toHaveBeenCalled()
    expect(editor.errors.value.content).toBeTruthy()
  })
})

describe('useProductionFeedEditor — edit flow', () => {
  beforeEach(() => {
    fetchPostDetail.mockResolvedValue(rawPost())
  })

  it('loads a post via initEdit and maps it into the form', async () => {
    const editor = useProductionFeedEditor({ mode: 'edit' })

    await editor.initEdit(7)

    expect(fetchPostDetail).toHaveBeenCalledWith(7)
    expect(editor.postId.value).toBe(7)
    expect(editor.form.value.judul).toBe('Judul Lama')
    expect(editor.currentStatus.value).toBe('draft')
    expect(editor.isLoading.value).toBe(false)
  })

  it('updates via updateFeedPost when saving a draft', async () => {
    updateFeedPost.mockResolvedValue({ post_id: 7, status: 'draft' })

    const editor = useProductionFeedEditor({ mode: 'edit' })
    await editor.initEdit(7)
    editor.form.value.judul = 'Judul Baru'

    const post = await editor.saveDraft()

    expect(updateFeedPost).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ judul: 'Judul Baru' })
    )
    expect(post).toBeTruthy()
  })

  it('only updates (no publish call) when the post is already published', async () => {
    fetchPostDetail.mockResolvedValue(rawPost({ status: 'published' }))
    updateFeedPost.mockResolvedValue({ post_id: 7, status: 'published' })

    const editor = useProductionFeedEditor({ mode: 'edit' })
    await editor.initEdit(7)
    editor.form.value.isi_konten = '<p>update</p>'

    const post = await editor.publish()

    expect(updateFeedPost).toHaveBeenCalledTimes(1)
    expect(publishFeedPost).not.toHaveBeenCalled()
    expect(post.status).toBe('published')
  })

  it('publishes an edited draft via update then publish', async () => {
    updateFeedPost.mockResolvedValue({ post_id: 7, status: 'draft' })
    publishFeedPost.mockResolvedValue({ post_id: 7, status: 'published' })

    const editor = useProductionFeedEditor({ mode: 'edit' })
    await editor.initEdit(7)
    editor.form.value.isi_konten = '<p>update</p>'

    const post = await editor.publish()

    expect(updateFeedPost).toHaveBeenCalledTimes(1)
    expect(publishFeedPost).toHaveBeenCalledWith(7)
    expect(post.status).toBe('published')
  })

  it('reports a load error when the post is missing', async () => {
    fetchPostDetail.mockResolvedValue(null)

    const editor = useProductionFeedEditor({ mode: 'edit' })
    await editor.initEdit(99)

    expect(editor.loadError.value).toBeTruthy()
    expect(editor.isLoading.value).toBe(false)
  })
})

describe('useProductionFeedEditor — tags', () => {
  it('adds comma-separated tags, deduped case-insensitively', () => {
    const editor = useProductionFeedEditor({ mode: 'create' })
    editor.addTags('Grading, warna, GRADING')
    expect(editor.form.value.tags).toEqual(['Grading', 'warna'])
  })

  it('caps tags at 10 entries', () => {
    const editor = useProductionFeedEditor({ mode: 'create' })
    editor.addTags(Array.from({ length: 15 }, (_, i) => `tag-${i}`).join(','))
    expect(editor.form.value.tags).toHaveLength(10)
  })

  it('removes a tag', () => {
    const editor = useProductionFeedEditor({ mode: 'create' })
    editor.addTags('grading, warna')
    editor.removeTag('grading')
    expect(editor.form.value.tags).toEqual(['warna'])
  })
})

describe('useProductionFeedEditor — media', () => {
  it('uploads a cover image and stores the path', async () => {
    uploadFileTus.mockResolvedValue('/uploads/images/cover.webp')
    const file = new File(['x'], 'cover.png', { type: 'image/png' })

    const editor = useProductionFeedEditor({ mode: 'create' })
    editor.selectFile(file, 'cover')

    expect(uploadFileTus).toHaveBeenCalled()
    await vi.waitFor(() => {
      expect(editor.form.value.gambar_cover).toBe('/uploads/images/cover.webp')
    })
  })

  it('rejects a non-image cover', async () => {
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })

    const editor = useProductionFeedEditor({ mode: 'create' })
    editor.selectFile(file, 'cover')

    expect(uploadFileTus).not.toHaveBeenCalled()
    expect(editor.formError.value).toContain('gambar')
  })

  it('queues a gallery video into the modal and uploads on confirm', async () => {
    uploadFileTus.mockResolvedValue('/uploads/videos/clip.mp4')
    const file = new File(['x'], 'clip.mp4', { type: 'video/mp4' })

    const editor = useProductionFeedEditor({ mode: 'create' })
    editor.selectFile(file, 'gallery')

    expect(editor.activeUpload.value).toBeTruthy()
    expect(editor.form.value.media).toHaveLength(0)

    await editor.startActiveUpload()

    expect(uploadFileTus).toHaveBeenCalledTimes(1)
    expect(editor.form.value.media).toHaveLength(1)
    expect(editor.form.value.media[0].media_type).toBe('video')
    expect(editor.activeUpload.value).toBeNull()
  })

  it('uploads a gallery photo inline', async () => {
    uploadFileTus.mockResolvedValue('/uploads/images/photo.webp')
    const file = new File(['x'], 'photo.png', { type: 'image/png' })

    const editor = useProductionFeedEditor({ mode: 'create' })
    editor.selectFile(file, 'gallery')

    await vi.waitFor(() => {
      expect(editor.form.value.media).toHaveLength(1)
      expect(editor.form.value.media[0].media_type).toBe('photo')
    })
  })

  it('moves and removes gallery items', () => {
    uploadFileTus.mockResolvedValue('/uploads/images/x.webp')
    const editor = useProductionFeedEditor({ mode: 'create' })
    editor.form.value.media = [
      { localId: 'a', media_type: 'photo', file_path: '/uploads/images/a.webp' },
      { localId: 'b', media_type: 'photo', file_path: '/uploads/images/b.webp' }
    ]

    editor.moveMedia('b', -1)
    expect(editor.form.value.media[0].localId).toBe('b')

    editor.removeMedia('a')
    expect(editor.form.value.media.map((m) => m.localId)).toEqual(['b'])
  })

  it('surfaces an upload failure as a form error', async () => {
    uploadFileTus.mockRejectedValue(new Error('network'))
    const file = new File(['x'], 'photo.png', { type: 'image/png' })

    const editor = useProductionFeedEditor({ mode: 'create' })
    editor.selectFile(file, 'gallery')

    await vi.waitFor(() => {
      expect(editor.formError.value).toContain('Gagal mengunggah')
    })
  })
})
