export async function seed(knex) {
  const creatorEmails = {
    langitTerakhir: 'raka@pfspace.test',
    suaraCiliwung: 'dina@pfspace.test',
    frameTertinggal: 'salsa@pfspace.test',
    enamBelasMm: 'dewa@pfspace.test',
    ruangGelap: 'iman@pfspace.test',
    projector: 'anya@pfspace.test',
    catatanArsip: 'rio@pfspace.test',
    pawaiSeluloid: 'mira@pfspace.test',
    negatif: 'surya@pfspace.test',
    satuGulung: 'kirana@pfspace.test'
  };

  const emails = Object.values(creatorEmails);
  const users = await knex('users').whereIn('email', emails);

  const emailToId = {};
  for (const user of users) {
    emailToId[user.email] = user.id;
  }

  let fallback = await knex('users').where('email', 'admin@cinearchive.com').first();
  if (!fallback) {
    fallback = await knex('users').first();
  }

  const fallbackId = fallback ? fallback.id : null;

  // Reset films for a clean dev dataset
  await knex('films').del();

  const films = [
    {
      user_id: emailToId[creatorEmails.langitTerakhir] || fallbackId,
      category_id: 1,
      judul: 'Langit Terakhir di Kampus',
      sinopsis:
        'Menjelang wisuda, sekelompok mahasiswa memutuskan memutar film terakhir di atap kampus sebelum ruang pemutaran ditutup permanen.',
      tahun_karya: 2023,
      link_video_utama: 'https://www.youtube.com/watch?v=3qHkcs3kG44',
      link_trailer: 'https://www.youtube.com/watch?v=G14p4tZ8W1M',
      gambar_poster:
        'https://images.pexels.com/photos/799137/pexels-photo-799137.jpeg?auto=compress&cs=tinysrgb&w=800',
      file_naskah: null,
      file_storyboard: null,
      file_rab: null,
      crew: JSON.stringify([
        { jabatan: 'Sutradara', anggota: ['Raka Pradipta'] },
        { jabatan: 'Penulis Naskah', anggota: ['Nadia Permata'] },
        { jabatan: 'Sinematografer', anggota: ['Bagas Satrio'] }
      ]),
      status: 'published'
    },
    {
      user_id: emailToId[creatorEmails.suaraCiliwung] || fallbackId,
      category_id: 2,
      judul: 'Suara Sungai Ciliwung',
      sinopsis:
        'Dokumenter mengenai komunitas warga dan seniman yang mencoba memulihkan ingatan kolektif tentang Sungai Ciliwung lewat pemutaran film di bantaran sungai.',
      tahun_karya: 2022,
      link_video_utama: 'https://www.youtube.com/watch?v=Q9K5wW4a9Y0',
      link_trailer: 'https://www.youtube.com/watch?v=9uwZV7l4zg4',
      gambar_poster:
        'https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg?auto=compress&cs=tinysrgb&w=800',
      file_naskah: null,
      file_storyboard: null,
      file_rab: null,
      crew: JSON.stringify([
        { jabatan: 'Sutradara', anggota: ['Dina Larasati'] },
        { jabatan: 'Produser', anggota: ['Fajar Ramadhan'] }
      ]),
      status: 'published'
    },
    {
      user_id: emailToId[creatorEmails.frameTertinggal] || fallbackId,
      category_id: 3,
      judul: 'Frame yang Tertinggal',
      sinopsis:
        'Animasi 2D tentang seorang arsiparis muda yang menemukan kotak film keluarga yang hampir dibuang di gudang rumah neneknya.',
      tahun_karya: 2021,
      link_video_utama: 'https://www.youtube.com/watch?v=O2Xql8J9dHc',
      link_trailer: 'https://www.youtube.com/watch?v=FkC3pBpn5Wc',
      gambar_poster:
        'https://images.pexels.com/photos/799443/pexels-photo-799443.jpeg?auto=compress&cs=tinysrgb&w=800',
      file_naskah: null,
      file_storyboard: null,
      file_rab: null,
      crew: JSON.stringify([
        { jabatan: 'Sutradara', anggota: ['Salsa Nurani'] },
        { jabatan: 'Animator', anggota: ['Yoga Mahendra', 'Nisa Puspita'] }
      ]),
      status: 'published'
    },
    {
      user_id: emailToId[creatorEmails.enamBelasMm] || fallbackId,
      category_id: 5,
      judul: '16mm di Bawah Bantal',
      sinopsis:
        'Eksperimental esai visual tentang kebiasaan seorang mahasiswa yang menonton ulang film-film arsip kampus sebagai ritual sebelum tidur.',
      tahun_karya: 2024,
      link_video_utama: 'https://www.youtube.com/watch?v=VfT1d1Qfb-A',
      link_trailer: null,
      gambar_poster:
        'https://images.pexels.com/photos/1098365/pexels-photo-1098365.jpeg?auto=compress&cs=tinysrgb&w=800',
      file_naskah: null,
      file_storyboard: null,
      file_rab: null,
      crew: JSON.stringify([
        { jabatan: 'Sutradara', anggota: ['Dewa Angkasa'] },
        { jabatan: 'Editor', anggota: ['Rani Kusuma'] }
      ]),
      status: 'published'
    },
    {
      user_id: emailToId[creatorEmails.ruangGelap] || fallbackId,
      category_id: 2,
      judul: 'Ruang Gelap di Perpustakaan',
      sinopsis:
        'Dokumenter observasional tentang ruang pemutaran kecil di perpustakaan fakultas yang perlahan dilupakan, namun masih dihidupkan oleh komunitas film.',
      tahun_karya: 2020,
      link_video_utama: 'https://www.youtube.com/watch?v=tKq3TnXHc4g',
      link_trailer: null,
      gambar_poster:
        'https://images.pexels.com/photos/799137/pexels-photo-799137.jpeg?auto=compress&cs=tinysrgb&w=800',
      file_naskah: null,
      file_storyboard: null,
      file_rab: null,
      crew: JSON.stringify([
        { jabatan: 'Sutradara', anggota: ['Iman Fauzan'] },
        { jabatan: 'Penata Kamera', anggota: ['Sari Restu'] }
      ]),
      status: 'published'
    },
    {
      user_id: emailToId[creatorEmails.projector] || fallbackId,
      category_id: 1,
      judul: 'Projector yang Tak Pernah Padam',
      sinopsis:
        'Seorang teknisi proyektor tua menjaga ruang pemutaran film kampus meski hampir tidak ada lagi yang datang menonton.',
      tahun_karya: 2019,
      link_video_utama: 'https://www.youtube.com/watch?v=1q5dZV3M9Pc',
      link_trailer: 'https://www.youtube.com/watch?v=8Gg1GzH0c8A',
      gambar_poster:
        'https://images.pexels.com/photos/799114/pexels-photo-799114.jpeg?auto=compress&cs=tinysrgb&w=800',
      file_naskah: null,
      file_storyboard: null,
      file_rab: null,
      crew: JSON.stringify([
        { jabatan: 'Sutradara', anggota: ['Anya Wulandari'] },
        { jabatan: 'Produser', anggota: ['Galang Putra'] }
      ]),
      status: 'published'
    },
    {
      user_id: emailToId[creatorEmails.catatanArsip] || fallbackId,
      category_id: 3,
      judul: 'Catatan dari Ruang Arsip',
      sinopsis:
        'Animasi kolase yang menghidupkan kembali catatan-catatan kecil di belakang foto produksi film mahasiswa tahun 1980-an.',
      tahun_karya: 2023,
      link_video_utama: 'https://www.youtube.com/watch?v=2T8Z0UCGV7k',
      link_trailer: null,
      gambar_poster:
        'https://images.pexels.com/photos/2706379/pexels-photo-2706379.jpeg?auto=compress&cs=tinysrgb&w=800',
      file_naskah: null,
      file_storyboard: null,
      file_rab: null,
      crew: JSON.stringify([
        { jabatan: 'Sutradara', anggota: ['Rio Alvaro'] },
        { jabatan: 'Animator', anggota: ['Lia Setyaningrum'] }
      ]),
      status: 'pending'
    },
    {
      user_id: emailToId[creatorEmails.pawaiSeluloid] || fallbackId,
      category_id: 4,
      judul: 'Pawai Seluloid',
      sinopsis:
        'Musikal kampus tentang komunitas film yang menggelar pawai keliling kota sambil memutar cuplikan arsip film di dinding-dinding bangunan.',
      tahun_karya: 2022,
      link_video_utama: 'https://www.youtube.com/watch?v=4L9pQy5nP0Q',
      link_trailer: 'https://www.youtube.com/watch?v=YxF8q7K1hZQ',
      gambar_poster:
        'https://images.pexels.com/photos/799137/pexels-photo-799137.jpeg?auto=compress&cs=tinysrgb&w=800',
      file_naskah: null,
      file_storyboard: null,
      file_rab: null,
      crew: JSON.stringify([
        { jabatan: 'Sutradara', anggota: ['Mira Santosa'] },
        { jabatan: 'Penata Musik', anggota: ['Naufal Prakoso'] }
      ]),
      status: 'published'
    },
    {
      user_id: emailToId[creatorEmails.negatif] || fallbackId,
      category_id: 5,
      judul: 'Negatif yang Tersisa',
      sinopsis:
        'Eksperimental hitam putih yang memanfaatkan negatif film rusak dari arsip kampus untuk menciptakan narasi baru tentang kota yang hilang.',
      tahun_karya: 2018,
      link_video_utama: 'https://www.youtube.com/watch?v=0Xk8MaPkfM0',
      link_trailer: null,
      gambar_poster:
        'https://images.pexels.com/photos/3605018/pexels-photo-3605018.jpeg?auto=compress&cs=tinysrgb&w=800',
      file_naskah: null,
      file_storyboard: null,
      file_rab: null,
      crew: JSON.stringify([
        { jabatan: 'Sutradara', anggota: ['Surya Mahendra'] },
        { jabatan: 'Penata Suara', anggota: ['Celine Paramita'] }
      ]),
      status: 'rejected'
    },
    {
      user_id: emailToId[creatorEmails.satuGulung] || fallbackId,
      category_id: 1,
      judul: 'Satu Gulung untuk Besok',
      sinopsis:
        'Sekelompok mahasiswa hanya memiliki satu gulung film 16mm tersisa dan harus memutuskan cerita apa yang paling layak direkam.',
      tahun_karya: 2024,
      link_video_utama: 'https://www.youtube.com/watch?v=6dQp9Th1q6k',
      link_trailer: 'https://www.youtube.com/watch?v=Z1v1Fq3QKfM',
      gambar_poster:
        'https://images.pexels.com/photos/65128/pexels-photo-65128.jpeg?auto=compress&cs=tinysrgb&w=800',
      file_naskah: null,
      file_storyboard: null,
      file_rab: null,
      crew: JSON.stringify([
        { jabatan: 'Sutradara', anggota: ['Kirana Devi'] },
        { jabatan: 'Penulis Naskah', anggota: ['Bagus Arya'] }
      ]),
      status: 'pending'
    }
  ];

  await knex('films').insert(films);

  // Generate slugs for films that do not have one yet
  const filmsWithoutSlug = await knex('films')
    .whereNull('slug')
    .select('film_id', 'judul');

  for (const film of filmsWithoutSlug) {
    const slug = generateSlug(film.judul, film.film_id);
    await knex('films').where('film_id', film.film_id).update({ slug });
  }
}

function generateSlug(title, id) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  return `${base}-${id}`;
}

