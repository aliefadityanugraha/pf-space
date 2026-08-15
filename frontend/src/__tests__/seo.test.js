import { describe, it, expect } from 'vitest';

describe('Frontend SEO Head Metadata', () => {
  it('should generate valid Open Graph and Twitter meta tags for a film archive', () => {
    const mockFilm = {
      judul: 'Sore: Istri dari Masa Depan',
      sinopsis: 'Mengisahkan fotografer Indonesia di Kroasia.',
      gambar_poster: '/uploads/images/sore.jpg',
      creator: { name: 'Dion Wiyoko' },
      category: { name: 'Romance' },
      created_at: '2026-08-14'
    };

    const title = `${mockFilm.judul} - PF Space`;
    const description = mockFilm.sinopsis;
    const posterUrl = `http://localhost:5173${mockFilm.gambar_poster}`;

    const metaTags = [
      { name: 'description', content: description },
      { property: 'og:type', content: 'video.other' },
      { property: 'og:site_name', content: 'PF Space' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: posterUrl },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', content: posterUrl }
    ];

    expect(title).toBe('Sore: Istri dari Masa Depan - PF Space');
    expect(metaTags.find(m => m.property === 'og:site_name').content).toBe('PF Space');
    expect(metaTags.find(m => m.property === 'og:image').content).toContain('sore.jpg');
    expect(metaTags.find(m => m.name === 'twitter:card').content).toBe('summary_large_image');
  });

  it('should generate valid Schema.org Movie JSON-LD structured data', () => {
    const mockFilm = {
      judul: 'Film Short Film SMK',
      sinopsis: 'Film pendek karya siswa SMK Semarang.',
      gambar_poster: 'http://localhost:5173/uploads/poster.jpg',
      creator: { name: 'Tim Produksi' },
      category: { name: 'Drama' },
      created_at: '2026-08-14'
    };

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Movie',
      name: mockFilm.judul,
      description: mockFilm.sinopsis,
      image: mockFilm.gambar_poster,
      director: {
        '@type': 'Person',
        name: mockFilm.creator.name
      },
      genre: mockFilm.category.name,
      productionCompany: {
        '@type': 'Organization',
        name: 'PF Space - Perfilman SMK'
      }
    };

    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('Movie');
    expect(jsonLd.name).toBe('Film Short Film SMK');
    expect(jsonLd.director.name).toBe('Tim Produksi');
  });

  it('should generate valid Schema.org WebSite JSON-LD with SearchAction', () => {
    const websiteJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'PF Space',
      alternateName: 'Perfilman Space',
      url: 'http://localhost:5173',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'http://localhost:5173/films?search={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    };

    expect(websiteJsonLd['@type']).toBe('WebSite');
    expect(websiteJsonLd.potentialAction['@type']).toBe('SearchAction');
    expect(websiteJsonLd.potentialAction.target).toContain('search={search_term_string}');
  });
});
