import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useProteinStore } from '../../store/proteinStore';
import axios from 'axios';

const AIChat = () => {
  const { targetProtein, binderProtein, interactionStats, isChatOpen, setIsChatOpen } = useProteinStore();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your AI protein analysis assistant. Ask me anything about the proteins you're viewing, their structure, function, or interactions."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const suggestedQuestions = [
    "What are the key binding sites?",
    "Explain the confidence scores",
    "Show me disease-related variants",
    "What are the functional domains?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    try {
      // Prepare protein data for backend - ensure all values are serializable
      const targetProteinData = targetProtein ? {
        uniprotId: targetProtein.uniprotId || null,
        name: targetProtein.name || null,
        organism: targetProtein.organism || null,
        function: targetProtein.function || null,
        sequence: targetProtein.sequence ? String(targetProtein.sequence) : null,
        metrics: targetProtein.metrics ? {
          plddt: targetProtein.metrics.plddt || null,
          length: targetProtein.metrics.length || null,
          mass: targetProtein.metrics.mass || null
        } : null
      } : null;

      const binderProteinData = binderProtein ? {
        uniprotId: binderProtein.uniprotId || null,
        name: binderProtein.name || null,
        organism: binderProtein.organism || null,
        function: binderProtein.function || null,
        sequence: binderProtein.sequence ? String(binderProtein.sequence) : null,
        metrics: binderProtein.metrics ? {
          plddt: binderProtein.metrics.plddt || null,
          length: binderProtein.metrics.length || null,
          mass: binderProtein.metrics.mass || null
        } : null
      } : null;

      const interactionStatsData = interactionStats ? {
        totalContacts: interactionStats.totalContacts,
        averageDistance: interactionStats.averageDistance,
        minDistance: interactionStats.minDistance,
        interactionTypes: interactionStats.interactionTypes,
        contacts: interactionStats.contacts
      } : null;

      // Call backend chat API
      const response = await axios.post('/api/chat', {
        message: userMessage,
        target_protein: targetProteinData,
        binder_protein: binderProteinData,
        interaction_stats: interactionStatsData
      });

      // Add assistant response
      setMessages([...newMessages, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to get response. Please check if the backend is running and GEMINI_API_KEY is set.';
      setMessages([...newMessages, { role: 'assistant', content: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isChatOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50 max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-xs text-gray-500">Powered by Gemini</p>
          </div>
        </div>
        <button
          onClick={() => setIsChatOpen(false)}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5 text-gray-600" />
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
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="text-sm max-w-none markdown-content">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                      em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 ml-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 ml-2">{children}</ol>,
                      li: ({ children }) => <li className="ml-1">{children}</li>,
                      h1: ({ children }) => <h1 className="text-base font-bold mb-2 mt-2 text-gray-900">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-bold mb-1 mt-2 text-gray-900">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-1 text-gray-800">{children}</h3>,
                      code: ({ inline, children }) => 
                        inline ? (
                          <code className="bg-gray-200 px-1 rounded text-xs font-mono">{children}</code>
                        ) : (
                          <code className="block bg-gray-200 px-2 py-1 rounded text-xs font-mono my-1 whitespace-pre-wrap">{children}</code>
                        ),
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-3 italic my-2 text-gray-700">{children}</blockquote>,
                      hr: () => <hr className="my-3 border-gray-300" />,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-600 mb-2">Suggested questions:</p>
          <div className="grid grid-cols-2 gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestion(question)}
                className="text-left px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about proteins, structure, or function..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
