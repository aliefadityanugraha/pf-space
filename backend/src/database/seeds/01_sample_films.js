export async function seed(knex) {
  // Get admin or first user
  const adminUser = await knex('users').first();
  if (!adminUser) {
    console.log('⚠️ No user found in database. Run 00_admin_user seed first.');
    return;
  }

  // Ensure default categories exist
  let categories = await knex('categories').select('*');
  if (categories.length === 0) {
    console.log('Creating default categories...');
    const catData = [
      { nama_kategori: 'Film Pendek', deskripsi: 'Karya fiksi pendek berkualitas dari siswa.' },
      { nama_kategori: 'Dokumenter', deskripsi: 'Karya dokumentasi realita kehidupan dan kebudayaan.' },
      { nama_kategori: 'Animasi', deskripsi: 'Film animasi 2D dan 3D karya kreator muda.' },
      { nama_kategori: 'Musik Video', deskripsi: 'Karya ekspresi musik dan visual.' },
      { nama_kategori: 'Eksperimental', deskripsi: 'Karya inovatif dengan gaya sinema bebas.' },
    ];
    await knex('categories').insert(catData);
    categories = await knex('categories').select('*');
  }

  const catMap = {};
  categories.forEach(c => {
    catMap[c.nama_kategori] = c.category_id;
  });
  const defaultCatId = categories[0]?.category_id || 1;

  const sampleFilms = [
    {
      judul: "Bayang Sepi",
      slug: "bayang-sepi-2026",
      sinopsis: "Kisah seorang pemuda yang mencari jejak kenangan lamanya di balik sunyinya sudut kota tua.",
      tahun_karya: 2026,
      link_video_utama: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      gambar_poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop",
      category_id: catMap['Film Pendek'] || defaultCatId,
      user_id: adminUser.id,
      status: 'published',
    },
    {
      judul: "Cahaya Di Ujung Senja",
      slug: "cahaya-di-ujung-senja",
      sinopsis: "Perjuangan seorang anak pesisir mengejar impian di tengah keterbatasan teknologi.",
      tahun_karya: 2025,
      link_video_utama: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      gambar_poster: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop",
      category_id: catMap['Dokumenter'] || defaultCatId,
      user_id: adminUser.id,
      status: 'published',
    },
    {
      judul: "Jejak Langkah Guruku",
      slug: "jejak-langkah-guruku",
      sinopsis: "Dokumentasi pengabdian 30 tahun seorang guru honorer di pelosok negeri.",
      tahun_karya: 2025,
      link_video_utama: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      gambar_poster: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop",
      category_id: catMap['Dokumenter'] || defaultCatId,
      user_id: adminUser.id,
      status: 'published',
    },
    {
      judul: "Melodi Dari Kereta",
      slug: "melodi-dari-kereta",
      sinopsis: "Pertemuan tidak sengaja dua musikus jalanan di dalam kereta komuter malam.",
      tahun_karya: 2026,
      link_video_utama: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      gambar_poster: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&auto=format&fit=crop",
      category_id: catMap['Musik Video'] || defaultCatId,
      user_id: adminUser.id,
      status: 'published',
    },
    {
      judul: "Garis Waktu 3D",
      slug: "garis-waktu-3d",
      sinopsis: "Petualangan melintasi dimensi waktu menggunakan mesin buatan sendiri.",
      tahun_karya: 2024,
      link_video_utama: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      gambar_poster: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=800&auto=format&fit=crop",
      category_id: catMap['Animasi'] || defaultCatId,
      user_id: adminUser.id,
      status: 'published',
    },
    {
      judul: "Lentera Desa",
      slug: "lentera-desa",
      sinopsis: "Inovasi penerangan tenaga surya ramah lingkungan ciptaan siswa SMK.",
      tahun_karya: 2026,
      link_video_utama: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      gambar_poster: "https://images.unsplash.com/photo-1518676599625-583569970993?w=800&auto=format&fit=crop",
      category_id: catMap['Dokumenter'] || defaultCatId,
      user_id: adminUser.id,
      status: 'published',
    },
    {
      judul: "Rasa Dalam Sunyi",
      slug: "rasa-dalam-sunyi",
      sinopsis: "Kisah persahabatan anak tunarungu yang mengekspresikan seni lukis.",
      tahun_karya: 2025,
      link_video_utama: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      gambar_poster: "https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800&auto=format&fit=crop",
      category_id: catMap['Film Pendek'] || defaultCatId,
      user_id: adminUser.id,
      status: 'published',
    },
    {
      judul: "Detik Terakhir",
      slug: "detik-terakhir",
      sinopsis: "Ketegangan tim penyelamat dalam mengungkap rahasia laboratorium tua.",
      tahun_karya: 2026,
      link_video_utama: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      gambar_poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop",
      category_id: catMap['Eksperimental'] || defaultCatId,
      user_id: adminUser.id,
      status: 'published',
    },
    {
      judul: "Harmoni Nusantara",
      slug: "harmoni-nusantara",
      sinopsis: "Gubahan alunan musik tradisional khas daerah dipadukan dengan irama modern.",
      tahun_karya: 2024,
      link_video_utama: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      gambar_poster: "https://images.unsplash.com/photo-1515634928627-2a4e0dae3ddf?w=800&auto=format&fit=crop",
      category_id: catMap['Musik Video'] || defaultCatId,
      user_id: adminUser.id,
      status: 'published',
    },
    {
      judul: "Mimpi Anak Nelayan",
      slug: "mimpi-anak-nelayan",
      sinopsis: "Kehidupan sehari-hari anak-anak pesisir yang merajut cita-cita menjadi kapten laut.",
      tahun_karya: 2025,
      link_video_utama: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      gambar_poster: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&auto=format&fit=crop",
      category_id: catMap['Dokumenter'] || defaultCatId,
      user_id: adminUser.id,
      status: 'published',
    },
    {
      judul: "Sketsa Senja",
      slug: "sketsa-senja",
      sinopsis: "Kisah romansa sederhana berlatar suasana kota masa kecil yang hangat.",
      tahun_karya: 2026,
      link_video_utama: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      gambar_poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop",
      category_id: catMap['Film Pendek'] || defaultCatId,
      user_id: adminUser.id,
      status: 'published',
    },
    {
      judul: "Surat Untuk Ibu",
      slug: "surat-untuk-ibu",
      sinopsis: "Pesan emosional anak perantau yang berjuang menuntut ilmu di kota besar.",
      tahun_karya: 2025,
      link_video_utama: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      gambar_poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&auto=format&fit=crop",
      category_id: catMap['Film Pendek'] || defaultCatId,
      user_id: adminUser.id,
      status: 'published',
    },
    {
      judul: "Bayangan Kota",
      slug: "bayangan-kota",
      sinopsis: "Visualisasi eksperimental arsitektur malam dan ritme lampu jalanan.",
      tahun_karya: 2024,
      link_video_utama: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      gambar_poster: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop",
      category_id: catMap['Eksperimental'] || defaultCatId,
      user_id: adminUser.id,
      status: 'published',
    },
    {
      judul: "Petualangan Kibo",
      slug: "petualangan-kibo",
      sinopsis: "Animasi pendek fiksi fabel tentang robot ramah pembantu lingkungan.",
      tahun_karya: 2026,
      link_video_utama: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      gambar_poster: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop",
      category_id: catMap['Animasi'] || defaultCatId,
      user_id: adminUser.id,
      status: 'published',
    },
    {
      judul: "Suara Hati Sang Penari",
      slug: "suara-hati-sang-penari",
      sinopsis: "Proses latihan tari tradisional untuk pergelaran budaya tingkat internasional.",
      tahun_karya: 2025,
      link_video_utama: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      gambar_poster: "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800&auto=format&fit=crop",
      category_id: catMap['Dokumenter'] || defaultCatId,
      user_id: adminUser.id,
      status: 'published',
    }
  ];

  console.log(`Seeding 15 sample films into 'films' table...`);
  for (const film of sampleFilms) {
    const existing = await knex('films').where({ slug: film.slug }).first();
    if (!existing) {
      await knex('films').insert({
        ...film,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });
    }
  }

  console.log('✅ Successfully seeded 15 sample films!');
}
