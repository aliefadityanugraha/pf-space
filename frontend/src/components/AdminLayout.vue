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
      <router-view v-slot="{ Component, route }">
        <Suspense>
          <component :is="Component" :key="route.fullPath" />
          <template #fallback>
            <div class="flex-1 p-8 flex items-center justify-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
            </div>
          </template>
        </Suspense>
      </router-view>
    </div>
  </div>
</template>

<style scoped>
</style>
