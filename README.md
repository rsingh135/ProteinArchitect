# GenLab - AI-Powered Synthetic Organism Design Platform

A modern, beautiful landing page for GenLab, an AI-powered platform that designs custom organisms from concept to manufacturing protocol.

## Features

- **10-Step Design Pipeline**: Complete workflow from prompt to manufacturing
- **AI-Powered**: LLMs, Transformers, RL agents, and GNNs working together
- **3D Visualization**: Interactive protein and organism structure viewers
- **Modern UI**: Built with React, Tailwind CSS, and Framer Motion
- **Responsive Design**: Works beautifully on all devices

## Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

```
GenLab/
├── src/
│   ├── components/
│   │   ├── Hero.jsx          # Hero section
│   │   ├── Navbar.jsx        # Navigation bar
│   │   ├── Process.jsx       # 10-step pipeline
│   │   ├── Features.jsx      # Features showcase
│   │   ├── Visualization.jsx # 3D visualization section
│   │   ├── Technology.jsx    # Technology stack
│   │   ├── CTA.jsx           # Call-to-action
│   │   └── Footer.jsx        # Footer
│   ├── App.jsx               # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Sections

1. **Hero**: Eye-catching introduction with animated background
2. **Process**: Detailed breakdown of the 10-step design pipeline
3. **Features**: Key platform capabilities
4. **Visualization**: 3D visualization capabilities
5. **Technology**: Complete technology stack overview
6. **CTA**: Call-to-action section
7. **Footer**: Links and information

## Customization

- Colors: Edit `tailwind.config.js` to change the color scheme
- Content: Modify component files in `src/components/`
- Animations: Adjust Framer Motion animations in component files

## License

MIT

