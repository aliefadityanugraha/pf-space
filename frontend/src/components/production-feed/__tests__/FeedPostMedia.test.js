/**
 * Unit tests for the production feed post media component
 * (photo gallery + fullscreen lightbox + video + pdf).
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FeedPostMedia from '../FeedPostMedia.vue'

const VideoPlayerStub = {
  props: ['src', 'title', 'poster'],
  template: '<div class="video-player-stub" :data-src="src">{{ title }}</div>'
}

const mediaItem = (overrides = {}) => ({
  mediaId: 1,
  mediaType: 'photo',
  filePath: 'photos/one.jpg',
  mimeType: null,
  fileSize: null,
  thumbnail: null,
  duration: null,
  sortOrder: 0,
  ...overrides
})

const mountMedia = (media, props = {}) =>
  mount(FeedPostMedia, {
    props: { media, title: 'Judul Post', ...props },
    global: {
      stubs: { VideoPlayer: VideoPlayerStub },
      attachTo: document.body
    }
  })

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('FeedPostMedia', () => {
  it('renders nothing when there is no media', () => {
    const wrapper = mountMedia([])
    expect(wrapper.find('section').exists()).toBe(false)
  })

  it('renders a gallery grid for photos', () => {
    const wrapper = mountMedia([
      mediaItem({ filePath: 'photos/a.jpg' }),
      mediaItem({ mediaId: 2, filePath: 'photos/b.jpg' })
    ])

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(2)
    expect(buttons[0].attributes('aria-label')).toBe('Perbesar gambar 1')
  })

  it('renders videos through the VideoPlayer component', () => {
    const wrapper = mountMedia([
      mediaItem({ mediaType: 'video', filePath: 'videos/clip.mp4' })
    ])

    const player = wrapper.find('.video-player-stub')
    expect(player.exists()).toBe(true)
    expect(player.attributes('data-src')).toContain('/uploads/videos/clip.mp4')
  })

  it('renders a PDF preview with a download link', () => {
    const wrapper = mountMedia([
      mediaItem({ mediaType: 'pdf', filePath: 'docs/naskah.pdf' })
    ])

    expect(wrapper.find('iframe').exists()).toBe(true)
    expect(wrapper.find('iframe').attributes('src')).toContain('/uploads/docs/naskah.pdf')
    const download = wrapper.find('a[target="_blank"]')
    expect(download.exists()).toBe(true)
    expect(download.attributes('href')).toContain('/uploads/docs/naskah.pdf')
  })

  it('opens the fullscreen lightbox when a photo is clicked', async () => {
    const wrapper = mountMedia([
      mediaItem({ filePath: 'photos/a.jpg' }),
      mediaItem({ mediaId: 2, filePath: 'photos/b.jpg' })
    ])

    expect(document.body.querySelector('.fixed.inset-0')).toBeNull()

    await wrapper.findAll('button')[1].trigger('click')

    const lightbox = document.body.querySelector('.fixed.inset-0')
    expect(lightbox).not.toBeNull()
    expect(lightbox.textContent).toContain('2 / 2')
  })

  it('navigates photos with the next/previous buttons', async () => {
    const wrapper = mountMedia([
      mediaItem({ filePath: 'photos/a.jpg' }),
      mediaItem({ mediaId: 2, filePath: 'photos/b.jpg' })
    ])

    await wrapper.findAll('button')[0].trigger('click')

    const lightbox = document.body.querySelector('.fixed.inset-0')
    expect(lightbox.textContent).toContain('1 / 2')

    const next = document.body.querySelector('button[aria-label="Gambar berikutnya"]')
    await next.click()

    expect(lightbox.textContent).toContain('2 / 2')

    const prev = document.body.querySelector('button[aria-label="Gambar sebelumnya"]')
    await prev.click()
    expect(lightbox.textContent).toContain('1 / 2')
  })

  it('closes the lightbox with the close button', async () => {
    const wrapper = mountMedia([mediaItem({ filePath: 'photos/a.jpg' })])

    await wrapper.find('button').trigger('click')
    expect(document.body.querySelector('.fixed.inset-0')).not.toBeNull()

    const close = document.body.querySelector('button[aria-label="Tutup galeri"]')
    await close.click()

    expect(document.body.querySelector('.fixed.inset-0')).toBeNull()
  })

  it('hides gallery navigation when there is a single photo', async () => {
    const wrapper = mountMedia([mediaItem({ filePath: 'photos/a.jpg' })])

    await wrapper.find('button').trigger('click')

    expect(document.body.querySelector('button[aria-label="Gambar berikutnya"]')).toBeNull()
    expect(document.body.querySelector('button[aria-label="Gambar sebelumnya"]')).toBeNull()
  })
})
