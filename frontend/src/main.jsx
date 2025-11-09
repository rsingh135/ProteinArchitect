import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Initialize theme on app load - default to dark
// Check if user has explicitly set a theme preference
const themeMigrationKey = 'protein-architect-theme-migrated-v2';
let savedTheme = localStorage.getItem('protein-architect-theme');

// Migration: If user hasn't been migrated yet and has 'light' saved, or no theme saved, default to dark
if (!localStorage.getItem(themeMigrationKey)) {
  // First time with new default (dark mode)
  savedTheme = 'dark';
  localStorage.setItem('protein-architect-theme', 'dark');
  localStorage.setItem(themeMigrationKey, 'true');
} else if (!savedTheme) {
  // No saved theme, default to dark
  savedTheme = 'dark';
  localStorage.setItem('protein-architect-theme', 'dark');
}

// Always apply the theme immediately
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

