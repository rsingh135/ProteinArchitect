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
  // Initialize theme from localStorage or default to dark
  // If no theme is saved, default to dark mode
  let savedTheme = storage.getItem('protein-architect-theme');
  
  // If no saved theme, set to dark and save it
  if (!savedTheme) {
    savedTheme = 'dark';
    storage.setItem('protein-architect-theme', 'dark');
  }
  
  // Ensure dark class is applied immediately
  if (typeof document !== 'undefined') {
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  return {
    theme: savedTheme,
    setTheme: (theme) => {
      set({ theme });
      storage.setItem('protein-architect-theme', theme);
      // Apply theme to document root
      if (typeof document !== 'undefined') {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    },
    toggleTheme: () => {
      const currentTheme = get().theme;
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      get().setTheme(newTheme);
    },
  };
});
