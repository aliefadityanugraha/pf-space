<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { 
  Bold, Italic, List, ListOrdered, Heading2, 
  Quote, Undo, Redo, Type
} from 'lucide-vue-next'
import { watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Tulis deskripsi lengkap di sini...'
  }
})

const emit = defineEmits(['update:modelValue'])

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4 font-body',
    },
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(() => props.modelValue, (value) => {
  const isSame = editor.value.getHTML() === value
  if (isSame) return
  editor.value.commands.setContent(value, false)
})
</script>

<template>
  <div v-if="editor" class="border-2 border-black bg-white shadow-brutal-sm overflow-hidden flex flex-col">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-1 p-2 border-b-2 border-black bg-stone-50">
      <button 
        type="button"
        @click="editor.chain().focus().toggleBold().run()"
        :class="['p-1.5 hover:bg-stone-200 border border-transparent transition-all', editor.isActive('bold') ? 'bg-stone-800 text-white border-black' : 'text-stone-600']"
        title="Bold"
      >
        <Bold class="w-4 h-4" />
      </button>
      <button 
        type="button"
        @click="editor.chain().focus().toggleItalic().run()"
        :class="['p-1.5 hover:bg-stone-200 border border-transparent transition-all', editor.isActive('italic') ? 'bg-stone-800 text-white border-black' : 'text-stone-600']"
        title="Italic"
      >
        <Italic class="w-4 h-4" />
      </button>
      <div class="w-px h-6 bg-stone-300 mx-1"></div>
      <button 
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="['p-1.5 hover:bg-stone-200 border border-transparent transition-all', editor.isActive('heading', { level: 2 }) ? 'bg-stone-800 text-white border-black' : 'text-stone-600']"
        title="Heading / New Section"
      >
        <Heading2 class="w-4 h-4" />
      </button>
      <button 
        type="button"
        @click="editor.chain().focus().setParagraph().run()"
        :class="['p-1.5 hover:bg-stone-200 border border-transparent transition-all', editor.isActive('paragraph') ? 'bg-stone-800 text-white border-black' : 'text-stone-600']"
        title="Normal Text"
      >
        <Type class="w-4 h-4" />
      </button>
      <div class="w-px h-6 bg-stone-300 mx-1"></div>
      <button 
        type="button"
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="['p-1.5 hover:bg-stone-200 border border-transparent transition-all', editor.isActive('bulletList') ? 'bg-stone-800 text-white border-black' : 'text-stone-600']"
        title="Bullet List"
      >
        <List class="w-4 h-4" />
      </button>
      <button 
        type="button"
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="['p-1.5 hover:bg-stone-200 border border-transparent transition-all', editor.isActive('orderedList') ? 'bg-stone-800 text-white border-black' : 'text-stone-600']"
        title="Ordered List"
      >
        <ListOrdered class="w-4 h-4" />
      </button>
      <button 
        type="button"
        @click="editor.chain().focus().toggleBlockquote().run()"
        :class="['p-1.5 hover:bg-stone-200 border border-transparent transition-all', editor.isActive('blockquote') ? 'bg-stone-800 text-white border-black' : 'text-stone-600']"
        title="Quote"
      >
        <Quote class="w-4 h-4" />
      </button>
      <div class="flex-1"></div>
      <button 
        type="button"
        @click="editor.chain().focus().undo().run()"
        :disabled="!editor.can().undo()"
        class="p-1.5 hover:bg-stone-200 text-stone-600 disabled:opacity-30"
      >
        <Undo class="w-4 h-4" />
      </button>
      <button 
        type="button"
        @click="editor.chain().focus().redo().run()"
        :disabled="!editor.can().redo()"
        class="p-1.5 hover:bg-stone-200 text-stone-600 disabled:opacity-30"
      >
        <Redo class="w-4 h-4" />
      </button>
    </div>

    <!-- Editor Content -->
    <EditorContent :editor="editor" />
  </div>
</template>

<style>
.ProseMirror p.is-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}

.ProseMirror {
  outline: none !important;
}

.ProseMirror h2 {
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  font-family: 'Outfit', sans-serif;
}

.ProseMirror ul {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin: 1rem 0;
}

.ProseMirror ol {
  list-style-type: decimal;
  padding-left: 1.5rem;
  margin: 1rem 0;
}

.ProseMirror blockquote {
  border-left: 4px solid #000;
  padding-left: 1rem;
  font-style: italic;
  margin: 1rem 0;
}
</style>
