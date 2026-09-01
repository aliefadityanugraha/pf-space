<script setup>
import { ref } from "vue";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthCard from "@/components/AuthCard.vue";
import { Mail, ArrowLeft, Send, Loader2 } from "lucide-vue-next";
import { useHead } from "@unhead/vue";

useHead({
  title: "Lupa Kata Sandi - PF Space",
  meta: [
    { name: "description", content: "Pulihkan kata sandi akun PF Space Anda." },
  ],
});

const email = ref("");
const submitted = ref(false);
const loading = ref(false);
const error = ref("");

const handleSubmit = async () => {
  if (!email.value) return;

  loading.value = true;
  error.value = "";

  try {
    // Call actual API endpoint
    await api.post("/api/auth/forgot-password", { email: email.value });
    submitted.value = true;
  } catch (err) {
    // If 404 or other error, show message
    error.value =
      err.message || "Gagal mengirim link reset. Silakan coba lagi.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <AuthCard
    split
    title="Lupa Kata Sandi?"
    subtitle="Masukkan email kamu untuk menerima link pengaturan ulang kata sandi."
  >
    <!-- Success State -->
    <div v-if="submitted" class="text-center py-4">
      <div
        class="w-12 h-12 bg-red-500/10 mx-auto mb-4 border border-red-500/40 shadow-[3px_3px_0px_#000] flex items-center justify-center"
      >
        <Send class="w-6 h-6 text-red-500" />
      </div>
      <h2
        class="text-lg font-display font-bold text-stone-900 dark:text-white mb-1.5 uppercase tracking-tight"
      >
        Periksa Email Kamu
      </h2>
      <p class="text-stone-600 dark:text-stone-400 font-body mb-6 text-xs leading-relaxed">
        Kami telah mengirimkan instruksi pemulihan ke:<br />
        <span class="text-amber-600 dark:text-amber-400 font-bold">{{ email }}</span>
      </p>
      <router-link to="/auth/login">
        <Button
          class="bg-stone-800 dark:bg-stone-800 border border-stone-700 text-white hover:bg-stone-700 w-full font-bold uppercase tracking-wider text-xs h-10.5 rounded-none shadow-[2px_2px_0px_#000]"
        >
          <ArrowLeft class="w-4 h-4 mr-2" />
          Kembali ke Login
        </Button>
      </router-link>
    </div>

    <!-- Form State -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-4">
      <div
        v-if="error"
        class="p-2.5 bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-400 text-xs font-medium"
      >
        {{ error }}
      </div>

      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
          Alamat Email
        </label>
        <div class="relative">
          <Mail
            class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
          />
          <Input
            v-model="email"
            type="email"
            placeholder="nama@email.com"
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
        <span v-else>Kirim Link Pemulihan</span>
        <Send v-if="!loading" class="w-4 h-4 ml-1.5" />
      </Button>
    </form>

    <template #footer>
      <div v-if="!submitted" class="flex items-center justify-between">
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
