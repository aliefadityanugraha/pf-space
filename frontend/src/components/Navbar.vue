<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import { api } from "@/lib/api";
import {
  Search,
  User,
  Film,
  LogOut,
  Settings,
  Upload,
  LogIn,
  Shield,
  Loader2,
  X,
  BookOpen,
  Ticket,
  Rss,
  Menu,
  UserPlus,
  Bookmark,
  Home,
  Clapperboard,
  PenLine,
} from "lucide-vue-next";
import NotificationDropdown from "./NotificationDropdown.vue";
import ThemeToggle from "./ThemeToggle.vue";
import CommandPalette from "./CommandPalette.vue";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { assetUrl } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useLiveSearch } from "@/composables/useLiveSearch";

const props = defineProps({
  lightTitle: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();
const { user, isLoggedIn, isCreator, isModerator, isAdmin, logout } = useAuth();
const isDropdownOpen = ref(false);
const imageError = ref(false);

const searchStatus = computed(() =>
  isAdmin.value || isModerator.value ? "all" : "published",
);

const { searchQuery, searchResults, isSearching, showResults, clearSearch } =
  useLiveSearch({
    limit: 10,
    status: searchStatus,
  });

const goToArchive = (slug) => {
  router.push(`/archive/${slug}`);
  clearSearch();
};

const handleLogout = async () => {
  await logout();
  isDropdownOpen.value = false;
  router.push("/");
};

const showFestivalMode = ref(false);
const searchInputRef = ref(null);
const showCommandPalette = ref(false);

const fetchFestivalSetting = async () => {
  try {
    const res = await api.get("/api/settings/public");
    const festivalSetting = res.data?.find((s) => s.key === "festival_mode");
    if (
      festivalSetting &&
      festivalSetting.value &&
      festivalSetting.value.is_active
    ) {
      showFestivalMode.value = true;
    }
  } catch (err) {
    console.error("Failed to fetch festival setting", err);
  }
};

const handleKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    showCommandPalette.value = !showCommandPalette.value;
  }
};

onMounted(() => {
  fetchFestivalSetting();
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 h-16 md:h-20 transition-all duration-500"
    :class="
      lightTitle
        ? 'bg-transparent backdrop-blur-md border-b-2 border-white/20'
        : 'bg-background border-b-2 border-border shadow-brutal'
    "
  >
    <div
      class="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between"
    >
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-2 md:gap-3">
        <img
          src="/logo-perfilman.png"
          alt="Perfilman"
          class="w-8 h-8 md:w-10 md:h-10 object-contain"
        />
        <span
          class="text-base md:text-xl font-bold font-display block transition-colors duration-500"
          :class="lightTitle ? 'text-white' : 'text-foreground'"
          >PF Space</span
        >
      </router-link>

      <!-- Desktop Search Bar -->
      <div class="hidden md:block flex-1 max-w-md mx-4 md:mx-8 relative group">
        <div class="relative z-50">
          <Search
            v-if="!isSearching"
            class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors z-10 text-stone-500 dark:text-stone-400"
          />
          <Loader2
            v-else
            class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-teal animate-spin z-10"
          />

          <Input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Cari di arsip…"
            class="h-11 pl-12 pr-40 border-2 shadow-brutal focus-visible:ring-0 transition-all duration-300 bg-white dark:bg-stone-900 hover:bg-orange-50/50 dark:hover:bg-stone-800 focus:bg-white dark:focus:bg-stone-900 border-black dark:border-stone-100 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-black dark:focus:border-stone-100 cursor-pointer"
            @click="showCommandPalette = true"
            @focus="showResults = searchQuery.length > 0"
          />

          <!-- Keyboard Shortcut Hint -->
          <div
            class="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:flex gap-1"
          >
            <kbd
              class="pointer-events-none inline-flex h-5 items-center gap-1 rounded border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 px-1.5 font-mono text-[10px] font-medium text-stone-500 dark:text-stone-400"
            >
              <span class="text-xs">⌘</span>K
            </kbd>
          </div>

          <div
            class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2"
          >
            <button
              v-if="searchQuery"
              @click="
                searchQuery = '';
                showResults = false;
              "
              class="p-2 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Search Results Dropdown -->
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-1"
        >
          <div
            v-if="showResults && searchQuery"
            class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-stone-900 border-2 border-stone-800 dark:border-stone-100 shadow-brutal z-40 overflow-hidden"
          >
            <div
              v-if="isSearching && searchResults.length === 0"
              class="p-4 text-center text-stone-500 dark:text-stone-400 text-sm font-body italic"
            >
              Mencari...
            </div>

            <template v-else-if="searchResults.length > 0">
              <div
                class="p-2 border-b-2 border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-400 px-4"
              >
                Hasil Pencarian
              </div>
              <div class="max-h-[400px] overflow-y-auto">
                <button
                  v-for="res in searchResults"
                  :key="res.film_id"
                  @click="goToArchive(res.slug)"
                  class="w-full flex items-center gap-4 p-3 hover:bg-orange-50 dark:hover:bg-stone-800 transition-colors border-b last:border-0 border-stone-100 dark:border-stone-800 text-left group/item cursor-pointer"
                >
                  <div
                    class="w-12 h-16 bg-stone-200 flex-shrink-0 border border-stone-800 overflow-hidden"
                  >
                    <img
                      v-if="res.gambar_poster"
                      :src="assetUrl(res.gambar_poster)"
                      class="w-full h-full object-cover group-hover/item:scale-110 transition-transform"
                    />
                    <Film v-else class="w-full h-full p-3 text-stone-400" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <h4 class="font-bold text-sm text-stone-900 truncate">
                        {{ res.judul }}
                      </h4>
                      <Badge
                        v-if="
                          res.status !== 'published' &&
                          (isAdmin || isModerator || res.user_id === user?.id)
                        "
                        variant="outline"
                        :class="[
                          'text-[8px] h-4 px-1 uppercase font-bold',
                          res.status === 'pending'
                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-red-100 text-red-700 border-red-200',
                        ]"
                      >
                        {{ res.status }}
                      </Badge>
                    </div>
                    <p class="text-xs text-stone-500 font-mono">
                      {{ res.tahun_karya || "-" }} •
                      {{ res.category?.nama_kategori }}
                    </p>
                  </div>
                </button>
              </div>
              <div
                class="p-3 bg-stone-800 text-white text-center text-[10px] font-bold uppercase tracking-widest hover:bg-stone-700 transition-colors cursor-pointer"
                @click="showCommandPalette = true"
              >
                Lihat Semua Hasil
              </div>
            </template>

            <div
              v-else-if="!isSearching && searchQuery"
              class="p-8 text-center text-stone-400"
            >
              <Film class="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p class="text-sm font-body italic">Arsip tidak ditemukan.</p>
            </div>
          </div>
        </Transition>

        <div
          v-if="showResults"
          class="fixed inset-0 z-30"
          @click="showResults = false"
        ></div>
      </div>

      <!-- Right Action Items -->
      <div class="flex items-center gap-1.5 md:gap-3">
        <!-- Mobile Search Button (44px touch target) -->
        <button
          type="button"
          @click="showCommandPalette = true"
          aria-label="Cari Cepat"
          title="Cari Cepat (Ctrl+K)"
          class="w-11 h-11 md:hidden bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal flex items-center justify-center hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer shrink-0"
        >
          <Search class="w-5 h-5 text-stone-900 dark:text-stone-100" />
        </button>

        <!-- Theme Switcher (Mobile) -->
        <div class="md:hidden">
          <ThemeToggle />
        </div>

        <!-- Desktop Quick Links & Theme Switcher -->
        <div class="hidden md:flex items-center gap-2 md:gap-3">
          <ThemeToggle />

          <router-link
            v-if="showFestivalMode"
            to="/festival"
            aria-label="Halaman Festival"
          >
            <Button
              aria-label="Festival"
              title="Festival"
              class="bg-yellow-400 text-stone-900 border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] font-bold uppercase rounded-none transition-all h-10 px-4 text-sm flex items-center gap-2 cursor-pointer"
            >
              <Ticket class="w-4 h-4 text-stone-900" />
              <span>Festival</span>
            </Button>
          </router-link>

          <router-link to="/materi" aria-label="Halaman Materi Belajar">
            <Button
              aria-label="Materi Belajar"
              title="Materi Belajar"
              class="bg-brand-orange text-stone-900 border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] font-bold uppercase rounded-none transition-all h-10 px-4 text-sm flex items-center gap-2 cursor-pointer"
            >
              <BookOpen class="w-4 h-4 text-stone-900" />
              <span>Materi</span>
            </Button>
          </router-link>

          <router-link to="/feed" aria-label="Halaman Production Feed">
            <Button
              aria-label="Production Feed"
              title="Production Feed"
              class="bg-brand-teal text-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] font-bold uppercase rounded-none transition-all h-10 px-4 text-sm flex items-center gap-2 cursor-pointer"
            >
              <Rss class="w-4 h-4 text-white" />
              <span>Feed</span>
            </Button>
          </router-link>
        </div>

        <!-- Auth Buttons (Desktop - Not Logged In) -->
        <div v-if="!isLoggedIn" class="hidden md:flex items-center gap-2">
          <router-link to="/auth/login" aria-label="Halaman Masuk">
            <Button
              aria-label="Masuk ke Akun"
              class="bg-white text-stone-900 border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] font-bold uppercase rounded-none transition-all h-10 px-5 text-sm cursor-pointer"
            >
              Masuk
            </Button>
          </router-link>
          <router-link to="/auth/register" aria-label="Halaman Pendaftaran">
            <Button
              aria-label="Daftar Akun Baru"
              class="bg-brand-red text-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] font-bold uppercase rounded-none transition-all h-10 px-5 text-sm cursor-pointer"
            >
              Daftar
            </Button>
          </router-link>
        </div>

        <!-- Notification Bell (Logged In) -->
        <NotificationDropdown v-if="isLoggedIn" />

        <!-- User / Mobile Menu Dropdown -->
        <DropdownMenu
          :open="isDropdownOpen"
          @update:open="isDropdownOpen = $event"
          :modal="false"
        >
          <DropdownMenuTrigger as-child>
            <button
              type="button"
              aria-label="Menu Navigasi Pengguna"
              title="Menu Pengguna"
              :class="[
                'w-11 h-11 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal flex items-center justify-center hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-0 active:translate-y-0 active:shadow-none hover:shadow-brutal-sm transition-all cursor-pointer overflow-hidden shrink-0',
                !isLoggedIn ? 'md:hidden' : ''
              ]"
            >
              <img
                v-if="isLoggedIn && user?.image && !imageError"
                :src="assetUrl(user.image)"
                :alt="user.name"
                referrerpolicy="no-referrer"
                class="w-full h-full object-cover"
                @error="imageError = true"
              />
              <User
                v-else-if="isLoggedIn"
                class="w-4 h-4 md:w-5 md:h-5 transition-colors text-stone-900 dark:text-stone-100"
              />
              <Menu
                v-else
                class="w-5 h-5 transition-colors text-stone-900 dark:text-stone-100"
              />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            :side-offset="8"
            :collision-padding="12"
            class="w-[calc(100vw-1.5rem)] sm:w-72 max-w-xs bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal p-0 z-50 overflow-hidden"
          >
            <!-- User Info Header (If Logged In) -->
            <div
              v-if="isLoggedIn"
              class="p-3.5 border-b-2 border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800"
            >
              <p
                class="font-bold text-stone-900 dark:text-stone-100 text-sm truncate"
              >
                {{ user?.name }}
              </p>
              <p
                class="text-xs text-stone-500 dark:text-stone-400 font-mono truncate"
              >
                {{ user?.email }}
              </p>
              <div class="flex items-center gap-1.5 mt-1.5">
                <Badge
                  v-if="isAdmin"
                  class="bg-brand-red text-white text-[9px] uppercase tracking-wider border border-black"
                  >Admin</Badge
                >
                <Badge
                  v-else-if="isModerator"
                  class="bg-brand-teal text-white text-[9px] uppercase tracking-wider border border-black"
                  >Kurator</Badge
                >
                <Badge
                  v-else-if="isCreator"
                  class="bg-brand-orange text-stone-900 text-[9px] uppercase tracking-wider border border-black"
                  >Sutradara / Kreator</Badge
                >
                <Badge
                  v-else
                  variant="outline"
                  class="text-[9px] uppercase tracking-wider"
                  >Anggota Komunitas</Badge
                >
              </div>
            </div>

            <!-- Mobile Navigation Links -->
            <div
              class="md:hidden py-1.5 border-b-2 border-stone-100 dark:border-stone-800"
            >
              <DropdownMenuLabel
                class="text-[9px] font-bold uppercase tracking-widest text-stone-400 px-4 py-1"
                >Jelajahi</DropdownMenuLabel
              >

              <DropdownMenuItem as-child>
                <router-link
                  to="/"
                  class="flex items-center gap-3 px-4 py-1.5 text-xs font-bold hover:bg-orange-50 dark:hover:bg-stone-800 cursor-pointer"
                  @click="isDropdownOpen = false"
                >
                  <Home class="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  <span>Beranda</span>
                </router-link>
              </DropdownMenuItem>

              <DropdownMenuItem as-child>
                <router-link
                  to="/films"
                  class="flex items-center gap-3 px-4 py-1.5 text-xs font-bold hover:bg-orange-50 dark:hover:bg-stone-800 cursor-pointer"
                  @click="isDropdownOpen = false"
                >
                  <Film class="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  <span>Arsip Film</span>
                </router-link>
              </DropdownMenuItem>

              <DropdownMenuItem as-child>
                <router-link
                  to="/feed"
                  class="flex items-center gap-3 px-4 py-1.5 text-xs font-bold hover:bg-orange-50 dark:hover:bg-stone-800 cursor-pointer"
                  @click="isDropdownOpen = false"
                >
                  <Rss class="w-3.5 h-3.5 text-brand-teal" />
                  <span>Feed Produksi</span>
                </router-link>
              </DropdownMenuItem>

              <DropdownMenuItem as-child>
                <router-link
                  to="/materi"
                  class="flex items-center gap-3 px-4 py-1.5 text-xs font-bold hover:bg-orange-50 dark:hover:bg-stone-800 cursor-pointer"
                  @click="isDropdownOpen = false"
                >
                  <BookOpen class="w-3.5 h-3.5 text-brand-orange" />
                  <span>Materi Belajar</span>
                </router-link>
              </DropdownMenuItem>

              <DropdownMenuItem v-if="showFestivalMode" as-child>
                <router-link
                  to="/festival"
                  class="flex items-center gap-3 px-4 py-1.5 text-xs font-bold hover:bg-orange-50 dark:hover:bg-stone-800 cursor-pointer"
                  @click="isDropdownOpen = false"
                >
                  <Ticket class="w-3.5 h-3.5 text-yellow-600" />
                  <span>Festival Film</span>
                </router-link>
              </DropdownMenuItem>
            </div>

            <!-- User Menu Actions -->
            <div class="py-1.5">
              <template v-if="isLoggedIn">
                <DropdownMenuLabel
                  class="text-[9px] font-bold uppercase tracking-widest text-stone-400 px-4 py-1"
                  >Akun Saya</DropdownMenuLabel
                >

                <DropdownMenuItem as-child>
                  <router-link
                    to="/profile"
                    class="flex items-center gap-3 px-4 py-1.5 text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                    @click="isDropdownOpen = false"
                  >
                    <User class="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                    <span>Profil Saya</span>
                  </router-link>
                </DropdownMenuItem>

                <DropdownMenuItem as-child>
                  <router-link
                    to="/collections"
                    class="flex items-center gap-3 px-4 py-1.5 text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                    @click="isDropdownOpen = false"
                  >
                    <Bookmark class="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                    <span>Koleksi Disimpan</span>
                  </router-link>
                </DropdownMenuItem>

                <DropdownMenuItem v-if="isCreator" as-child>
                  <router-link
                    to="/my-archive"
                    class="flex items-center gap-3 px-4 py-1.5 text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                    @click="isDropdownOpen = false"
                  >
                    <Clapperboard class="w-3.5 h-3.5 text-brand-orange" />
                    <span>Kelola Karya Saya</span>
                  </router-link>
                </DropdownMenuItem>

                <DropdownMenuSeparator
                  v-if="isCreator || isAdmin || isModerator"
                  class="my-1 border-b border-stone-100 dark:border-stone-800"
                />

                <DropdownMenuLabel
                  v-if="isCreator || isAdmin || isModerator"
                  class="text-[9px] font-bold uppercase tracking-widest text-stone-400 px-4 py-1"
                  >Kreator & Kurator</DropdownMenuLabel
                >

                <DropdownMenuItem v-if="isCreator || isAdmin" as-child>
                  <router-link
                    to="/upload"
                    class="flex items-center gap-3 px-4 py-1.5 text-xs font-bold text-brand-teal hover:bg-teal-50 dark:hover:bg-stone-800 cursor-pointer"
                    @click="isDropdownOpen = false"
                  >
                    <Upload class="w-3.5 h-3.5" />
                    <span>+ Unggah Film Baru</span>
                  </router-link>
                </DropdownMenuItem>

                <DropdownMenuItem v-if="isCreator || isAdmin" as-child>
                  <router-link
                    to="/feed/create"
                    class="flex items-center gap-3 px-4 py-1.5 text-xs font-bold text-brand-teal hover:bg-teal-50 dark:hover:bg-stone-800 cursor-pointer"
                    @click="isDropdownOpen = false"
                  >
                    <PenLine class="w-3.5 h-3.5" />
                    <span>+ Tulis Update Feed</span>
                  </router-link>
                </DropdownMenuItem>

                <DropdownMenuItem v-if="isModerator || isAdmin" as-child>
                  <router-link
                    to="/manage-materi"
                    class="flex items-center gap-3 px-4 py-1.5 text-xs font-bold text-brand-orange hover:bg-orange-50 dark:hover:bg-stone-800 cursor-pointer"
                    @click="isDropdownOpen = false"
                  >
                    <BookOpen class="w-3.5 h-3.5" />
                    <span>+ Unggah & Kelola Materi</span>
                  </router-link>
                </DropdownMenuItem>

                <DropdownMenuItem v-if="isAdmin || isModerator" as-child>
                  <router-link
                    to="/admin"
                    class="flex items-center gap-3 px-4 py-1.5 text-xs font-bold text-brand-red hover:bg-red-50 dark:hover:bg-stone-800 cursor-pointer"
                    @click="isDropdownOpen = false"
                  >
                    <Shield class="w-3.5 h-3.5" />
                    <span>Panel Kurasi / Admin</span>
                  </router-link>
                </DropdownMenuItem>

                <DropdownMenuSeparator
                  class="my-1 border-b border-stone-100 dark:border-stone-800"
                />

                <DropdownMenuItem
                  @click="handleLogout"
                  class="flex items-center gap-3 px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-stone-800 cursor-pointer"
                >
                  <LogOut class="w-3.5 h-3.5" />
                  <span>Keluar Akun</span>
                </DropdownMenuItem>
              </template>

              <!-- Not Logged In Mobile Actions -->
              <template v-else>
                <div class="md:hidden p-3 space-y-2">
                  <DropdownMenuItem as-child>
                    <router-link
                      to="/auth/login"
                      class="flex items-center justify-center gap-2 w-full py-2 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-100 font-bold uppercase text-xs shadow-brutal-sm cursor-pointer"
                      @click="isDropdownOpen = false"
                    >
                      <LogIn class="w-4 h-4" />
                      <span>Masuk</span>
                    </router-link>
                  </DropdownMenuItem>

                  <DropdownMenuItem as-child>
                    <router-link
                      to="/auth/register"
                      class="flex items-center justify-center gap-2 w-full py-2 bg-brand-red text-white border-2 border-black font-bold uppercase text-xs shadow-brutal-sm cursor-pointer"
                      @click="isDropdownOpen = false"
                    >
                      <UserPlus class="w-4 h-4" />
                      <span>Daftar Akun</span>
                    </router-link>
                  </DropdownMenuItem>
                </div>
              </template>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Global Command Palette Search Modal -->
    <CommandPalette v-model="showCommandPalette" />
  </nav>
</template>
