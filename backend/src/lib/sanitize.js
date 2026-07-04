/**
 * src/lib/sanitize.js
 * 
 * HTML sanitization utilities for user-generated content.
 * Uses sanitize-html to prevent XSS attacks while allowing
 * safe HTML in rich text fields (e.g., Tiptap editor output).
 */

import sanitizeHtml from 'sanitize-html';

/**
 * Configuration for RICH TEXT fields (e.g., deskripsi_lengkap from Tiptap).
 * Allows basic formatting tags but strips dangerous content like <script>, 
 * inline event handlers (onclick, onerror), and javascript: URLs.
 */
const RICH_TEXT_OPTIONS = {
  allowedTags: [
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Block elements
    'p', 'blockquote', 'pre', 'div', 'hr', 'br',
    // Lists
    'ul', 'ol', 'li',
    // Inline formatting
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
    'code', 'mark', 'sub', 'sup', 'small', 'span',
    // Links & Media
    'a', 'img',
    // Table (if Tiptap has table extension)
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    'a': ['href', 'target', 'rel', 'title'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    'td': ['colspan', 'rowspan'],
    'th': ['colspan', 'rowspan'],
    'span': ['class'],        // Allow class for Tiptap styling
    'pre': ['class'],         // Allow class for code blocks
    'code': ['class'],
    'blockquote': ['class'],
    '*': ['class'],           // Tiptap uses classes for styling
  },
  allowedSchemes: ['http', 'https', 'mailto'],  // Block javascript: URLs
  allowedSchemesByTag: {
    'img': ['http', 'https', 'data'],  // Allow data URIs for images only
  },
  // Force all links to open in new tab safely
  transformTags: {
    'a': sanitizeHtml.simpleTransform('a', {
      target: '_blank',
      rel: 'noopener noreferrer'
    })
  },
  // Strip all non-whitelisted tags instead of escaping them
  disallowedTagsMode: 'discard',
};

/**
 * Configuration for PLAIN TEXT fields (e.g., comments, sinopsis, community replies).
 * Strips ALL HTML — only raw text is allowed.
 */
const PLAIN_TEXT_OPTIONS = {
  allowedTags: [],          // No HTML tags allowed
  allowedAttributes: {},    // No attributes allowed
  disallowedTagsMode: 'discard',
};

/**
 * Sanitize rich text HTML (for fields like deskripsi_lengkap).
 * Allows safe formatting but removes scripts, event handlers, etc.
 * 
 * @param {string} html - Raw HTML input from rich text editor
 * @returns {string} Sanitized HTML string
 */
export function sanitizeRichText(html) {
  if (!html || typeof html !== 'string') return html;
  return sanitizeHtml(html, RICH_TEXT_OPTIONS);
}

/**
 * Strip ALL HTML from text (for plain text fields like comments).
 * Returns only the text content with no HTML at all.
 * 
 * @param {string} text - Raw text input that should not contain HTML
 * @returns {string} Plain text with all HTML removed
 */
export function sanitizePlainText(text) {
  if (!text || typeof text !== 'string') return text;
  return sanitizeHtml(text, PLAIN_TEXT_OPTIONS);
}
