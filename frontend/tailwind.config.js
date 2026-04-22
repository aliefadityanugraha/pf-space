/**
 * ⚠️  PERHATIAN: File ini TIDAK AKTIF / dead code.
 *
 * Proyek ini menggunakan Tailwind CSS v4 via plugin @tailwindcss/vite (lihat vite.config.js).
 * Tailwind v4 TIDAK membaca tailwind.config.js — konfigurasi tema sepenuhnya
 * dilakukan melalui blok @theme di src/style.css.
 *
 * File ini dibiarkan agar tidak menyebabkan error jika ada tool lain yang membacanya,
 * tapi TIDAK berpengaruh pada hasil build.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
