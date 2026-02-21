export async function seed(knex) {
  // Ambil user yang sudah ada (role creator)
  const users = await knex('users').where('role_id', 2);
  
  // Jika tidak ada user creator, pakai user pertama apapun
  let defaultUser;
  if (users.length > 0) {
    defaultUser = users[0];
  } else {
    defaultUser = await knex('users').first();
  }
  
  // Fallback jika database kosong user (seharusnya tidak terjadi jika seed urut)
  const userId = defaultUser ? defaultUser.id : 'user-id-placeholder';

  // Helper untuk mendapatkan user acak dari list
  const getRandomUser = () => {
    if (users.length === 0) return userId;
    return users[Math.floor(Math.random() * users.length)].id;
  };

  // Helper untuk generate slug
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() + '-' + Math.random().toString(36).substr(2, 6);
  };

  // Bersihkan tabel films
  await knex('films').del();

  const films = [
    {
      user_id: getRandomUser(),
      category_id: 1, // Film Pendek
      judul: 'Tilik',
      slug: generateSlug('Tilik'),
      sinopsis: 'Dian adalah kembang desa. Banyak lelaki yang mendekatinya hingga datang melamarnya. Warga desa bergunjing tentang status lajang Dian. Dalam satu kesempatan perjalanan naik truk untuk menjenguk Bu Lurah di rumah sakit di kota, Bu Tejo membuka obrolan tentang Dian. Perjalanan menjadi penuh gosip dan petualangan bagi ibu-ibu desa tersebut.',
      tahun_karya: 2018,
      link_video_utama: 'https://www.youtube.com/watch?v=GAyV3nZfE6I',
      link_trailer: 'https://www.youtube.com/watch?v=GAyV3nZfE6I',
      gambar_poster: 'https://upload.wikimedia.org/wikipedia/id/7/7b/Tilik_poster.jpeg',
      status: 'published',
      crew: JSON.stringify([
        { jabatan: 'Sutradara', anggota: ['Wahyu Agung Prasetyo'] },
        { jabatan: 'Penulis', anggota: ['Bagus Sumartono'] },
        { jabatan: 'Produser', anggota: ['Elena Rosmeisara'] }
      ])
    },
    {
      user_id: getRandomUser(),
      category_id: 1, // Film Pendek
      judul: 'Lemantun',
      slug: generateSlug('Lemantun'),
      sinopsis: 'Seorang ibu mencoba membagikan warisan kepada kelima anaknya. Warisan tersebut adalah lemari. Namun, lemari-lemari tersebut harus dibawa pulang hari itu juga. Tri, anak ketiga yang tidak punya gelar sarjana, mendapat lemari paling kecil namun paling berarti baginya.',
      tahun_karya: 2014,
      link_video_utama: 'https://www.youtube.com/watch?v=vVjV-7H8J8A',
      link_trailer: 'https://www.youtube.com/watch?v=vVjV-7H8J8A',
      gambar_poster: 'https://upload.wikimedia.org/wikipedia/id/5/58/Poster_Lemantun.jpg',
      status: 'published',
      crew: JSON.stringify([
        { jabatan: 'Sutradara', anggota: ['Wregas Bhanuteja'] },
        { jabatan: 'Penulis', anggota: ['Wregas Bhanuteja'] }
      ])
    },
    {
      user_id: getRandomUser(),
      category_id: 1, // Film Pendek
      judul: 'Prenjak',
      slug: generateSlug('Prenjak'),
      sinopsis: 'Diah mengajak Jarwo ke gudang belakang pasar. Di sana, Diah menawarkan korek api seharga Rp 10.000 per batang untuk melihat organ intimnya. Jarwo setuju demi membantu Diah yang sedang butuh uang cepat. Sebuah kisah tentang keputusasaan dan transaksional di sudut Yogyakarta.',
      tahun_karya: 2016,
      link_video_utama: 'https://www.youtube.com/watch?v=Hu10fFk8gJ8',
      link_trailer: 'https://www.youtube.com/watch?v=Hu10fFk8gJ8',
      gambar_poster: 'https://upload.wikimedia.org/wikipedia/id/8/8b/Prenjak_poster.jpg',
      status: 'published',
      crew: JSON.stringify([
        { jabatan: 'Sutradara', anggota: ['Wregas Bhanuteja'] },
        { jabatan: 'Produser', anggota: ['Wregas Bhanuteja'] }
      ])
    },
    {
      user_id: getRandomUser(),
      category_id: 1, // Film Pendek
      judul: 'Anak Lanang',
      slug: generateSlug('Anak Lanang'),
      sinopsis: 'Empat anak SD membahas kehidupan sehari-hari mereka di atas becak sepulang sekolah. Percakapan mereka lugu, lucu, namun menyentil isu sosial seperti poligami dan hubungan orang tua yang terekam lewat kacamata anak-anak. Teknik pengambilan gambar one-take shot yang memukau.',
      tahun_karya: 2017,
      link_video_utama: 'https://www.youtube.com/watch?v=8L8u8XQ8Xq8',
      link_trailer: 'https://www.youtube.com/watch?v=8L8u8XQ8Xq8',
      gambar_poster: 'https://upload.wikimedia.org/wikipedia/id/3/36/Anak_Lanang.jpg',
      status: 'published',
      crew: JSON.stringify([
        { jabatan: 'Sutradara', anggota: ['Wahyu Agung Prasetyo'] }
      ])
    },
    {
      user_id: getRandomUser(),
      category_id: 2, // Dokumenter
      judul: 'Denok & Gareng',
      slug: generateSlug('Denok & Gareng'),
      sinopsis: 'Di tengah harapan, kegagalan dan rencana-rencana baru, Denok dan Gareng tetap bersatu dalam perjuangan mereka untuk kelak mencapai penghidupan yang layak. Di rumah Gareng yang sederhana, pasangan muda muslim yang juga mantan anak jalanan ini memulai peternakan babi demi penghidupan.',
      tahun_karya: 2012,
      link_video_utama: 'https://www.youtube.com/watch?v=placeholder',
      link_trailer: 'https://www.youtube.com/watch?v=placeholder',
      gambar_poster: 'https://upload.wikimedia.org/wikipedia/id/1/1f/Denok_Gareng.jpg',
      status: 'published',
      crew: JSON.stringify([
        { jabatan: 'Sutradara', anggota: ['Dwi Sujanti Nugraheni'] }
      ])
    },
    {
      user_id: getRandomUser(),
      category_id: 3, // Animasi
      judul: 'Battle of Surabaya',
      slug: generateSlug('Battle of Surabaya'),
      sinopsis: 'Musa, remaja penyemir sepatu yang menjadi kurir bagi perjuangan arek-arek Suroboyo dan TKR dalam pertempuran 10 November 1945 di Surabaya. Film animasi 2D drama perang produksi MSV Pictures yang memenangkan berbagai penghargaan internasional.',
      tahun_karya: 2015,
      link_video_utama: 'https://www.youtube.com/watch?v=W0yT6d8J-Jc',
      link_trailer: 'https://www.youtube.com/watch?v=W0yT6d8J-Jc',
      gambar_poster: 'https://upload.wikimedia.org/wikipedia/id/2/23/Poster_Battle_of_Surabaya.jpg',
      status: 'published',
      crew: JSON.stringify([
        { jabatan: 'Sutradara', anggota: ['Aryanto Yuniawan'] },
        { jabatan: 'Produser', anggota: ['M. Suyanto'] }
      ])
    },
    {
      user_id: getRandomUser(),
      category_id: 4, // Musikal
      judul: 'Petualangan Sherina',
      slug: generateSlug('Petualangan Sherina'),
      sinopsis: 'Sherina, gadis kecil yang cerdas dan energik, harus pindah ke Bandung. Di sana ia bertemu Sadam, anak manja yang ternyata musuh bebuyutannya di sekolah. Petualangan dimulai ketika mereka diculik oleh Pak Raden suruhan Kertarajasa.',
      tahun_karya: 2000,
      link_video_utama: 'https://www.youtube.com/watch?v=3W215fJ6lW0',
      link_trailer: 'https://www.youtube.com/watch?v=3W215fJ6lW0',
      gambar_poster: 'https://upload.wikimedia.org/wikipedia/id/3/3c/Petualangan_Sherina_poster.JPG',
      status: 'published',
      crew: JSON.stringify([
        { jabatan: 'Sutradara', anggota: ['Riri Riza'] },
        { jabatan: 'Produser', anggota: ['Mira Lesmana'] },
        { jabatan: 'Musik', anggota: ['Elfa Secioria'] }
      ])
    },
    {
      user_id: getRandomUser(),
      category_id: 5, // Eksperimental
      judul: 'Siti',
      slug: generateSlug('Siti'),
      sinopsis: 'Siti harus berjuang menghidupi ibu mertuanya yang sudah tua, anaknya, dan suaminya yang lumpuh akibat kecelakaan kapal. Ia bekerja siang malam menjual peyek jingking di Parangtritis dan menjadi pemandu karaoke di malam hari. Film hitam putih yang menyentuh hati.',
      tahun_karya: 2014,
      link_video_utama: 'https://www.youtube.com/watch?v=placeholder',
      link_trailer: 'https://www.youtube.com/watch?v=placeholder',
      gambar_poster: 'https://upload.wikimedia.org/wikipedia/id/5/53/Siti_poster.jpg',
      status: 'published',
      crew: JSON.stringify([
        { jabatan: 'Sutradara', anggota: ['Eddie Cahyono'] },
        { jabatan: 'Produser', anggota: ['Ifa Isfansyah'] }
      ])
    }
  ];

  await knex('films').insert(films);
}
