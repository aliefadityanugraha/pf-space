<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { 
  Bold, Italic, Strikethrough, Code, List, ListOrdered, 
  Heading1, Heading2, Heading3, TextQuote, FileCode2,
  Minus, Undo, Redo, Type
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
      <button 
        type="button"
        @click="editor.chain().focus().toggleStrike().run()"
        :class="['p-1.5 hover:bg-stone-200 border border-transparent transition-all', editor.isActive('strike') ? 'bg-stone-800 text-white border-black' : 'text-stone-600']"
        title="Strikethrough"
      >
        <Strikethrough class="w-4 h-4" />
      </button>
      <button 
        type="button"
        @click="editor.chain().focus().toggleCode().run()"
        :class="['p-1.5 hover:bg-stone-200 border border-transparent transition-all', editor.isActive('code') ? 'bg-stone-800 text-white border-black' : 'text-stone-600']"
        title="Code"
      >
        <Code class="w-4 h-4" />
      </button>
      <div class="w-px h-6 bg-stone-300 mx-1"></div>
      
      <button 
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        :class="['p-1.5 hover:bg-stone-200 border border-transparent transition-all', editor.isActive('heading', { level: 1 }) ? 'bg-stone-800 text-white border-black' : 'text-stone-600']"
        title="Heading 1"
      >
        <Heading1 class="w-4 h-4" />
      </button>
      <button 
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="['p-1.5 hover:bg-stone-200 border border-transparent transition-all', editor.isActive('heading', { level: 2 }) ? 'bg-stone-800 text-white border-black' : 'text-stone-600']"
        title="Heading 2"
      >
        <Heading2 class="w-4 h-4" />
      </button>
      <button 
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="['p-1.5 hover:bg-stone-200 border border-transparent transition-all', editor.isActive('heading', { level: 3 }) ? 'bg-stone-800 text-white border-black' : 'text-stone-600']"
        title="Heading 3"
      >
        <Heading3 class="w-4 h-4" />
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
        <TextQuote class="w-4 h-4" />
      </button>
      <button 
        type="button"
        @click="editor.chain().focus().toggleCodeBlock().run()"
        :class="['p-1.5 hover:bg-stone-200 border border-transparent transition-all', editor.isActive('codeBlock') ? 'bg-stone-800 text-white border-black' : 'text-stone-600']"
        title="Code Block"
      >
        <FileCode2 class="w-4 h-4" />
      </button>
      <button 
        type="button"
        @click="editor.chain().focus().setHorizontalRule().run()"
        class="p-1.5 hover:bg-stone-200 border border-transparent transition-all text-stone-600"
        title="Horizontal Rule"
      >
        <Minus class="w-4 h-4" />
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

.ProseMirror h1 {
  font-size: 2rem;
  font-weight: 900;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-family: 'Outfit', sans-serif;
  text-transform: uppercase;
  letter-spacing: -0.025em;
}

.ProseMirror h2 {
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  font-family: 'Outfit', sans-serif;
}

.ProseMirror h3 {
  font-size: 1.25rem;
  font-weight: 600;
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
  background-color: #fafaf9;
}

.ProseMirror pre {
  background: #1c1917;
  color: #fff;
  font-family: 'JetBrains Mono', monospace;
  padding: 0.75rem 1rem;
  margin: 1rem 0;
  border-radius: 0;
  border: 2px solid #000;
  box-shadow: 4px 4px 0 #000;
}

.ProseMirror code {
  background: #f5f5f4;
  color: #ef4444;
  padding: 0.2rem 0.4rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875em;
  border: 1px solid #d6d3d1;
}

.ProseMirror pre code {
  color: inherit;
  padding: 0;
  background: none;
  font-size: 0.8rem;
  border: none;
}

.ProseMirror hr {
  border: none;
  border-top: 4px solid #000;
  margin: 2rem 0;
}
</style>
