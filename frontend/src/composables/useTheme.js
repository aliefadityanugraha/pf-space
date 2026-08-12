/**
 * src/composables/useTheme.js
 * 
 * Global Theme Engine Composable for PF Space
 * Supports 3 Modes: 'light', 'dark', and 'system' (auto OS preference).
 * Manages DOM root class (.dark) and persists preference in localStorage.
 */

import { ref, computed, watch, onMounted, onUnmounted, getCurrentInstance } from 'vue';

const STORAGE_KEY = 'vueuse-color-scheme';
const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Singleton reactive state across the app
const themeMode = ref(getInitialThemeMode());
const isSystemDark = ref(getSystemDarkPreference());

function getInitialThemeMode() {
  if (typeof window === 'undefined') return THEME_MODES.SYSTEM;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'system' || saved === 'auto') {
      return saved === 'auto' ? THEME_MODES.SYSTEM : saved;
    }
  } catch (e) {
    console.warn('[useTheme] Unable to access localStorage:', e);
  }
  return THEME_MODES.SYSTEM;
}

function getSystemDarkPreference() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyThemeToDOM(dark) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (dark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function useTheme() {
  const isDark = computed(() => {
    if (themeMode.value === THEME_MODES.DARK) return true;
    if (themeMode.value === THEME_MODES.LIGHT) return false;
    return isSystemDark.value; // SYSTEM mode
  });

  const setTheme = (mode) => {
    if (![THEME_MODES.LIGHT, THEME_MODES.DARK, THEME_MODES.SYSTEM].includes(mode)) {
      console.warn(`[useTheme] Invalid theme mode: ${mode}`);
      return;
    }
    themeMode.value = mode;
    try {
      localStorage.setItem(STORAGE_KEY, mode === THEME_MODES.SYSTEM ? 'auto' : mode);
    } catch (e) {
      console.warn('[useTheme] Unable to save theme to localStorage:', e);
    }
    applyThemeToDOM(isDark.value);
  };

  const toggleTheme = () => {
    if (isDark.value) {
      setTheme(THEME_MODES.LIGHT);
    } else {
      setTheme(THEME_MODES.DARK);
    }
  };

  let mediaQueryList = null;
  const handleSystemThemeChange = (e) => {
    isSystemDark.value = e.matches;
    if (themeMode.value === THEME_MODES.SYSTEM) {
      applyThemeToDOM(isSystemDark.value);
    }
  };

  const initListeners = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      isSystemDark.value = mediaQueryList.matches;
      
      if (mediaQueryList.addEventListener) {
        mediaQueryList.addEventListener('change', handleSystemThemeChange);
      } else if (mediaQueryList.addListener) {
        mediaQueryList.addListener(handleSystemThemeChange);
      }
    }
    applyThemeToDOM(isDark.value);
  };

  const cleanupListeners = () => {
    if (mediaQueryList) {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleSystemThemeChange);
      } else if (mediaQueryList.removeListener) {
        mediaQueryList.removeListener(handleSystemThemeChange);
      }
    }
  };

  if (getCurrentInstance()) {
    onMounted(initListeners);
    onUnmounted(cleanupListeners);
  } else {
    // If called outside setup (e.g. tests or standalone scripts)
    initListeners();
  }

  // Watch changes to themeMode
  watch(themeMode, () => {
    applyThemeToDOM(isDark.value);
  });

  return {
    themeMode,
    isDark,
    setTheme,
    toggleTheme,
    THEME_MODES
  };
}
