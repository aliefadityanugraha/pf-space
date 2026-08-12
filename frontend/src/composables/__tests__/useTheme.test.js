import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTheme } from '../useTheme';

describe('useTheme composable', () => {
  let storage = {};

  beforeEach(() => {
    storage = {};
    const localStorageMock = {
      getItem: (key) => storage[key] || null,
      setItem: (key, value) => { storage[key] = String(value); },
      removeItem: (key) => { delete storage[key]; },
      clear: () => { storage = {}; }
    };
    vi.stubGlobal('localStorage', localStorageMock);
    document.documentElement.className = '';
  });

  it('provides themeMode and isDark properties', () => {
    const { themeMode, isDark, setTheme, toggleTheme, THEME_MODES } = useTheme();
    expect(THEME_MODES).toEqual({ LIGHT: 'light', DARK: 'dark', SYSTEM: 'system' });
    expect(['light', 'dark', 'system']).toContain(themeMode.value);
    expect(typeof isDark.value).toBe('boolean');
    expect(typeof setTheme).toBe('function');
    expect(typeof toggleTheme).toBe('function');
  });

  it('allows setting theme to dark and updates DOM class + localStorage', () => {
    const { setTheme, isDark, themeMode } = useTheme();
    setTheme('dark');
    expect(themeMode.value).toBe('dark');
    expect(isDark.value).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(storage['vueuse-color-scheme']).toBe('dark');
  });

  it('allows setting theme to light and updates DOM class + localStorage', () => {
    const { setTheme, isDark, themeMode } = useTheme();
    setTheme('light');
    expect(themeMode.value).toBe('light');
    expect(isDark.value).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(storage['vueuse-color-scheme']).toBe('light');
  });

  it('toggles theme correctly', () => {
    const { setTheme, toggleTheme, isDark } = useTheme();
    setTheme('light');
    expect(isDark.value).toBe(false);

    toggleTheme();
    expect(isDark.value).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    toggleTheme();
    expect(isDark.value).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
