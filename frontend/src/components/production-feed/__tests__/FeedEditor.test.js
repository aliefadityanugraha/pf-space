/**
 * Unit tests for the Production Feed editor component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import FeedEditor from '../FeedEditor.vue'

let mockEditorState

const createEditorState = (overrides = {}) => ({
  form: ref({
    judul: '',
    isi_konten: '',
    tipe: '',
    category_id: null,
    film_id: null,
    visibility: 'public',
    gambar_cover: '',
    media: [],
    tags: []
  }),
  currentStatus: ref('draft'),
  isEdit: false,
  categories: ref([]),
  tags: ref([]),
  films: ref([]),
  lookupsLoading: ref(false),
  isLoading: ref(false),
  loadError: ref(null),
  formError: ref(null),
  errors: ref({}),
  submitting: ref(false),
  uploading: ref(false),
  uploadProgress: ref(0),
  activeUpload: ref(null),
  submitAction: ref(null),
  isDirty: ref(false),
  canSubmit: ref(true),
  initEdit: vi.fn(),
  loadLookups: vi.fn(),
  addTags: vi.fn(),
  removeTag: vi.fn(),
  moveMedia: vi.fn(),
  removeMedia: vi.fn(),
  selectFile: vi.fn(),
  startActiveUpload: vi.fn(),
  cancelActiveUpload: vi.fn(),
  saveDraft: vi.fn(),
  publish: vi.fn(),
  ...overrides
})

vi.mock('@/modules/production-feed/useProductionFeedEditor', () => ({
  useProductionFeedEditor: () => mockEditorState
}))

vi.mock('vue-router', () => ({
  onBeforeRouteLeave: vi.fn()
}))

const mountEditor = (props = {}) =>
  mount(FeedEditor, {
    props: { mode: 'create', ...props },
    global: {
      stubs: {
        RichTextEditor: { template: '<div data-testid="tiptap-editor" />' }
      }
    }
  })

const findButtonByText = (wrapper, text) =>
  wrapper.findAll('button').find((b) => b.text().includes(text))

describe('FeedEditor', () => {
  beforeEach(() => {
    mockEditorState = createEditorState()
  })

  it('renders the editor shell: title, TipTap area, and media uploaders', () => {
    const wrapper = mountEditor()

    expect(wrapper.find('input[placeholder*="judul"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tiptap-editor"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Gallery Media')
    expect(wrapper.text()).toContain('Unggah Cover')
    expect(wrapper.text()).toContain('Foto')
    expect(wrapper.text()).toContain('Video')
    expect(wrapper.text()).toContain('PDF')
  })

  it('shows create-mode action labels', () => {
    const wrapper = mountEditor()
    expect(wrapper.text()).toContain('Simpan Draft')
    expect(wrapper.text()).toContain('Publikasikan')
  })

  it('emits published when the publish flow succeeds', async () => {
    mockEditorState.publish.mockResolvedValue({ post_id: 1, status: 'published' })
    const wrapper = mountEditor()

    await wrapper.find('form').trigger('submit')

    await vi.waitFor(() => {
      expect(mockEditorState.publish).toHaveBeenCalled()
      expect(wrapper.emitted('published')).toBeTruthy()
    })
  })

  it('emits saved when the draft flow succeeds', async () => {
    mockEditorState.saveDraft.mockResolvedValue({ post_id: 1, status: 'draft' })
    const wrapper = mountEditor()

    await findButtonByText(wrapper, 'Simpan Draft').trigger('click')

    await vi.waitFor(() => {
      expect(mockEditorState.saveDraft).toHaveBeenCalled()
      expect(wrapper.emitted('saved')).toBeTruthy()
    })
  })

  it('does not emit published when validation fails', async () => {
    mockEditorState.publish.mockResolvedValue(null)
    mockEditorState.errors.value = { judul: 'Judul wajib diisi' }
    const wrapper = mountEditor()

    await wrapper.find('form').trigger('submit')

    await vi.waitFor(() => {
      expect(mockEditorState.publish).toHaveBeenCalled()
      expect(wrapper.emitted('published')).toBeFalsy()
      expect(wrapper.text()).toContain('Judul wajib diisi')
    })
  })

  it('shows an API error banner from the composable', () => {
    mockEditorState.formError.value = 'Server menolak permintaan.'
    const wrapper = mountEditor()
    expect(wrapper.text()).toContain('Server menolak permintaan.')
  })

  it('renders edit-mode labels when editing', () => {
    mockEditorState.isEdit = true
    const wrapper = mountEditor({ mode: 'edit', postId: 7 })

    expect(wrapper.text()).toContain('Simpan Perubahan')
    expect(wrapper.text()).toContain('Draft')
    expect(mockEditorState.initEdit).toHaveBeenCalledWith(7)
  })

  it('emits cancel from the cancel button', async () => {
    const wrapper = mountEditor()
    await findButtonByText(wrapper, 'Batal').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('renders gallery media with previews and remove controls', () => {
    mockEditorState.form.value.media = [
      { localId: 'm1', media_type: 'photo', file_path: '/uploads/images/a.webp', thumbnail: null, duration: null },
      { localId: 'm2', media_type: 'pdf', file_path: '/uploads/documents/b.pdf', thumbnail: null, duration: null }
    ]
    const wrapper = mountEditor()

    expect(wrapper.findAll('[data-testid="media-item"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('b.pdf')
  })

  it('renders the linked film, type and category selects', () => {
    mockEditorState.films.value = [{ film_id: 1, judul: 'Film A', status: 'published' }]
    mockEditorState.categories.value = [{ category_id: 2, nama_kategori: 'Dokumenter' }]
    const wrapper = mountEditor()

    expect(wrapper.text()).toContain('Film A')
    expect(wrapper.text()).toContain('Dokumenter')
  })
})
