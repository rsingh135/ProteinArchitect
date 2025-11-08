import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, X, MinusCircle, Loader } from 'lucide-react';
import { useProteinStore } from '../../store/proteinStore';
import GlassCard from '../shared/GlassCard';

const AIChat = () => {
  const { isChatOpen, setIsChatOpen } = useProteinStore();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI protein analysis assistant. Ask me anything about the proteins you\'re viewing, their structure, function, or interactions.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      const aiResponse = {
        role: 'assistant',
        content: `Based on the current protein structure (UniProt: P01308), I can tell you that this is human insulin, a peptide hormone critical for glucose metabolism. The structure shows high confidence (pLDDT: 92.3) in the core regions. Would you like me to explain the binding sites or functional domains?`,
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    'What are the key binding sites?',
    'Explain the confidence scores',
    'Show me disease-related variants',
    'What are the functional domains?',
  ];

  if (!isChatOpen) {
    return (
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-full shadow-neon-cyan hover:shadow-neon-magenta transition-all duration-300 flex items-center space-x-2 z-50 animate-glow-pulse"
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-medium">Ask AI Assistant</span>
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="fixed right-6 bottom-6 w-96 h-[600px] z-50"
      >
        <GlassCard className="h-full flex flex-col p-0 overflow-hidden" neonBorder neonColor="purple">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-border bg-dark-elevated/50">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Sparkles className="w-5 h-5 text-neon-purple" />
                <div className="absolute inset-0 bg-neon-purple blur-md opacity-50"></div>
              </div>
              <div>
                <h3 className="font-semibold text-white">AI Assistant</h3>
                <p className="text-xs text-gray-400">Powered by GPT-4</p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 rounded-lg hover:bg-dark-hover transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-neon-cyan to-neon-blue text-white'
                      : 'glass text-gray-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="glass rounded-xl px-4 py-3 flex items-center space-x-2">
                  <Loader className="w-4 h-4 text-neon-purple animate-spin" />
                  <span className="text-sm text-gray-400">Analyzing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
              <div className="grid grid-cols-2 gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className="text-xs text-left px-3 py-2 rounded-lg bg-dark-surface hover:bg-dark-hover border border-dark-border hover:border-neon-purple/50 transition-all duration-300 text-gray-300"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-dark-border bg-dark-elevated/50">
            <div className="flex items-end space-x-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about proteins, structure, or function..."
                className="flex-1 bg-dark-surface rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-neon-purple resize-none"
                rows="2"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-3 rounded-lg bg-gradient-to-r from-neon-purple to-neon-magenta text-white hover:shadow-neon-purple transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIChat;
