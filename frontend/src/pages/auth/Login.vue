<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthCard from "@/components/AuthCard.vue";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-vue-next";
import { useHead } from "@unhead/vue";

useHead({
  title: "Masuk - PF Space",
  meta: [{ name: "description", content: "Masuk ke akun PF Space Anda." }],
});

const router = useRouter();
const { login, loginWithGoogle, loading } = useAuth();

const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const showPassword = ref(false);
const error = ref("");

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const handleSubmit = async () => {
  error.value = "";
  const normalizedEmail = email.value.trim().toLowerCase();
  const normalizedPassword = password.value.trim();

  const result = await login(normalizedEmail, normalizedPassword);

  if (result.success) {
    router.push("/");
  } else {
    if (
      result.message === "Unauthorized" ||
      result.message?.toLowerCase().includes("invalid credentials")
    ) {
      error.value = "Email atau kata sandi salah";
    } else {
      error.value = result.message || "Terjadi kesalahan saat masuk";
    }
  }
};

const handleGoogleLogin = () => {
  loginWithGoogle();
};
</script>

<template>
  <AuthCard
    split
    title="Selamat Datang Kembali"
    subtitle="Masuk untuk mengelola arsip dan memberikan apresiasi pada karya terbaik."
  >
    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Error Message -->
      <div
        v-if="error"
        class="p-2.5 bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-400 text-xs font-medium"
      >
        {{ error }}
      </div>

      <!-- Email -->
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
          Email
        </label>
        <div class="relative">
          <Mail
            class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
          />
          <Input
            v-model="email"
            type="email"
            placeholder="Masukkan email kamu..."
            class="h-10.5 pl-10 bg-white dark:bg-stone-900/90 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-none transition-colors"
            required
          />
        </div>
      </div>

      <!-- Password -->
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
          Password
        </label>
        <div class="relative">
          <Lock
            class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
          />
          <Input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••••••"
            class="h-10.5 pl-10 pr-10 bg-white dark:bg-stone-900/90 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-none transition-colors"
            required
          />
          <button
            type="button"
            @click="togglePassword"
            class="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-1"
          >
            <Eye v-if="!showPassword" class="w-4 h-4" />
            <EyeOff v-else class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Remember & Forgot -->
      <div class="flex items-center justify-between pt-0.5">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            v-model="rememberMe"
            class="w-4 h-4 border border-stone-400 dark:border-stone-600 bg-stone-100 dark:bg-stone-900 rounded-none accent-red-600 cursor-pointer"
          />
          <span class="text-xs text-stone-600 dark:text-stone-400 font-body hover:text-stone-900 dark:hover:text-stone-300 transition-colors">
            Tetap masuk di perangkat ini
          </span>
        </label>
        <router-link
          to="/auth/forgot"
          class="text-xs text-amber-600 dark:text-amber-400 font-medium hover:text-amber-500 dark:hover:text-amber-300 transition-colors"
        >
          Lupa kode akses?
        </router-link>
      </div>

      <!-- Submit Button -->
      <Button
        variant="destructive"
        class="w-full bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider text-xs shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all h-10.5 rounded-none"
        :disabled="loading"
      >
        <span v-if="loading">Mengautentikasi...</span>
        <template v-else>
          Masuk ke Portal
          <LogIn class="w-4 h-4 ml-1.5" />
        </template>
      </Button>

      <!-- Google Login -->
      <Button
        type="button"
        variant="outline"
        class="w-full bg-white hover:bg-stone-100 border-stone-300 text-stone-800 dark:bg-[#161413] dark:hover:bg-stone-800 dark:border-stone-700 dark:text-white text-xs font-semibold h-10.5 rounded-none transition-colors"
        @click="handleGoogleLogin"
      >
        <svg class="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Lanjut dengan Google
      </Button>
    </form>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <p class="text-stone-600 dark:text-stone-400 font-body text-xs">
          Belum memiliki akun kurator?
        </p>
        <router-link to="/auth/register">
          <Button
            variant="outline"
            class="bg-transparent border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-white hover:bg-stone-100 dark:hover:bg-stone-800 hover:border-stone-400 dark:hover:border-stone-600 font-bold text-xs px-3.5 h-8.5 rounded-none transition-colors"
          >
            Daftar Sekarang
          </Button>
        </router-link>
      </div>
    </template>
  </AuthCard>
</template>
