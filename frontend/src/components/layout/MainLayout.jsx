import React from 'react';
import Navbar from './Navbar';
import { useProteinStore } from '../../store/proteinStore';

const MainLayout = ({ children }) => {
  const { isChatOpen } = useProteinStore();

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-base overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Background gradient effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan opacity-5 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-magenta opacity-5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-neon-purple opacity-3 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Content */}
        <div className="flex-1 relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
