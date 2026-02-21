/**
 * src/lib/ai/base.provider.js
 *
 * Abstract base class for AI providers.
 * All AI providers must extend this class and implement chat().
 */

export class BaseAIProvider {
  /**
   * @param {object} config - Provider configuration
   */
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Send a chat message and get a response
   * @param {Array<{role: string, content: string}>} messages - Chat messages
   * @param {object} options - Chat options (temperature, maxTokens, context)
   * @returns {Promise<{content: string, usage: object, model: string}>}
   */
  async chat(messages, options = {}) {
    throw new Error('chat() must be implemented by provider');
  }

  /**
   * Send a single prompt (convenience wrapper around chat)
   * @param {string} prompt - User prompt text
   * @param {object} options - Chat options
   * @returns {Promise<{content: string, usage: object, model: string}>}
   */
  async complete(prompt, options = {}) {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  /**
   * Get the system prompt for the AI assistant
   * @returns {string} System prompt in Indonesian
   */
  getSystemPrompt() {
    return `Kamu adalah asisten AI untuk PF Space, sebuah platform arsip film karya siswa.
            Keahlianmu meliputi:
            - Memberikan rekomendasi film berdasarkan genre, mood, atau tema
            - Menganalisis aspek sinematografi, storytelling, dan teknik pembuatan film
            - Membantu diskusi tentang plot, karakter, dan makna film
            - Memberikan saran untuk filmmaker pemula
            - Menjawab pertanyaan seputar industri film dan perfilman Indonesia

            Gaya komunikasimu:
            - Ramah dan antusias tentang film
            - Informatif tapi tidak menggurui
            - Menggunakan bahasa Indonesia yang baik, bisa campur bahasa Inggris untuk istilah teknis
            - Memberikan jawaban yang relevan dan to the point

            Jika ditanya di luar topik film/sinema, arahkan kembali ke topik yang relevan dengan sopan.`;
  }
}
