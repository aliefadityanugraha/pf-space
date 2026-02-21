<script setup>
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Film, Users, Archive, Award } from 'lucide-vue-next'
import { useHead } from '@unhead/vue'

useHead({
  title: 'Tentang PF Space - Visi & Misi',
  meta: [
    { name: 'description', content: 'Pelajari lebih lanjut tentang PF Space, platform kearsipan film digital yang didedikasikan untuk siswa.' }
  ]
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F2EEE3]">
    <Navbar />
    <main class="pt-28 pb-16">
      <div class="max-w-7xl mx-auto px-4 md:px-8">
        <h1 class="text-4xl md:text-5xl font-display font-semibold text-slate-900 mb-6">Tentang PF Space</h1>
        
        <p class="text-lg font-body text-slate-600 mb-12 leading-relaxed">
          PF Space adalah platform digital yang didedikasikan untuk mengarsipkan dan menampilkan karya film siswa. 
          Kami percaya pada kekuatan sinema untuk bercerita, menginspirasi perubahan, dan menghubungkan komunitas.
        </p>

        <!-- Collaboration Section -->
        <section class="mb-16 p-8 md:p-12 bg-white border-2 border-black shadow-brutal text-center relative overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-red via-brand-orange to-brand-teal"></div>
          
          <h2 class="text-sm font-mono font-bold text-stone-500 uppercase tracking-widest mb-10">Kolaborasi Strategis 3 Instansi</h2>
          
          <div class="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <!-- Logo 1: SMKN Ngasem -->
            <div class="flex flex-col items-center gap-4 group">
              <div class="w-32 h-32 md:w-36 md:h-36 bg-[#F2EEE3] border-2 border-black p-4 flex items-center justify-center shadow-brutal-sm group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all">
                <img src="/logo-smkn-ngasem.png" alt="SMKN Ngasem Kediri" class="max-w-full max-h-full object-contain" />
              </div>
              <span class="font-display font-bold text-sm text-stone-800">SMKN Ngasem</span>
            </div>
            
            <div class="text-3xl font-display font-black text-brand-red opacity-50 hidden md:block">X</div>
            <div class="md:hidden text-2xl font-display font-black text-brand-red opacity-50">✕</div>
            
            <!-- Logo 2: Produksi Film -->
            <div class="flex flex-col items-center gap-4 group">
              <div class="w-32 h-32 md:w-36 md:h-36 bg-[#F2EEE3] border-2 border-black p-4 flex items-center justify-center shadow-brutal-sm group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all">
                <img src="/logo-perfilman.png" alt="Produksi Film" class="max-w-full max-h-full object-contain" />
              </div>
              <span class="font-display font-bold text-sm text-stone-800">Produksi Film</span>
            </div>
            
            <div class="text-3xl font-display font-black text-brand-red opacity-50 hidden md:block">X</div>
            <div class="md:hidden text-2xl font-display font-black text-brand-red opacity-50">✕</div>
            
            <!-- Logo 3: Sistem Informasi / Academic -->
            <div class="flex flex-col items-center gap-4 group">
              <div class="w-32 h-32 md:w-36 md:h-36 bg-[#F2EEE3] border-2 border-black p-4 flex items-center justify-center shadow-brutal-sm group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all">
                <div class="flex flex-col items-center text-stone-400">
                  <Award class="w-12 h-12 mb-1" />
                  <span class="text-[10px] font-bold uppercase">Sistem Informasi</span>
                </div>
              </div>
              <span class="font-display font-bold text-sm text-stone-800">Sistem Informasi</span>
            </div>
          </div>
          
          <p class="mt-12 text-stone-600 font-body text-sm md:text-base max-w-2xl mx-auto italic">
            "Platform ini lahir dari sinergi antara dunia pendidikan kejuruan, industri kreatif perfilman, dan pengembangan sistem informasi akademik."
          </p>
        </section>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card class="border-2 border-black shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
            <CardHeader>
              <Film class="w-8 h-8 text-brand-red mb-2" />
              <CardTitle class="font-display font-bold">Arsip Film</CardTitle>
              <CardDescription class="font-body">Akses ratusan karya film siswa dari berbagai genre dan tahun.</CardDescription>
            </CardHeader>
          </Card>

          <Card class="border-2 border-black shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
            <CardHeader>
              <Users class="w-8 h-8 text-brand-teal mb-2" />
              <CardTitle class="font-display font-bold">Komunitas</CardTitle>
              <CardDescription class="font-body">Terhubung dengan sesama penikmat film dan para pembuatnya.</CardDescription>
            </CardHeader>
          </Card>

          <Card class="border-2 border-black shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
            <CardHeader>
              <Archive class="w-8 h-8 text-brand-orange mb-2" />
              <CardTitle class="font-display font-bold">Pelestarian</CardTitle>
              <CardDescription class="font-body">Mengarsipkan karya sinema secara digital untuk generasi mendatang.</CardDescription>
            </CardHeader>
          </Card>

          <Card class="border-2 border-black shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
            <CardHeader>
              <Award class="w-8 h-8 text-yellow-500 mb-2" />
              <CardTitle class="font-display font-bold">Apresiasi</CardTitle>
              <CardDescription class="font-body">Kurasi dan penayangan rutin untuk menyoroti karya siswa terbaik.</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <!-- Founders Section -->
        <section class="mt-24">
          <h2 class="text-3xl font-display font-bold text-stone-900 mb-2 tracking-tight">Meet The Founders</h2>
          <div class="w-20 h-2 bg-brand-red mb-12"></div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Founder 1 -->
            <div class="group">
              <div class="relative mb-4">
                <div class="aspect-square bg-brand-orange border-2 border-black shadow-brutal group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all flex items-center justify-center overflow-hidden">
                  <img src="/the founders/MEET TEDO.jpg" alt="Tedo Haris Candra" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                </div>
                <!-- <div class="absolute -bottom-2 -right-2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">Business</div> -->
              </div>
              <h3 class="font-display font-bold text-xl text-stone-900">Tedo Haris Candra</h3>
              <p class="text-xs font-bold text-brand-teal uppercase tracking-widest mb-3 italic">Business Analyst</p>
              <p class="text-sm text-stone-600 font-body leading-relaxed">
                Menerjemahkan visi pelestarian ke dalam strategi pengembangan produk yang terstruktur, memastikan platform menjawab kebutuhan komunitas.
              </p>
            </div>

            <!-- Founder 2 -->
            <div class="group">
              <div class="relative mb-4">
                <div class="aspect-square bg-brand-teal border-2 border-black shadow-brutal group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all flex items-center justify-center overflow-hidden">
                  <img src="/the founders/MEET RIZAL.jpg" alt="M. Misbach H. Afrizal" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                </div>
                <!-- <div class="absolute -bottom-2 -right-2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">Tech Lead</div> -->
              </div>
              <h3 class="font-display font-bold text-xl text-stone-900">M. Misbach H. Afrizal</h3>
              <p class="text-xs font-bold text-brand-orange uppercase tracking-widest mb-3 italic">System Architecture</p>
              <p class="text-sm text-stone-600 font-body leading-relaxed">
                Membangun fondasi teknis yang kokoh dan skalabel, menjamin keamanan serta performa tinggi dalam pengarsipan film digital.
              </p>
            </div>

            <!-- Founder 3 -->
            <div class="group">
              <div class="relative mb-4">
                <div class="aspect-square bg-brand-red border-2 border-black shadow-brutal group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all flex items-center justify-center overflow-hidden">
                  <img src="/the founders/MEET ME ALIEF.jpg" alt="Alief Aditya Nugraha" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                </div>
                <!-- <div class="absolute -bottom-2 -right-2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">Designer</div> -->
              </div>
              <h3 class="font-display font-bold text-xl text-stone-900">Alief Aditya Nugraha</h3>
              <p class="text-xs font-bold text-brand-red uppercase tracking-widest mb-3 italic">UI/UX Designer</p>
              <p class="text-sm text-stone-600 font-body leading-relaxed">
                Menciptakan pengalaman visual yang unik dengan estetikap, memadukan fungsi dan seni untuk menghidupkan karakter PF Space.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
    <Footer />
  </div>
</template>
