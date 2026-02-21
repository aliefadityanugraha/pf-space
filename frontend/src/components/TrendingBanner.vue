<script setup>
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: 'Apresiasi Karya Terbaik' },
  subtitle: { type: String, default: 'Dukung karya favoritmu dan lihat tren apresiasi minggu ini.' },
  buttonText: { type: String, default: 'Beri Apresiasi' },
  to: { type: String, default: '/voting' },
  color: { type: String, default: 'red' }
})

const router = useRouter()

const bgClass = computed(() => {
  return props.color === 'teal' ? 'bg-brand-teal' : 'bg-brand-red'
})
</script>

<template>
  <section class="max-w-7xl mx-auto px-4 md:px-8 py-8">
    <Card :class="[bgClass, 'text-white border-2 border-black shadow-brutal']">
      <CardContent class="p-4 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="text-center md:text-left">
          <h2 class="text-lg md:text-3xl font-display font-bold">{{ title }}</h2>
          <p class="text-xs md:text-base opacity-90">{{ subtitle }}</p>
        </div>
        <Button 
          size="sm" 
          class="bg-white text-black hover:bg-stone-100 gap-2 shadow-brutal-sm border-2 border-black md:h-11 md:px-8"
          @click="router.push(to)"
        >
          {{ buttonText }}
          <ArrowRight class="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  </section>
</template>
