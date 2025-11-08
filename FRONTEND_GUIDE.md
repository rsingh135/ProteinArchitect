# ProteinViz - Modern Protein Visualization Platform

## 🎨 Overview

A cutting-edge web platform for real-time, side-by-side 3D visualization and analysis of target proteins and binding partners. Features include seamless natural language protein search, advanced molecular rendering, critical structure analytics, and an AI-powered chat interface.

## 🚀 Quick Start

```bash
cd frontend
npm install
npm run dev
```

The application will be available at http://localhost:3001

## 🎯 Key Features

### 1. **AI-Powered Search**
- Natural language queries (e.g., "human insulin receptor", "SARS spike protein")
- Autocomplete suggestions with UniProt IDs
- Converts queries to protein structures automatically

### 2. **Dual 3D Viewer**
- Side-by-side visualization of target and binder proteins
- Multiple render styles: Cartoon, Sphere, Stick, Surface
- Color schemes: Spectrum, Confidence, Chain, Secondary Structure
- Synchronized or independent rotation controls
- Real-time confidence scores overlay

### 3. **Analysis Dashboard**
- **Per-Residue Confidence (pLDDT)**: Visual bar chart of prediction confidence
- **Predicted Aligned Error (PAE)**: Heatmap showing interface quality
- **Interface Contacts**: Detailed residue-level interaction analysis
- **Quick Stats**: Length, mass, confidence scores at a glance

### 4. **AI Chat Assistant**
- Ask questions about protein structure, function, and interactions
- Context-aware responses based on current visualization
- Suggested questions for quick exploration
- Powered by LLM technology

## 🎨 Design System

### Color Palette
- **Neon Cyan** (#00f0ff): Primary UI elements, target protein
- **Neon Magenta** (#ff00ff): Binder protein, accents
- **Neon Purple** (#b000ff): AI features, analysis
- **Neon Green** (#00ff88): Success states, high confidence
- **Neon Orange** (#ffaa00): Warnings, medium confidence
- **Dark Base** (#0a0a0f): Main background

### Typography
- **Headings**: Inter (Bold, Wide)
- **Body**: Inter (Regular)
- **Code/Sequences**: JetBrains Mono

### Effects
- **Glass Morphism**: Frosted glass cards with backdrop blur
- **Neon Glows**: Subtle shadow effects on interactive elements
- **Smooth Animations**: Framer Motion powered transitions
- **Floating Gradients**: Animated background accents

## 📁 Project Structure

```
frontend/src/
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx           # Top navigation with search
│   │   ├── SearchBar.jsx        # AI-powered protein search
│   │   └── MainLayout.jsx       # Main app wrapper
│   ├── viewer/
│   │   ├── DualViewer.jsx       # Side-by-side 3D viewers
│   │   ├── MolecularViewer.jsx  # 3Dmol.js wrapper
│   │   └── ViewerControls.jsx   # Style & color controls
│   ├── analysis/
│   │   ├── AnalysisDashboard.jsx  # Main dashboard
│   │   ├── ConfidencePanel.jsx    # pLDDT visualization
│   │   └── PAEPlot.jsx            # PAE heatmap
│   ├── chat/
│   │   └── AIChat.jsx           # Floating AI assistant
│   └── shared/
│       └── GlassCard.jsx        # Reusable glass card
├── store/
│   └── proteinStore.js          # Zustand state management
└── styles/
    └── index.css                # Global styles + Tailwind
```

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling with custom neon theme
- **Framer Motion** - Animations
- **3Dmol.js** - WebGL molecular visualization
- **Zustand** - State management
- **Lucide React** - Icon library

## 🎮 Usage Guide

### Viewing Proteins

1. **Search**: Use the AI search bar to find proteins by name or UniProt ID
2. **Toggle Views**: Switch between "3D Viewer" and "Analysis Dashboard"
3. **Customize**: Adjust render style (Cartoon, Sphere, etc.) and colors
4. **Analyze**: View confidence scores, PAE plots, and interface contacts
5. **Ask AI**: Click the AI assistant to ask questions about the protein

### Keyboard Shortcuts

- **Esc**: Close AI chat
- **Enter**: Send message in AI chat
- **Tab**: Navigate between search suggestions

## 🔮 Future Enhancements

- [ ] AlphaFold 3 API integration for structure prediction
- [ ] Export publication-ready images
- [ ] Batch mode for multiple protein comparisons
- [ ] Custom annotations and notes
- [ ] Evolutionary conservation mapping
- [ ] Disease variant highlighting
- [ ] Ligand/antibody binding visualization
- [ ] Real-time collaboration

## 📊 Performance

- **WebGL Acceleration**: Hardware-accelerated 3D rendering
- **Lazy Loading**: Components load on demand
- **Optimized Animations**: 60fps smooth transitions
- **Responsive**: Works on desktop, tablet, and mobile

## 🎨 Customization

### Changing Colors

Edit `tailwind.config.js` to modify the neon color palette:

```javascript
colors: {
  neon: {
    cyan: '#00f0ff',
    magenta: '#ff00ff',
    // Add more colors...
  }
}
```

### Adding New Render Styles

Update `ViewerControls.jsx` to add more 3Dmol.js styles:

```javascript
const styles = [
  { id: 'cartoon', name: 'Cartoon', icon: Waves },
  // Add your style here
];
```

## 🐛 Troubleshooting

**3D viewer not loading?**
- Check browser console for errors
- Ensure WebGL is enabled in your browser
- Try refreshing the page

**Search not working?**
- Mock data is used by default
- Backend integration coming soon

**Styling issues?**
- Clear browser cache
- Rebuild: `npm run build`

## 📝 License

MIT

---

Built with ❤️ for modern protein research
