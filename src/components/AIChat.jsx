import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRobot,
  faPaperPlane,
  faTimes,
  faUser,
  faMagic,
  faSpinner,
  faMinimize,
  faExpand
} from "@fortawesome/free-solid-svg-icons";
import { listClients } from '../lib/clients';
import { getActiveTenant } from '../lib/tenantState';

export default function AIChat({ isOpen, onToggle, context }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showStarters, setShowStarters] = useState(true);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [clients, setClients] = useState([]);
  const [clientsLoaded, setClientsLoaded] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load clients for context awareness
  useEffect(() => {
    if (isOpen && !clientsLoaded) {
      loadClients();
    }
  }, [isOpen, clientsLoaded]);

  const loadClients = async () => {
    try {
      const tenant = getActiveTenant();
      if (tenant?.id) {
        const clientData = await listClients(tenant.id);
        setClients(clientData || []);
        setClientsLoaded(true);
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
      setClients([]);
      setClientsLoaded(true);
    }
  };

  // Smart client matching function
  const findMatchingClients = (query) => {
    if (!clients.length) return [];
    
    const searchTerm = query.toLowerCase();
    const matches = clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm) ||
      (client.email && client.email.toLowerCase().includes(searchTerm))
    );
    
    return matches;
  };

  // Generate client suggestions response
  const generateClientSuggestionsResponse = (clientName, matchingClients) => {
    if (matchingClients.length === 0) {
      return `I couldn't find any clients with the name "${clientName}". Would you like me to:
      
1. Create a new client named "${clientName}"
2. Show you all your existing clients
3. Search for a different name

What would you prefer?`;
    } else if (matchingClients.length === 1) {
      const client = matchingClients[0];
      return `Perfect! I found the client "${client.name}"${client.email ? ` (${client.email})` : ''}. What would you like to do for this client?`;
    } else {
      const suggestions = matchingClients.map((client, index) => 
        `${index + 1}. ${client.name}${client.email ? ` (${client.email})` : ''}`
      ).join('\n');
      
      return `I found ${matchingClients.length} clients matching "${clientName}":

${suggestions}

Which one did you mean? You can say "number 1" or "the first one" or just tell me more details.`;
    }
  };

  // Conversation starters
  // Get business-friendly error messages
  const getErrorMessage = (error) => {
    const errorMessages = [
      {
        message: "Our AI assistant is experiencing high demand right now. Let's try again in a moment! ⏰",
        countdown: 10
      },
      {
        message: "We're fine-tuning our AI for better responses. Please give us a moment to get back to you! 🔧",
        countdown: 8
      },
      {
        message: "Our assistant is taking a quick coffee break ☕ - back in just a few seconds!",
        countdown: 6
      },
      {
        message: "High traffic alert! Our AI is working hard to serve everyone. Thanks for your patience! 🚀",
        countdown: 12
      },
      {
        message: "Our intelligent assistant is updating its knowledge. Please try again shortly! 📚",
        countdown: 7
      }
    ];

    return errorMessages[Math.floor(Math.random() * errorMessages.length)];
  };

  // Countdown effect
  useEffect(() => {
    if (retryCountdown > 0) {
      const timer = setTimeout(() => {
        setRetryCountdown(retryCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [retryCountdown]);

  const conversationStarters = [
    "Help me create a professional invoice",
    "Guide me through document generation",
    clients.length > 0 ? `Create invoice for ${clients[0]?.name || 'a client'}` : "Show me my clients",
    "Create a new client",
    "Find a client by name"
  ].filter(Boolean);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleStarterClick = (starter) => {
    setInputMessage(starter);
    setShowStarters(false);
    inputRef.current?.focus();
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || retryCountdown > 0) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setShowStarters(false);

    try {
      // Send the full conversation history to maintain context
      const response = await fetch('/.netlify/functions/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          context,
          clientData: clients
        })
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('AI Chat Error:', error); // Developer logging
      
      const errorInfo = getErrorMessage(error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorInfo.message
      }]);
      
      setRetryCountdown(errorInfo.countdown);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[36rem]'
      }`} style={{ backgroundColor: '#E9F5EE' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 rounded-t-2xl" style={{ backgroundColor: '#4D7969' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <FontAwesomeIcon icon={faRobot} className="w-4 h-4 text-white" />
            </div>
            <div className="text-white">
              <h3 className="font-semibold text-sm">Finovo Assistant</h3>
              <p className="text-xs text-white/80">Always ready to help</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
            >
              <FontAwesomeIcon icon={isMinimized ? faExpand : faMinimize} className="w-3 h-3" />
            </button>
            <button
              onClick={onToggle}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 h-80 bg-white/50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#4D7969' }}>
                        <FontAwesomeIcon icon={faRobot} className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : ''}`}>
                    <div
                      className={`px-3 py-2 rounded-2xl ${
                        message.role === 'user'
                          ? 'text-white ml-auto shadow-sm'
                          : message.isError
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-white text-gray-800 shadow-sm border border-gray-100'
                      }`}
                      style={message.role === 'user' ? { backgroundColor: '#4D7969' } : {}}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                    <div className={`text-xs text-gray-500 mt-1 px-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 order-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faUser} className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Retry countdown display */}
              {retryCountdown > 0 && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="animate-pulse">⏳</div>
                  <span>Please wait {retryCountdown} seconds before trying again</span>
                </div>
              )}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#4D7969' }}>
                      <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 text-white animate-spin" />
                    </div>
                  </div>
                  <div className="bg-white px-3 py-2 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Conversation Starters */}
              {showStarters && messages.length === 1 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 font-medium px-1">Quick start:</p>
                  {conversationStarters.map((starter, index) => (
                    <button
                      key={index}
                      onClick={() => handleStarterClick(starter)}
                      className="w-full text-left p-3 bg-white/80 hover:bg-white rounded-xl border border-gray-200/50 hover:border-gray-300 transition-all duration-200 text-sm text-gray-700 hover:text-gray-900"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white/30 border-t border-gray-200/50 rounded-b-2xl">
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={retryCountdown > 0 ? `Wait ${retryCountdown}s before sending...` : "Type your message..."}
                    disabled={isLoading || retryCountdown > 0}
                    className={`w-full px-3 py-2 pr-12 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent resize-none text-sm leading-relaxed ${
                      retryCountdown > 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    style={{ focusRingColor: '#4D7969' }}
                    rows={1}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading || retryCountdown > 0}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                    style={{ color: '#4D7969' }}
                  >
                    <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
