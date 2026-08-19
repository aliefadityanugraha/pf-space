<script setup>
import { ref } from 'vue'
import AdminSidebar from './AdminSidebar.vue'

const sidebarCollapsed = ref(false)
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex transition-colors duration-300">
    <AdminSidebar @update:collapsed="sidebarCollapsed = $event" />
    
    <div 
      :class="[
        'flex-1 transition-all duration-300 min-h-screen flex flex-col',
        sidebarCollapsed ? 'ml-16' : 'ml-60'
      ]"
    >
      <main id="main-content" class="flex-1 flex flex-col">
        <router-view v-slot="{ Component, route }">
          <Suspense>
            <component :is="Component" :key="route.fullPath" />
            <template #fallback>
              <div class="flex-1 p-8 flex items-center justify-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
              </div>
            </template>
          </Suspense>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
</style>
