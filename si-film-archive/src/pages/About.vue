<script setup>
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Film, Users, Archive, Award } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-[#F2EEE3]">
    <Navbar />
    <main class="pt-28 pb-16">
      <div class="max-w-4xl mx-auto px-4 md:px-8">
        <h1 class="text-4xl md:text-5xl font-display font-semibold text-slate-900 mb-6">About CineArchive</h1>
        
        <p class="text-lg font-body text-slate-600 mb-12 leading-relaxed">
          CineArchive is a digital platform dedicated to preserving and showcasing student film works. 
          We believe in the power of cinema to tell stories, inspire change, and connect communities.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Film class="w-8 h-8 text-brand-red mb-2" />
              <CardTitle>Film Archive</CardTitle>
              <CardDescription>Access thousands of student films from various genres and eras.</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users class="w-8 h-8 text-brand-teal mb-2" />
              <CardTitle>Community</CardTitle>
              <CardDescription>Connect with fellow film enthusiasts and creators.</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Archive class="w-8 h-8 text-brand-orange mb-2" />
              <CardTitle>Preservation</CardTitle>
              <CardDescription>Digitally preserving cinematic history for future generations.</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Award class="w-8 h-8 text-yellow-500 mb-2" />
              <CardTitle>Recognition</CardTitle>
              <CardDescription>Monthly showcases to highlight outstanding student works.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</template>
