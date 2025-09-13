import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faBoxes, faPalette, faFileInvoice, faBank, faChevronDown, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import supabase from '../lib/supabase';

export default function Settings() {
  const navigate = useNavigate();
  const { tenant, setTenant } = useOutletContext() || {};
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('business');
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);

  // Business Information
  const [businessInfo, setBusinessInfo] = useState({
    business_name: '',
    business_address: '',
    business_email: '',
    business_phone: '',
    business_website: '',
    tax_id: ''
  });

  // Branding
  const [branding, setBranding] = useState({
    logo_url: '',
    brand_color: '#10B981'
  });

  // Invoice Settings
  const [invoiceSettings, setInvoiceSettings] = useState({
    currency: 'EUR',
    timezone: 'Europe/Lisbon',
    number_prefix_invoice: 'INV-',
    invoice_footer: '',
    payment_terms: 'Payment due within 30 days'
  });

  // Banking Details
  const [bankingDetails, setBankingDetails] = useState({
    bank_details: ''
  });

  useEffect(() => {
    if (tenant) {
      setBusinessInfo({
        business_name: tenant.business_name || '',
        business_address: tenant.business_address || '',
        business_email: tenant.business_email || '',
        business_phone: tenant.business_phone || '',
        business_website: tenant.business_website || '',
        tax_id: tenant.tax_id || ''
      });

      setBranding({
        logo_url: tenant.logo_url || '',
        brand_color: tenant.brand_color || '#10B981'
      });

      setInvoiceSettings({
        currency: tenant.currency || 'EUR',
        timezone: tenant.timezone || 'Europe/Lisbon',
        number_prefix_invoice: tenant.number_prefix_invoice || 'INV-',
        invoice_footer: tenant.invoice_footer || '',
        payment_terms: tenant.payment_terms || 'Payment due within 30 days'
      });

      setBankingDetails({
        bank_details: tenant.bank_details || ''
      });
    }
  }, [tenant]);

  const handleSave = async (section) => {
    setSaving(true);
    setErr('');
    setSuccess('');

    try {
      let updateData = {};
      
      switch (section) {
        case 'business':
          updateData = businessInfo;
          break;
        case 'branding':
          updateData = branding;
          break;
        case 'invoice':
          updateData = invoiceSettings;
          break;
        case 'banking':
          updateData = bankingDetails;
          break;
        default:
          throw new Error('Invalid section');
      }

      const { data, error } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('id', tenant.id)
        .select()
        .single();

      if (error) throw error;

      // Update the tenant context
      setTenant(data);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('Error saving settings:', error);
      setErr(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'business', label: 'Business Info', icon: faBuilding },
    { id: 'branding', label: 'Branding', icon: faPalette },
    { id: 'invoice', label: 'Invoice Settings', icon: faFileInvoice },
    { id: 'banking', label: 'Banking', icon: faBank }
  ];

  if (!tenant) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-black/70">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <button
          type="button"
          onClick={() => navigate('/app')}
          className="text-gray-600 hover:text-gray-800 text-sm sm:text-base"
        >
          ← Back to Dashboard
        </button>
      </div>

      {(err || success) && (
        <div className={`mb-6 rounded-lg px-4 py-3 text-sm ${
          err ? 'bg-red-50 border border-red-200 text-red-700' : 
                'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {err || success}
        </div>
      )}

      {/* Mobile: Show note and Quick Actions only */}
      <div className="md:hidden">
        {/* Info Note */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faInfoCircle} className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-1">Mobile Quick Access</h3>
              <p className="text-sm text-blue-700 mb-3">
                You're viewing the quick actions panel. For complete settings like business info, branding, and banking details, use the menu below or switch to desktop.
              </p>
              
              {/* Mobile Settings Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMobileDropdown(!showMobileDropdown)}
                  className="w-full flex items-center justify-between bg-white border border-blue-300 rounded-md px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50"
                >
                  <span>Access Full Settings</span>
                  <FontAwesomeIcon 
                    icon={faChevronDown} 
                    className={`w-4 h-4 transition-transform ${showMobileDropdown ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                {showMobileDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setShowMobileDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <FontAwesomeIcon icon={tab.icon} className="w-4 h-4 text-gray-500" />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Show selected tab content or Quick Actions by default */}
        {activeTab !== 'items' && (
          <div className="mb-6">
            {/* Show the selected settings tab */}
            {activeTab === 'business' && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
                  <button
                    onClick={() => setActiveTab('items')}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← Back to Items
                  </button>
                </div>
                {/* Business form content - simplified for mobile */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                    <input
                      type="text"
                      value={businessInfo.business_name}
                      onChange={(e) => setBusinessInfo(prev => ({ ...prev, business_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={businessInfo.business_email}
                      onChange={(e) => setBusinessInfo(prev => ({ ...prev, business_email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                  <button
                    onClick={() => handleSave('business')}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 text-sm"
                  >
                    {saving ? 'Saving...' : 'Save Business Info'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Branding</h2>
                  <button
                    onClick={() => setActiveTab('items')}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← Back to Items
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                    <input
                      type="url"
                      value={branding.logo_url}
                      onChange={(e) => setBranding(prev => ({ ...prev, logo_url: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={branding.brand_color}
                        onChange={(e) => setBranding(prev => ({ ...prev, brand_color: e.target.value }))}
                        className="w-12 h-10 border border-gray-300 rounded-md"
                      />
                      <input
                        type="text"
                        value={branding.brand_color}
                        onChange={(e) => setBranding(prev => ({ ...prev, brand_color: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        placeholder="#10B981"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleSave('branding')}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 text-sm"
                  >
                    {saving ? 'Saving...' : 'Save Branding'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'invoice' && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Invoice Settings</h2>
                  <button
                    onClick={() => setActiveTab('items')}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← Back to Items
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
                    <select
                      value={invoiceSettings.currency}
                      onChange={(e) => setInvoiceSettings(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handleSave('invoice')}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 text-sm"
                  >
                    {saving ? 'Saving...' : 'Save Invoice Settings'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'banking' && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Banking Details</h2>
                  <button
                    onClick={() => setActiveTab('items')}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← Back to Items
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Details</label>
                    <textarea
                      value={bankingDetails.bank_details}
                      onChange={(e) => setBankingDetails(prev => ({ ...prev, bank_details: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="Enter your bank account details..."
                    />
                  </div>
                  <button
                    onClick={() => handleSave('banking')}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 text-sm"
                  >
                    {saving ? 'Saving...' : 'Save Banking Details'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions - Always show on mobile when activeTab is 'items' or default */}
        {(activeTab === 'items' || activeTab === 'business') && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => navigate('/app/items/new')}
                className="flex items-center gap-3 p-4 bg-white rounded-lg border hover:bg-gray-50 text-left"
              >
                <FontAwesomeIcon icon={faBoxes} className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-sm">Manage Items</div>
                  <div className="text-xs text-gray-500">Add products and services to your catalog</div>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/app/clients/new')}
                className="flex items-center gap-3 p-4 bg-white rounded-lg border hover:bg-gray-50 text-left"
              >
                <FontAwesomeIcon icon={faBuilding} className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-sm">Manage Clients</div>
                  <div className="text-xs text-gray-500">Add and organize your client information</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Show full tab navigation */}
      <div className="hidden md:block">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FontAwesomeIcon icon={tab.icon} className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Business Information Tab */}
        {activeTab === 'business' && (
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Business Information</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                value={businessInfo.business_name}
                onChange={(e) => setBusinessInfo(prev => ({ ...prev, business_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={businessInfo.business_email}
                onChange={(e) => setBusinessInfo(prev => ({ ...prev, business_email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={businessInfo.business_phone}
                onChange={(e) => setBusinessInfo(prev => ({ ...prev, business_phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                value={businessInfo.business_website}
                onChange={(e) => setBusinessInfo(prev => ({ ...prev, business_website: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                placeholder="https://www.example.com"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax ID / VAT Number
              </label>
              <input
                type="text"
                value={businessInfo.tax_id}
                onChange={(e) => setBusinessInfo(prev => ({ ...prev, tax_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Address
            </label>
            <textarea
              value={businessInfo.business_address}
              onChange={(e) => setBusinessInfo(prev => ({ ...prev, business_address: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
              placeholder="Enter your complete business address..."
            />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-end">
            <button
              onClick={() => handleSave('business')}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 text-sm sm:text-base"
            >
              {saving ? 'Saving...' : 'Save Business Info'}
            </button>
          </div>
        </div>
        )}

        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Branding</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={branding.logo_url}
                onChange={(e) => setBranding(prev => ({ ...prev, logo_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a URL to your logo image (recommended: PNG, 200x60px)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.brand_color}
                  onChange={(e) => setBranding(prev => ({ ...prev, brand_color: e.target.value }))}
                  className="w-12 h-10 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={branding.brand_color}
                  onChange={(e) => setBranding(prev => ({ ...prev, brand_color: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                  placeholder="#10B981"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This color will be used in your invoices and quotes
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-end">
            <button
              onClick={() => handleSave('branding')}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 text-sm sm:text-base"
            >
              {saving ? 'Saving...' : 'Save Branding'}
            </button>
          </div>
        </div>
        )}

        {/* Invoice Settings Tab */}
        {activeTab === 'invoice' && (
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Invoice Settings</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Currency
              </label>
              <select
                value={invoiceSettings.currency}
                onChange={(e) => setInvoiceSettings(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={invoiceSettings.timezone}
                onChange={(e) => setInvoiceSettings(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
              >
                <option value="Europe/Lisbon">Europe/Lisbon</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Number Prefix
              </label>
              <input
                type="text"
                value={invoiceSettings.number_prefix_invoice}
                onChange={(e) => setInvoiceSettings(prev => ({ ...prev, number_prefix_invoice: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                placeholder="INV-"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Terms
            </label>
            <textarea
              value={invoiceSettings.payment_terms}
              onChange={(e) => setInvoiceSettings(prev => ({ ...prev, payment_terms: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
              placeholder="Payment due within 30 days..."
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Footer
            </label>
            <textarea
              value={invoiceSettings.invoice_footer}
              onChange={(e) => setInvoiceSettings(prev => ({ ...prev, invoice_footer: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
              placeholder="Thank you for your business..."
            />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-end">
            <button
              onClick={() => handleSave('invoice')}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 text-sm sm:text-base"
            >
              {saving ? 'Saving...' : 'Save Invoice Settings'}
            </button>
          </div>
        </div>
        )}

        {/* Banking Tab */}
        {activeTab === 'banking' && (
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Banking Details</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Account Details
            </label>
            <textarea
              value={bankingDetails.bank_details}
              onChange={(e) => setBankingDetails(prev => ({ ...prev, bank_details: e.target.value }))}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
              placeholder="Enter your bank account details for invoices:

Bank Name: Your Bank
Account Number: 123456789
Routing Number: 987654321
SWIFT/BIC: BANKCODE123"
            />
            <p className="text-xs text-gray-500 mt-1">
              These details will appear on your invoices for client payments
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-end">
            <button
              onClick={() => handleSave('banking')}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 text-sm sm:text-base"
            >
              {saving ? 'Saving...' : 'Save Banking Details'}
            </button>
          </div>
        </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/app/items/new')}
            className="flex items-center gap-3 p-4 bg-white rounded-lg border hover:bg-gray-50 text-left"
          >
            <FontAwesomeIcon icon={faBoxes} className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-sm sm:text-base">Manage Items</div>
              <div className="text-xs sm:text-sm text-gray-500">Add products and services to your catalog</div>
            </div>
          </button>
          
          <button
            onClick={() => navigate('/app/clients/new')}
            className="flex items-center gap-3 p-4 bg-white rounded-lg border hover:bg-gray-50 text-left"
          >
            <FontAwesomeIcon icon={faBuilding} className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-sm sm:text-base">Manage Clients</div>
              <div className="text-xs sm:text-sm text-gray-500">Add and organize your client information</div>
            </div>
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
