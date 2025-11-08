<<<<<<< HEAD
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
=======
# 🧬 Protein Architect - Expressibility-Aware Designer

**Hack Princeton Fall 2025**

An **Agentic, Closed-Loop Generative Platform** that designs and optimizes therapeutic protein sequences for function, stability, and large-scale industrial manufacturability.

## 🎯 Problem Solved: The Expressibility Cliff

The major bottleneck in biologics development is that AI-designed proteins often misfold, are unstable, or are impossible to produce at high yield in a bioreactor. This system guarantees that designs are viable for commercial production.

## ✨ Key Features

- **Generative Design-for-Expression**: RL-based AI generates novel protein sequences optimized for your constraints
- **Expressibility Oracle**: GNN/Transformer model (deployed on AWS SageMaker) predicts stability and manufacturability
- **Interactive Design Dialogue**: LLM agent enables conversational protein refinement
- **3D Structural Visualization**: Interactive 3D protein structure viewer using Three.js
- **Host Organism View**: Visual representation of protein expression in host cells (E. coli/CHO)
- **Manufacturing Protocol Generation**: Automatic generation of industrial production recipes with cost/yield predictions

## 🏗️ Architecture

```
┌─────────────────┐
│  React Frontend │
│  (Three.js 3D)  │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼─────────────────────────┐
│     FastAPI Backend              │
│  ┌──────────────────────────┐   │
│  │  Protein Generator       │   │
│  │  (Mock RL-based)         │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │  Expressibility Oracle   │   │
│  │  └─> AWS SageMaker       │   │
│  │      (Mock endpoint)     │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │  Manufacturing Agent     │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │  LLM Agent (OpenAI)      │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file (optional, for OpenAI API):
```bash
OPENAI_API_KEY=your_openai_api_key_here
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
```

5. Start the backend server:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
>>>>>>> fa706d977ef7d4f921f13c15ab41a7e408bc9381
```bash
npm install
```

<<<<<<< HEAD
2. Start the development server:
=======
3. Start the development server:
>>>>>>> fa706d977ef7d4f921f13c15ab41a7e408bc9381
```bash
npm run dev
```

<<<<<<< HEAD
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

=======
The frontend will be available at `http://localhost:3000`

## 📖 Usage

1. **Design a Protein**: Fill in the target name and constraints in the Design tab
2. **View 3D Structure**: See the generated protein structure in the 3D Structure tab
3. **Check Manufacturing**: View the production protocol and cost estimates in the Manufacturing tab
4. **Refine Design**: Use the "Refine Design" button to interactively improve your protein using natural language

## 🧪 API Endpoints

### `POST /generate_protein`
Generate a novel protein sequence with expressibility optimization.

**Request:**
```json
{
  "target_name": "Anti-TNF-alpha Antibody",
  "max_length": 200,
  "max_cysteines": 5,
  "functional_constraint": "Must bind to receptor X",
  "additional_constraints": "Optimize for stability"
}
```

**Response:**
```json
{
  "sequence": "MKTAYIAKQR...",
  "length": 150,
  "oracle_results": {
    "instability_index": 35.2,
    "stability_score": 64.8,
    "yield_prediction": 0.8,
    "host_cell": "E. coli",
    "cost_per_gram": 105.2,
    "is_stable": true
  },
  "manufacturing_protocol": {...},
  "retraining_triggered": false
}
```

### `POST /refine_protein`
Refine protein design using conversational LLM agent.

**Request:**
```json
{
  "sequence": "MKTAYIAKQR...",
  "refinement_prompt": "Reduce predicted immunogenicity by 20%"
}
```

## 🎨 Features Demo

### 3D Visualization
- Interactive protein structure viewer
- Color-coded amino acids by type
- Rotate and zoom controls

### Host Organism View
- 3D visualization of E. coli or CHO cells
- Highlighted protein expression sites
- Animated ribosomes

### Expressibility Oracle
- Real-time stability predictions
- Cost penalty calculations
- Yield predictions

## 🔧 Technology Stack

**Backend:**
- FastAPI (Python web framework)
- OpenAI API (LLM agent)
- AWS SageMaker (mock for hackathon)
- NumPy, scikit-learn (ML utilities)

**Frontend:**
- React 18
- Three.js (3D visualization)
- Vite (build tool)
- Axios (HTTP client)

## 📝 Notes for Hackathon

- **AWS SageMaker Integration**: Currently uses a mock implementation. In production, this would connect to an actual SageMaker endpoint hosting a trained GNN/Transformer model.
- **Protein Generation**: Uses mock RL-based generation. In production, this would use a trained reinforcement learning model.
- **3D Structure**: Uses simplified visualization. In production, this would integrate with AlphaFold/ESMFold API for accurate structure prediction.

## 🎯 Hackathon Highlights

1. **Closed-Loop System**: Demonstrates the complete pipeline from design to manufacturing
2. **AWS Cloud Integration**: Shows SageMaker deployment architecture (mock)
3. **Interactive 3D Visualization**: Engaging user experience with Three.js
4. **LLM-Powered Refinement**: Natural language protein design refinement
5. **Cost Optimization**: Automatic cost penalty system guides design optimization

## 📄 License

See LICENSE file for details.

## 🙏 Acknowledgments

Built for Hack Princeton Fall 2025. Inspired by the need to bridge the gap between AI-designed proteins and industrial manufacturability.
>>>>>>> fa706d977ef7d4f921f13c15ab41a7e408bc9381
