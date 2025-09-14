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
  faReceipt,
  faExclamationTriangle,
  faCheckCircle,
  faClock,
  faChartLine,
  faArrowUp,
  faTimes,
  faCheck,
  faBan,
  faEdit,
  faTrash,
  faSpinner,
  faBell,
  faEnvelope,
  faFileExport,
  faFilePdf
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { receiptSharing } from '../lib/receiptPDF';

export default function Receipts() {
  const navigate = useNavigate();
  const { tenant } = useOutletContext() || {};
  
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [error, setError] = useState("");
  const [selectedReceipts, setSelectedReceipts] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState("");
  const [approvalComment, setApprovalComment] = useState("");

  // Load receipts data
  useEffect(() => {
    if (!tenant?.slug) return;
    
    const loadReceipts = async () => {
      try {
        setLoading(true);
        setError("");

        // FOR DEVELOPMENT: Use mock data if database is not available
        if (process.env.NODE_ENV === 'development') {
          console.log('Using mock data for development');
          const mockReceipts = [
            {
              id: 1,
              number: "RCP-2024-001",
              created_at: "2024-09-01T10:00:00Z",
              date: "2024-09-01",
              vendor_name: "Office Depot",
              client_name: "John Doe",
              client_email: "john@example.com",
              category: "office_supplies",
              description: "Office supplies and stationery",
              amount: 150.00,
              tax_amount: 15.00,
              total: 165.00,
              currency: "KES",
              payment_method: "Mobile Money",
              status: "approved",
              receipt_image_url: null,
              notes: "Purchased for office setup"
            },
            {
              id: 2,
              number: "RCP-2024-002",
              created_at: "2024-09-02T14:30:00Z",
              date: "2024-09-02",
              vendor_name: "Café Coffee Day",
              client_name: "Jane Smith",
              client_email: "jane@example.com",
              category: "meals",
              description: "Business lunch meeting",
              amount: 2500.00,
              tax_amount: 250.00,
              total: 2750.00,
              currency: "KES",
              payment_method: "Card",
              status: "pending",
              receipt_image_url: null,
              notes: "Client meeting expenses"
            }
          ];

          setReceipts(mockReceipts);
          setFilteredReceipts(mockReceipts);
          setLoading(false);
          return;
        }
        
        // Try API endpoint first
        try {
          const response = await fetch(`/.netlify/functions/list-receipts?tenant=${tenant.slug}&limit=50`);
          
          if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const data = await response.json();
              if (!data.error) {
                const receiptsData = data.receipts || [];
                setReceipts(receiptsData);
                setFilteredReceipts(receiptsData);
                if (data.analytics) {
                  window._receiptsAnalytics = data.analytics;
                }
                return; // Success, exit early
              }
            }
          }
        } catch (apiError) {
          console.log("API endpoint not available, trying direct Supabase access");
        }
        
        // Fallback to direct Supabase access
        const { default: supabase } = await import('../lib/supabase');
        
        // First get tenant ID from slug
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('id')
          .eq('slug', tenant.slug)
          .single();
          
        if (tenantError) {
          throw new Error(`Could not find tenant: ${tenantError.message}`);
        }
        
        // Fetch receipts from Supabase with client information
        const { data: receiptsData, error: receiptsError } = await supabase
          .from('receipts')
          .select(`
            *,
            client:clients(name, email)
          `)
          .eq('tenant_id', tenantData.id)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (receiptsError) {
          throw new Error(`Failed to fetch receipts: ${receiptsError.message}`);
        }
        
        // Transform data to match expected format
        const formattedReceipts = (receiptsData || []).map(receipt => ({
          id: receipt.id,
          number: receipt.number,
          created_at: receipt.created_at,
          date: receipt.date,
          vendor_name: receipt.vendor_name,
          client_name: receipt.client?.name || null,
          client_email: receipt.client?.email || null,
          category: receipt.category,
          description: receipt.description,
          amount: parseFloat(receipt.amount || 0),
          tax_amount: parseFloat(receipt.tax_amount || 0),
          total: parseFloat(receipt.total || receipt.amount || 0),
          currency: receipt.currency || 'EUR',
          payment_method: receipt.payment_method || 'Cash',
          status: receipt.status || 'pending',
          receipt_image_url: receipt.receipt_image_url,
          notes: receipt.notes
        }));
        
        setReceipts(formattedReceipts);
        setFilteredReceipts(formattedReceipts);
        
        console.log(`Loaded ${formattedReceipts.length} receipts from Supabase`);
        
      } catch (err) {
        console.warn("Failed to load receipts from database, using demo data:", err.message);
        setError(`Database connection failed: ${err.message}`);
        
        // Final fallback to mock data
        const mockReceipts = [
          {
            id: 1,
            number: "RCP-2024-001",
            created_at: "2024-09-01T10:00:00Z",
            date: "2024-09-01",
            vendor_name: "Office Depot",
            category: "office_supplies",
            description: "Office supplies and stationery",
            amount: 125.50,
            tax_amount: 20.08,
            total: 145.58,
            currency: "EUR",
            payment_method: "Cash",
            status: "approved"
          },
          {
            id: 2,
            number: "RCP-2024-002",
            created_at: "2024-09-05T14:30:00Z",
            date: "2024-09-05",
            vendor_name: "Uber",
            category: "travel",
            description: "Business trip to client meeting",
            amount: 4500,
            tax_amount: 720,
            total: 5220,
            currency: "KES",
            payment_method: "Mobile Money",
            status: "pending"
          },
          {
            id: 3,
            number: "RCP-2024-003",
            created_at: "2024-09-10T09:15:00Z",
            date: "2024-09-10",
            vendor_name: "Restaurant Milano",
            category: "meals",
            description: "Client lunch meeting",
            amount: 8500,
            tax_amount: 1360,
            total: 9860,
            currency: "KES",
            payment_method: "Credit Card",
            status: "approved"
          },
          {
            id: 4,
            number: "RCP-2024-004",
            created_at: "2024-09-12T16:45:00Z",
            date: "2024-09-12",
            vendor_name: "Tech Solutions",
            category: "equipment",
            description: "New laptop for development",
            amount: 120000,
            tax_amount: 19200,
            total: 139200,
            currency: "KES",
            payment_method: "Bank Transfer",
            status: "pending"
          },
          {
            id: 5,
            number: "RCP-2024-005",
            created_at: "2024-09-14T11:20:00Z",
            date: "2024-09-14",
            vendor_name: "Electric Company",
            category: "utilities",
            description: "Monthly electricity bill",
            amount: 15000,
            tax_amount: 2400,
            total: 17400,
            currency: "KES",
            payment_method: "Mobile Money",
            status: "approved"
          }
        ];
        
        setReceipts(mockReceipts);
        setFilteredReceipts(mockReceipts);
      } finally {
        setLoading(false);
      }
    };

    loadReceipts();
  }, [tenant?.slug]);

  // Filter receipts based on search and category
  useEffect(() => {
    let filtered = receipts;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(receipt => 
        receipt.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(receipt => receipt.category === categoryFilter);
    }
    
    setFilteredReceipts(filtered);
  }, [receipts, searchTerm, categoryFilter]);

  const getReceiptStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return { text: "Approved", cls: "bg-green-100 text-green-800" };
      case "pending":
        return { text: "Pending", cls: "bg-yellow-100 text-yellow-800" };
      case "rejected":
        return { text: "Rejected", cls: "bg-red-100 text-red-800" };
      default:
        return { text: "Unknown", cls: "bg-gray-100 text-gray-800" };
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      office_supplies: "Office Supplies",
      travel: "Travel",
      meals: "Meals & Entertainment",
      equipment: "Equipment",
      utilities: "Utilities"
    };
    return labels[category] || category;
  };

  // Calculate analytics
  const analytics = {
    totalReceipts: receipts.length,
    totalAmount: receipts.reduce((sum, receipt) => sum + (receipt.total || receipt.amount), 0),
    approvedAmount: receipts.filter(receipt => receipt.status === "approved").reduce((sum, receipt) => sum + (receipt.total || receipt.amount), 0),
    pendingAmount: receipts.filter(receipt => receipt.status === "pending").reduce((sum, receipt) => sum + (receipt.total || receipt.amount), 0),
    approvedCount: receipts.filter(receipt => receipt.status === "approved").length,
    pendingCount: receipts.filter(receipt => receipt.status === "pending").length,
    rejectedCount: receipts.filter(receipt => receipt.status === "rejected").length
  };

  const formatCurrency = (amount, currency = "EUR") => {
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-EU", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const handleReceiptAction = async (action, receipt) => {
    try {
      switch (action) {
        case 'view':
          setSelectedReceipt(receipt);
          break;
        case 'view-pdf':
          await viewReceiptPDF(receipt);
          break;
        case 'download':
          await downloadReceipt(receipt);
          break;
        case 'share':
          await shareReceipt(receipt);
          break;
        case 'edit':
          navigate(`/app/receipts/${receipt.id}/edit`);
          break;
        case 'approve':
          await approveReceipt(receipt.id);
          break;
        case 'reject':
          setApprovalAction('reject');
          setSelectedReceipt(receipt);
          setShowApprovalModal(true);
          break;
        case 'delete':
          if (confirm('Are you sure you want to delete this receipt?')) {
            await deleteReceipt(receipt.id);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      setError(`Failed to ${action} receipt: ${error.message}`);
    }
  };

  const approveReceipt = async (receiptId) => {
    try {
      const response = await fetch('/.netlify/functions/update-receipt-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: tenant?.slug,
          receiptId: receiptId,
          status: 'approved',
          comment: 'Receipt approved'
        })
      });

      if (!response.ok) throw new Error('Failed to approve receipt');
      
      // Refresh receipts list
      window.location.reload();
    } catch (err) {
      setError(`Failed to approve receipt: ${err.message}`);
    }
  };

  const rejectReceipt = async () => {
    try {
      const response = await fetch('/.netlify/functions/update-receipt-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: tenant?.slug,
          receiptId: selectedReceipt.id,
          status: 'rejected',
          comment: approvalComment || 'Receipt rejected'
        })
      });

      if (!response.ok) throw new Error('Failed to reject receipt');
      
      setShowApprovalModal(false);
      setApprovalComment("");
      // Refresh receipts list
      window.location.reload();
    } catch (err) {
      setError(`Failed to reject receipt: ${err.message}`);
    }
  };

  const downloadReceipt = async (receipt) => {
    try {
      // Get tenant and client data for PDF generation
      const tenantData = {
        business_name: tenant?.business_name || 'Your Business',
        owner_email: tenant?.owner_email,
        phone: tenant?.phone || tenant?.business_phone,
        address: tenant?.business_address,
        currency: tenant?.currency || 'EUR'
      };

      // Get client data if available
      let clientData = null;
      if (receipt.client_name) {
        clientData = {
          name: receipt.client_name,
          email: receipt.client_email,
          phone: receipt.client_phone
        };
      }

      // Generate and download PDF
      const result = await receiptSharing.generateAndDownload(receipt, tenantData, clientData);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      console.log('Receipt PDF downloaded:', result.filename);
      
    } catch (err) {
      console.error('Download error:', err);
      setError(`Failed to download receipt: ${err.message}`);
    }
  };

  const viewReceiptPDF = async (receipt) => {
    try {
      // Get tenant and client data for PDF generation
      const tenantData = {
        business_name: tenant?.business_name || 'Your Business',
        owner_email: tenant?.owner_email,
        phone: tenant?.phone || tenant?.business_phone,
        address: tenant?.business_address,
        currency: tenant?.currency || 'EUR'
      };

      // Get client data if available
      let clientData = null;
      if (receipt.client_name) {
        clientData = {
          name: receipt.client_name,
          email: receipt.client_email,
          phone: receipt.client_phone
        };
      }

      // Generate and view PDF
      const result = await receiptSharing.generateAndView(receipt, tenantData, clientData);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      console.log('Receipt PDF opened for viewing');
      
    } catch (err) {
      console.error('View error:', err);
      setError(`Failed to view receipt: ${err.message}`);
    }
  };

  const shareReceipt = async (receipt) => {
    try {
      // Get tenant and client data for PDF generation
      const tenantData = {
        business_name: tenant?.business_name || 'Your Business',
        owner_email: tenant?.owner_email,
        phone: tenant?.phone || tenant?.business_phone,
        address: tenant?.business_address,
        currency: tenant?.currency || 'EUR'
      };

      // Get client data if available
      let clientData = null;
      if (receipt.client_name) {
        clientData = {
          name: receipt.client_name,
          email: receipt.client_email,
          phone: receipt.client_phone
        };
      }

      // Generate PDF and share via WhatsApp
      const result = await receiptSharing.generateAndShare(receipt, tenantData, clientData);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      if (result.method === 'native') {
        console.log('Receipt shared via native sharing');
      } else if (result.method === 'whatsapp') {
        console.log('Receipt shared via WhatsApp');
      }
      
    } catch (err) {
      console.error('Share error:', err);
      setError(`Failed to share receipt: ${err.message}`);
    }
  };

  const deleteReceipt = async (receiptId) => {
    try {
      const response = await fetch('/.netlify/functions/delete-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: tenant?.slug,
          receiptId: receiptId
        })
      });

      if (!response.ok) throw new Error('Failed to delete receipt');
      
      // Refresh receipts list
      window.location.reload();
    } catch (err) {
      setError(`Failed to delete receipt: ${err.message}`);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedReceipts.size === 0) {
      setError("Please select receipts first");
      return;
    }

    setBulkActionLoading(true);
    try {
      const receiptIds = Array.from(selectedReceipts);
      
      const response = await fetch('/.netlify/functions/bulk-receipt-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: tenant?.slug,
          receiptIds: receiptIds,
          action: action
        })
      });

      if (!response.ok) throw new Error(`Failed to ${action} receipts`);
      
      setSelectedReceipts(new Set());
      // Refresh receipts list
      window.location.reload();
    } catch (err) {
      setError(`Failed to ${action} receipts: ${err.message}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleReceiptSelection = (receiptId) => {
    const newSelection = new Set(selectedReceipts);
    if (newSelection.has(receiptId)) {
      newSelection.delete(receiptId);
    } else {
      newSelection.add(receiptId);
    }
    setSelectedReceipts(newSelection);
  };

  const selectAllReceipts = () => {
    if (selectedReceipts.size === filteredReceipts.length) {
      setSelectedReceipts(new Set());
    } else {
      setSelectedReceipts(new Set(filteredReceipts.map(r => r.id)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-gray-500">Loading receipts...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-full lg:w-80 bg-white shadow-sm border-r border-gray-200 flex flex-col lg:h-screen">
        {/* Sidebar Header */}
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Receipts</h2>
            <Link
              to="/app/receipts/new"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#4D7969' }}
            >
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
              <span className="hidden sm:inline">New Receipt</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>
          
          {/* Search */}
          <div className="relative mb-4">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search receipts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm"
              style={{ focusRingColor: '#4D7969' }}
            />
          </div>
          
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm"
              style={{ focusRingColor: '#4D7969' }}
            >
              <option value="all">All Categories</option>
              <option value="office_supplies">Office Supplies</option>
              <option value="travel">Travel</option>
              <option value="meals">Meals & Entertainment</option>
              <option value="equipment">Equipment</option>
              <option value="utilities">Utilities</option>
            </select>
          </div>
        </div>

        {/* Receipt List */}
        <div className="flex-1 overflow-y-auto max-h-80 lg:max-h-none">
        {error && (
          <div className="m-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
            <div className="font-medium mb-1">
              {error.includes('Database connection failed') ? 'Database Connection' : 'Development Mode'}
            </div>
            <div className="text-xs">{error}</div>
            {!error.includes('Database connection failed') && (
              <div className="text-xs mt-2 opacity-75">Using demo data. Start with 'npm run dev' to enable API functions.</div>
            )}
          </div>
        )}          {filteredReceipts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {searchTerm || categoryFilter !== "all" ? "No receipts match your filters" : "No receipts yet"}
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {filteredReceipts.slice(0, 10).map((receipt) => {
                const badge = getReceiptStatusBadge(receipt.status);
                
                return (
                  <div
                    key={receipt.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => setSelectedReceipt(receipt)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 truncate">{receipt.number}</h3>
                        <p className="text-sm text-gray-600 truncate">
                          {receipt.vendor_name}
                          {receipt.client_name && receipt.client_name !== receipt.vendor_name && (
                            <span className="text-blue-600 ml-1">({receipt.client_name})</span>
                          )}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ml-2 ${badge.cls}`}>
                        {badge.text}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                      <span>{formatDate(receipt.date)}</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(receipt.total || receipt.amount, receipt.currency)}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-3 truncate">
                      {getCategoryLabel(receipt.category)}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReceiptAction('view', receipt);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        <FontAwesomeIcon icon={faEye} className="w-3 h-3 mr-1" />
                        View
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReceiptAction('view-pdf', receipt);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        <FontAwesomeIcon icon={faFilePdf} className="w-3 h-3 mr-1" />
                        PDF
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReceiptAction('download', receipt);
                        }}
                        className="text-xs text-green-600 hover:text-green-800"
                      >
                        <FontAwesomeIcon icon={faDownload} className="w-3 h-3 mr-1" />
                        Download
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReceiptAction('share', receipt);
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-800"
                      >
                        <FontAwesomeIcon icon={faWhatsapp} className="w-3 h-3 mr-1" />
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
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto min-h-0">
        {/* Bulk Actions Toolbar */}
        {selectedReceipts.size > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-sm text-blue-800">
                <span className="font-medium">{selectedReceipts.size}</span> receipt(s) selected
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleBulkAction('approve')}
                  disabled={bulkActionLoading}
                  className="flex-1 sm:flex-none px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faCheck} className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Approve</span>
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  disabled={bulkActionLoading}
                  className="flex-1 sm:flex-none px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faBan} className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Reject</span>
                </button>
                <button
                  onClick={() => handleBulkAction('export')}
                  disabled={bulkActionLoading}
                  className="flex-1 sm:flex-none px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faFileExport} className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={() => setSelectedReceipts(new Set())}
                  className="flex-1 sm:flex-none px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
          {/* Total Expenses Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.totalAmount)}
                </p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faDollarSign} className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faArrowUp} className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600 font-medium">+8.3% from last month</span>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              {analytics.totalReceipts} total receipts
            </div>
          </div>

          {/* Pending Approvals Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
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
                {analytics.pendingCount} pending
              </span>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              {analytics.rejectedCount} rejected
            </div>
          </div>

          {/* Approval Rate Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">
                  {analytics.totalReceipts > 0 ? Math.round((analytics.approvedCount / analytics.totalReceipts) * 100) : 0}%
                </p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">
                {formatCurrency(analytics.approvedAmount)} approved
              </span>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Of {formatCurrency(analytics.totalAmount)} total
            </div>
          </div>
        </div>

        {/* Receipt Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Receipt Overview</h3>
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
              <div className="text-xl lg:text-2xl font-bold text-gray-900">{analytics.totalReceipts}</div>
              <div className="text-xs lg:text-sm text-gray-600">Total Receipts</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-xl lg:text-2xl font-bold text-green-600">{analytics.approvedCount}</div>
              <div className="text-xs lg:text-sm text-gray-600">Approved</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-xl lg:text-2xl font-bold text-orange-600">{analytics.pendingCount}</div>
              <div className="text-xs lg:text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-xl lg:text-2xl font-bold text-red-600">{analytics.rejectedCount}</div>
              <div className="text-xs lg:text-sm text-gray-600">Rejected</div>
            </div>
          </div>

          {/* Recent Receipts Table */}
          <div className="overflow-x-auto -mx-4 lg:mx-0">
            <div className="min-w-full inline-block align-middle px-4 lg:px-0">
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left pb-3 text-xs lg:text-sm font-medium text-gray-600 w-12">
                        <input
                          type="checkbox"
                          checked={selectedReceipts.size === filteredReceipts.length && filteredReceipts.length > 0}
                          onChange={selectAllReceipts}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="text-left pb-3 text-xs lg:text-sm font-medium text-gray-600 min-w-[120px]">Receipt</th>
                      <th className="text-left pb-3 text-xs lg:text-sm font-medium text-gray-600 min-w-[150px]">Vendor</th>
                      <th className="text-left pb-3 text-xs lg:text-sm font-medium text-gray-600 min-w-[100px]">Date</th>
                      <th className="text-left pb-3 text-xs lg:text-sm font-medium text-gray-600 min-w-[100px]">Category</th>
                      <th className="text-left pb-3 text-xs lg:text-sm font-medium text-gray-600 min-w-[100px]">Amount</th>
                      <th className="text-left pb-3 text-xs lg:text-sm font-medium text-gray-600 min-w-[80px]">Status</th>
                      <th className="text-left pb-3 text-xs lg:text-sm font-medium text-gray-600 min-w-[160px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceipts.slice(0, 10).map((receipt) => {
                      const badge = getReceiptStatusBadge(receipt.status);
                      const isSelected = selectedReceipts.has(receipt.id);
                      
                      return (
                        <tr key={receipt.id} className={`border-b border-gray-100 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                          <td className="py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleReceiptSelection(receipt.id)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="py-3 text-xs lg:text-sm font-medium text-gray-900">{receipt.number}</td>
                          <td className="py-3 text-xs lg:text-sm text-gray-600">
                            {receipt.vendor_name}
                            {receipt.client_name && receipt.client_name !== receipt.vendor_name && (
                              <div className="text-blue-600 text-xs">Client: {receipt.client_name}</div>
                            )}
                          </td>
                          <td className="py-3 text-xs lg:text-sm text-gray-600">{formatDate(receipt.date)}</td>
                          <td className="py-3 text-xs lg:text-sm text-gray-600">{getCategoryLabel(receipt.category)}</td>
                          <td className="py-3 text-xs lg:text-sm font-medium text-gray-900">
                            {formatCurrency(receipt.total || receipt.amount, receipt.currency)}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.cls}`}>
                              {badge.text}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleReceiptAction('view', receipt)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="View Receipt Details"
                              >
                                <FontAwesomeIcon icon={faEye} className="w-3 lg:w-4 h-3 lg:h-4" />
                              </button>
                              
                              <button 
                                onClick={() => handleReceiptAction('view-pdf', receipt)}
                                className="text-indigo-600 hover:text-indigo-800 p-1"
                                title="View PDF Receipt"
                              >
                                <FontAwesomeIcon icon={faFilePdf} className="w-3 lg:w-4 h-3 lg:h-4" />
                              </button>
                              
                              {receipt.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => handleReceiptAction('approve', receipt)}
                                    className="text-green-600 hover:text-green-800 p-1"
                                    title="Approve Receipt"
                                  >
                                    <FontAwesomeIcon icon={faCheck} className="w-3 lg:w-4 h-3 lg:h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleReceiptAction('reject', receipt)}
                                    className="text-red-600 hover:text-red-800 p-1"
                                    title="Reject Receipt"
                                  >
                                    <FontAwesomeIcon icon={faBan} className="w-3 lg:w-4 h-3 lg:h-4" />
                                  </button>
                                </>
                              )}
                              
                              <button 
                                onClick={() => handleReceiptAction('download', receipt)}
                                className="text-green-600 hover:text-green-800 p-1"
                                title="Download PDF"
                              >
                                <FontAwesomeIcon icon={faDownload} className="w-3 lg:w-4 h-3 lg:h-4" />
                              </button>
                              <button 
                                onClick={() => handleReceiptAction('share', receipt)}
                                className="text-emerald-600 hover:text-emerald-800 p-1"
                                title="Share via WhatsApp"
                              >
                                <FontAwesomeIcon icon={faWhatsapp} className="w-3 lg:w-4 h-3 lg:h-4" />
                              </button>
                              <button 
                                onClick={() => handleReceiptAction('edit', receipt)}
                                className="text-orange-600 hover:text-orange-800 p-1"
                                title="Edit Receipt"
                              >
                                <FontAwesomeIcon icon={faEdit} className="w-3 lg:w-4 h-3 lg:h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-4">
                {filteredReceipts.slice(0, 10).map((receipt) => {
                  const badge = getReceiptStatusBadge(receipt.status);
                  const isSelected = selectedReceipts.has(receipt.id);
                  
                  return (
                    <div key={receipt.id} className={`bg-white rounded-lg border p-4 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleReceiptSelection(receipt.id)}
                            className="rounded border-gray-300 mt-1"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-gray-900 text-sm">{receipt.number}</h3>
                            <p className="text-sm text-gray-600 truncate">{receipt.vendor_name}</p>
                            {receipt.client_name && receipt.client_name !== receipt.vendor_name && (
                              <p className="text-blue-600 text-xs">Client: {receipt.client_name}</p>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${badge.cls}`}>
                          {badge.text}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <p className="font-medium">{formatDate(receipt.date)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <p className="font-medium">{formatCurrency(receipt.total || receipt.amount, receipt.currency)}</p>
                        </div>
                      </div>

                      <div className="text-sm mb-3">
                        <span className="text-gray-500">Category:</span>
                        <span className="ml-2">{getCategoryLabel(receipt.category)}</span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleReceiptAction('view', receipt)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="View Receipt Details"
                          >
                            <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleReceiptAction('view-pdf', receipt)}
                            className="text-indigo-600 hover:text-indigo-800 p-1"
                            title="View PDF Receipt"
                          >
                            <FontAwesomeIcon icon={faFilePdf} className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleReceiptAction('download', receipt)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Download PDF"
                          >
                            <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleReceiptAction('share', receipt)}
                            className="text-emerald-600 hover:text-emerald-800 p-1"
                            title="Share via WhatsApp"
                          >
                            <FontAwesomeIcon icon={faWhatsapp} className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {receipt.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleReceiptAction('approve', receipt)}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Approve Receipt"
                            >
                              <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleReceiptAction('reject', receipt)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Reject Receipt"
                            >
                              <FontAwesomeIcon icon={faBan} className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {filteredReceipts.length === 0 && (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faReceipt} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No receipts found</h3>
              <p className="text-gray-600 mb-4">Get started by uploading your first receipt</p>
              <Link
                to="/app/receipts/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#4D7969' }}
              >
                <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                Upload Receipt
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Detail Modal */}
      {selectedReceipt && !showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900">
                  Receipt {selectedReceipt.number}
                </h3>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
                </button>
              </div>

              {/* Receipt Image */}
              {selectedReceipt.receipt_image_url && (
                <div className="mb-6">
                  <img
                    src={selectedReceipt.receipt_image_url}
                    alt="Receipt"
                    className="w-full max-h-48 lg:max-h-64 object-contain bg-gray-50 rounded-lg border"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                    <p className="text-gray-900">{selectedReceipt.vendor_name}</p>
                    {selectedReceipt.client_name && selectedReceipt.client_name !== selectedReceipt.vendor_name && (
                      <p className="text-blue-600 text-sm">Client: {selectedReceipt.client_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getReceiptStatusBadge(selectedReceipt.status).cls}`}>
                      {getReceiptStatusBadge(selectedReceipt.status).text}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <p className="text-gray-900">{formatDate(selectedReceipt.date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <p className="text-gray-900">{getCategoryLabel(selectedReceipt.category)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <p className="text-gray-900">{selectedReceipt.payment_method || 'Cash'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <p className="text-gray-900">{selectedReceipt.currency || 'EUR'}</p>
                  </div>
                </div>

                {selectedReceipt.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-gray-900 break-words">{selectedReceipt.description}</p>
                  </div>
                )}

                {selectedReceipt.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <p className="text-gray-900 break-words">{selectedReceipt.notes}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <label className="block text-gray-600 mb-1">Amount</label>
                      <p className="font-medium">{formatCurrency(selectedReceipt.amount, selectedReceipt.currency)}</p>
                    </div>
                    {selectedReceipt.tax_amount && (
                      <div>
                        <label className="block text-gray-600 mb-1">Tax</label>
                        <p className="font-medium">{formatCurrency(selectedReceipt.tax_amount, selectedReceipt.currency)}</p>
                      </div>
                    )}
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-gray-600 mb-1">Total</label>
                      <p className="font-bold text-lg">{formatCurrency(selectedReceipt.total || selectedReceipt.amount, selectedReceipt.currency)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t">
                  {selectedReceipt.status === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => handleReceiptAction('approve', selectedReceipt)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReceiptAction('reject', selectedReceipt)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <FontAwesomeIcon icon={faBan} className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleReceiptAction('view-pdf', selectedReceipt)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <FontAwesomeIcon icon={faFilePdf} className="w-4 h-4" />
                      View PDF
                    </button>
                    <button
                      onClick={() => handleReceiptAction('download', selectedReceipt)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                      Download PDF
                    </button>
                    <button
                      onClick={() => handleReceiptAction('share', selectedReceipt)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <FontAwesomeIcon icon={faWhatsapp} className="w-4 h-4" />
                      Share WhatsApp
                    </button>
                    <button
                      onClick={() => setSelectedReceipt(null)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {approvalAction === 'reject' ? 'Reject' : 'Approve'} Receipt
                </h3>
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setApprovalComment("");
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  {approvalAction === 'reject' ? 'Reject' : 'Approve'} receipt {selectedReceipt?.number}?
                </p>
                <div className="text-sm text-gray-500 break-words">
                  Vendor: {selectedReceipt?.vendor_name}<br/>
                  Amount: {formatCurrency(selectedReceipt?.total || selectedReceipt?.amount, selectedReceipt?.currency)}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment {approvalAction === 'reject' ? '(Required)' : '(Optional)'}
                </label>
                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm resize-none"
                  style={{ focusRingColor: '#4D7969' }}
                  placeholder={approvalAction === 'reject' ? 'Please provide a reason for rejection...' : 'Optional approval notes...'}
                  required={approvalAction === 'reject'}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setApprovalComment("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={approvalAction === 'reject' ? rejectReceipt : () => approveReceipt(selectedReceipt.id)}
                  disabled={approvalAction === 'reject' && !approvalComment.trim()}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                    approvalAction === 'reject' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <FontAwesomeIcon icon={approvalAction === 'reject' ? faBan : faCheck} className="w-4 h-4 mr-2" />
                  {approvalAction === 'reject' ? 'Reject' : 'Approve'} Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
