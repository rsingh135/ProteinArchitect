import React from 'react';
import Navbar from './Navbar';
import { useThemeStore } from '../../store/themeStore';

const MainLayout = ({ children }) => {
  const { theme } = useThemeStore();
  
  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden transition-colors ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
