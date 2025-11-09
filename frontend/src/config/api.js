/**
 * API Configuration
 * 
 * Centralized API URL configuration for the application.
 * Uses environment variables for production, falls back to localhost for development.
 */

// Get API URL from environment variable, fallback to localhost for development
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Debug: Log the API URL being used (only in browser console, not in production logs)
if (typeof globalThis.window !== 'undefined') {
  console.log('🔧 API Configuration:', {
    VITE_API_URL: import.meta.env.VITE_API_URL || 'NOT SET',
    API_URL: API_URL,
    environment: import.meta.env.MODE,
    isProduction: import.meta.env.PROD
  });
}

// API endpoints
export const API_ENDPOINTS = {
  health: `${API_URL}/health`,
  searchProteins: `${API_URL}/search_proteins`,
  predictPPI: `${API_URL}/predict_ppi`,
  predictPPIFromSequences: `${API_URL}/predict_ppi_from_sequences`,
  generatePPIVideo: `${API_URL}/generate_ppi_video`,
  researchProtein: `${API_URL}/research_protein`,
  generateProtein: `${API_URL}/generate_protein`,
  refineProtein: `${API_URL}/refine_protein`,
  chat: `${API_URL}/chat`,
  listModels: `${API_URL}/list_models`,
};

// Helper function to check if backend is available
export async function checkBackendHealth() {
  try {
    const response = await fetch(API_ENDPOINTS.health);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Helper function to get backend error message
export function getBackendErrorMessage() {
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const hasEnvVar = !!import.meta.env.VITE_API_URL;
  
  if (!hasEnvVar) {
    return `Cannot connect to backend server. VITE_API_URL environment variable is not set. Please set it to your backend URL (e.g., https://proteinarchitect-backend.onrender.com) in Vercel project settings and redeploy.`;
  }
  
  return `Cannot connect to backend server at ${backendUrl}. Please check if the backend is running and accessible.`;
}

export default API_URL;

