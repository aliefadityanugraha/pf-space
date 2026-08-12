<script setup>
import PageLayout from "@/components/PageLayout.vue";
import PageHeader from "@/components/PageHeader.vue";
import { Badge } from "@/components/ui/badge";
import { useHead } from "@unhead/vue";
import { Globe, Github, Instagram } from "lucide-vue-next";

useHead({
  title: "Tentang PF Space - Visi & Misi",
  meta: [
    {
      name: "description",
      content:
        "Pelajari lebih lanjut tentang PF Space, platform kearsipan film digital yang didedikasikan untuk siswa.",
    },
  ],
});
</script>

<template>
  <PageLayout>
    <div class="max-w-7xl mx-auto px-4 md:px-8">
      <!-- Breadcrumb -->
      <nav
        class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4 pt-2 md:pt-8"
      >
        <router-link to="/" class="text-brand-teal hover:underline"
          >Beranda</router-link
        >
        <span class="text-stone-400">/</span>
        <Badge
          variant="outline"
          class="bg-orange-100 text-orange-700 border-orange-300"
          >Tentang</Badge
        >
      </nav>

      <PageHeader
        title="Tentang PF Space"
        description="Pelajari lebih lanjut tentang misi kami dalam mengarsipkan dan menampilkan karya film siswa."
        icon-color="bg-brand-orange"
      />

      <p
        class="text-sm md:text-lg font-body text-muted-foreground mb-8 md:mb-12 leading-relaxed"
      >
        PF Space adalah platform digital yang didedikasikan untuk mengarsipkan
        dan menampilkan karya film siswa. Kami percaya pada kekuatan sinema
        untuk bercerita, menginspirasi perubahan, dan menghubungkan komunitas.
      </p>

      <!-- Collaboration Section -->
      <section
        class="mb-12 md:mb-16 p-6 md:p-12 bg-card text-card-foreground border-2 border-border shadow-brutal text-center relative overflow-hidden"
      >
        <div
          class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-red via-brand-orange to-brand-teal"
        ></div>

        <h2
          class="text-[9px] md:text-sm font-mono font-bold text-muted-foreground uppercase tracking-widest mb-6 md:mb-10"
        >
          Program Kreativitas Mahasiswa - Pengabdian Masyarakat Universitas Dian
          Nuswantoro
        </h2>

        <div
          class="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16"
        >
          <!-- Logo 1: SMKN Ngasem -->
          <div class="flex flex-col items-center gap-3 md:gap-4 group">
            <div class="w-24 h-24 md:w-48 md:h-48">
              <img
                src="/logo-smkn-ngasem.png"
                alt="SMKN Ngasem Kediri"
                class="w-full max-h-full object-contain"
              />
            </div>
            <div class="flex flex-col">
              <span class="font-display font-bold text-sm text-foreground"
                >SMKN Ngasem</span
              >
              <span class="text-[10px] text-muted-foreground uppercase font-mono"
                >Mitra Pengabdian</span
              >
            </div>
          </div>

          <div
            class="text-3xl font-display font-black text-brand-red opacity-30 hidden md:block"
          >
            &
          </div>
          <div
            class="md:hidden text-2xl font-display font-black text-brand-red opacity-30"
          >
            &
          </div>

          <!-- Logo 2: Produksi Film -->
          <div class="flex flex-col items-center gap-3 md:gap-4 group">
            <div class="w-24 h-24 md:w-48 md:h-48">
              <img
                src="/logo-perfilman.png"
                alt="Produksi Film"
                class="w-full max-h-full object-contain"
              />
            </div>
            <div class="flex flex-col">
              <span class="font-display font-bold text-sm text-foreground"
                >Produksi Film</span
              >
              <span class="text-[10px] text-muted-foreground uppercase font-mono"
                >Konsultan Kreatif</span
              >
            </div>
          </div>

          <div
            class="text-3xl font-display font-black text-brand-red opacity-30 hidden md:block"
          >
            &
          </div>
          <div
            class="md:hidden text-2xl font-display font-black text-brand-red opacity-30"
          >
            &
          </div>

          <!-- Logo 3: UDINUS -->
          <div class="flex flex-col items-center gap-3 md:gap-4 group">
            <div class="w-24 h-24 md:w-48 md:h-48">
              <img
                src="/Logo-Udinus-Official-02-1-1024x1024.png"
                alt="Universitas Dian Nuswantoro"
                class="max-w-full max-h-full object-contain"
              />
            </div>
            <div class="flex flex-col">
              <span class="font-display font-bold text-sm text-foreground"
                >UDINUS</span
              >
              <span class="text-[10px] text-muted-foreground uppercase font-mono"
                >Inisiator PKM-PM</span
              >
            </div>
          </div>
        </div>

        <p
          class="mt-8 md:mt-12 text-muted-foreground font-body text-xs md:text-base max-w-3xl mx-auto italic leading-relaxed px-4 md:px-0"
        >
          "Platform ini merupakan wujud nyata kontribusi mahasiswa Universitas
          Dian Nuswantoro melalui Program Kreativitas Mahasiswa (PKM-PM) dalam
          melestarikan karya kreatif siswa SMKN Ngasem Kediri."
        </p>
      </section>

      <div class="mt-8 space-y-12">
        <!-- Visi & Misi Card -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Visi -->
          <div
            class="bg-card text-card-foreground border-2 border-border p-6 md:p-8 shadow-brutal hover:shadow-brutal-lg transition-all"
          >
            <h3
              class="font-display font-bold text-xl md:text-2xl text-foreground mb-4 flex items-center gap-3"
            >
              <span
                class="w-3 h-3 bg-brand-red border border-border inline-block"
              ></span>
              Visi Kami
            </h3>
            <p
              class="text-muted-foreground font-body text-sm md:text-base leading-relaxed"
            >
              Menjadi wadah digital terdepan dalam melestarikan, mengapresiasi,
              dan mengembangkan potensi karya sinematik siswa sekolah menengah
              di seluruh Indonesia.
            </p>
          </div>

          <!-- Misi -->
          <div
            class="bg-card text-card-foreground border-2 border-border p-6 md:p-8 shadow-brutal hover:shadow-brutal-lg transition-all"
          >
            <h3
              class="font-display font-bold text-xl md:text-2xl text-foreground mb-4 flex items-center gap-3"
            >
              <span
                class="w-3 h-3 bg-brand-teal border border-border inline-block"
              ></span>
              Misi Kami
            </h3>
            <ul
              class="text-muted-foreground font-body text-sm md:text-base space-y-2 list-disc list-inside leading-relaxed"
            >
              <li>Mengarsipkan karya film siswa secara terstruktur dan aman</li>
              <li>Menyediakan materi pembelajaran film yang mudah diakses</li>
              <li>
                Membangun ekosistem apresiasi antara siswa, pengajar, dan publik
              </li>
            </ul>
          </div>
        </div>

        <!-- Latar Belakang Section -->
        <div
          class="bg-card text-card-foreground border-2 border-border p-6 md:p-10 shadow-brutal"
        >
          <h2
            class="font-display font-bold text-2xl md:text-3xl text-foreground mb-4"
          >
            Latar Belakang
          </h2>
          <div
            class="prose dark:prose-invert max-w-none font-body text-sm md:text-base leading-relaxed space-y-4 text-muted-foreground"
          >
            <p>
              PF Space (Platform Kearsipan Film Digital Siswa) lahir dari
              kebutuhan akan sistem dokumentasi karya kreatif siswa yang lebih
              terintegrasi dan berkelanjutan.
            </p>
            <p>
              Banyak karya sinematik siswa yang luar biasa terancam hilang atau
              tidak terdokumentasi dengan baik setelah masa studi selesai. PF
              Space hadir sebagai solusi untuk memastikan setiap karya, naskah,
              storyboard, dan materi pembelajaran dapat diakses, dipelajari,
              serta diapresiasi oleh generasi mendatang.
            </p>
          </div>
        </div>
      </div>

      <!-- Founders Section -->
      <section class="mt-16 md:mt-24">
        <h2
          class="text-xl md:text-3xl font-display font-bold text-foreground mb-2 tracking-tight"
        >
          Temui Pendiri Kami
        </h2>
        <div class="w-16 md:w-20 h-1.5 md:h-2 bg-brand-red mb-8 md:mb-12"></div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Founder 1 -->
          <div class="group">
            <div class="relative mb-3 md:mb-4">
              <div
                class="aspect-square bg-brand-orange border-2 border-border shadow-brutal group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all flex items-center justify-center overflow-hidden"
              >
                <img
                  src="/the founders/MEET TEDO.jpg"
                  alt="Tedo Haris Candra"
                  class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                />
              </div>
            </div>
            <h3
              class="font-display font-bold text-lg md:text-xl text-foreground"
            >
              Tedo Haris Candra
            </h3>
            <p
              class="text-[10px] md:text-xs font-bold text-brand-teal uppercase tracking-widest mb-2 md:mb-3 italic"
            >
              Business Analyst & Content Manager
            </p>
            <p
              class="text-[13px] md:text-sm text-muted-foreground font-body leading-relaxed mb-4"
            >
              Menganalisis kebutuhan alur platform dan strategi produk, serta
              mengelola struktur konten sinematik dan aset pembelajaran agar
              memberikan dampak optimal bagi komunitas.
            </p>
            <!-- Social Links -->
            <div
              class="flex items-center gap-2 pt-3 border-t-2 border-border"
            >
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                title="Portfolio Tedo Haris Candra"
                class="p-2 bg-card border-2 border-border shadow-brutal-xs hover:bg-brand-teal hover:text-white transition-all text-foreground flex items-center gap-1 text-xs font-bold font-mono"
              >
                <Globe class="w-3.5 h-3.5" />
                <span>Portfolio</span>
              </a>
              <a
                href="https://github.com/candratd"
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub Tedo Haris Candra"
                class="p-2 bg-white border-2 border-stone-900 shadow-brutal-xs hover:bg-stone-900 hover:text-white transition-all text-stone-900"
              >
                <Github class="w-3.5 h-3.5" />
              </a>
              <a
                href="https://www.instagram.com/tedohc/"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram Tedo Haris Candra"
                class="p-2 bg-white border-2 border-stone-900 shadow-brutal-xs hover:bg-pink-600 hover:text-white transition-all text-stone-900"
              >
                <Instagram class="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <!-- Founder 2 -->
          <div class="group">
            <div class="relative mb-3 md:mb-4">
              <div
                class="aspect-square bg-brand-teal border-2 border-black shadow-brutal group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all flex items-center justify-center overflow-hidden"
              >
                <img
                  src="/the founders/MEET RIZAL.jpg"
                  alt="M. Misbach H. Afrizal"
                  class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                />
              </div>
            </div>
            <h3
              class="font-display font-bold text-lg md:text-xl text-stone-900"
            >
              M. Misbach H. Afrizal
            </h3>
            <p
              class="text-[10px] md:text-xs font-bold text-brand-orange uppercase tracking-widest mb-2 md:mb-3 italic"
            >
              System Architecture & UI/UX Designer
            </p>
            <p
              class="text-[13px] md:text-sm text-stone-600 font-body leading-relaxed mb-4"
            >
              Merancang arsitektur sistem yang skalabel, aman, dan efisien,
              serta menyusun konsep desain antarmuka pengguna yang intuitif.
            </p>
            <!-- Social Links -->
            <div
              class="flex items-center gap-2 pt-3 border-t-2 border-stone-200"
            >
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                title="Portfolio M. Misbach H. Afrizal"
                class="p-2 bg-white border-2 border-stone-900 shadow-brutal-xs hover:bg-brand-orange hover:text-stone-900 transition-all text-stone-900 flex items-center gap-1 text-xs font-bold font-mono"
              >
                <Globe class="w-3.5 h-3.5" />
                <span>Portfolio</span>
              </a>
              <a
                href="https://github.com/hafistafrizal"
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub M. Misbach H. Afrizal"
                class="p-2 bg-white border-2 border-stone-900 shadow-brutal-xs hover:bg-stone-900 hover:text-white transition-all text-stone-900"
              >
                <Github class="w-3.5 h-3.5" />
              </a>
              <a
                href="https://instagram.com/hafishta"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram M. Misbach H. Afrizal"
                class="p-2 bg-white border-2 border-stone-900 shadow-brutal-xs hover:bg-pink-600 hover:text-white transition-all text-stone-900"
              >
                <Instagram class="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <!-- Founder 3 -->
          <div class="group">
            <div class="relative mb-3 md:mb-4">
              <div
                class="aspect-square bg-brand-red border-2 border-black shadow-brutal group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all flex items-center justify-center overflow-hidden"
              >
                <img
                  src="/the founders/MEET ME ALIEF.jpg"
                  alt="Alief Aditya Nugraha"
                  class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                />
              </div>
            </div>
            <h3
              class="font-display font-bold text-lg md:text-xl text-stone-900"
            >
              Alief Aditya Nugraha
            </h3>
            <p
              class="text-[10px] md:text-xs font-bold text-brand-red uppercase tracking-widest mb-2 md:mb-3 italic"
            >
              UI/UX Designer & Fullstack Engineer
            </p>
            <p
              class="text-[13px] md:text-sm text-stone-600 font-body leading-relaxed mb-4"
            >
              Mendesain identitas visual Neobrutalism khas PF Space serta
              mengimplementasikan pengkodean frontend dan backend secara
              end-to-end.
            </p>
            <!-- Social Links -->
            <div
              class="flex items-center gap-2 pt-3 border-t-2 border-stone-200"
            >
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                title="Portfolio Alief Aditya Nugraha"
                class="p-2 bg-white border-2 border-stone-900 shadow-brutal-xs hover:bg-brand-red hover:text-white transition-all text-stone-900 flex items-center gap-1 text-xs font-bold font-mono"
              >
                <Globe class="w-3.5 h-3.5" />
                <span>Portfolio</span>
              </a>
              <a
                href="https://github.com/aliefadityanugraha"
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub Alief Aditya Nugraha"
                class="p-2 bg-white border-2 border-stone-900 shadow-brutal-xs hover:bg-stone-900 hover:text-white transition-all text-stone-900"
              >
                <Github class="w-3.5 h-3.5" />
              </a>
              <a
                href="https://instagram.com/aliefaditya.n"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram Alief Aditya Nugraha"
                class="p-2 bg-white border-2 border-stone-900 shadow-brutal-xs hover:bg-pink-600 hover:text-white transition-all text-stone-900"
              >
                <Instagram class="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  </PageLayout>
</template>
