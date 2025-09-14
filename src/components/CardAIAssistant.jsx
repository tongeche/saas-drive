import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faTimes, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

export default function CardAIAssistant({ 
  cardType, 
  onFieldUpdate, 
  currentFormData = {},
  tenant,
  isVisible = false 
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Get card-specific context and suggestions
  const getCardContext = () => {
    switch (cardType) {
      case 'payment-receipt':
        return {
          title: 'Receipt Assistant',
          description: 'I can help you create a payment receipt quickly',
          suggestions: [
            'Create receipt for €100',
            'Help me fill payment details'
          ],
          systemPrompt: `You are a receipt creation assistant. Help users fill receipt forms by asking for missing information and updating form fields.
          
          Current form data: ${JSON.stringify(currentFormData)}
          
          When user says things like "send receipt 100" or "create receipt for €50", extract the amount and ask for payment method.
          When they provide payment method, call updateField to fill the form.
          
          Always be helpful and guide them through the process step by step.`
        };
      case 'business-proposal':
        return {
          title: 'Proposal Assistant',
          description: 'I can help you create professional business proposals',
          suggestions: [
            'Help me write a proposal',
            'Suggest project description'
          ],
          systemPrompt: `You are a business proposal assistant. Help users create professional proposals by gathering information and filling form fields.
          
          Current form data: ${JSON.stringify(currentFormData)}
          
          Guide users through proposal creation by asking about project details, timeline, budget, and client requirements.`
        };
      case 'service-agreement':
        return {
          title: 'Agreement Assistant',
          description: 'I can help you draft service agreements',
          suggestions: [
            'Help me create an agreement',
            'Suggest service terms'
          ],
          systemPrompt: `You are a service agreement assistant. Help users create professional service agreements by gathering service details and terms.
          
          Current form data: ${JSON.stringify(currentFormData)}
          
          Guide users through agreement creation by asking about services, frequency, fees, and terms.`
        };
      case 'invoice-creation':
        return {
          title: 'Invoice Assistant',
          description: 'I can help you create professional invoices',
          suggestions: [
            'Create invoice for €500',
            'Help me set up payment terms'
          ],
          systemPrompt: `You are an invoice creation assistant. Help users create invoices by gathering client information, items, and payment details.`
        };
      case 'quote-creation':
        return {
          title: 'Quote Assistant',
          description: 'I can help you create compelling quotes',
          suggestions: [
            'Create quote for project',
            'Help me calculate pricing'
          ],
          systemPrompt: `You are a quote creation assistant. Help users create professional quotes by gathering project details and pricing information.`
        };
      case 'client-creation':
        return {
          title: 'Client Assistant',
          description: 'I can help you add new clients',
          suggestions: [
            'Add new client quickly',
            'Help me organize client info'
          ],
          systemPrompt: `You are a client management assistant. Help users add new clients by gathering contact information and business details.`
        };
      case 'cashflow-creation':
        return {
          title: 'Cashflow Assistant',
          description: 'I can help you log income and expenses',
          suggestions: [
            'Log €200 income',
            'Help me categorize transaction'
          ],
          systemPrompt: `You are a cashflow management assistant. Help users log income and expenses by gathering transaction details and categories.`
        };
      default:
        return {
          title: 'AI Assistant',
          description: 'I can help you with this form',
          suggestions: [
            'Help me fill this form',
            'Guide me through the process'
          ],
          systemPrompt: 'You are a helpful form assistant.'
        };
    }
  };

  const cardContext = getCardContext();

  // Initialize chat when opened
  useEffect(() => {
    if (isChatOpen && messages.length === 0) {
      const welcomeMessage = {
        role: 'assistant',
        content: `Hi ${tenant?.business_name || 'there'}! ${cardContext.description}. What would you like to create?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isChatOpen, cardContext.description, tenant?.business_name]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isChatOpen]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
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
          context: cardContext.systemPrompt,
          cardType,
          currentFormData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Check if AI wants to update form fields
      const aiResponse = data.message;
      
      // Parse field updates from AI response
      const fieldUpdates = aiResponse.match(/FIELD_UPDATE:\s*(\w+)\s*=\s*([^\n]+)/g);
      if (fieldUpdates) {
        fieldUpdates.forEach(update => {
          const match = update.match(/FIELD_UPDATE:\s*(\w+)\s*=\s*(.+)/);
          if (match) {
            const [, fieldName, fieldValue] = match;
            onFieldUpdate(fieldName, fieldValue.trim());
          }
        });
      }

      const assistantMessage = {
        role: 'assistant',
        content: aiResponse.replace(/FIELD_UPDATE:.*?(?=\n|$)/g, '').trim(),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
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

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    setTimeout(() => sendMessage(), 100);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating AI Avatar */}
      {!isChatOpen && (
        <div className="absolute top-2 right-2 z-30">
          <button
            onClick={() => setIsChatOpen(true)}
            className="group relative text-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 animate-pulse"
            style={{ backgroundColor: '#4D7969' }}
          >
            <FontAwesomeIcon icon={faRobot} className="w-4 h-4" />
            
            {/* Tooltip */}
            <div className="absolute top-full right-0 mt-1 hidden group-hover:block">
              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {cardContext.title}
                <div className="absolute bottom-full right-2 transform translate-x-1/2">
                  <div className="border-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Chat Interface */}
      {isChatOpen && (
        <div className="absolute top-2 right-2 z-30 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200" style={{ backgroundColor: '#E9F5EE' }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#4D7969' }}>
                <FontAwesomeIcon icon={faRobot} className="w-3 h-3 text-white" />
              </div>
              <span className="font-medium text-sm text-gray-800">{cardContext.title}</span>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 text-gray-500 hover:text-gray-700 rounded transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-3 space-y-3" style={{ backgroundColor: '#E9F5EE' }}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#4D7969' }}>
                      <FontAwesomeIcon icon={faRobot} className="w-2 h-2 text-white" />
                    </div>
                  </div>
                )}
                
                <div className={`max-w-xs ${message.role === 'user' ? 'order-1' : ''}`}>
                  <div
                    className={`px-3 py-2 rounded-xl text-xs ${
                      message.role === 'user'
                        ? 'text-white ml-auto'
                        : message.isError
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-white text-gray-800 border border-gray-100'
                    }`}
                    style={message.role === 'user' ? { backgroundColor: '#4D7969' } : {}}
                  >
                    <p className="leading-relaxed">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#4D7969' }}>
                    <FontAwesomeIcon icon={faRobot} className="w-2 h-2 text-white" />
                  </div>
                </div>
                <div className="bg-white px-3 py-2 rounded-xl border border-gray-100">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {messages.length === 1 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-600 font-medium">Quick start:</p>
                {cardContext.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left p-2 bg-white/80 hover:bg-white rounded-lg border border-gray-200/50 hover:border-gray-300 transition-all duration-200 text-xs text-gray-700 hover:text-gray-900"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full px-3 py-2 pr-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent text-xs"
                  style={{ focusRingColor: '#4D7969' }}
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                  style={{ color: '#4D7969' }}
                >
                  <FontAwesomeIcon icon={faPaperPlane} className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
