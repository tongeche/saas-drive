// Business Analytics & Reports Dashboard
// Comprehensive analytics with charts, metrics, and export functionality

import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faFileExport,
  faDownload,
  faFilter,
  faCalendarAlt,
  faUsers,
  faMoneyBillWave,
  faFileInvoice,
  faReceipt,
  faArrowUp,
  faArrowDown,
  faEye,
  faSync,
  faPrint,
  faSearch,
  faChartBar,
  faChartPie,
  faPercentage,
  faClock,
  faExclamationTriangle,
  faCheckCircle,
  faTimesCircle,
  faSpinner,
  faTable,
  faListAlt,
  faCalendar,
  faDollarSign,
  faHashtag,
  faBuilding,
  faEnvelope,
  faPhone
} from '@fortawesome/free-solid-svg-icons';

export default function BusinessAnalytics() {
  const { tenant } = useOutletContext() || {};
  
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('last_30_days');
  const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'clients', 'invoices']);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [error, setError] = useState('');

  // Mock data - replace with actual API calls
  const mockAnalytics = {
    summary: {
      total_revenue: 125400,
      total_clients: 47,
      total_invoices: 156,
      total_receipts: 89,
      pending_invoices: 12,
      overdue_invoices: 3,
      average_invoice_value: 804.49,
      revenue_growth: 12.5,
      client_growth: 8.3,
      invoice_growth: 15.2
    },
    revenue_by_month: [
      { month: 'Jan', revenue: 8500, invoices: 12, clients: 8 },
      { month: 'Feb', revenue: 9200, invoices: 15, clients: 11 },
      { month: 'Mar', revenue: 10800, invoices: 18, clients: 14 },
      { month: 'Apr', revenue: 12300, invoices: 21, clients: 16 },
      { month: 'May', revenue: 11900, invoices: 19, clients: 15 },
      { month: 'Jun', revenue: 13500, invoices: 24, clients: 18 },
    ],
    top_clients: [
      { name: 'TechCorp Ltd', revenue: 15600, invoices: 8, status: 'active' },
      { name: 'Global Dynamics', revenue: 12400, invoices: 6, status: 'active' },
      { name: 'Innovation Labs', revenue: 9800, invoices: 5, status: 'active' },
      { name: 'Future Systems', revenue: 8200, invoices: 4, status: 'prospect' },
      { name: 'Digital Solutions', revenue: 7300, invoices: 3, status: 'active' }
    ],
    payment_status: {
      paid: 143,
      pending: 12,
      overdue: 3,
      draft: 2
    },
    invoice_trends: {
      this_month: 24,
      last_month: 19,
      growth_percentage: 26.3
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [tenant?.id, dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalytics(mockAnalytics);
    } catch (error) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = 'KES') => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (value) => {
    return value > 0 ? faArrowUp : faArrowDown;
  };

  const getGrowthColor = (value) => {
    return value > 0 ? 'text-green-600' : 'text-red-600';
  };

  const handleExport = (format) => {
    setExportFormat(format);
    setShowExportModal(true);
  };

  const executeExport = () => {
    // Implement actual export functionality
    console.log(`Exporting in ${exportFormat} format`);
    setShowExportModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-blue-600 animate-spin mb-4" />
          <div className="text-gray-600 dark:text-gray-400">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FontAwesomeIcon icon={faChartLine} className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            Business Analytics & Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive insights into your business performance
          </p>
        </div>
        
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="last_7_days">Last 7 days</option>
            <option value="last_30_days">Last 30 days</option>
            <option value="last_90_days">Last 90 days</option>
            <option value="last_year">Last year</option>
            <option value="custom">Custom range</option>
          </select>
          
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <FontAwesomeIcon icon={faFileExport} className="w-4 h-4" />
            <span className="hidden sm:inline">Export Report</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FontAwesomeIcon icon={faMoneyBillWave} className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
              Total Revenue
            </p>
            <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
              {formatCurrency(analytics.summary?.total_revenue || 0)}
            </p>
            <div className="flex items-center justify-center">
              <FontAwesomeIcon 
                icon={getGrowthIcon(analytics.summary?.revenue_growth || 0)} 
                className={`w-3 h-3 mr-1 ${getGrowthColor(analytics.summary?.revenue_growth || 0)}`} 
              />
              <span className={`text-xs font-medium ${getGrowthColor(analytics.summary?.revenue_growth || 0)}`}>
                {formatPercentage(analytics.summary?.revenue_growth || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Clients */}
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FontAwesomeIcon icon={faUsers} className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
              Total Clients
            </p>
            <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
              {analytics.summary?.total_clients || 0}
            </p>
            <div className="flex items-center justify-center">
              <FontAwesomeIcon 
                icon={getGrowthIcon(analytics.summary?.client_growth || 0)} 
                className={`w-3 h-3 mr-1 ${getGrowthColor(analytics.summary?.client_growth || 0)}`} 
              />
              <span className={`text-xs font-medium ${getGrowthColor(analytics.summary?.client_growth || 0)}`}>
                {formatPercentage(analytics.summary?.client_growth || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Invoices */}
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FontAwesomeIcon icon={faFileInvoice} className="w-5 h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
              Total Invoices
            </p>
            <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
              {analytics.summary?.total_invoices || 0}
            </p>
            <div className="flex items-center justify-center">
              <FontAwesomeIcon 
                icon={getGrowthIcon(analytics.summary?.invoice_growth || 0)} 
                className={`w-3 h-3 mr-1 ${getGrowthColor(analytics.summary?.invoice_growth || 0)}`} 
              />
              <span className={`text-xs font-medium ${getGrowthColor(analytics.summary?.invoice_growth || 0)}`}>
                {formatPercentage(analytics.summary?.invoice_growth || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Average Invoice Value */}
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FontAwesomeIcon icon={faDollarSign} className="w-5 h-5 md:w-6 md:h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
              Avg Invoice
            </p>
            <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
              {formatCurrency(analytics.summary?.average_invoice_value || 0)}
            </p>
            <div className="flex items-center justify-center">
              <FontAwesomeIcon icon={faArrowUp} className="w-3 h-3 mr-1 text-green-500" />
              <span className="text-xs font-medium text-green-600">+5.2%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-4 md:space-x-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: faChartLine },
            { id: 'revenue', label: 'Revenue', icon: faMoneyBillWave },
            { id: 'clients', label: 'Clients', icon: faUsers },
            { id: 'invoices', label: 'Invoices', icon: faFileInvoice },
            { id: 'exports', label: 'Reports', icon: faFileExport }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={tab.icon} className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab analytics={analytics} formatCurrency={formatCurrency} />
      )}

      {activeTab === 'revenue' && (
        <RevenueTab analytics={analytics} formatCurrency={formatCurrency} />
      )}

      {activeTab === 'clients' && (
        <ClientsTab analytics={analytics} formatCurrency={formatCurrency} />
      )}

      {activeTab === 'invoices' && (
        <InvoicesTab analytics={analytics} formatCurrency={formatCurrency} />
      )}

      {activeTab === 'exports' && (
        <ExportsTab onExport={handleExport} />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          onExport={executeExport}
          format={exportFormat}
          setFormat={setExportFormat}
        />
      )}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ analytics, formatCurrency }) {
  return (
    <div className="space-y-6">
      {/* Revenue Trend Chart */}
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Trend</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2 sm:mt-0">
            <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4" />
            Last 6 months
          </div>
        </div>
        
        {/* Simple Bar Chart */}
        <div className="grid grid-cols-6 gap-2 h-48 items-end">
          {(analytics.revenue_by_month || []).map((month, index) => (
            <div key={month.month} className="flex flex-col items-center">
              <div 
                className="w-full bg-blue-500 rounded-t-md transition-all duration-500 hover:bg-blue-600"
                style={{ 
                  height: `${(month.revenue / Math.max(...analytics.revenue_by_month.map(m => m.revenue))) * 100}%`,
                  minHeight: '20px'
                }}
                title={`${month.month}: ${formatCurrency(month.revenue)}`}
              ></div>
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-2">{month.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Clients and Payment Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Clients</h3>
          <div className="space-y-3">
            {(analytics.top_clients || []).slice(0, 5).map((client, index) => (
              <div key={client.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{client.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{client.invoices} invoices</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {formatCurrency(client.revenue)}
                  </p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    client.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {client.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Status</h3>
          <div className="space-y-4">
            {Object.entries(analytics.payment_status || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'paid' ? 'bg-green-500' :
                    status === 'pending' ? 'bg-yellow-500' :
                    status === 'overdue' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {status}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
          
          {/* Visual representation */}
          <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
            {Object.entries(analytics.payment_status || {}).map(([status, count]) => {
              const total = Object.values(analytics.payment_status || {}).reduce((a, b) => a + b, 0);
              const percentage = (count / total) * 100;
              return (
                <div
                  key={status}
                  className={`h-full ${
                    status === 'paid' ? 'bg-green-500' :
                    status === 'pending' ? 'bg-yellow-500' :
                    status === 'overdue' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                ></div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Revenue Tab Component
function RevenueTab({ analytics, formatCurrency }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Analysis</h3>
        <div className="text-center py-8">
          <FontAwesomeIcon icon={faChartBar} className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Detailed revenue charts coming soon</p>
        </div>
      </div>
    </div>
  );
}

// Clients Tab Component
function ClientsTab({ analytics, formatCurrency }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Client Analytics</h3>
        <div className="text-center py-8">
          <FontAwesomeIcon icon={faUsers} className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Client analytics dashboard coming soon</p>
        </div>
      </div>
    </div>
  );
}

// Invoices Tab Component
function InvoicesTab({ analytics, formatCurrency }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invoice Analytics</h3>
        <div className="text-center py-8">
          <FontAwesomeIcon icon={faFileInvoice} className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Invoice analytics dashboard coming soon</p>
        </div>
      </div>
    </div>
  );
}

// Exports Tab Component
function ExportsTab({ onExport }) {
  const exportOptions = [
    {
      format: 'pdf',
      title: 'PDF Report',
      description: 'Complete business report in PDF format',
      icon: faFileExport,
      color: 'red'
    },
    {
      format: 'excel',
      title: 'Excel Spreadsheet',
      description: 'Data export for analysis in Excel',
      icon: faTable,
      color: 'green'
    },
    {
      format: 'csv',
      title: 'CSV Data',
      description: 'Raw data in comma-separated format',
      icon: faListAlt,
      color: 'blue'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Export Reports</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {exportOptions.map((option) => (
            <div
              key={option.format}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onExport(option.format)}
            >
              <div className="text-center">
                <FontAwesomeIcon 
                  icon={option.icon} 
                  className={`w-8 h-8 mb-3 text-${option.color}-600 dark:text-${option.color}-400`} 
                />
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{option.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{option.description}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExport(option.format);
                  }}
                  className={`w-full px-4 py-2 bg-${option.color}-600 text-white rounded-lg hover:bg-${option.color}-700 transition-colors`}
                >
                  Export {option.format.toUpperCase()}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Export Modal Component
function ExportModal({ onClose, onExport, format, setFormat }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Report</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FontAwesomeIcon icon={faTimesCircle} className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Export Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pdf">PDF Report</option>
                <option value="excel">Excel Spreadsheet</option>
                <option value="csv">CSV Data</option>
              </select>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onExport}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Export Now
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}