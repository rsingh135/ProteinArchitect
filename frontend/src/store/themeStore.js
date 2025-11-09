import { create } from 'zustand';

// Simple localStorage helper
const storage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },
};

export const useThemeStore = create((set, get) => {
  // Initialize theme from localStorage or default to light
  const savedTheme = storage.getItem('protein-architect-theme') || 'light';
  
  // Apply theme on initialization
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  return {
    theme: savedTheme,
    setTheme: (theme) => {
      set({ theme });
      storage.setItem('protein-architect-theme', theme);
      // Apply theme to document root
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    toggleTheme: () => {
      const currentTheme = get().theme;
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      get().setTheme(newTheme);
    },
  };
});
