import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileAlt,
  faDownload,
  faShare,
  faEye,
  faEdit,
  faCopy,
  faFileContract,
  faHandshake,
  faReceipt,
  faBuilding,
  faUser,
  faCalendarAlt,
  faEuroSign,
  faPhone,
  faEnvelope,
  faMapMarkerAlt,
  faChevronDown,
  faPlus,
  faMagic
} from "@fortawesome/free-solid-svg-icons";
import { listClients } from "../lib/clients";

export default function DocumentGeneration() {
  const { tenant } = useOutletContext() || {};
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [generatedDocument, setGeneratedDocument] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [clients, setClients] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  // Load clients when component mounts
  useEffect(() => {
    const loadClients = async () => {
      if (tenant?.id) {
        try {
          const clientList = await listClients(tenant.id);
          setClients(clientList);
        } catch (error) {
          console.error('Error loading clients:', error);
        } finally {
          setIsLoadingClients(false);
        }
      }
    };

    loadClients();
  }, [tenant?.id]);

  // Three common business document templates
  const documentTemplates = [
    {
      id: 'business-proposal',
      name: 'Business Proposal',
      description: 'Professional proposal for potential clients',
      icon: faFileContract,
      color: 'blue',
      fields: [
        { name: 'clientId', label: 'Select Client', type: 'client-select', required: true, icon: faUser },
        { name: 'clientName', label: 'Client Name', type: 'text', required: true, icon: faUser, autoFill: true },
        { name: 'clientCompany', label: 'Client Company', type: 'text', required: true, icon: faBuilding },
        { name: 'clientAddress', label: 'Client Address', type: 'textarea', required: false, icon: faMapMarkerAlt, autoFill: true },
        { name: 'projectTitle', label: 'Project Title', type: 'text', required: true, icon: faFileAlt },
        { name: 'projectDescription', label: 'Project Description', type: 'textarea', required: true, icon: faEdit },
        { name: 'projectDuration', label: 'Project Duration', type: 'text', placeholder: 'e.g., 4-6 weeks', icon: faCalendarAlt },
        { name: 'totalAmount', label: 'Total Amount (€)', type: 'number', required: true, icon: faEuroSign },
        { name: 'paymentTerms', label: 'Payment Terms', type: 'text', placeholder: 'e.g., 50% upfront, 50% on completion', icon: faHandshake },
        { name: 'validUntil', label: 'Valid Until', type: 'date', required: true, icon: faCalendarAlt }
      ],
      template: `
BUSINESS PROPOSAL

From: {{businessName}}
{{businessAddress}}
Phone: {{businessPhone}}
Email: {{businessEmail}}

To: {{clientName}}
{{clientCompany}}
{{clientAddress}}

Date: {{currentDate}}

PROJECT PROPOSAL: {{projectTitle}}

Dear {{clientName}},

Thank you for considering {{businessName}} for your upcoming project. We are pleased to present this proposal for {{projectTitle}}.

PROJECT DESCRIPTION:
{{projectDescription}}

PROJECT DURATION:
{{projectDuration}}

INVESTMENT:
Total Project Cost: €{{totalAmount}}

PAYMENT TERMS:
{{paymentTerms}}

NEXT STEPS:
If you would like to proceed with this proposal, please sign and return this document by {{validUntil}}.

We look forward to working with you.

Best regards,
{{businessName}}
{{businessPhone}}
{{businessEmail}}

Proposal valid until: {{validUntil}}
      `
    },
    {
      id: 'service-agreement',
      name: 'Service Agreement',
      description: 'Formal agreement for service provision',
      icon: faHandshake,
      color: 'green',
      fields: [
        { name: 'clientId', label: 'Select Client', type: 'client-select', required: true, icon: faUser },
        { name: 'clientName', label: 'Client Name', type: 'text', required: true, icon: faUser, autoFill: true },
        { name: 'clientAddress', label: 'Client Address', type: 'textarea', required: true, icon: faMapMarkerAlt, autoFill: true },
        { name: 'serviceDescription', label: 'Service Description', type: 'textarea', required: true, icon: faEdit },
        { name: 'serviceFrequency', label: 'Service Frequency', type: 'text', placeholder: 'e.g., Monthly, Weekly', icon: faCalendarAlt },
        { name: 'monthlyFee', label: 'Monthly Fee (€)', type: 'number', required: true, icon: faEuroSign },
        { name: 'startDate', label: 'Start Date', type: 'date', required: true, icon: faCalendarAlt },
        { name: 'agreementDuration', label: 'Agreement Duration', type: 'text', placeholder: 'e.g., 12 months', icon: faCalendarAlt },
        { name: 'cancellationNotice', label: 'Cancellation Notice Period', type: 'text', placeholder: 'e.g., 30 days', icon: faCalendarAlt }
      ],
      template: `
SERVICE AGREEMENT

BETWEEN: {{businessName}}
Address: {{businessAddress}}
Phone: {{businessPhone}}
Email: {{businessEmail}}

AND: {{clientName}}
Address: {{clientAddress}}

Date: {{currentDate}}

1. SERVICES TO BE PROVIDED:
{{serviceDescription}}

2. SERVICE FREQUENCY:
{{serviceFrequency}}

3. COMPENSATION:
Monthly Fee: €{{monthlyFee}}
Payment due on the first of each month.

4. TERM:
This agreement commences on {{startDate}} and continues for {{agreementDuration}}.

5. CANCELLATION:
Either party may terminate this agreement with {{cancellationNotice}} written notice.

6. RESPONSIBILITIES:
- {{businessName}} will provide the agreed services professionally and on time
- {{clientName}} will provide necessary access and information for service delivery
- Payment must be made within 14 days of invoice date

7. GOVERNING LAW:
This agreement is governed by local business law.

SIGNATURES:

{{businessName}}: _________________________ Date: _________

{{clientName}}: _________________________ Date: _________
      `
    },
    {
      id: 'payment-receipt',
      name: 'Payment Receipt',
      description: 'Official receipt for payments received',
      icon: faReceipt,
      color: 'purple',
      fields: [
        { name: 'receiptNumber', label: 'Receipt Number', type: 'text', required: true, icon: faFileAlt },
        { name: 'clientId', label: 'Select Client', type: 'client-select', required: true, icon: faUser },
        { name: 'clientName', label: 'Client Name', type: 'text', required: true, icon: faUser, autoFill: true },
        { name: 'paymentAmount', label: 'Payment Amount (€)', type: 'number', required: true, icon: faEuroSign },
        { name: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['Cash', 'Bank Transfer', 'Credit Card', 'Check'], required: true, icon: faHandshake },
        { name: 'paymentDate', label: 'Payment Date', type: 'date', required: true, icon: faCalendarAlt },
        { name: 'paymentFor', label: 'Payment For', type: 'text', required: true, placeholder: 'e.g., Invoice #INV-001', icon: faFileAlt },
        { name: 'notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Optional notes', icon: faEdit }
      ],
      template: `
OFFICIAL PAYMENT RECEIPT

{{businessName}}
{{businessAddress}}
Phone: {{businessPhone}}
Email: {{businessEmail}}

RECEIPT #: {{receiptNumber}}
DATE: {{paymentDate}}

RECEIVED FROM: {{clientName}}

AMOUNT RECEIVED: €{{paymentAmount}}

PAYMENT METHOD: {{paymentMethod}}

PAYMENT FOR: {{paymentFor}}

{{notes}}

This serves as an official receipt for the above payment.

Thank you for your business!

{{businessName}}
Authorized Signature: _________________________

Generated on: {{currentDate}}
      `
    }
  ];

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setFormData({});
    setGeneratedDocument(null);
  };

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleClientSelect = (clientId) => {
    const selectedClient = clients.find(client => client.id === clientId);
    
    if (selectedClient) {
      setFormData(prev => ({
        ...prev,
        clientId: clientId,
        clientName: selectedClient.name,
        clientAddress: selectedClient.billing_address || '',
        clientEmail: selectedClient.email || '',
        clientPhone: selectedClient.phone || ''
      }));
    }
  };

  const generateDocument = async () => {
    setIsGenerating(true);
    
    try {
      // Prepare template variables
      const templateVars = {
        ...formData,
        businessName: tenant?.business_name || 'Your Business',
        businessAddress: tenant?.address || 'Your Address',
        businessPhone: tenant?.phone || 'Your Phone',
        businessEmail: tenant?.email || 'your@email.com',
        currentDate: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      };

      // Replace template placeholders
      let documentContent = selectedTemplate.template;
      
      Object.entries(templateVars).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        documentContent = documentContent.replace(regex, value || `[${key}]`);
      });

      setGeneratedDocument({
        content: documentContent,
        title: `${selectedTemplate.name} - ${formData.clientName || 'Client'}`,
        template: selectedTemplate
      });
    } catch (error) {
      console.error('Error generating document:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
    // This would integrate with your PDF generation service
    // For now, we'll simulate the download
    const element = document.createElement('a');
    const file = new Blob([generatedDocument.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${generatedDocument.title}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const shareWhatsApp = () => {
    const message = `Document: ${generatedDocument.title}\n\n${generatedDocument.content.substring(0, 500)}...`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-4">
          <FontAwesomeIcon icon={faMagic} className="w-4 h-4" />
          Professional Document Generation
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Document Generation</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Create professional business documents using smart templates with client data integration
        </p>
      </div>

      {!selectedTemplate ? (
        /* Template Selection */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {documentTemplates.map(template => (
            <div
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className="group bg-white rounded-3xl shadow-sm ring-1 ring-black/5 p-8 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:ring-2 hover:ring-blue-500/20"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-4 rounded-2xl ${
                  template.color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-blue-100' :
                  template.color === 'green' ? 'bg-gradient-to-br from-green-50 to-green-100' :
                  'bg-gradient-to-br from-purple-50 to-purple-100'
                }`}>
                  <FontAwesomeIcon icon={template.icon} className={`w-8 h-8 ${
                    template.color === 'blue' ? 'text-blue-600' :
                    template.color === 'green' ? 'text-green-600' :
                    'text-purple-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                  {template.fields.length} fields to complete
                </span>
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                  Client dropdown
                </span>
              </div>
              
              <button className={`w-full text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md group-hover:shadow-lg transform group-hover:-translate-y-0.5 ${
                template.color === 'blue' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' :
                template.color === 'green' ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' :
                'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
              }`}>
                <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
                Use This Template
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Document Generation Interface */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Panel */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  selectedTemplate.color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-blue-100' :
                  selectedTemplate.color === 'green' ? 'bg-gradient-to-br from-green-50 to-green-100' :
                  'bg-gradient-to-br from-purple-50 to-purple-100'
                }`}>
                  <FontAwesomeIcon icon={selectedTemplate.icon} className={`w-6 h-6 ${
                    selectedTemplate.color === 'blue' ? 'text-blue-600' :
                    selectedTemplate.color === 'green' ? 'text-green-600' :
                    'text-purple-600'
                  }`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedTemplate.name}</h2>
                  <p className="text-gray-600">{selectedTemplate.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ← Back to Templates
              </button>
            </div>

            <form className="space-y-6">
              {selectedTemplate.fields.map(field => (
                <div key={field.name} className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    {field.icon && (
                      <FontAwesomeIcon icon={field.icon} className="w-4 h-4 text-gray-500" />
                    )}
                    {field.label} 
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  
                  {field.type === 'client-select' ? (
                    <div className="relative">
                      <select
                        value={formData[field.name] || ''}
                        onChange={(e) => {
                          handleInputChange(field.name, e.target.value);
                          handleClientSelect(e.target.value);
                        }}
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
                        disabled={isLoadingClients}
                      >
                        <option value="">
                          {isLoadingClients ? 'Loading clients...' : 'Select a client'}
                        </option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>
                            {client.name} {client.email && `(${client.email})`}
                          </option>
                        ))}
                      </select>
                      <FontAwesomeIcon 
                        icon={faUser} 
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                      />
                      <FontAwesomeIcon 
                        icon={faChevronDown} 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                      />
                    </div>
                  ) : field.type === 'textarea' ? (
                    <div className="relative">
                      <textarea
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        className={`w-full px-4 py-3 ${field.icon ? 'pl-10' : ''} border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 hover:border-gray-400 resize-vertical`}
                        rows={3}
                        readOnly={field.autoFill && formData.clientId}
                      />
                      {field.icon && (
                        <FontAwesomeIcon 
                          icon={field.icon} 
                          className="absolute left-3 top-4 w-4 h-4 text-gray-400"
                        />
                      )}
                    </div>
                  ) : field.type === 'select' ? (
                    <div className="relative">
                      <select
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className={`w-full px-4 py-3 ${field.icon ? 'pl-10' : ''} border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200 hover:border-gray-400`}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      {field.icon && (
                        <FontAwesomeIcon 
                          icon={field.icon} 
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                        />
                      )}
                      <FontAwesomeIcon 
                        icon={faChevronDown} 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type={field.type}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        className={`w-full px-4 py-3 ${field.icon ? 'pl-10' : ''} border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 hover:border-gray-400`}
                        readOnly={field.autoFill && formData.clientId}
                      />
                      {field.icon && (
                        <FontAwesomeIcon 
                          icon={field.icon} 
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                        />
                      )}
                    </div>
                  )}
                  
                  {field.autoFill && formData.clientId && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <FontAwesomeIcon icon={faMagic} className="w-3 h-3" />
                      Auto-filled from selected client
                    </p>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={generateDocument}
                disabled={isGenerating}
                className={`w-full flex items-center justify-center gap-3 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                  selectedTemplate.color === 'blue' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' :
                  selectedTemplate.color === 'green' ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' :
                  'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
                }`}
              >
                <FontAwesomeIcon icon={isGenerating ? faMagic : faFileAlt} className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Generating Document...' : 'Generate Document'}
              </button>
            </form>
          </div>

          {/* Preview Panel */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Document Preview</h3>
              {generatedDocument && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadPDF}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={shareWhatsApp}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    <FontAwesomeIcon icon={faShare} className="w-4 h-4" />
                    Share
                  </button>
                </div>
              )}
            </div>

            {generatedDocument ? (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-96">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {generatedDocument.content}
                </pre>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500 min-h-96 flex items-center justify-center">
                <div>
                  <FontAwesomeIcon icon={faFileAlt} className="w-12 h-12 text-gray-300 mb-4" />
                  <p>Fill in the form and click "Generate Document" to see preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
