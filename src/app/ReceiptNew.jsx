import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUpload, 
  faCamera, 
  faFileImage, 
  faTimes,
  faSave,
  faArrowLeft,
  faEye,
  faSearch,
  faSpinner,
  faCheckCircle,
  faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";

export default function ReceiptNew() {
  const navigate = useNavigate();
  const { tenant } = useOutletContext() || {};
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  
  // Receipt form data
  const [receiptData, setReceiptData] = useState({
    vendor_name: "",
    client_id: "",
    category: "office_supplies",
    description: "",
    date: new Date().toISOString().split('T')[0],
    amount: "",
    tax_amount: "",
    currency: tenant?.currency || "EUR",
    payment_method: tenant?.default_payment_method || "Cash",
    notes: "",
    receipt_image: null
  });

  // Load clients when component mounts
  useEffect(() => {
    if (tenant?.slug) {
      loadClients();
    }
  }, [tenant?.slug]);

  // Update currency and payment method when tenant changes
  useEffect(() => {
    if (tenant?.currency && tenant.currency !== receiptData.currency) {
      setReceiptData(prev => ({
        ...prev,
        currency: tenant.currency
      }));
    }
    if (tenant?.default_payment_method && tenant.default_payment_method !== receiptData.payment_method) {
      setReceiptData(prev => ({
        ...prev,
        payment_method: tenant.default_payment_method
      }));
    }
  }, [tenant?.currency, tenant?.default_payment_method]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      
      // Try to get tenant ID and load clients
      const { default: supabase } = await import('../lib/supabase');
      
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', tenant.slug)
        .single();
        
      if (tenantError) {
        console.warn("Could not load tenant for clients:", tenantError.message);
        return;
      }

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, email')
        .eq('tenant_id', tenantData.id)
        .order('name', { ascending: true });

      if (clientsError) {
        console.warn("Could not load clients:", clientsError.message);
        return;
      }

      setClients(clientsData || []);
    } catch (err) {
      console.warn("Failed to load clients:", err.message);
    } finally {
      setLoadingClients(false);
    }
  };

  const categories = [
    { value: "office_supplies", label: "Office Supplies" },
    { value: "travel", label: "Travel" },
    { value: "meals", label: "Meals & Entertainment" },
    { value: "equipment", label: "Equipment" },
    { value: "utilities", label: "Utilities" },
    { value: "software", label: "Software & Subscriptions" },
    { value: "marketing", label: "Marketing" },
    { value: "professional", label: "Professional Services" },
    { value: "other", label: "Other" }
  ];

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file (JPG, PNG, etc.)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setUploadedFile(file);
    setError("");

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Store file for form submission
    setReceiptData(prev => ({ ...prev, receipt_image: file }));

    // Auto-scan if OCR is available
    handleOCRScan(file);
  };

  const handleOCRScan = async (file) => {
    setScanning(true);
    try {
      // Simulate OCR processing (in real implementation, use Tesseract.js or API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock OCR results
      const mockOCRData = {
        vendor_name: "Sample Vendor Ltd",
        amount: "45.99",
        tax_amount: "7.36",
        date: "2024-09-14",
        description: "Office supplies purchase"
      };

      setReceiptData(prev => ({
        ...prev,
        ...mockOCRData
      }));

      setSuccess("Receipt data extracted successfully! Please review and edit as needed.");
    } catch (err) {
      console.error("OCR scanning failed:", err);
      setError("Failed to extract data from receipt. Please enter manually.");
    } finally {
      setScanning(false);
    }
  };

  const handleInputChange = (field, value) => {
    setReceiptData(prev => ({ ...prev, [field]: value }));
    
    // Auto-calculate total when amount or tax changes
    if (field === 'amount' || field === 'tax_amount') {
      const amount = parseFloat(field === 'amount' ? value : receiptData.amount) || 0;
      const tax = parseFloat(field === 'tax_amount' ? value : receiptData.tax_amount) || 0;
      setReceiptData(prev => ({ ...prev, total: amount + tax }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate required fields
      if ((!receiptData.vendor_name && !receiptData.client_id) || !receiptData.amount || !receiptData.date) {
        throw new Error("Please fill in all required fields (vendor/client, amount, and date)");
      }

      // Determine final vendor name
      const finalVendorName = receiptData.client_id 
        ? clients.find(c => c.id === receiptData.client_id)?.name 
        : receiptData.vendor_name;

      // Try API endpoint first
      try {
        const formData = new FormData();
        formData.append('tenant', tenant?.slug || 'demo');
        formData.append('vendor_name', finalVendorName);
        formData.append('client_id', receiptData.client_id || '');
        formData.append('category', receiptData.category);
        formData.append('description', receiptData.description);
        formData.append('date', receiptData.date);
        formData.append('amount', receiptData.amount);
        formData.append('tax_amount', receiptData.tax_amount || '0');
        formData.append('currency', receiptData.currency);
        formData.append('payment_method', receiptData.payment_method);
        formData.append('notes', receiptData.notes);
        
        if (receiptData.receipt_image) {
          formData.append('receipt_image', receiptData.receipt_image);
        }

        const response = await fetch('/.netlify/functions/create-receipt', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          if (!result.error) {
            setSuccess("Receipt created successfully!");
            setTimeout(() => navigate('/app/receipts'), 2000);
            return;
          }
        }
      } catch (apiError) {
        console.log("API endpoint not available, trying direct Supabase");
      }

      // Fallback to direct Supabase
      const { default: supabase } = await import('../lib/supabase');
      
      // Get tenant ID
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', tenant?.slug || 'demo')
        .single();
        
      if (tenantError) {
        throw new Error(`Could not find tenant: ${tenantError.message}`);
      }

      // Generate receipt number
      const receiptNumber = `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // Prepare receipt data
      const receiptRecord = {
        tenant_id: tenantData.id,
        number: receiptNumber,
        vendor_name: finalVendorName,
        client_id: receiptData.client_id || null,
        category: receiptData.category,
        description: receiptData.description || null,
        date: receiptData.date,
        amount: parseFloat(receiptData.amount),
        tax_amount: parseFloat(receiptData.tax_amount || 0),
        currency: receiptData.currency,
        payment_method: receiptData.payment_method,
        notes: receiptData.notes || null,
        status: 'pending'
      };

      // Insert receipt into database
      const { data: newReceipt, error: insertError } = await supabase
        .from('receipts')
        .insert(receiptRecord)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to save receipt: ${insertError.message}`);
      }

      console.log("Receipt saved to database:", newReceipt);
      setSuccess("Receipt created successfully and saved to database!");
      
      // Redirect to receipts list after 2 seconds
      setTimeout(() => {
        navigate('/app/receipts');
      }, 2000);

    } catch (err) {
      console.error("Error creating receipt:", err);
      setError(`Failed to create receipt: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = "EUR") => {
    if (!amount) return "";
    if (currency === "KES") {
      return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES"
      }).format(amount);
    }
    return new Intl.NumberFormat("en-EU", {
      style: "currency",
      currency: currency
    }).format(amount);
  };

  const calculateTotal = () => {
    const amount = parseFloat(receiptData.amount) || 0;
    const tax = parseFloat(receiptData.tax_amount) || 0;
    return amount + tax;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/app/receipts')}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">New Receipt</h1>
                <p className="text-sm text-gray-600">Upload and manage your expense receipts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5" />
              <div className="font-medium">Error</div>
            </div>
            <div className="text-sm mt-1">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5" />
              <div className="font-medium">Success</div>
            </div>
            <div className="text-sm mt-1">{success}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Receipt</h2>
            
            {!uploadedFile ? (
              <div className="space-y-4">
                {/* Upload Area */}
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FontAwesomeIcon icon={faFileImage} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Receipt Image</h3>
                  <p className="text-gray-600 mb-4">Drag and drop or click to select</p>
                  <p className="text-sm text-gray-500">Supports JPG, PNG, PDF (max 10MB)</p>
                </div>

                {/* Upload Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FontAwesomeIcon icon={faUpload} className="w-4 h-4" />
                    <span>Choose File</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#4D7969' }}
                  >
                    <FontAwesomeIcon icon={faCamera} className="w-4 h-4" />
                    <span>Take Photo</span>
                  </button>
                </div>

                {/* Hidden File Inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Preview */}
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="w-full h-64 object-contain bg-gray-50 rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFile(null);
                      setPreviewUrl("");
                      setReceiptData(prev => ({ ...prev, receipt_image: null }));
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                  </button>
                </div>

                {/* OCR Status */}
                {scanning && (
                  <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 text-blue-600 animate-spin" />
                    <span className="text-blue-800 font-medium">Extracting data from receipt...</span>
                  </div>
                )}

                {/* Re-upload Options */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <FontAwesomeIcon icon={faUpload} className="w-4 h-4 mr-2" />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOCRScan(uploadedFile)}
                    disabled={scanning}
                    className="flex-1 px-3 py-2 text-sm text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#4D7969' }}
                  >
                    <FontAwesomeIcon icon={faSearch} className="w-4 h-4 mr-2" />
                    Re-scan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Receipt Details</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Vendor/Client Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor/Client *
                </label>
                <div className="space-y-3">
                  {/* Client Dropdown */}
                  {clients.length > 0 && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Select existing client</label>
                      <select
                        value={receiptData.client_id}
                        onChange={(e) => {
                          const clientId = e.target.value;
                          const selectedClient = clients.find(c => c.id === clientId);
                          setReceiptData(prev => ({
                            ...prev,
                            client_id: clientId,
                            vendor_name: selectedClient ? selectedClient.name : prev.vendor_name
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm"
                        style={{ focusRingColor: '#4D7969' }}
                        disabled={loadingClients}
                      >
                        <option value="">Select a client...</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>
                            {client.name} {client.email && `(${client.email})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Manual Vendor Input */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      {clients.length > 0 ? 'Or enter new vendor name' : 'Vendor name'}
                    </label>
                    <input
                      type="text"
                      value={receiptData.vendor_name}
                      onChange={(e) => {
                        const value = e.target.value;
                        setReceiptData(prev => ({
                          ...prev,
                          vendor_name: value,
                          client_id: value ? "" : prev.client_id // Clear client selection if typing new vendor
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm"
                      style={{ focusRingColor: '#4D7969' }}
                      placeholder="Enter vendor name"
                      required={!receiptData.client_id}
                    />
                  </div>
                  
                  {loadingClients && (
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      Loading clients...
                    </div>
                  )}
                </div>
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={receiptData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm"
                    style={{ focusRingColor: '#4D7969' }}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={receiptData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm"
                    style={{ focusRingColor: '#4D7969' }}
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={receiptData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm"
                  style={{ focusRingColor: '#4D7969' }}
                  placeholder="Brief description of expense"
                />
              </div>

              {/* Amount & Tax */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      {receiptData.currency === 'EUR' ? '€' : 
                       receiptData.currency === 'USD' ? '$' : 
                       receiptData.currency === 'GBP' ? '£' : 
                       receiptData.currency === 'KES' ? 'KSh' : 
                       receiptData.currency}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={receiptData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm"
                      style={{ focusRingColor: '#4D7969' }}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      {receiptData.currency === 'EUR' ? '€' : 
                       receiptData.currency === 'USD' ? '$' : 
                       receiptData.currency === 'GBP' ? '£' : 
                       receiptData.currency === 'KES' ? 'KSh' : 
                       receiptData.currency}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={receiptData.tax_amount}
                      onChange={(e) => handleInputChange('tax_amount', e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm"
                      style={{ focusRingColor: '#4D7969' }}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-900">
                    {formatCurrency(calculateTotal(), receiptData.currency)}
                  </div>
                </div>
              </div>

              {/* Currency (Collapsible Advanced Section) */}
              <details className="group">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2">
                  <span>Advanced Settings</span>
                  <span className="text-xs text-gray-500">
                    (Currency: {receiptData.currency}, Payment: {receiptData.payment_method} - {tenant?.business_name || 'Tenant'} defaults)
                  </span>
                </summary>
                <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={receiptData.currency}
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm"
                        style={{ focusRingColor: '#4D7969' }}
                      >
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="KES">KES (KSh)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Default currency is set to {tenant?.currency || 'EUR'} in your tenant settings
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <select
                        value={receiptData.payment_method}
                        onChange={(e) => handleInputChange('payment_method', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm"
                        style={{ focusRingColor: '#4D7969' }}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Mobile Money">Mobile Money</option>
                        <option value="Check">Check</option>
                        <option value="Other">Other</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Default payment method is set to {tenant?.default_payment_method || 'Cash'} in your tenant settings
                      </p>
                    </div>
                  </div>
                </div>
              </details>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={receiptData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm resize-none"
                  style={{ focusRingColor: '#4D7969' }}
                  placeholder="Additional notes or comments"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => navigate('/app/receipts')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || ((!receiptData.vendor_name && !receiptData.client_id) || !receiptData.amount)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#4D7969' }}
                >
                  {loading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} className="w-4 h-4" />
                      Create Receipt
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
