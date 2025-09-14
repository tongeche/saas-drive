const https = require('https');

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { messages, context: chatContext, cardType, currentFormData, clientData } = JSON.parse(event.body);

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Messages array is required' })
      };
    }

    // Enhanced system prompt for conversational AI assistant
    let systemContent = `You are Finovo Assistant, an intelligent business management AI that understands conversational context and user actions.

CONVERSATION INTELLIGENCE:
- You maintain context across the conversation
- When a user mentions a client name and then says an action (like "create invoice"), you understand they want to perform that action FOR the previously mentioned client
- You are proactive and understand business workflows
- You help users complete tasks efficiently with minimal back-and-forth

BUSINESS ACTIONS YOU CAN HELP WITH:
- Creating invoices, quotes, proposals
- Managing client information
- Generating receipts and documents
- Navigating the business dashboard

CONVERSATION FLOW RULES:
1. Remember what was discussed earlier in the conversation
2. When users mention actions like "create invoice", "make quote", "send receipt" after mentioning a client, connect them together
3. Be contextually aware - if they just talked about "Rosa Maria" and then say "create invoice", they mean "create invoice for Rosa Maria"
4. Ask clarifying questions only when truly necessary
5. Offer to help complete the action they requested`;
    
    // Add client data context if available
    if (clientData && Array.isArray(clientData) && clientData.length > 0) {
      systemContent += `\n\nCLIENT DATABASE: You have access to ${clientData.length} clients:\n${clientData.map(c => `- ${c.name}${c.email ? ` (${c.email})` : ''}${c.phone ? ` [${c.phone}]` : ''}`).join('\n')}`;
      
      systemContent += `\n\nCLIENT MATCHING LOGIC:
1. When users mention client names, search the database above for matches
2. If you find exact matches, acknowledge and proceed 
3. If multiple matches exist, ask which specific client they mean by listing options with distinguishing info
4. If no matches found, offer to create a new client
5. Remember client context throughout the conversation

CONVERSATION EXAMPLES:
User: "Rosa Maria"
You: "Perfect! I found Rosa Maria in your clients. How can I assist you with Rosa Maria today?"

User: "create invoice" (following the Rosa Maria mention)
You: "Great! I'll help you create an invoice for Rosa Maria. Let me guide you through the process. What services or products are you invoicing for?"

User: "invoice for James"
You (if multiple James): "I found 3 clients named James: 1. James Smith (james@email.com), 2. James Brown (james.b@company.com), 3. James Wilson. Which James would you like to create an invoice for?"

User: "invoice for ABC Corp"
You (if not found): "I don't see ABC Corp in your client list. Would you like me to create a new client called ABC Corp first, or check if they might be listed under a different name?"`;
    }
    
    if (cardType) {
      systemContent += `\n\nCARD CONTEXT: You are currently helping with ${cardType} creation. Current form data: ${JSON.stringify(currentFormData)}`;
      
      if (cardType === 'payment-receipt') {
        systemContent += `\n\nRECEIPT CREATION HELP:
When users say things like "send receipt 100" or "create receipt for €50":
1. Extract the amount and respond with something like "I'll help you create a receipt for €100. What payment method was used?"
2. When they provide payment method (cash, bank transfer, etc.), respond with: "FIELD_UPDATE: paymentAmount = 100\nFIELD_UPDATE: paymentMethod = Cash\nGreat! I've filled in the amount and payment method. Would you like me to help with any other details?"
3. Continue helping with other fields like receipt number, payment date, etc.`;
      } else if (cardType === 'business-proposal') {
        systemContent += `\n\nPROPOSAL CREATION HELP: Help users create professional proposals by asking about project details, timeline, and budget. Use FIELD_UPDATE: fieldName = value to fill form fields.`;
      } else if (cardType === 'service-agreement') {
        systemContent += `\n\nSERVICE AGREEMENT HELP: Help users create service agreements by asking about services, frequency, and terms. Use FIELD_UPDATE: fieldName = value to fill form fields.`;
      }
    } else {
      // Main AI assistant context - not in a specific card
      systemContent += `\n\nGENERAL BUSINESS ASSISTANCE:
When users want to create invoices, quotes, or other documents:
1. Confirm the client they want to work with
2. Offer to navigate them to the appropriate page
3. Ask what specific help they need
4. Guide them through the process step by step

INVOICE CREATION FLOW:
User: "create invoice" (after mentioning a client)
You: "Perfect! I'll help you create an invoice for [Client Name]. I can guide you to the invoice creation page, or would you like me to help you with specific details like:
- What services or products to include?
- Payment terms and due dates?
- Invoice amount calculations?
What would be most helpful?"

If they want to proceed, you can say: "Let me guide you to create this invoice. You can go to the Invoices section and click 'New Invoice', then select [Client Name] as the client."`;
    }

    systemContent += `\n\nIMPORTANT: Always maintain conversation context. If a user mentions a client name and then asks for an action, connect them together intelligently.`;

    systemContent += `\n\n${chatContext || 'Provide helpful, accurate, and business-focused assistance.'}`;

    const systemPrompt = {
      role: 'system',
      content: systemContent
    };

    const requestData = {
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [systemPrompt, ...messages],
      max_tokens: 1000,
      temperature: 0.7
    };

    const response = await makeOpenAIRequest(requestData);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: response.choices[0].message.content,
        usage: response.usage
      })
    };

  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate response',
        details: error.message 
      })
    };
  }
};

function makeOpenAIRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          if (res.statusCode === 200) {
            resolve(parsedData);
          } else {
            reject(new Error(`OpenAI API Error: ${parsedData.error?.message || 'Unknown error'}`));
          }
        } catch (error) {
          reject(new Error('Failed to parse OpenAI response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}
