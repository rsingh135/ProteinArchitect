import { create } from 'zustand';

export const useProteinStore = create((set) => ({
  // Target protein (left viewer)
  targetProtein: null,
  targetStructure: null,

  // Binder/partner protein (right viewer)
  binderProtein: null,
  binderStructure: null,

  // Viewing options
  viewMode: 'split', // 'split' | 'overlay'
  syncRotation: true,
  renderStyle: 'cartoon', // 'cartoon' | 'sphere' | 'stick' | 'surface'
  colorScheme: 'confidence', // 'confidence' | 'domain' | 'mutation' | 'conservation'

  // Analysis data
  confidenceScores: null,
  paeData: null,
  interfaceContacts: null,

  // UI state
  isChatOpen: true,
  activePanel: 'analysis', // 'analysis' | 'sequence' | 'export'
  isLoading: false,

  // Actions
  setTargetProtein: (protein) => set({ targetProtein: protein }),
  setTargetStructure: (structure) => set({ targetStructure: structure }),
  setBinderProtein: (protein) => set({ binderProtein: protein }),
  setBinderStructure: (structure) => set({ binderStructure: structure }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSyncRotation: (sync) => set({ syncRotation: sync }),
  setRenderStyle: (style) => set({ renderStyle: style }),
  setColorScheme: (scheme) => set({ colorScheme: scheme }),
  setConfidenceScores: (scores) => set({ confidenceScores: scores }),
  setPaeData: (data) => set({ paeData: data }),
  setInterfaceContacts: (contacts) => set({ interfaceContacts: contacts }),
  setIsChatOpen: (open) => set({ isChatOpen: open }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Reset
  reset: () => set({
    targetProtein: null,
    targetStructure: null,
    binderProtein: null,
    binderStructure: null,
    confidenceScores: null,
    paeData: null,
    interfaceContacts: null,
    isLoading: false,
  }),
}));
