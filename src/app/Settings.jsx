import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faBoxes, faPalette, faFileInvoice, faBank, faChevronDown, faInfoCircle, faMoon, faRocket } from '@fortawesome/free-solid-svg-icons';
import { ThemeDropdown } from '../components/ThemeToggle.jsx';
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
    default_payment_method: 'Cash',
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
        default_payment_method: tenant.default_payment_method || 'Cash',
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
    { id: 'theme', label: 'Theme', icon: faMoon },
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <button
                  onClick={() => navigate('/app')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Dashboard
                </button>
                <span>•</span>
                <span className="text-gray-900 dark:text-white font-medium">Settings</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FontAwesomeIcon icon={faPalette} className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
                    Settings
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    Configure your business preferences and account settings
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/app')}
                className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 font-medium"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Dashboard</span>
              </button>
              
              {saving && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Saving...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {(err || success) && (
          <div className={`mb-6 rounded-2xl p-4 shadow-lg border backdrop-blur-sm ${
            err ? 'bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800' : 
                  'bg-gradient-to-r from-green-50 to-emerald-100/50 dark:from-green-900/20 dark:to-emerald-800/20 border-green-200 dark:border-green-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                err ? 'bg-red-100 dark:bg-red-900/40' : 'bg-green-100 dark:bg-green-900/40'
              }`}>
                {err ? (
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`font-medium ${
                  err ? 'text-red-800 dark:text-red-200' : 'text-green-800 dark:text-green-200'
                }`}>
                  {err ? 'Error occurred' : 'Success!'}
                </p>
                <p className={`text-sm ${
                  err ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'
                }`}>
                  {err || success}
                </p>
              </div>
            </div>
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

            {activeTab === 'theme' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Theme Preferences</h2>
                  <button
                    onClick={() => setActiveTab('items')}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    ← Back to Items
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
                      Choose your preferred theme
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Select how you want the app to appear. You can choose a light theme, dark theme, or let the system decide based on your device settings.
                    </p>
                    
                    <ThemeDropdown />
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                      Theme Features
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Light mode for bright environments</li>
                      <li>• Dark mode for reduced eye strain</li>
                      <li>• System mode automatically follows your device preference</li>
                      <li>• Instant switching without page reload</li>
                      <li>• Settings persist across sessions</li>
                    </ul>
                  </div>
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
                      <option value="KES">KES (KSh)</option>
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
          {/* Modern Tab Navigation */}
          <div className="mb-8">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-2 border border-gray-200/60 dark:border-gray-600/60 shadow-lg">
              <nav className="flex space-x-1 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex items-center gap-3 px-6 py-3 rounded-2xl font-medium text-sm transition-all duration-300 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-[1.02]'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-gray-700/60 hover:scale-[1.01]'
                    }`}
                  >
                    <div className={`p-2 rounded-xl transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-white/20' 
                        : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
                    }`}>
                      <FontAwesomeIcon icon={tab.icon} className="w-4 h-4" />
                    </div>
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-xl"></div>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Theme Tab */}
        {activeTab === 'theme' && (
          <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-700/50 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/60 dark:border-gray-600/60 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FontAwesomeIcon icon={faMoon} className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Theme Preferences</h2>
                <p className="text-gray-600 dark:text-gray-400">Customize the appearance of your application</p>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/30 dark:border-gray-600/30">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Choose your preferred theme
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Select how you want the app to appear. You can choose a light theme, dark theme, or let the system decide based on your device settings.
                </p>
                
                <div className="mb-6">
                  <ThemeDropdown />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/60 dark:border-blue-800/60">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                    <FontAwesomeIcon icon={faInfoCircle} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
                      Theme Features
                    </h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Light mode for bright environments and clear visibility
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Dark mode for reduced eye strain and energy efficiency
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        System mode automatically follows your device preference
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Instant switching without page reload or data loss
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Settings persist across sessions and devices
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop: Content Area */}
        <div className="hidden lg:block">
        {activeTab === 'business' && (
          <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-700/50 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/60 dark:border-gray-600/60 p-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FontAwesomeIcon icon={faBuilding} className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Business Information</h2>
                <p className="text-gray-600 dark:text-gray-400">Manage your company details and contact information</p>
              </div>
            </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Business Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={businessInfo.business_name}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, business_name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm"
                  required
                />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-xl pointer-events-none"></div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={businessInfo.business_email}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, business_email: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-xl pointer-events-none"></div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={businessInfo.business_phone}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, business_phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-xl pointer-events-none"></div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Website URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={businessInfo.business_website}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, business_website: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm"
                  placeholder="https://www.example.com"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-xl pointer-events-none"></div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Tax ID / VAT Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={businessInfo.tax_id}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, tax_id: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-xl pointer-events-none"></div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Business Address
            </label>
            <div className="relative">
              <textarea
                value={businessInfo.business_address}
                onChange={(e) => setBusinessInfo(prev => ({ ...prev, business_address: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm resize-none"
                placeholder="Enter your complete business address..."
              />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-xl pointer-events-none"></div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-end">
            <button
              onClick={() => handleSave('business')}
              disabled={saving}
              className="group relative px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
            >
              {saving ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faBuilding} className="w-4 h-4" />
                  <span>Save Business Info</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            </button>
          </div>
        </div>
        )}

        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-700/50 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/60 dark:border-gray-600/60 p-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FontAwesomeIcon icon={faPalette} className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Branding</h2>
                <p className="text-gray-600 dark:text-gray-400">Customize your brand identity and visual elements</p>
              </div>
            </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Logo URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={branding.logo_url}
                  onChange={(e) => setBranding(prev => ({ ...prev, logo_url: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm"
                  placeholder="https://example.com/logo.png"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-rose-500/5 rounded-xl pointer-events-none"></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faInfoCircle} className="w-3 h-3" />
                Enter a URL to your logo image (recommended: PNG, 200x60px)
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Brand Color
              </label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="color"
                    value={branding.brand_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, brand_color: e.target.value }))}
                    className="w-16 h-12 border border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl pointer-events-none"></div>
                </div>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={branding.brand_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, brand_color: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm"
                    placeholder="#10B981"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-rose-500/5 rounded-xl pointer-events-none"></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faInfoCircle} className="w-3 h-3" />
                This color will be used in your invoices and quotes
              </p>
            </div>
          </div>

          {/* Brand Preview */}
          <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Brand Preview</h3>
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
              {branding.logo_url ? (
                <img 
                  src={branding.logo_url} 
                  alt="Brand Logo"
                  className="h-12 w-auto max-w-[120px] object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${!branding.logo_url ? 'flex' : 'hidden'}`}
                style={{ backgroundColor: branding.brand_color }}
              >
                {businessInfo.business_name ? businessInfo.business_name.charAt(0).toUpperCase() : 'B'}
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {businessInfo.business_name || 'Your Business Name'}
                </div>
                <div className="text-sm" style={{ color: branding.brand_color }}>
                  Powered by Finovo
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-end">
            <button
              onClick={() => handleSave('branding')}
              disabled={saving}
              className="group relative px-8 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-2xl hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
            >
              {saving ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faPalette} className="w-4 h-4" />
                  <span>Save Branding</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-rose-400/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            </button>
          </div>
        </div>
        )}

        {/* Invoice Settings Tab */}
        {activeTab === 'invoice' && (
          <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-700/50 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/60 dark:border-gray-600/60 p-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FontAwesomeIcon icon={faFileInvoice} className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice Settings</h2>
                <p className="text-gray-600 dark:text-gray-400">Configure invoice defaults and preferences</p>
              </div>
            </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Default Currency
              </label>
              <div className="relative">
                <select
                  value={invoiceSettings.currency}
                  onChange={(e) => setInvoiceSettings(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white backdrop-blur-sm appearance-none"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="KES">KES (KSh)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <FontAwesomeIcon icon={faChevronDown} className="w-4 h-4 text-gray-400" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl pointer-events-none"></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faInfoCircle} className="w-3 h-3" />
                This currency will be used for all invoices, receipts, and financial calculations
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Timezone
              </label>
              <div className="relative">
                <select
                  value={invoiceSettings.timezone}
                  onChange={(e) => setInvoiceSettings(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white backdrop-blur-sm appearance-none"
                >
                  <option value="Europe/Lisbon">Europe/Lisbon</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="Africa/Nairobi">Africa/Nairobi (East Africa)</option>
                  <option value="Africa/Lagos">Africa/Lagos (West Africa)</option>
                  <option value="Africa/Cairo">Africa/Cairo (North Africa)</option>
                  <option value="Africa/Johannesburg">Africa/Johannesburg (South Africa)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <FontAwesomeIcon icon={faChevronDown} className="w-4 h-4 text-gray-400" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl pointer-events-none"></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faInfoCircle} className="w-3 h-3" />
                Affects date and time display throughout the application
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Default Payment Method
              </label>
              <div className="relative">
                <select
                  value={invoiceSettings.default_payment_method}
                  onChange={(e) => setInvoiceSettings(prev => ({ ...prev, default_payment_method: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white backdrop-blur-sm appearance-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Check">Check</option>
                  <option value="Other">Other</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <FontAwesomeIcon icon={faChevronDown} className="w-4 h-4 text-gray-400" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl pointer-events-none"></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faInfoCircle} className="w-3 h-3" />
                Default payment method for receipts and transactions
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Invoice Number Prefix
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={invoiceSettings.number_prefix_invoice}
                  onChange={(e) => setInvoiceSettings(prev => ({ ...prev, number_prefix_invoice: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm"
                  placeholder="INV-"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl pointer-events-none"></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faInfoCircle} className="w-3 h-3" />
                Prefix for automatically generated invoice numbers
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Payment Terms
            </label>
            <div className="relative">
              <textarea
                value={invoiceSettings.payment_terms}
                onChange={(e) => setInvoiceSettings(prev => ({ ...prev, payment_terms: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm resize-none"
                placeholder="Payment due within 30 days..."
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl pointer-events-none"></div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Invoice Footer
            </label>
            <div className="relative">
              <textarea
                value={invoiceSettings.invoice_footer}
                onChange={(e) => setInvoiceSettings(prev => ({ ...prev, invoice_footer: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm resize-none"
                placeholder="Thank you for your business..."
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl pointer-events-none"></div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-end">
            <button
              onClick={() => handleSave('invoice')}
              disabled={saving}
              className="group relative px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
            >
              {saving ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faFileInvoice} className="w-4 h-4" />
                  <span>Save Invoice Settings</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            </button>
          </div>
        </div>
        )}

        {/* Banking Tab */}
        {activeTab === 'banking' && (
          <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-700/50 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/60 dark:border-gray-600/60 p-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FontAwesomeIcon icon={faBank} className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Banking Details</h2>
                <p className="text-gray-600 dark:text-gray-400">Configure payment information for your invoices</p>
              </div>
            </div>
          
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Bank Account Details
            </label>
            <div className="relative">
              <textarea
                value={bankingDetails.bank_details}
                onChange={(e) => setBankingDetails(prev => ({ ...prev, bank_details: e.target.value }))}
                rows={8}
                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm resize-none"
                placeholder="Enter your bank account details for invoices:

Bank Name: Your Bank
Account Number: 123456789
Routing Number: 987654321
SWIFT/BIC: BANKCODE123

Additional Instructions:
Please include invoice number in payment reference"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-xl pointer-events-none"></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
              <FontAwesomeIcon icon={faInfoCircle} className="w-3 h-3" />
              These details will appear on your invoices for client payments
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-end">
            <button
              onClick={() => handleSave('banking')}
              disabled={saving}
              className="group relative px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
            >
              {saving ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faBank} className="w-4 h-4" />
                  <span>Save Banking Details</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            </button>
          </div>
        </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-800 dark:to-purple-900/20 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/60 dark:border-gray-600/60 p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FontAwesomeIcon icon={faRocket} className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Actions</h3>
              <p className="text-gray-600 dark:text-gray-400">Access key features rapidly</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <button
              onClick={() => navigate('/app/items/new')}
              className="group relative flex items-center gap-4 p-6 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-600/60 hover:bg-gradient-to-br hover:from-white hover:to-purple-50/50 dark:hover:from-gray-700 dark:hover:to-purple-900/30 text-left transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <FontAwesomeIcon icon={faBoxes} className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-300">Manage Items</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">Add products and services to your catalog</div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            
            <button
              onClick={() => navigate('/app/clients/new')}
              className="group relative flex items-center gap-4 p-6 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-600/60 hover:bg-gradient-to-br hover:from-white hover:to-purple-50/50 dark:hover:from-gray-700 dark:hover:to-purple-900/30 text-left transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <FontAwesomeIcon icon={faBuilding} className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300">Manage Clients</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">Add and organize your client information</div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
