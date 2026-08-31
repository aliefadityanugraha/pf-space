<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthCard from "@/components/AuthCard.vue";
import { Lock, ArrowLeft, CheckCircle, Loader2 } from "lucide-vue-next";
import { useHead } from "@unhead/vue";

useHead({
  title: "Atur Ulang Kata Sandi - PF Space",
  meta: [
    {
      name: "description",
      content: "Atur ulang kata sandi akun PF Space Anda.",
    },
  ],
});

const route = useRoute();
const router = useRouter();
const token = route.query.token;

const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const error = ref("");
const success = ref(false);

const handleSubmit = async () => {
  if (!password.value || !confirmPassword.value) return;

  if (password.value !== confirmPassword.value) {
    error.value = "Password tidak sama";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    await api.post("/api/auth/reset-password", {
      token,
      password: password.value,
    });
    success.value = true;
    setTimeout(() => {
      router.push("/auth/login");
    }, 3000);
  } catch (err) {
    error.value =
      err.message || "Gagal mereset password. Token mungkin sudah kadaluarsa.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <AuthCard
    title="Atur Ulang Kata Sandi"
    subtitle="Buat kata sandi baru untuk akun PF Space kamu."
  >
    <div v-if="success" class="text-center py-4">
      <div
        class="w-12 h-12 bg-green-500/20 mx-auto mb-4 border border-green-500/40 shadow-[3px_3px_0px_#000] flex items-center justify-center"
      >
        <CheckCircle class="w-6 h-6 text-green-500" />
      </div>
      <h2 class="text-lg font-display font-bold text-stone-900 dark:text-white mb-1.5 uppercase tracking-tight">
        Kata Sandi Berhasil Direset
      </h2>
      <p class="text-stone-600 dark:text-stone-400 font-body mb-6 text-xs leading-relaxed">
        Anda akan dialihkan ke halaman login secara otomatis...
      </p>
      <router-link to="/auth/login">
        <Button
          class="bg-stone-800 dark:bg-stone-800 border border-stone-700 text-white hover:bg-stone-700 w-full font-bold uppercase tracking-wider text-xs h-10.5 rounded-none shadow-[2px_2px_0px_#000]"
        >
          Masuk Sekarang
        </Button>
      </router-link>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-4">
      <div
        v-if="error"
        class="p-2.5 bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-400 text-xs font-medium"
      >
        {{ error }}
      </div>

      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
          Kata Sandi Baru
        </label>
        <div class="relative">
          <Lock
            class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
          />
          <Input
            v-model="password"
            type="password"
            placeholder="Minimal 8 karakter"
            class="h-10.5 pl-10 bg-white dark:bg-stone-900/90 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-none transition-colors"
            required
            minlength="8"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
          Konfirmasi Kata Sandi
        </label>
        <div class="relative">
          <Lock
            class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
          />
          <Input
            v-model="confirmPassword"
            type="password"
            placeholder="Ulangi kata sandi baru"
            class="h-10.5 pl-10 bg-white dark:bg-stone-900/90 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-none transition-colors"
            required
          />
        </div>
      </div>

      <Button
        variant="destructive"
        class="w-full bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider text-xs shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all h-10.5 rounded-none"
        type="submit"
        :disabled="loading"
      >
        <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
        <span v-else>Reset Kata Sandi</span>
      </Button>
    </form>

    <template #footer>
      <div v-if="!success" class="flex items-center justify-between">
        <router-link
          to="/auth/login"
          class="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 inline-flex items-center gap-1.5 font-semibold tracking-wide transition-colors"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          Kembali ke Login
        </router-link>
      </div>
    </template>
  </AuthCard>
</template>
