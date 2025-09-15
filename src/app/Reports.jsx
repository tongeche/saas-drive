// Standalone Reports and Analytics Page
// Dedicated page for business reports and data export

import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileExport,
  faDownload,
  faChartLine,
  faMoneyBillWave,
  faUsers,
  faFileInvoice,
  faReceipt,
  faCalendarAlt,
  faFilter,
  faTable,
  faChartBar,
  faChartPie,
  faPrint,
  faEnvelope,
  faShare,
  faCloud,
  faDatabase,
  faSpinner,
  faCheckCircle,
  faExclamationTriangle,
  faInfoCircle,
  faClock,
  faArrowRight,
  faTimes,
  faSearch,
  faSync
} from '@fortawesome/free-solid-svg-icons';

export default function Reports() {
  const { tenant } = useOutletContext() || {};
  
  const [loading, setLoading] = useState(false);
  const [selectedReports, setSelectedReports] = useState([]);
  const [dateRange, setDateRange] = useState('last_30_days');
  const [customDate, setCustomDate] = useState({ start: '', end: '' });
  const [exportProgress, setExportProgress] = useState(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Available report types
  const reportTypes = [
    {
      id: 'revenue_summary',
      title: 'Revenue Summary',
      description: 'Total revenue breakdown by period',
      icon: faMoneyBillWave,
      color: 'green',
      formats: ['pdf', 'excel', 'csv'],
      estimatedTime: '2-3 minutes'
    },
    {
      id: 'client_report',
      title: 'Client Analytics',
      description: 'Client performance and engagement metrics',
      icon: faUsers,
      color: 'blue',
      formats: ['pdf', 'excel'],
      estimatedTime: '3-5 minutes'
    },
    {
      id: 'invoice_report',
      title: 'Invoice Analysis',
      description: 'Invoice status, payments, and trends',
      icon: faFileInvoice,
      color: 'purple',
      formats: ['pdf', 'excel', 'csv'],
      estimatedTime: '2-4 minutes'
    },
    {
      id: 'receipts_report',
      title: 'Receipts Summary',
      description: 'Receipt tracking and categorization',
      icon: faReceipt,
      color: 'orange',
      formats: ['pdf', 'excel', 'csv'],
      estimatedTime: '1-2 minutes'
    },
    {
      id: 'tax_report',
      title: 'Tax Report',
      description: 'Tax calculations and compliance data',
      icon: faFileExport,
      color: 'red',
      formats: ['pdf', 'excel'],
      estimatedTime: '5-7 minutes'
    },
    {
      id: 'cashflow_report',
      title: 'Cash Flow Analysis',
      description: 'Income vs expenses analysis',
      icon: faChartLine,
      color: 'indigo',
      formats: ['pdf', 'excel', 'csv'],
      estimatedTime: '3-4 minutes'
    }
  ];

  const dateRangeOptions = [
    { value: 'last_7_days', label: 'Last 7 days' },
    { value: 'last_30_days', label: 'Last 30 days' },
    { value: 'last_90_days', label: 'Last 90 days' },
    { value: 'last_6_months', label: 'Last 6 months' },
    { value: 'last_year', label: 'Last year' },
    { value: 'current_month', label: 'Current month' },
    { value: 'current_year', label: 'Current year' },
    { value: 'custom', label: 'Custom range' }
  ];

  const toggleReportSelection = (reportId) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleBulkExport = async (format) => {
    if (selectedReports.length === 0) return;
    
    setLoading(true);
    setExportProgress({ current: 0, total: selectedReports.length, status: 'preparing' });
    
    try {
      // Simulate export process
      for (let i = 0; i < selectedReports.length; i++) {
        setExportProgress({ 
          current: i + 1, 
          total: selectedReports.length, 
          status: 'processing',
          currentReport: reportTypes.find(r => r.id === selectedReports[i])?.title
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      setExportProgress({ 
        current: selectedReports.length, 
        total: selectedReports.length, 
        status: 'completed' 
      });
      
      // Reset after completion
      setTimeout(() => {
        setExportProgress(null);
        setSelectedReports([]);
      }, 3000);
      
    } catch (error) {
      setExportProgress({ status: 'error', message: 'Export failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      green: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
      blue: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
      purple: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
      orange: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
      red: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FontAwesomeIcon icon={faFileExport} className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            Business Reports & Export
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generate comprehensive business reports and export data for analysis
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="text-center">
            <div className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">47</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Reports Available</div>
          </div>
          <div className="text-center">
            <div className="text-lg md:text-xl font-bold text-green-600">156</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Generated Today</div>
          </div>
          <div className="text-center">
            <div className="text-lg md:text-xl font-bold text-blue-600">2.4GB</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Exports</div>
          </div>
          <div className="text-center">
            <div className="text-lg md:text-xl font-bold text-purple-600">99.2%</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Date Range Selection */}
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faCalendarAlt} className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report Period</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            
            {dateRange === 'custom' && (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={customDate.start}
                  onChange={(e) => setCustomDate(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={customDate.end}
                  onChange={(e) => setCustomDate(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
            
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              <FontAwesomeIcon icon={faFilter} className="w-4 h-4 mr-2" />
              Advanced
            </button>
          </div>
        </div>
        
        {showAdvancedOptions && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client Filter
                </label>
                <select className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>All Clients</option>
                  <option>Active Clients Only</option>
                  <option>Premium Clients</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency
                </label>
                <select className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>KES (Kenyan Shilling)</option>
                  <option>USD (US Dollar)</option>
                  <option>EUR (Euro)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Include
                </label>
                <div className="space-y-1">
                  <label className="flex items-center text-sm">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    Paid Invoices
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    Pending Invoices
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {reportTypes.map((report) => (
          <div
            key={report.id}
            className={`p-4 md:p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
              selectedReports.includes(report.id)
                ? `${getColorClasses(report.color)} shadow-lg scale-105`
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => toggleReportSelection(report.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                selectedReports.includes(report.id) 
                  ? 'bg-white dark:bg-gray-800' 
                  : getColorClasses(report.color).split(' ')[0] + ' dark:bg-' + report.color + '-900/30'
              }`}>
                <FontAwesomeIcon 
                  icon={report.icon} 
                  className={`w-6 h-6 ${
                    selectedReports.includes(report.id)
                      ? `text-${report.color}-600 dark:text-${report.color}-400`
                      : `text-${report.color}-600 dark:text-${report.color}-400`
                  }`} 
                />
              </div>
              
              {selectedReports.includes(report.id) && (
                <FontAwesomeIcon icon={faCheckCircle} className="w-6 h-6 text-green-600" />
              )}
            </div>
            
            <h3 className={`font-semibold mb-2 ${
              selectedReports.includes(report.id) 
                ? 'text-gray-900 dark:text-white' 
                : 'text-gray-900 dark:text-white'
            }`}>
              {report.title}
            </h3>
            
            <p className={`text-sm mb-4 ${
              selectedReports.includes(report.id) 
                ? 'text-gray-700 dark:text-gray-300' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {report.description}
            </p>
            
            <div className="flex items-center justify-between text-xs">
              <div className="flex gap-1">
                {report.formats.map(format => (
                  <span 
                    key={format} 
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedReports.includes(report.id)
                        ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {format.toUpperCase()}
                  </span>
                ))}
              </div>
              <div className={`flex items-center gap-1 ${
                selectedReports.includes(report.id) 
                  ? 'text-gray-600 dark:text-gray-400' 
                  : 'text-gray-500 dark:text-gray-500'
              }`}>
                <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                {report.estimatedTime}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Export Controls */}
      {selectedReports.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Export Selected Reports
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedReports.length} report{selectedReports.length !== 1 ? 's' : ''} selected
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleBulkExport('pdf')}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FontAwesomeIcon icon={loading ? faSpinner : faFileExport} className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Export as PDF
              </button>
              
              <button
                onClick={() => handleBulkExport('excel')}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FontAwesomeIcon icon={loading ? faSpinner : faTable} className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Export as Excel
              </button>
              
              <button
                onClick={() => setSelectedReports([])}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Progress */}
      {exportProgress && (
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <FontAwesomeIcon 
              icon={exportProgress.status === 'completed' ? faCheckCircle : faSpinner} 
              className={`w-5 h-5 ${
                exportProgress.status === 'completed' ? 'text-green-600' : 
                exportProgress.status === 'error' ? 'text-red-600' : 
                'text-blue-600 animate-spin'
              }`} 
            />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {exportProgress.status === 'completed' ? 'Export Completed' :
               exportProgress.status === 'error' ? 'Export Failed' :
               'Exporting Reports...'}
            </h3>
          </div>
          
          {exportProgress.status === 'processing' && (
            <div className="space-y-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Processing: {exportProgress.currentReport}</span>
                <span>{exportProgress.current} of {exportProgress.total}</span>
              </div>
            </div>
          )}
          
          {exportProgress.status === 'completed' && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                All reports exported successfully
              </span>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                Download All
              </button>
            </div>
          )}
          
          {exportProgress.status === 'error' && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-600">{exportProgress.message}</span>
              <button 
                onClick={() => setExportProgress(null)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                <FontAwesomeIcon icon={faSync} className="w-4 h-4" />
                Retry
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
          <FontAwesomeIcon icon={faChartLine} className="w-8 h-8 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
          <p className="text-sm text-blue-100 mb-4">View interactive business analytics</p>
          <button className="w-full bg-white text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium">
            Open Dashboard
          </button>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white">
          <FontAwesomeIcon icon={faCloud} className="w-8 h-8 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Scheduled Reports</h3>
          <p className="text-sm text-green-100 mb-4">Set up automatic report generation</p>
          <button className="w-full bg-white text-green-600 py-2 rounded-lg hover:bg-green-50 transition-colors font-medium">
            Schedule Reports
          </button>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white">
          <FontAwesomeIcon icon={faDatabase} className="w-8 h-8 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Data Backup</h3>
          <p className="text-sm text-purple-100 mb-4">Backup and restore your business data</p>
          <button className="w-full bg-white text-purple-600 py-2 rounded-lg hover:bg-purple-50 transition-colors font-medium">
            Manage Backups
          </button>
        </div>
      </div>
    </div>
  );
}