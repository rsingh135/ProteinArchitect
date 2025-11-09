import React from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useProteinStore } from '../../store/proteinStore';
import { useThemeStore } from '../../store/themeStore';

const ChatButton = () => {
  const { isChatOpen, setIsChatOpen } = useProteinStore();
  const { theme } = useThemeStore();

  return (
    <button
      onClick={() => setIsChatOpen(!isChatOpen)}
      className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-5 py-3 rounded-full shadow-lg transition-all duration-300 ${
        isChatOpen
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : theme === 'dark'
          ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
          : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'
      }`}
      aria-label={isChatOpen ? 'Close chat' : 'Open AI assistant'}
    >
      {isChatOpen ? (
        <>
          <X className="w-5 h-5" />
          <span className="font-medium">Close</span>
        </>
      ) : (
        <>
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">AI Assistant</span>
        </>
      )}
    </button>
  );
};

export default ChatButton;

