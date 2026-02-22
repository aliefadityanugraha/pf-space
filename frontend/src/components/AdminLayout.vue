<script setup>
import { ref } from 'vue'
import SidebarAdmin from './SidebarAdmin.vue'

const sidebarCollapsed = ref(false)
</script>

<template>
  <div class="min-h-screen bg-stone-100 flex">
    <SidebarAdmin @update:collapsed="sidebarCollapsed = $event" />
    
    <div 
      :class="[
        'flex-1 transition-all duration-300 min-h-screen flex flex-col',
        sidebarCollapsed ? 'ml-14' : 'ml-56'
      ]"
    >
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<style scoped>
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
