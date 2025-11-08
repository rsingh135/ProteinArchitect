import React from 'react';
import Navbar from './Navbar';

const MainLayout = ({ children }) => {
  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
