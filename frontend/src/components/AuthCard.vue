<script setup>
import { ref, onMounted } from "vue";
import { Badge } from "@/components/ui/badge";
import { Film, ArrowLeft } from "lucide-vue-next";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { assetUrl } from "@/lib/format";

defineProps({
  title: {
    type: String,
    default: "PF Space",
  },
  subtitle: {
    type: String,
    default: "Educational Film Repository",
  },
  className: {
    type: String,
    default: "",
  },
  split: {
    type: Boolean,
    default: false,
  },
  image: {
    type: String,
    default: "/banner.webp",
  },
});

const curators = ref([]);
const totalCurators = ref(0);
const failedImages = ref({});

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const fetchTopCurators = async () => {
  try {
    const res = await api.get("/api/users/top-curators");
    const payload = res?.data || res;
    if (payload && payload.curators) {
      curators.value = payload.curators;
      totalCurators.value = payload.totalCurators || payload.curators.length || 0;
    }
  } catch (err) {
    console.debug("Failed to load top curators", err);
  }
};

onMounted(() => {
  fetchTopCurators();
});
</script>

<template>
  <div
    class="min-h-screen w-full bg-[#f2eee3] dark:bg-[#121110] flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 relative overflow-y-auto sm:overflow-hidden select-none selection:bg-red-500 selection:text-white transition-colors duration-300"
  >
    <!-- Floating Back to Home Button (Expert & Clean Placement) -->
    <router-link
      to="/"
      class="fixed top-4 left-4 sm:top-6 sm:left-6 z-30 inline-flex items-center gap-2 px-3.5 py-1.5 sm:py-2 bg-white/95 dark:bg-[#1a1816]/95 backdrop-blur border-2 border-stone-900 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:text-red-600 dark:hover:text-red-400 text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all group"
      title="Kembali ke Beranda Utama"
    >
      <ArrowLeft class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 group-hover:-translate-x-0.5 transition-transform" />
      <span class="text-[11px] sm:text-xs">Beranda</span>
    </router-link>

    <!-- Ambient Backdrop Effects for Depth -->
    <div
      class="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:24px_24px]"
    ></div>
    <div
      class="absolute w-[500px] h-[500px] rounded-full bg-red-600/10 blur-[120px] pointer-events-none -top-24 -left-24"
    ></div>
    <div
      class="absolute w-[400px] h-[400px] rounded-full bg-amber-600/5 blur-[100px] pointer-events-none -bottom-20 -right-20"
    ></div>

    <!-- Auth Layout Card Container (80-90% scale, compact, adaptive light/dark theme) -->
    <div
      :class="
        cn(
          'w-full max-w-[880px] bg-white dark:bg-[#1a1816] border-2 border-stone-900 dark:border-stone-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.85)] flex flex-col md:flex-row relative z-10 my-auto rounded-none overflow-hidden transition-colors duration-300',
          !split && 'max-w-[440px] flex-col',
          className
        )
      "
    >
      <!-- Left side: Cinematic Image / Branding Banner (Positioned at bottom as originally) -->
      <div
        v-if="split"
        class="hidden md:flex md:w-[45%] relative overflow-hidden bg-[#2b0808] border-r-2 border-stone-900 dark:border-stone-800 flex-col justify-end min-h-[530px]"
      >
        <!-- Background Mountain / Banner Image -->
        <img
          :src="image"
          alt="Auth background"
          class="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-luminosity scale-105"
        />
        <!-- Multi-layer Gradient for Legibility & Contrast -->
        <div
          class="absolute inset-0 bg-gradient-to-t from-[#140404] via-red-950/70 to-transparent"
        ></div>
        <div
          class="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/20"
        ></div>

        <!-- Banner Content Placed at Bottom (Seperti Semula) -->
        <div class="relative z-10 p-7 lg:p-8 flex flex-col justify-end">
          <!-- Film Reel Icon Badge with High Contrast -->
          <div
            class="w-12 h-12 bg-white flex items-center justify-center mb-5 border-2 border-stone-900 shadow-[3px_3px_0px_#000]"
          >
            <Film class="w-7 h-7 text-red-600" />
          </div>

          <!-- Title PF Space with clear high-contrast white & amber colors -->
          <h1
            class="text-3xl lg:text-4xl font-display font-black text-white leading-tight mb-2 tracking-tight drop-shadow-md"
          >
            PF <span class="text-amber-400 font-extrabold">Space</span>
          </h1>
          <div class="w-12 h-1 bg-amber-400 mb-4"></div>

          <!-- Description Quote -->
          <p
            class="text-xs lg:text-sm text-stone-200 font-body leading-relaxed max-w-xs italic text-pretty drop-shadow mb-6"
          >
            "Portal sinema dan pengarsipan untuk mendukung pembelajaran dan
            apresiasi karya sinematografi."
          </p>

          <!-- Bottom Area: Realtime Kurator stats & Top Creator Avatars -->
          <div class="pt-5 border-t border-white/15 flex items-center gap-3">
            <!-- Dynamic Curators Avatar Stack with Real Profile Photos -->
            <div class="flex -space-x-2.5 overflow-hidden py-1 items-center">
              <template v-if="curators && curators.length > 0">
                <div
                  v-for="curator in curators"
                  :key="curator.id"
                  class="relative group cursor-pointer"
                  :title="`${curator.name} • ${curator.role_name} (${curator.activity_label})`"
                >
                  <!-- Creator Avatar Image -->
                  <img
                    v-if="curator.image && !failedImages[curator.id]"
                    :src="assetUrl(curator.image)"
                    :alt="curator.name"
                    @error="failedImages[curator.id] = true"
                    class="w-8.5 h-8.5 rounded-full object-cover border-2 border-stone-950 bg-stone-800 shadow-md ring-1 ring-white/20 transition-transform group-hover:scale-110 group-hover:z-20"
                    loading="lazy"
                  />
                  <!-- Fallback Initial Avatar -->
                  <div
                    v-else
                    :class="
                      cn(
                        'w-8.5 h-8.5 rounded-full border-2 border-stone-950 flex items-center justify-center text-[10px] font-black uppercase shadow-md ring-1 ring-white/20 transition-transform group-hover:scale-110 group-hover:z-20',
                        curator.role_name === 'Admin'
                          ? 'bg-red-700 text-white'
                          : curator.role_name === 'Kreator'
                          ? 'bg-amber-600 text-stone-950'
                          : 'bg-stone-800 text-amber-300'
                      )
                    "
                  >
                    {{ getInitials(curator.name) }}
                  </div>
                </div>
              </template>
              <!-- Loading Skeleton -->
              <template v-else>
                <div
                  v-for="i in 3"
                  :key="i"
                  class="w-8.5 h-8.5 rounded-full border-2 border-stone-950 bg-stone-800/80 animate-pulse"
                ></div>
              </template>
            </div>

            <!-- Dynamic Curator Text -->
            <p
              class="text-[10px] text-stone-200 font-bold uppercase tracking-wider leading-tight drop-shadow"
            >
              Bergabung dengan {{ totalCurators > 0 ? (totalCurators >= 100 ? totalCurators + '+' : totalCurators) : '' }} kurator film lainnya
            </p>
          </div>
        </div>
      </div>

      <!-- Right side: Form Container (Adaptive Light/Dark Theme) -->
      <div
        :class="
          cn('flex-1 flex flex-col bg-[#fbf9f5] dark:bg-[#1c1a18] transition-colors duration-300', split ? 'md:w-[55%]' : 'w-full')
        "
      >
        <!-- Red accent top-bar (if NOT split) -->
        <div v-if="!split" class="h-1.5 bg-red-600"></div>

        <div
          :class="
            cn(
              'p-6 sm:p-7 md:p-8 flex flex-col justify-center flex-1',
              !split && 'p-6 sm:p-8'
            )
          "
        >
          <!-- Small Header for Non-Split view -->
          <div v-if="!split" class="flex justify-center mb-3">
            <div
              class="w-10 h-10 bg-white flex items-center justify-center border border-black shadow-[2px_2px_0px_#000]"
            >
              <Film class="w-6 h-6 text-red-600" />
            </div>
          </div>

          <!-- Section Title & Subtitle -->
          <div :class="cn('mb-4 sm:mb-5', !split && 'text-center')">
            <Badge
              v-if="split"
              variant="outline"
              class="mb-2 text-red-600 dark:text-red-400 border-red-500/40 bg-red-500/10 font-bold uppercase tracking-widest text-[9px] px-2 py-0.5"
            >
              Portal Akses
            </Badge>

            <h2
              class="text-2xl sm:text-[26px] font-display font-bold text-stone-900 dark:text-white leading-tight tracking-tight"
            >
              {{ title }}
            </h2>
            <p
              class="text-stone-600 dark:text-stone-400 font-body border-t border-stone-200 dark:border-stone-800/80 pt-2 mt-2 text-xs leading-relaxed"
            >
              {{ subtitle }}
            </p>
          </div>

          <!-- Main Slot (Form Content) -->
          <slot></slot>

          <!-- Footer Links Slot -->
          <div
            v-if="$slots.footer"
            class="mt-4 pt-3.5 border-t border-stone-200 dark:border-stone-800/80"
          >
            <slot name="footer"></slot>
          </div>
        </div>

        <!-- Bottom Footer (Mobile / Simple view) -->
        <div
          v-if="!split"
          class="py-3 px-6 text-center border-t border-stone-200 dark:border-stone-800/60 bg-stone-100 dark:bg-[#161413]"
        >
          <p
            class="text-[9px] text-stone-500 font-body uppercase tracking-widest"
          >
            © {{ new Date().getFullYear() }} PF Space. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
