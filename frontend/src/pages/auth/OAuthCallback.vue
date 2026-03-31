<template>
  <div class="callback-page">
    <div class="callback-card">
      <div v-if="error" class="error-state">
        <div class="icon-wrapper error">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <h2>Login Gagal</h2>
        <p>{{ error }}</p>
        <button @click="goToLogin" class="btn-retry">Coba Lagi</button>
      </div>
      <div v-else class="loading-state">
        <div class="spinner"></div>
        <h2>Memproses Login...</h2>
        <p>Sedang memverifikasi akun Google Anda</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { refreshUser, isLoggedIn } = useAuth();
const error = ref(null);

function goToLogin() {
  router.push('/auth/login');
}

onMounted(async () => {
  try {
    // Force re-fetch session after Google redirected back here
    await refreshUser();
    
    if (isLoggedIn.value) {
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      router.replace(redirect || '/');
    } else {
      error.value = 'Login dengan Google gagal. Sesi tidak ditemukan.';
    }
  } catch (err) {
    error.value = 'Terjadi kesalahan saat memproses login. Silakan coba lagi.';
    console.error('OAuth callback error:', err);
  }
});
</script>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #1a1a2e 0%, #0d0d1a 100%);
}

.callback-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 3rem 2.5rem;
  text-align: center;
  max-width: 400px;
  width: 90%;
  backdrop-filter: blur(20px);
}

.loading-state h2,
.error-state h2 {
  color: #ffffff;
  font-size: 1.5rem;
  margin: 1.25rem 0 0.5rem;
}

.loading-state p,
.error-state p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #6c63ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.icon-wrapper.error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.icon-wrapper svg {
  width: 32px;
  height: 32px;
}

.btn-retry {
  margin-top: 1.5rem;
  padding: 0.75rem 2rem;
  background: #6c63ff;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-retry:hover {
  background: #5a52e0;
}
</style>
