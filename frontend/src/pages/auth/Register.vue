<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthCard from "@/components/AuthCard.vue";
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Film } from "lucide-vue-next";
import { useHead } from "@unhead/vue";

useHead({
  title: "Daftar - PF Space",
  meta: [
    {
      name: "description",
      content: "Buat profil kuratormu dan mulai berkontribusi di PF Space.",
    },
  ],
});

const router = useRouter();
const { register, loginWithGoogle, loading } = useAuth();

const fullName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const agreeTerms = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const error = ref("");

const handleSubmit = async () => {
  error.value = "";

  if (password.value !== confirmPassword.value) {
    error.value = "Konfirmasi kata sandi tidak cocok";
    return;
  }

  if (!agreeTerms.value) {
    error.value = "Anda harus menyetujui Syarat & Ketentuan";
    return;
  }

  const result = await register({
    name: fullName.value,
    email: email.value,
    password: password.value,
  });

  if (result.success) {
    router.push("/");
  } else {
    // If it's a validation error from Better Auth (usually a raw string or complex object)
    error.value = result.message || "Pendaftaran gagal";
  }
};

const handleGoogleLogin = () => {
  loginWithGoogle();
};
</script>

<template>
  <AuthCard
    split
    title="Gabung PF Space"
    subtitle="Buat profil kuratormu dan mulai berkontribusi dalam pengarsipan film."
  >
    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-3">
      <!-- Error Message -->
      <div
        v-if="error"
        class="p-2.5 bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-400 text-xs font-medium"
      >
        {{ error }}
      </div>

      <!-- Full Name -->
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
          Nama Lengkap
        </label>
        <div class="relative">
          <User
            class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
          />
          <Input
            v-model="fullName"
            type="text"
            placeholder="Masukkan nama lengkap..."
            class="h-9.5 pl-10 bg-white dark:bg-stone-900/90 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 text-xs sm:text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-none transition-colors"
            required
          />
        </div>
      </div>

      <!-- Email -->
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
          Email
        </label>
        <div class="relative">
          <Mail
            class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
          />
          <Input
            v-model="email"
            type="email"
            placeholder="Masukkan email..."
            class="h-9.5 pl-10 bg-white dark:bg-stone-900/90 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 text-xs sm:text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-none transition-colors"
            required
          />
        </div>
      </div>

      <!-- Password & Confirm Password (Grid on desktop) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <!-- Password -->
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
            Kata Sandi
          </label>
          <div class="relative">
            <Lock
              class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400"
            />
            <Input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Buat sandi..."
              class="h-9.5 pl-8.5 pr-8 bg-white dark:bg-stone-900/90 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 text-xs sm:text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-none transition-colors"
              required
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-0.5"
            >
              <Eye v-if="!showPassword" class="w-3.5 h-3.5" />
              <EyeOff v-else class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Confirm Password -->
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
            Konfirmasi
          </label>
          <div class="relative">
            <Lock
              class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400"
            />
            <Input
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Ulangi sandi..."
              class="h-9.5 pl-8.5 pr-8 bg-white dark:bg-stone-900/90 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 text-xs sm:text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-none transition-colors"
              required
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-0.5"
            >
              <Eye v-if="!showConfirmPassword" class="w-3.5 h-3.5" />
              <EyeOff v-else class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Terms -->
      <label class="flex items-start gap-2 cursor-pointer select-none pt-0.5">
        <input
          type="checkbox"
          v-model="agreeTerms"
          class="w-4 h-4 mt-0.5 border border-stone-400 dark:border-stone-600 bg-stone-100 dark:bg-stone-900 rounded-none accent-red-600 cursor-pointer"
          required
        />
        <span class="text-xs text-stone-600 dark:text-stone-400 font-body leading-tight">
          Saya setuju dengan
          <router-link to="/terms" class="text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 underline underline-offset-2">Syarat & Ketentuan</router-link>
          dan
          <router-link to="/privacy" class="text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 underline underline-offset-2">Privasi</router-link>
        </span>
      </label>

      <!-- Submit Button -->
      <Button
        variant="destructive"
        class="w-full bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider text-xs shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all h-10 rounded-none"
        :disabled="loading"
      >
        <span v-if="loading">Memproses...</span>
        <template v-else>
          Daftar Sekarang
          <UserPlus class="w-4 h-4 ml-1.5" />
        </template>
      </Button>

      <!-- Google Login -->
      <Button
        type="button"
        variant="outline"
        class="w-full bg-white hover:bg-stone-100 border-stone-300 text-stone-800 dark:bg-[#161413] dark:hover:bg-stone-800 dark:border-stone-700 dark:text-white text-xs font-semibold h-10 rounded-none transition-colors"
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
          Sudah memiliki akun kurator?
        </p>
        <router-link to="/auth/login">
          <Button
            variant="outline"
            class="bg-transparent border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-white hover:bg-stone-100 dark:hover:bg-stone-800 hover:border-stone-400 dark:hover:border-stone-600 font-bold text-xs px-3.5 h-8 rounded-none transition-colors"
          >
            Masuk Sekarang
          </Button>
        </router-link>
      </div>
    </template>
  </AuthCard>
</template>
