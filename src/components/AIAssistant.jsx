import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagic, faRobot } from '@fortawesome/free-solid-svg-icons';
import AIChat from './AIChat';

export default function AIAssistant({ context = "Assistant", tenant, currentPage }) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Get page-specific context
  const getPageContext = () => {
    if (currentPage?.includes('/documents')) {
      return {
        page: 'Document Generation',
        suggestion: 'I see you are working on creating documents. I can help you with business proposals, service agreements, payment receipts, and filling out client information. What would you like assistance with?'
      };
    }
    if (currentPage?.includes('/invoices')) {
      return {
        page: 'Invoice Management',
        suggestion: 'I see you are working with invoices. I can help you create professional invoices, manage payment terms, calculate totals, and organize client billing. How can I assist you?'
      };
    }
    if (currentPage?.includes('/clients')) {
      return {
        page: 'Client Management',
        suggestion: 'I see you are managing clients. I can help you organize client information, track communication history, manage contact details, and set up billing preferences. What do you need help with?'
      };
    }
    if (currentPage?.includes('/dashboard')) {
      return {
        page: 'Dashboard',
        suggestion: 'I can help you understand your business metrics, analyze your financial data, or guide you to the right features. What would you like to explore?'
      };
    }
    return {
      page: 'Business Management',
      suggestion: 'I can help you with invoices, documents, client management, and general business operations. How can I assist you today?'
    };
  };

  const pageContext = getPageContext();
  const tenantName = tenant?.business_name || tenant?.name || 'there';

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  // Enhanced context for the AI
  const enhancedContext = `You are a business assistant for ${tenantName}. The user is currently on the ${pageContext.page} page. When greeting users, be contextual and helpful. For example, if they say "hi" while on the Document Generation page, respond with something like "Hi ${tenantName}! ${pageContext.suggestion}"

BUSINESS CONTEXT:
- Business Name: ${tenantName}
- Current Page: ${pageContext.page}
- Currency: ${tenant?.currency || 'EUR'}

When users ask about clients, invoices, or services, you can help them find specific clients by name, create new clients, or guide them through the process. Always be helpful and business-focused.`;

  return (
    <>
      {/* Floating AI Button */}
      {!isChatOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={toggleChat}
            className="group relative text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
            style={{ backgroundColor: '#4D7969' }}
          >
            <FontAwesomeIcon icon={faRobot} className="w-6 h-6" />
            
            {/* Pulse animation */}
            <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: '#4D7969' }}></div>
            
            {/* Magic sparkle effect */}
            <div className="absolute -top-1 -right-1 text-yellow-400">
              <FontAwesomeIcon icon={faMagic} className="w-3 h-3 animate-pulse" />
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
              <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
                Ask Finovo Assistant • {pageContext.page}
                <div className="absolute top-full right-4 transform -translate-x-1/2">
                  <div className="border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* AI Chat Component */}
      <AIChat 
        isOpen={isChatOpen}
        onToggle={toggleChat}
        context={enhancedContext}
      />
    </>
  );
}
