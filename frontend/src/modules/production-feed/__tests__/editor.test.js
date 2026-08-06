/**
 * Unit tests for production-feed/editor pure helpers
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  TIPE_OPTIONS,
  VISIBILITY_OPTIONS,
  createInitialForm,
  postToForm,
  formToPayload,
  fileToMediaType,
  makeMediaItem,
  moveMediaItem,
  removeMediaItem,
  validateForm,
  isFormDirty,
  stripHtml
} from '../editor'

const rawPost = () => ({
  post_id: 1,
  judul: 'Day 40: Warna mulai masuk',
  isi_konten: '<p>Grading selesai.</p>',
  tipe: 'progress',
  category_id: 5,
  film_id: 3,
  visibility: 'private',
  gambar_cover: '/uploads/images/cover.webp',
  media: [
    {
      media_type: 'photo',
      file_path: '/uploads/images/a.webp',
      mime_type: 'image/webp',
      file_size: 1234,
      sort_order: 0
    },
    {
      media_type: 'video',
      file_path: '/uploads/videos/b.mp4',
      mime_type: 'video/mp4',
      file_size: 999999,
      thumbnail: '/uploads/images/t.jpg',
      duration: 12.5,
      sort_order: 1
    }
  ],
  tags: [{ tag_id: 1, nama_tag: 'grading', slug: 'grading' }]
})

describe('TIPE_OPTIONS / VISIBILITY_OPTIONS', () => {
  it('exposes the expected post types and visibilities', () => {
    expect(TIPE_OPTIONS.map((o) => o.value)).toEqual([
      'progress',
      'behind_the_scenes',
      'casting',
      'announcement',
      'wrap'
    ])
    expect(VISIBILITY_OPTIONS.map((o) => o.value)).toEqual(['public', 'private'])
  })
})

describe('stripHtml', () => {
  it('turns HTML into plain text', () => {
    expect(stripHtml('<p>Halo <strong>dunia</strong></p>')).toBe('Halo dunia')
  })

  it('handles empty input', () => {
    expect(stripHtml('')).toBe('')
    expect(stripHtml(null)).toBe('')
  })
})

describe('createInitialForm', () => {
  it('returns an empty editor form', () => {
    expect(createInitialForm()).toEqual({
      judul: '',
      isi_konten: '',
      tipe: '',
      category_id: null,
      film_id: null,
      visibility: 'public',
      gambar_cover: '',
      media: [],
      tags: []
    })
  })
})

describe('postToForm', () => {
  it('maps a raw post into the editor form model', () => {
    const form = postToForm(rawPost())

    expect(form.judul).toBe('Day 40: Warna mulai masuk')
    expect(form.tipe).toBe('progress')
    expect(form.category_id).toBe(5)
    expect(form.film_id).toBe(3)
    expect(form.visibility).toBe('private')
    expect(form.gambar_cover).toBe('/uploads/images/cover.webp')

    expect(form.media).toHaveLength(2)
    expect(form.media[0].media_type).toBe('photo')
    expect(form.media[1].media_type).toBe('video')
    expect(form.media[1].duration).toBe(12.5)
    expect(form.media[0].localId).toBeTruthy()

    expect(form.tags).toEqual(['grading'])
  })

  it('returns an empty form for null input', () => {
    expect(postToForm(null)).toEqual(createInitialForm())
  })

  it('supports tag objects with a name alias', () => {
    const form = postToForm({
      ...rawPost(),
      tags: [{ tag_id: 2, name: 'bts' }]
    })
    expect(form.tags).toEqual(['bts'])
  })
})

describe('formToPayload', () => {
  it('serializes a form into the API payload shape', () => {
    const form = {
      judul: '  Day 40  ',
      isi_konten: '<p>Grading selesai.</p>',
      tipe: 'progress',
      category_id: '5',
      film_id: '3',
      visibility: 'private',
      gambar_cover: '/uploads/images/cover.webp',
      media: [
        {
          localId: 'media-1',
          media_type: 'photo',
          file_path: '/uploads/images/a.webp',
          mime_type: 'image/webp',
          file_size: 1234,
          sort_order: 0
        },
        { localId: 'media-2', media_type: 'video', file_path: '/uploads/videos/b.mp4', sort_order: 1 }
      ],
      tags: ['  grading  ', 'warna']
    }

    const payload = formToPayload(form)

    expect(payload.judul).toBe('Day 40')
    expect(payload.visibility).toBe('private')
    expect(payload.category_id).toBe(5)
    expect(payload.film_id).toBe(3)
    expect(payload.media).toHaveLength(2)
    expect(payload.media[0].media_type).toBe('photo')
    expect(payload.media[0].file_size).toBe(1234)
    expect(payload.media[0].sort_order).toBe(0)
    expect(payload.media[1].sort_order).toBe(1)
    expect(payload.tags).toEqual(['grading', 'warna'])
  })

  it('drops empty media rows and coerces numbers', () => {
    const payload = formToPayload({
      judul: 'x',
      media: [{ localId: 'm1', media_type: 'photo', file_path: '' }],
      tags: []
    })
    expect(payload.media).toEqual([])
    expect(payload.tags).toEqual([])
  })

  it('omits optional selectors when unset', () => {
    const payload = formToPayload(createInitialForm())
    expect(payload).not.toHaveProperty('tipe')
    expect(payload).not.toHaveProperty('category_id')
    expect(payload).not.toHaveProperty('film_id')
  })
})

describe('fileToMediaType', () => {
  it('detects video, pdf and photo types', () => {
    expect(fileToMediaType({ type: 'video/mp4' })).toBe('video')
    expect(fileToMediaType({ type: 'application/pdf' })).toBe('pdf')
    expect(fileToMediaType({ type: 'image/png' })).toBe('photo')
    expect(fileToMediaType({ type: 'application/octet-stream' })).toBe('photo')
  })
})

describe('makeMediaItem', () => {
  it('builds a media row with a localId', () => {
    const item = makeMediaItem({ media_type: 'photo', file_path: '/uploads/images/a.webp' })
    expect(item.media_type).toBe('photo')
    expect(item.file_path).toBe('/uploads/images/a.webp')
    expect(item.sort_order).toBe(0)
    expect(item.localId).toBeTruthy()
  })
})

describe('moveMediaItem / removeMediaItem', () => {
  const media = [
    { localId: 'a', file_path: '/uploads/images/a.webp' },
    { localId: 'b', file_path: '/uploads/images/b.webp' },
    { localId: 'c', file_path: '/uploads/images/c.webp' }
  ]

  it('moves an item left and right', () => {
    expect(moveMediaItem(media, 2, 0).map((m) => m.localId)).toEqual(['c', 'a', 'b'])
    expect(moveMediaItem(media, 0, 2).map((m) => m.localId)).toEqual(['b', 'c', 'a'])
  })

  it('clamps out-of-range moves without crashing', () => {
    expect(moveMediaItem(media, 0, -5).map((m) => m.localId)).toEqual(['a', 'b', 'c'])
    expect(moveMediaItem(media, 0, 0)).toEqual(media)
  })

  it('removes an item by localId', () => {
    expect(removeMediaItem(media, 'b').map((m) => m.localId)).toEqual(['a', 'c'])
  })
})

describe('validateForm', () => {
  it('requires a judul', () => {
    const result = validateForm(createInitialForm())
    expect(result.valid).toBe(false)
    expect(result.errors.judul).toBeTruthy()
  })

  it('passes when judul is present (non-publish)', () => {
    const result = validateForm({ ...createInitialForm(), judul: 'Judul' })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('rejects publishing without any content, media or cover', () => {
    const result = validateForm({ ...createInitialForm(), judul: 'Judul' }, { forPublish: true })
    expect(result.valid).toBe(false)
    expect(result.errors.content).toBeTruthy()
  })

  it('allows publishing when content exists', () => {
    const result = validateForm(
      { ...createInitialForm(), judul: 'Judul', isi_konten: '<p>isi</p>' },
      { forPublish: true }
    )
    expect(result.valid).toBe(true)
  })

  it('allows publishing when media exists', () => {
    const result = validateForm(
      {
        ...createInitialForm(),
        judul: 'Judul',
        media: [{ localId: 'm1', media_type: 'photo', file_path: '/uploads/images/a.webp' }]
      },
      { forPublish: true }
    )
    expect(result.valid).toBe(true)
  })
})

describe('isFormDirty', () => {
  const base = {
    judul: 'Judul',
    isi_konten: '<p>isi</p>',
    tipe: 'progress',
    category_id: 5,
    film_id: null,
    visibility: 'public',
    gambar_cover: '/uploads/images/a.webp',
    media: [
      {
        localId: 'media-1',
        media_type: 'photo',
        file_path: '/uploads/images/a.webp',
        thumbnail: null,
        duration: null,
        sort_order: 0
      }
    ],
    tags: ['grading', 'warna']
  }

  it('is not dirty for identical forms', () => {
    expect(isFormDirty(base, { ...base })).toBe(false)
  })

  it('is dirty when the judul changes', () => {
    expect(isFormDirty(base, { ...base, judul: 'Judul Baru' })).toBe(true)
  })

  it('is dirty when media changes', () => {
    const changed = { ...base, media: [] }
    expect(isFormDirty(base, changed)).toBe(true)
  })

  it('ignores localId-only differences', () => {
    const relabeled = {
      ...base,
      media: [
        { ...base.media[0], localId: 'media-99' }
      ]
    }
    expect(isFormDirty(base, relabeled)).toBe(false)
  })

  it('ignores tag order', () => {
    expect(isFormDirty(base, { ...base, tags: ['warna', 'grading'] })).toBe(false)
  })

  it('handles a null baseline', () => {
    expect(isFormDirty(null, createInitialForm())).toBe(false)
  })
})
