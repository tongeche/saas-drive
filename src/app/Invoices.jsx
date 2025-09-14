import React, { useEffect, useState } from "react";
import { Link, useOutletContext, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faPlus, 
  faEye, 
  faDownload, 
  faShare, 
  faSearch,
  faFilter,
  faCalendarAlt,
  faDollarSign,
  faFileInvoice,
  faExclamationTriangle,
  faCheckCircle,
  faClock,
  faChartLine,
  faArrowUp,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import { statusOf, statusBadge } from "../lib/invoices";

export default function Invoices() {
  const navigate = useNavigate();
  const { tenant } = useOutletContext() || {};
  
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [error, setError] = useState("");

  // Load invoices data
  useEffect(() => {
    if (!tenant?.slug) return;
    
    const loadInvoices = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Fetch invoices from API
        const response = await fetch(`/.netlify/functions/list-invoices?tenant=${tenant.slug}&limit=50`);
        
        // Check if response is ok
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Check content type to ensure we're getting JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.error("Expected JSON but got:", contentType);
          throw new Error("Server returned HTML instead of JSON. The API endpoint may not be available.");
        }
        
        const invoicesData = await response.json();
        
        // Handle API error responses
        if (invoicesData.error) {
          throw new Error(invoicesData.error);
        }
        
        // For now, we'll enhance the data with mock client information and status
        // In a real app, you'd join this data or make additional API calls
        const enhancedInvoices = (invoicesData || []).map((invoice, index) => ({
          ...invoice,
          client_name: `Client ${index + 1}`, // Replace with actual client data
          client_email: `client${index + 1}@example.com`,
          issue_date: invoice.created_at.split('T')[0],
          due_date: new Date(new Date(invoice.created_at).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subtotal: 1000 + (index * 200),
          tax_total: (1000 + (index * 200)) * 0.16,
          total: (1000 + (index * 200)) * 1.16,
          currency: "EUR",
          status: index % 4 === 0 ? "paid" : index % 4 === 1 ? "overdue" : index % 4 === 2 ? "due_soon" : "issued"
        }));
        
        setInvoices(enhancedInvoices);
        setFilteredInvoices(enhancedInvoices);
      } catch (err) {
        console.error("Error loading invoices:", err);
        setError(`API Error: ${err.message}`);
        
        // Fallback to mock data in case of API error
        const mockInvoices = [
          {
            id: 1,
            number: "INV-2024-001",
            created_at: "2024-09-01T10:00:00Z",
            issue_date: "2024-09-01",
            due_date: "2024-09-15",
            client_name: "Rosa Maria",
            client_email: "rosa@example.com",
            subtotal: 1000,
            tax_total: 160,
            total: 1160,
            currency: "EUR",
            status: "paid"
          },
          {
            id: 2,
            number: "INV-2024-002",
            created_at: "2024-09-05T14:30:00Z",
            issue_date: "2024-09-05",
            due_date: "2024-09-10",
            client_name: "James Smith",
            client_email: "james@company.com",
            subtotal: 750,
            tax_total: 120,
            total: 870,
            currency: "EUR",
            status: "overdue"
          },
          {
            id: 3,
            number: "INV-2024-003",
            created_at: "2024-09-10T09:15:00Z",
            issue_date: "2024-09-10",
            due_date: "2024-09-20",
            client_name: "ABC Corporation",
            client_email: "billing@abc.com",
            subtotal: 2500,
            tax_total: 400,
            total: 2900,
            currency: "EUR",
            status: "due_soon"
          },
          {
            id: 4,
            number: "INV-2024-004",
            created_at: "2024-09-12T16:45:00Z",
            issue_date: "2024-09-12",
            due_date: "2024-10-12",
            client_name: "Tech Solutions Ltd",
            client_email: "accounts@techsolutions.com",
            subtotal: 3200,
            tax_total: 512,
            total: 3712,
            currency: "EUR",
            status: "issued"
          },
          {
            id: 5,
            number: "INV-2024-005",
            created_at: "2024-09-14T11:20:00Z",
            issue_date: "2024-09-14",
            due_date: "2024-09-28",
            client_name: "Design Studio Pro",
            client_email: "finance@designstudio.com",
            subtotal: 1800,
            tax_total: 288,
            total: 2088,
            currency: "EUR",
            status: "issued"
          }
        ];
        
        setInvoices(mockInvoices);
        setFilteredInvoices(mockInvoices);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [tenant?.slug]);

  // Filter invoices based on search and status
  useEffect(() => {
    let filtered = invoices;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(invoice => {
        const status = getInvoiceStatus(invoice);
        return status.toLowerCase().replace(" ", "_") === statusFilter;
      });
    }
    
    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter]);

  const getInvoiceStatus = (invoice) => {
    if (invoice.status === "paid") return "Paid";
    
    const due = new Date(invoice.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = (due - today) / (1000 * 60 * 60 * 24);
    
    if (diff < 0) return "Overdue";
    if (diff <= 7) return "Due Soon";
    return "Issued";
  };

  // Calculate analytics
  const analytics = {
    totalInvoices: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
    paidAmount: invoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + inv.total, 0),
    pendingAmount: invoices.filter(inv => inv.status !== "paid").reduce((sum, inv) => sum + inv.total, 0),
    overdueCount: invoices.filter(inv => getInvoiceStatus(inv) === "Overdue").length,
    dueSoonCount: invoices.filter(inv => getInvoiceStatus(inv) === "Due Soon").length
  };

  const formatCurrency = (amount, currency = "EUR") => {
    return new Intl.NumberFormat("en-EU", {
      style: "currency",
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-EU", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const handleInvoiceAction = async (action, invoice) => {
    try {
      switch (action) {
        case 'view':
          setSelectedInvoice(invoice);
          break;
        case 'download':
          // Implement PDF download
          console.log('Downloading invoice:', invoice.number);
          break;
        case 'share':
          // Implement share functionality
          console.log('Sharing invoice:', invoice.number);
          break;
        case 'edit':
          navigate(`/app/invoices/${invoice.id}/edit`);
          break;
        default:
          break;
      }
    } catch (error) {
      setError(`Failed to ${action} invoice: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-gray-500">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full bg-gray-50">
      {/* Sidebar */}
      <div className="w-full lg:w-80 bg-white shadow-sm border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Invoices</h2>
            <Link
              to="/app/invoices/new"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#4D7969' }}
            >
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
              <span className="hidden sm:inline">New Invoice</span>
            </Link>
          </div>
          
          {/* Search */}
          <div className="relative mb-4">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm"
              style={{ focusRingColor: '#4D7969' }}
            />
          </div>
          
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm"
              style={{ focusRingColor: '#4D7969' }}
            >
              <option value="all">All Invoices</option>
              <option value="issued">Issued</option>
              <option value="due_soon">Due Soon</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Invoice List */}
        <div className="flex-1 overflow-y-auto max-h-64 lg:max-h-none">
          {error && (
            <div className="m-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              <div className="font-medium mb-1">API Connection Issue</div>
              <div className="text-xs">{error}</div>
              <div className="text-xs mt-2 opacity-75">Showing demo data for preview purposes.</div>
            </div>
          )}
          
          {filteredInvoices.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {searchTerm || statusFilter !== "all" ? "No invoices match your filters" : "No invoices yet"}
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {filteredInvoices.slice(0, 10).map((invoice) => {
                const status = getInvoiceStatus(invoice);
                const badge = statusBadge(status);
                
                return (
                  <div
                    key={invoice.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 truncate">{invoice.number}</h3>
                        <p className="text-sm text-gray-600 truncate">{invoice.client_name}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ml-2 ${badge.cls}`}>
                        {badge.text}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{formatDate(invoice.issue_date)}</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInvoiceAction('view', invoice);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        <FontAwesomeIcon icon={faEye} className="w-3 h-3 mr-1" />
                        View
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInvoiceAction('download', invoice);
                        }}
                        className="text-xs text-green-600 hover:text-green-800"
                      >
                        <FontAwesomeIcon icon={faDownload} className="w-3 h-3 mr-1" />
                        Download
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInvoiceAction('share', invoice);
                        }}
                        className="text-xs text-purple-600 hover:text-purple-800"
                      >
                        <FontAwesomeIcon icon={faShare} className="w-3 h-3 mr-1" />
                        Share
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
          {/* Total Revenue Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.totalAmount)}
                </p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faDollarSign} className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faArrowUp} className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">+12.5% from last month</span>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              {analytics.totalInvoices} total invoices
            </div>
          </div>

          {/* Outstanding Amount Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.pendingAmount)}
                </p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faClock} className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-600 font-medium">
                {analytics.overdueCount} overdue
              </span>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              {analytics.dueSoonCount} due soon
            </div>
          </div>

          {/* Collection Rate Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">
                  {analytics.totalAmount > 0 ? Math.round((analytics.paidAmount / analytics.totalAmount) * 100) : 0}%
                </p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">
                {formatCurrency(analytics.paidAmount)} collected
              </span>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Of {formatCurrency(analytics.totalAmount)} total
            </div>
          </div>
        </div>

        {/* Invoice Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Invoice Overview</h3>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2" />
                This Month
              </button>
              <button className="flex-1 sm:flex-none px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                <FontAwesomeIcon icon={faFilter} className="w-4 h-4 mr-2" />
                Filter
              </button>
            </div>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xl lg:text-2xl font-bold text-gray-900">{analytics.totalInvoices}</div>
              <div className="text-xs lg:text-sm text-gray-600">Total Invoices</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-xl lg:text-2xl font-bold text-green-600">
                {invoices.filter(inv => inv.status === "paid").length}
              </div>
              <div className="text-xs lg:text-sm text-gray-600">Paid</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-xl lg:text-2xl font-bold text-orange-600">{analytics.dueSoonCount}</div>
              <div className="text-xs lg:text-sm text-gray-600">Due Soon</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-xl lg:text-2xl font-bold text-red-600">{analytics.overdueCount}</div>
              <div className="text-xs lg:text-sm text-gray-600">Overdue</div>
            </div>
          </div>

          {/* Recent Invoices Table */}
          <div className="overflow-x-auto">
            <div className="min-w-full inline-block align-middle">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left pb-3 text-xs lg:text-sm font-medium text-gray-600 min-w-[120px]">Invoice</th>
                    <th className="text-left pb-3 text-xs lg:text-sm font-medium text-gray-600 min-w-[150px]">Client</th>
                    <th className="text-left pb-3 text-xs lg:text-sm font-medium text-gray-600 min-w-[100px]">Date</th>
                    <th className="text-left pb-3 text-xs lg:text-sm font-medium text-gray-600 min-w-[100px]">Due Date</th>
                    <th className="text-left pb-3 text-xs lg:text-sm font-medium text-gray-600 min-w-[100px]">Amount</th>
                    <th className="text-left pb-3 text-xs lg:text-sm font-medium text-gray-600 min-w-[80px]">Status</th>
                    <th className="text-left pb-3 text-xs lg:text-sm font-medium text-gray-600 min-w-[120px]">Actions</th>
                  </tr>
                </thead>
              <tbody>
                {filteredInvoices.slice(0, 10).map((invoice) => {
                  const status = getInvoiceStatus(invoice);
                  const badge = statusBadge(status);
                  
                  return (
                    <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-xs lg:text-sm font-medium text-gray-900">{invoice.number}</td>
                      <td className="py-3 text-xs lg:text-sm text-gray-600">{invoice.client_name}</td>
                      <td className="py-3 text-xs lg:text-sm text-gray-600">{formatDate(invoice.issue_date)}</td>
                      <td className="py-3 text-xs lg:text-sm text-gray-600">{formatDate(invoice.due_date)}</td>
                      <td className="py-3 text-xs lg:text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.cls}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleInvoiceAction('view', invoice)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="View Invoice"
                          >
                            <FontAwesomeIcon icon={faEye} className="w-3 lg:w-4 h-3 lg:h-4" />
                          </button>
                          <button 
                            onClick={() => handleInvoiceAction('download', invoice)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Download PDF"
                          >
                            <FontAwesomeIcon icon={faDownload} className="w-3 lg:w-4 h-3 lg:h-4" />
                          </button>
                          <button 
                            onClick={() => handleInvoiceAction('share', invoice)}
                            className="text-purple-600 hover:text-purple-800 p-1"
                            title="Share Invoice"
                          >
                            <FontAwesomeIcon icon={faShare} className="w-3 lg:w-4 h-3 lg:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faFileInvoice} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first invoice</p>
              <Link
                to="/app/invoices/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#4D7969' }}
              >
                <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                Create Invoice
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Invoice {selectedInvoice.number}
                </h3>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                    <p className="text-gray-900">{selectedInvoice.client_name}</p>
                    <p className="text-sm text-gray-600">{selectedInvoice.client_email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge(getInvoiceStatus(selectedInvoice)).cls}`}>
                      {statusBadge(getInvoiceStatus(selectedInvoice)).text}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                    <p className="text-gray-900">{formatDate(selectedInvoice.issue_date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <p className="text-gray-900">{formatDate(selectedInvoice.due_date)}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <label className="block text-gray-600 mb-1">Subtotal</label>
                      <p className="font-medium">{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</p>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Tax</label>
                      <p className="font-medium">{formatCurrency(selectedInvoice.tax_total, selectedInvoice.currency)}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-gray-600 mb-1">Total</label>
                      <p className="font-bold text-lg">{formatCurrency(selectedInvoice.total, selectedInvoice.currency)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleInvoiceAction('download', selectedInvoice)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => handleInvoiceAction('share', selectedInvoice)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={faShare} className="w-4 h-4" />
                    Share
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
