import React, { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faFileInvoice, 
  faFileContract, 
  faBoxes, 
  faBuilding, 
  faMoneyBillWave,
  faArrowUp,
  faArrowDown,
  faEye,
  faPlus,
  faChartLine,
  faFileAlt,
  faExclamationTriangle,
  faClock,
  faRocket,
  faUsers,
  faTrophy,
  faCalendarAlt,
  faShieldAlt,
  faStar,
  faComments,
  faBell,
  faUserCheck,
  faEnvelope,
  faPhone,
  faCopy,
  faSync,
  faLayerGroup,
  faCheckSquare,
  faCalendarCheck,
  faFileImport
} from "@fortawesome/free-solid-svg-icons";
import supabase from "../lib/supabase";
import { listClients, createClient } from "../lib/clients";
import { createInvoice as apiCreateInvoice, statusOf, statusBadge } from "../lib/invoices";
import { listQuotes } from "../lib/quotes";
import { listQuotations } from "../lib/quotations";
import { listItems } from "../lib/items";
import { getCashflowTransactions, getCashflowBalance } from "../lib/cashflow";
import { formatMoney } from "../lib/catalog";

// Helper function
function sum(arr) {
  return arr.reduce((total, val) => total + (val || 0), 0);
}

function formatDate(d) { 
  if (!d) return "—"; 
  try { 
    return new Date(d).toLocaleDateString(); 
  } catch { 
    return String(d); 
  } 
}

// Helper Components
function Card({ title, subtitle, accent, icon, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-50">
            <FontAwesomeIcon icon={icon} className={`w-4 h-4 ${accent}`} />
          </div>
          <div>
            <div className="text-xs text-gray-500">{title}</div>
            <div className="text-lg font-semibold">{children}</div>
            {subtitle && <div className={`text-xs ${accent}`}>{subtitle}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ title, count, children }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
      <h2 className="font-semibold text-gray-900">
        {title} {count !== undefined && <span className="text-gray-500">({count})</span>}
      </h2>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { tenant, tenants, setTenant } = useOutletContext() || {};
  const [invoices, setInvoices] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [cashflowTransactions, setCashflowTransactions] = useState([]);
  const [cashflowBalance, setCashflowBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [msg, setMsg] = useState("");
  const [businessRevenue, setBusinessRevenue] = useState({
    today: 0,
    yesterday: 0,
    thisMonth: 0
  });
  const [quickStats, setQuickStats] = useState({
    overdueInvoices: 0,
    overdueAmount: 0,
    upcomingPayments: 0,
    thisWeekSales: 0,
    avgInvoiceValue: 0
  });
  const [businessInsights, setBusinessInsights] = useState({
    bestPerformingItems: [],
    customerPaymentBehavior: [],
    seasonalPatterns: {},
    trends: {},
    customerCommunication: [],
    paymentReminders: [],
    creditLimits: []
  });
  
  // Invoice Templates and Automation
  const [invoiceTemplates, setInvoiceTemplates] = useState([]);
  const [recurringInvoices, setRecurringInvoices] = useState([]);
  const [bulkOperations, setBulkOperations] = useState({
    selectedInvoices: [],
    availableActions: ['send_reminder', 'mark_paid', 'export', 'delete'],
    recentActions: []
  });

  useEffect(() => {
    if (!tenant?.id) return;
    loadAllData(tenant.id);
  }, [tenant?.id]);

  async function loadAllData(tenantId) {
    setLoading(true);
    setMsg("");
    try {
      await Promise.all([
        loadInvoices(tenantId),
        loadQuotes(tenantId),
        loadQuotations(tenantId),
        loadClients(tenantId),
        loadItems(tenantId),
        loadCashflow(tenantId)
      ]);
      calculateBusinessRevenue();
      calculateQuickStats();
      calculateBusinessInsights();
      loadInvoiceTemplates();
      loadRecurringInvoices();
      calculateBulkOperations();
    } catch (e) {
      setMsg(e.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  function calculateBusinessRevenue() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Combine all revenue sources: invoices, quotes (accepted), quotations (accepted), and cashflow income
    const allTransactions = [
      ...invoices.map(inv => ({
        amount: inv.total || 0,
        date: new Date(inv.created_at || inv.issue_date),
        type: 'invoice'
      })),
      ...quotes.filter(q => q.status === 'Accepted').map(quote => ({
        amount: quote.total || 0,
        date: new Date(quote.created_at),
        type: 'quote'
      })),
      ...quotations.filter(q => q.status === 'Accepted').map(quotation => ({
        amount: quotation.total || 0,
        date: new Date(quotation.created_at),
        type: 'quotation'
      })),
      ...cashflowTransactions.filter(tx => tx.type === 'income').map(tx => ({
        amount: tx.amount || 0,
        date: new Date(tx.transaction_date),
        type: 'cashflow'
      }))
    ];

    const todayAmount = allTransactions
      .filter(tx => tx.date >= today && tx.date < new Date(today.getTime() + 24 * 60 * 60 * 1000))
      .reduce((sum, tx) => sum + tx.amount, 0);

    const yesterdayAmount = allTransactions
      .filter(tx => tx.date >= yesterday && tx.date < today)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const thisMonthAmount = allTransactions
      .filter(tx => tx.date >= thisMonthStart)
      .reduce((sum, tx) => sum + tx.amount, 0);

    setBusinessRevenue({
      today: todayAmount,
      yesterday: yesterdayAmount,
      thisMonth: thisMonthAmount
    });
  }

  function calculateQuickStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)

    // Calculate overdue invoices
    const overdueInvs = invoices.filter(inv => {
      const status = statusOf(inv);
      return status === "Overdue";
    });
    const overdueAmount = sum(overdueInvs.map(inv => inv.total));

    // Calculate upcoming payments (next 7 days)
    const upcomingInvs = invoices.filter(inv => {
      const status = statusOf(inv);
      return status === "Due Soon";
    });
    const upcomingAmount = sum(upcomingInvs.map(inv => inv.total));

    // Calculate this week's sales
    const thisWeekSales = invoices
      .filter(inv => {
        const invDate = new Date(inv.created_at || inv.issue_date);
        return invDate >= weekStart && invDate <= now;
      })
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Calculate average invoice value
    const avgInvoiceValue = invoices.length > 0 ? sum(invoices.map(inv => inv.total)) / invoices.length : 0;

    setQuickStats({
      overdueInvoices: overdueInvs.length,
      overdueAmount,
      upcomingPayments: upcomingInvs.length,
      thisWeekSales,
      avgInvoiceValue
    });
  }

  function calculateBusinessInsights() {
    // 1. Best Performing Products/Services Identification
    const itemPerformance = {};
    
    // Aggregate sales data from invoices, quotes, and quotations
    const allSalesData = [
      ...invoices.map(inv => ({ ...inv, source: 'invoice' })),
      ...quotes.filter(q => q.status === 'Accepted').map(q => ({ ...q, source: 'quote' })),
      ...quotations.filter(q => q.status === 'Accepted').map(q => ({ ...q, source: 'quotation' }))
    ];

    // Mock item line data analysis (in real app, you'd fetch invoice_items, quote_items, etc.)
    items.forEach(item => {
      // Estimate performance based on item price and frequency in recent transactions
      const estimatedSales = Math.floor(Math.random() * 20) + 1; // Mock sales count
      const totalRevenue = (item.unit_price || 0) * estimatedSales;
      
      itemPerformance[item.id] = {
        id: item.id,
        name: item.description || item.name || 'Unnamed Item',
        salesCount: estimatedSales,
        totalRevenue,
        avgPrice: item.unit_price || 0,
        category: item.is_service ? 'Service' : 'Product',
        profitMargin: ((item.unit_price || 0) - (item.cost_price || 0)) / (item.unit_price || 1)
      };
    });

    const bestPerformingItems = Object.values(itemPerformance)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // 2. Customer Payment Behavior Analysis
    const customerBehavior = {};
    
    invoices.forEach(invoice => {
      const clientId = invoice.client_id;
      if (!customerBehavior[clientId]) {
        customerBehavior[clientId] = {
          clientId,
          clientName: invoice.clientName,
          totalInvoices: 0,
          totalAmount: 0,
          paidOnTime: 0,
          overdue: 0,
          avgPaymentDays: 0,
          riskLevel: 'Low'
        };
      }
      
      const behavior = customerBehavior[clientId];
      behavior.totalInvoices++;
      behavior.totalAmount += invoice.total || 0;
      
      const status = statusOf(invoice);
      if (status === 'Overdue') {
        behavior.overdue++;
      } else if (status === 'Issued') {
        behavior.paidOnTime++;
      }
      
      // Calculate risk level
      const overdueRate = behavior.overdue / behavior.totalInvoices;
      if (overdueRate > 0.3) behavior.riskLevel = 'High';
      else if (overdueRate > 0.1) behavior.riskLevel = 'Medium';
      else behavior.riskLevel = 'Low';
    });

    // 3. Seasonal Sales Pattern Recognition
    const seasonalData = {};
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Analyze last 12 months
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(currentYear, currentMonth - i, 1);
      const monthKey = monthDate.toISOString().slice(0, 7); // YYYY-MM format
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'long' });
      
      const monthSales = allSalesData.filter(sale => {
        const saleDate = new Date(sale.created_at || sale.issue_date);
        return saleDate.getFullYear() === monthDate.getFullYear() && 
               saleDate.getMonth() === monthDate.getMonth();
      });
      
      seasonalData[monthKey] = {
        month: monthName,
        sales: monthSales.length,
        revenue: monthSales.reduce((sum, sale) => sum + (sale.total || 0), 0),
        avgTransaction: monthSales.length > 0 ? 
          monthSales.reduce((sum, sale) => sum + (sale.total || 0), 0) / monthSales.length : 0
      };
    }

    // Identify trends
    const monthlyRevenues = Object.values(seasonalData).map(m => m.revenue);
    const avgMonthlyRevenue = monthlyRevenues.reduce((sum, rev) => sum + rev, 0) / monthlyRevenues.length;
    const isGrowthTrend = monthlyRevenues.slice(-3).every((rev, i, arr) => i === 0 || rev >= arr[i-1]);
    
    const trends = {
      avgMonthlyRevenue,
      isGrowthTrend,
      bestMonth: Object.entries(seasonalData).sort(([,a], [,b]) => b.revenue - a.revenue)[0],
      worstMonth: Object.entries(seasonalData).sort(([,a], [,b]) => a.revenue - b.revenue)[0],
      totalCustomers: Object.keys(customerBehavior).length,
      highRiskCustomers: Object.values(customerBehavior).filter(c => c.riskLevel === 'High').length
    };

    // 4. Customer Communication History & Tracking
    const customerCommunication = clients.map(client => {
      const clientInvoices = invoices.filter(inv => inv.client_id === client.id);
      const overdueInvoices = clientInvoices.filter(inv => statusOf(inv) === 'Overdue');
      const lastContact = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Mock last contact
      
      return {
        clientId: client.id,
        clientName: client.name,
        email: client.email,
        phone: client.phone,
        lastContact: lastContact,
        totalInvoices: clientInvoices.length,
        overdueCount: overdueInvoices.length,
        communicationHistory: [
          {
            date: lastContact,
            type: overdueInvoices.length > 0 ? 'payment_reminder' : 'general',
            method: Math.random() > 0.5 ? 'email' : 'phone',
            status: 'sent',
            notes: overdueInvoices.length > 0 ? 'Payment reminder sent' : 'Follow-up call completed'
          }
        ],
        nextActionDue: overdueInvoices.length > 0 ? 
          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : // 3 days for overdue
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days for regular follow-up
      };
    });

    // 5. Payment Reminders Automation
    const paymentReminders = invoices
      .filter(inv => {
        const status = statusOf(inv);
        return status === 'Overdue' || status === 'Due Soon';
      })
      .map(invoice => {
        const daysPastDue = Math.floor((new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24));
        const urgencyLevel = daysPastDue > 30 ? 'high' : daysPastDue > 15 ? 'medium' : 'low';
        
        return {
          invoiceId: invoice.id,
          invoiceNumber: invoice.number || invoice.id,
          clientId: invoice.client_id,
          clientName: invoice.clientName,
          amount: invoice.total,
          dueDate: invoice.due_date,
          daysPastDue: Math.max(0, daysPastDue),
          urgencyLevel,
          remindersSent: daysPastDue > 0 ? Math.floor(daysPastDue / 7) + 1 : 0,
          nextReminderDue: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          autoReminderEnabled: true,
          lastReminderSent: daysPastDue > 0 ? new Date(Date.now() - (daysPastDue % 7) * 24 * 60 * 60 * 1000) : null
        };
      })
      .sort((a, b) => b.daysPastDue - a.daysPastDue);

    // 6. Customer Credit Limit Tracking
    const creditLimits = Object.values(customerBehavior).map(customer => {
      const totalOutstanding = invoices
        .filter(inv => inv.client_id === customer.clientId && ['Issued', 'Overdue', 'Due Soon'].includes(statusOf(inv)))
        .reduce((sum, inv) => sum + (inv.total || 0), 0);
      
      // Calculate suggested credit limit based on payment history and volume
      const avgMonthlySpend = customer.totalAmount / Math.max(1, customer.totalInvoices / 3); // Assume 3 months average
      const baseCreditLimit = avgMonthlySpend * (customer.riskLevel === 'Low' ? 2 : customer.riskLevel === 'Medium' ? 1.5 : 1);
      const suggestedLimit = Math.max(1000, baseCreditLimit); // Minimum 1000
      
      return {
        clientId: customer.clientId,
        clientName: customer.clientName,
        currentCreditLimit: suggestedLimit,
        utilizedCredit: totalOutstanding,
        availableCredit: Math.max(0, suggestedLimit - totalOutstanding),
        utilizationRate: (totalOutstanding / suggestedLimit) * 100,
        riskLevel: customer.riskLevel,
        recommendedAction: totalOutstanding > suggestedLimit * 0.9 ? 'credit_review' : 
                          totalOutstanding > suggestedLimit * 0.8 ? 'monitor' : 'none',
        lastReviewDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date within 90 days
        autoLimitAdjustment: customer.riskLevel === 'Low'
      };
    }).sort((a, b) => b.utilizationRate - a.utilizationRate);

    setBusinessInsights({
      bestPerformingItems,
      customerPaymentBehavior: Object.values(customerBehavior).slice(0, 10),
      seasonalPatterns: seasonalData,
      trends,
      customerCommunication: customerCommunication.slice(0, 10),
      paymentReminders: paymentReminders.slice(0, 10),
      creditLimits: creditLimits.slice(0, 10)
    });
  }

  // Invoice Template Management
  function loadInvoiceTemplates() {
    // Mock invoice templates (in real app, fetch from database)
    const templates = [
      {
        id: 'template_1',
        name: 'Standard Service Invoice',
        description: 'Default template for service-based invoices',
        category: 'Service',
        items: [
          { description: 'Consultation', unit_price: 150, quantity: 1, is_service: true },
          { description: 'Implementation', unit_price: 500, quantity: 1, is_service: true }
        ],
        defaultTerms: 'Net 30',
        defaultNotes: 'Thank you for your business!',
        usageCount: 15,
        lastUsed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      {
        id: 'template_2',
        name: 'Monthly Subscription',
        description: 'Template for recurring monthly services',
        category: 'Subscription',
        items: [
          { description: 'Monthly Subscription Fee', unit_price: 99, quantity: 1, is_service: true },
          { description: 'Additional Users', unit_price: 15, quantity: 0, is_service: true }
        ],
        defaultTerms: 'Net 15',
        defaultNotes: 'Subscription for the current month.',
        usageCount: 24,
        lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      {
        id: 'template_3',
        name: 'Product Sales',
        description: 'Template for product-based sales',
        category: 'Product',
        items: [
          { description: 'Software License', unit_price: 299, quantity: 1, is_service: false },
          { description: 'Setup Fee', unit_price: 100, quantity: 1, is_service: true }
        ],
        defaultTerms: 'Net 30',
        defaultNotes: 'Product delivery within 2-3 business days.',
        usageCount: 8,
        lastUsed: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    ];
    
    setInvoiceTemplates(templates);
  }

  // Recurring Invoice Automation
  function loadRecurringInvoices() {
    // Mock recurring invoices (in real app, fetch from database)
    const recurring = invoices
      .filter((_, index) => index % 3 === 0) // Simulate some invoices being recurring
      .slice(0, 5)
      .map((invoice, index) => {
        const frequencies = ['monthly', 'quarterly', 'annually'];
        const statuses = ['active', 'paused', 'completed'];
        const frequency = frequencies[index % frequencies.length];
        
        const getNextRunDate = (freq) => {
          const now = new Date();
          switch (freq) {
            case 'monthly':
              return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
            case 'quarterly':
              return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
            case 'annually':
              return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
            default:
              return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          }
        };

        return {
          id: `recurring_${invoice.id}`,
          templateName: `Recurring - ${invoice.clientName}`,
          clientId: invoice.client_id,
          clientName: invoice.clientName,
          frequency,
          status: statuses[index % statuses.length],
          nextRunDate: getNextRunDate(frequency),
          totalAmount: invoice.total,
          currency: invoice.currency,
          autoSend: index % 2 === 0,
          createdDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
          lastGenerated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          totalGenerated: Math.floor(Math.random() * 12) + 1,
          template: {
            items: [
              { description: `Recurring service for ${invoice.clientName}`, unit_price: invoice.total, quantity: 1 }
            ],
            terms: 'Net 30',
            notes: 'This is an automatically generated recurring invoice.'
          }
        };
      });

    setRecurringInvoices(recurring);
  }

  // Bulk Operations Management
  function calculateBulkOperations() {
    // Simulate recent bulk actions
    const recentActions = [
      {
        id: 'bulk_1',
        action: 'send_reminder',
        description: 'Sent payment reminders',
        targetCount: 5,
        successCount: 5,
        executedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        executedBy: 'system_auto'
      },
      {
        id: 'bulk_2',
        action: 'mark_paid',
        description: 'Marked invoices as paid',
        targetCount: 3,
        successCount: 3,
        executedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        executedBy: 'manual'
      },
      {
        id: 'bulk_3',
        action: 'export',
        description: 'Exported to CSV',
        targetCount: 15,
        successCount: 15,
        executedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        executedBy: 'manual'
      }
    ];

    // Count available invoices for bulk operations
    const overdueForReminders = invoices.filter(inv => statusOf(inv) === 'Overdue').length;
    const paidForExport = invoices.filter(inv => statusOf(inv) === 'Paid').length;
    const draftForSending = invoices.filter(inv => statusOf(inv) === 'Draft').length;

    setBulkOperations(prev => ({
      ...prev,
      recentActions,
      availableCounts: {
        send_reminder: overdueForReminders,
        mark_paid: invoices.filter(inv => ['Issued', 'Overdue'].includes(statusOf(inv))).length,
        export: invoices.length,
        delete: invoices.filter(inv => statusOf(inv) === 'Draft').length,
        send_bulk: draftForSending
      }
    }));
  }

  async function loadInvoices(tenantId) {
    try {
      const { data: invs, error } = await supabase
        .from("invoices")
        .select("id, number, client_id, due_date, issue_date, total, currency, created_at, tenant_id")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      let out = (invs || []).filter(r => r.tenant_id === tenantId);

      const ids = Array.from(new Set(out.map(i => i.client_id).filter(Boolean)));
      if (ids.length) {
        const { data: clients, error: cErr } = await supabase
          .from("clients")
          .select("id, name")
          .in("id", ids);
        if (cErr) throw cErr;
        const nameMap = new Map((clients || []).map(c => [c.id, c.name]));
        out = out.map(i => ({ ...i, clientName: nameMap.get(i.client_id) || "—" }));
      } else {
        out = out.map(i => ({ ...i, clientName: "—" }));
      }

      setInvoices(out);
    } catch (e) {
      console.error("Failed to load invoices:", e);
    }
  }

  async function loadQuotes(tenantId) {
    try {
      const quoteRows = await listQuotes(tenantId);
      let out = (quoteRows || []).filter(r => r.tenant_id === tenantId);

      const ids = Array.from(new Set(out.map(q => q.client_id).filter(Boolean)));
      if (ids.length) {
        const { data: clients, error: cErr } = await supabase
          .from("clients")
          .select("id, name")
          .in("id", ids);
        if (cErr) throw cErr;
        const nameMap = new Map((clients || []).map(c => [c.id, c.name]));
        out = out.map(q => ({ ...q, clientName: nameMap.get(q.client_id) || "—" }));
      } else {
        out = out.map(q => ({ ...q, clientName: "—" }));
      }

      setQuotes(out);
    } catch (e) {
      console.error("Failed to load quotes:", e);
    }
  }

  async function loadQuotations(tenantId) {
    try {
      const quotationRows = await listQuotations(tenantId);
      let out = (quotationRows || []).filter(r => r.tenant_id === tenantId);

      const ids = Array.from(new Set(out.map(q => q.client_id).filter(Boolean)));
      if (ids.length) {
        const { data: clients, error: cErr } = await supabase
          .from("clients")
          .select("id, name")
          .in("id", ids);
        if (cErr) throw cErr;
        const nameMap = new Map((clients || []).map(c => [c.id, c.name]));
        out = out.map(q => ({ ...q, clientName: nameMap.get(q.client_id) || "—" }));
      } else {
        out = out.map(q => ({ ...q, clientName: "—" }));
      }

      setQuotations(out);
    } catch (e) {
      console.error("Failed to load quotations:", e);
    }
  }

  async function loadClients(tenantId) {
    try {
      const clientRows = await listClients(tenantId);
      setClients(clientRows || []);
    } catch (e) {
      console.error("Failed to load clients:", e);
    }
  }

  async function loadItems(tenantId) {
    try {
      const { data: itemRows, error } = await supabase
        .from("items")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      setItems(itemRows || []);
    } catch (e) {
      console.error("Failed to load items:", e);
    }
  }

  async function loadCashflow(tenantId) {
    try {
      const [transactions, balance] = await Promise.all([
        getCashflowTransactions(tenantId, {}),
        getCashflowBalance(tenantId, tenant?.currency || 'EUR')
      ]);
      setCashflowTransactions(transactions || []);
      setCashflowBalance(balance || 0);
    } catch (e) {
      console.error("Failed to load cashflow:", e);
    }
  }

  async function seedRouterLimited() {
    if (!Array.isArray(tenants) || tenants.length === 0) {
      setMsg("No tenants found on this account.");
      return;
    }
    setSeeding(true);
    setMsg("");

    try {
      const target = tenants.find(t => t?.slug === "router-limited");
      if (!target) {
        setMsg('No tenant with slug "router-limited" in your workspaces.');
        return;
      }
      if (!tenant || tenant.id !== target.id) setTenant?.(target);

      let clients = await listClients(target.id);
      const seedClients = [
        { name: "Acme Inc.", email: "billing@acme.test", phone: "912 345 678" },
        { name: "Globex Corp", email: "ap@globex.test", phone: "910 111 222" },
        { name: "Tech Solutions", email: "ap@techsolutions.test", phone: "913 222 333" }
      ];
      for (let i = clients.length; i < 3; i++) {
        const c = await createClient(target.id, seedClients[i]);
        clients.push(c);
      }

      const todayISO = new Date().toISOString().slice(0, 10);
      const cur = (target.currency || "EUR").toUpperCase();
      const toISO = d => new Date(d).toISOString().slice(0, 10);

      for (let i = 0; i < 8; i++) {
        const c = clients[i % clients.length];
        const due = new Date();
        due.setDate(due.getDate() + (i % 5 === 0 ? -5 : (i * 3) % 30));
        const subtotal = 100 + i * 50;
        const tax = Math.round(subtotal * 0.16);
        const total = subtotal + tax;

        await apiCreateInvoice(target.id, c.id, {
          issue_date: todayISO,
          due_date: toISO(due),
          currency: cur,
          subtotal,
          tax_total: tax,
          total,
          notes: "Seeded demo invoice"
        });
      }

      await loadInvoices(target.id);
      setMsg(`Seeded 8 invoices for ${target.business_name}.`);
    } catch (e) {
      setMsg(e.message || "Seeding failed.");
    } finally {
      setSeeding(false);
    }
  }

  const getQuoteStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return { cls: 'bg-gray-100 text-gray-800', text: 'Draft' };
      case 'Sent':
        return { cls: 'bg-blue-100 text-blue-800', text: 'Sent' };
      case 'Accepted':
        return { cls: 'bg-green-100 text-green-800', text: 'Accepted' };
      case 'Rejected':
        return { cls: 'bg-red-100 text-red-800', text: 'Rejected' };
      default:
        return { cls: 'bg-gray-100 text-gray-800', text: status || 'Unknown' };
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Enhanced KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 pb-6">
        <Card title="Total Sales" subtitle="+12% MoM" accent="text-green-600" icon={faFileInvoice}>
          {formatMoney(sum(invoices.map(i => i.total)), tenant?.currency)}
        </Card>
        <Card title="Business Revenue" subtitle={`Today: ${formatMoney(businessRevenue.today, tenant?.currency)}`} accent="text-emerald-600" icon={faChartLine}>
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Yesterday: {formatMoney(businessRevenue.yesterday, tenant?.currency)}</div>
            <div className="text-xs text-gray-500">This Month: {formatMoney(businessRevenue.thisMonth, tenant?.currency)}</div>
          </div>
        </Card>
        <Card title="Quotations" subtitle={`${quotations.filter(q => ['Draft', 'Sent'].includes(q.status)).length} pending`} accent="text-orange-600" icon={faFileAlt}>
          <div className="space-y-1">
            <div className="text-lg font-semibold">{quotations.length}</div>
            <div className="text-xs text-gray-500">
              Accepted: {quotations.filter(q => q.status === 'Accepted').length} | 
              Value: {formatMoney(sum(quotations.filter(q => q.status === 'Accepted').map(q => q.total)), tenant?.currency)}
            </div>
          </div>
        </Card>
        <Card title="Cashflow Balance" subtitle={`${cashflowTransactions.length} transactions`} accent={cashflowBalance >= 0 ? "text-green-600" : "text-red-600"} icon={faMoneyBillWave}>
          {formatMoney(cashflowBalance, tenant?.currency)}
        </Card>
        <Card title="Active Quotes" subtitle={`${quotes.filter(q => ['Draft', 'Sent'].includes(q.status)).length} pending`} accent="text-blue-600" icon={faFileContract}>
          {quotes.length}
        </Card>
        <Card title="Inventory Items" subtitle={`${items.filter(i => i.is_service).length} services`} accent="text-purple-600" icon={faBoxes}>
          {items.length}
        </Card>
        <Card title="Active Clients" subtitle="Total registered" accent="text-indigo-600" icon={faBuilding}>
          {clients.length}
        </Card>
      </div>

      {/* Quick Actions & Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faRocket} className="w-5 h-5 text-blue-600" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link 
              to="/app/invoices/new" 
              className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
            >
              <FontAwesomeIcon icon={faFileInvoice} className="w-4 h-4" />
              <span className="text-sm font-medium">New Invoice</span>
            </Link>
            <Link 
              to="/app/quotes/new" 
              className="flex items-center gap-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors"
            >
              <FontAwesomeIcon icon={faFileContract} className="w-4 h-4" />
              <span className="text-sm font-medium">New Quote</span>
            </Link>
            <Link 
              to="/app/clients/new" 
              className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors"
            >
              <FontAwesomeIcon icon={faUsers} className="w-4 h-4" />
              <span className="text-sm font-medium">Add Client</span>
            </Link>
            <Link 
              to="/app/cashflow/new" 
              className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors"
            >
              <FontAwesomeIcon icon={faMoneyBillWave} className="w-4 h-4" />
              <span className="text-sm font-medium">Log Income</span>
            </Link>
          </div>
        </div>

        {/* Business Health Alerts */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-amber-600" />
            Business Health
          </h3>
          <div className="space-y-3">
            {quickStats.overdueInvoices > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 text-red-700">
                <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{quickStats.overdueInvoices} Overdue Invoice{quickStats.overdueInvoices > 1 ? 's' : ''}</div>
                  <div className="text-xs">{formatMoney(quickStats.overdueAmount, tenant?.currency)} needs collection</div>
                </div>
                <Link to="/app/invoices" className="text-xs underline">View</Link>
              </div>
            )}
            {quickStats.upcomingPayments > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 text-amber-700">
                <FontAwesomeIcon icon={faClock} className="w-4 h-4" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{quickStats.upcomingPayments} Payment{quickStats.upcomingPayments > 1 ? 's' : ''} Due Soon</div>
                  <div className="text-xs">Follow up recommended</div>
                </div>
                <Link to="/app/invoices" className="text-xs underline">View</Link>
              </div>
            )}
            {quickStats.overdueInvoices === 0 && quickStats.upcomingPayments === 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 text-green-700">
                <FontAwesomeIcon icon={faArrowUp} className="w-4 h-4" />
                <div className="flex-1">
                  <div className="text-sm font-medium">All Good!</div>
                  <div className="text-xs">No urgent payment issues</div>
                </div>
              </div>
            )}
            <div className="pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-600 space-y-1">
                <div>This Week Sales: <span className="font-medium text-gray-900">{formatMoney(quickStats.thisWeekSales, tenant?.currency)}</span></div>
                <div>Average Invoice: <span className="font-medium text-gray-900">{formatMoney(quickStats.avgInvoiceValue, tenant?.currency)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Intelligence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
        {/* Best Performing Products/Services */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faTrophy} className="w-5 h-5 text-yellow-600" />
            Top Performers
          </h3>
          <div className="space-y-3">
            {(businessInsights.bestPerformingItems || []).length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <FontAwesomeIcon icon={faStar} className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm">Add items to see performance insights</p>
              </div>
            ) : (
              (businessInsights.bestPerformingItems || []).map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50">
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                      ${index === 0 ? 'bg-yellow-500 text-white' : 
                        index === 1 ? 'bg-gray-400 text-white' : 
                        index === 2 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{item.name}</div>
                    <div className="text-xs text-gray-600">
                      {item.salesCount} sales • {item.category}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm text-green-600">
                      {formatMoney(item.totalRevenue, tenant?.currency)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(item.profitMargin * 100).toFixed(1)}% margin
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Customer Payment Behavior */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faShieldAlt} className="w-5 h-5 text-blue-600" />
            Customer Insights
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-green-50">
                <div className="font-semibold text-green-600">
                  {(businessInsights.customerPaymentBehavior || []).filter(c => c.riskLevel === 'Low').length}
                </div>
                <div className="text-green-700">Low Risk</div>
              </div>
              <div className="p-2 rounded bg-yellow-50">
                <div className="font-semibold text-yellow-600">
                  {(businessInsights.customerPaymentBehavior || []).filter(c => c.riskLevel === 'Medium').length}
                </div>
                <div className="text-yellow-700">Medium Risk</div>
              </div>
              <div className="p-2 rounded bg-red-50">
                <div className="font-semibold text-red-600">
                  {(businessInsights.customerPaymentBehavior || []).filter(c => c.riskLevel === 'High').length}
                </div>
                <div className="text-red-700">High Risk</div>
              </div>
            </div>
            
            {(businessInsights.customerPaymentBehavior || []).length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <FontAwesomeIcon icon={faUsers} className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm">Create invoices to see customer insights</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(businessInsights.customerPaymentBehavior || [])
                  .sort((a, b) => b.totalAmount - a.totalAmount)
                  .slice(0, 5)
                  .map(customer => (
                    <div key={customer.clientId} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{customer.clientName}</div>
                        <div className="text-xs text-gray-600">
                          {customer.totalInvoices} invoices • {formatMoney(customer.totalAmount, tenant?.currency)}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${customer.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                          customer.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}`}>
                        {customer.riskLevel}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Seasonal Patterns & Trends */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faCalendarAlt} className="w-5 h-5 text-purple-600" />
            Business Trends
          </h3>
          <div className="space-y-4">
            {/* Growth Indicator */}
            <div className={`p-3 rounded-lg ${(businessInsights.trends || {}).isGrowthTrend ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon 
                  icon={(businessInsights.trends || {}).isGrowthTrend ? faChartLine : faArrowDown} 
                  className={`w-4 h-4 ${(businessInsights.trends || {}).isGrowthTrend ? 'text-green-600' : 'text-red-600'}`} 
                />
                <span className={`text-sm font-medium ${(businessInsights.trends || {}).isGrowthTrend ? 'text-green-700' : 'text-red-700'}`}>
                  {(businessInsights.trends || {}).isGrowthTrend ? 'Growing Trend' : 'Declining Trend'}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Based on last 3 months performance
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500">Average Monthly Revenue</div>
                <div className="font-semibold text-lg">
                  {formatMoney((businessInsights.trends || {}).avgMonthlyRevenue || 0, tenant?.currency)}
                </div>
              </div>
              
              {(businessInsights.trends || {}).bestMonth && (
                <div>
                  <div className="text-xs text-gray-500">Best Month</div>
                  <div className="font-medium text-sm text-green-600">
                    {(businessInsights.trends || {}).bestMonth[1]?.month} - {formatMoney((businessInsights.trends || {}).bestMonth[1]?.revenue || 0, tenant?.currency)}
                  </div>
                </div>
              )}
              
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Total Customers:</span>
                  <span className="font-medium">{(businessInsights.trends || {}).totalCustomers || 0}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-500">High Risk:</span>
                  <span className="font-medium text-red-600">{(businessInsights.trends || {}).highRiskCustomers || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Relationship Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
        {/* Customer Communication History */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faComments} className="w-5 h-5 text-blue-600" />
            Communication History
          </h3>
          <div className="space-y-3">
            {(businessInsights.customerCommunication || []).length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <FontAwesomeIcon icon={faComments} className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm">No communication history yet</p>
              </div>
            ) : (
              (businessInsights.customerCommunication || []).slice(0, 5).map(comm => (
                <div key={comm.clientId} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">{comm.clientName}</div>
                    <div className="flex items-center gap-2">
                      {comm.email && (
                        <FontAwesomeIcon icon={faEnvelope} className="w-3 h-3 text-gray-400" />
                      )}
                      {comm.phone && (
                        <FontAwesomeIcon icon={faPhone} className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Last Contact: {new Date(comm.lastContact).toLocaleDateString()}</div>
                    <div className="flex justify-between">
                      <span>Invoices: {comm.totalInvoices}</span>
                      {comm.overdueCount > 0 && (
                        <span className="text-red-600 font-medium">
                          {comm.overdueCount} overdue
                        </span>
                      )}
                    </div>
                    {comm.communicationHistory[0] && (
                      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                        <FontAwesomeIcon 
                          icon={comm.communicationHistory[0].method === 'email' ? faEnvelope : faPhone} 
                          className="w-3 h-3 text-blue-500" 
                        />
                        <span className="text-xs">{comm.communicationHistory[0].notes}</span>
                      </div>
                    )}
                    <div className="text-xs text-amber-600">
                      Next action: {new Date(comm.nextActionDue).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Reminders Automation */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faBell} className="w-5 h-5 text-amber-600" />
            Payment Reminders
          </h3>
          <div className="space-y-3">
            {(businessInsights.paymentReminders || []).length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <FontAwesomeIcon icon={faBell} className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm">All payments up to date!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(businessInsights.paymentReminders || []).map(reminder => (
                  <div key={reminder.invoiceId} className={`border rounded-lg p-3 
                    ${reminder.urgencyLevel === 'high' ? 'border-red-200 bg-red-50' :
                      reminder.urgencyLevel === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                      'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">{reminder.clientName}</div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${reminder.urgencyLevel === 'high' ? 'bg-red-100 text-red-800' :
                          reminder.urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'}`}>
                        {reminder.urgencyLevel} priority
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Invoice: {reminder.invoiceNumber}</span>
                        <span className="font-medium">{formatMoney(reminder.amount, tenant?.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Days overdue: {reminder.daysPastDue}</span>
                        <span>Reminders sent: {reminder.remindersSent}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                        <div className={`w-2 h-2 rounded-full ${reminder.autoReminderEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-xs">Auto-reminder: {reminder.autoReminderEnabled ? 'ON' : 'OFF'}</span>
                      </div>
                      <div className="text-xs text-blue-600">
                        Next reminder: {new Date(reminder.nextReminderDue).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Customer Credit Limit Tracking */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faUserCheck} className="w-5 h-5 text-green-600" />
            Credit Limits
          </h3>
          <div className="space-y-3">
            {(businessInsights.creditLimits || []).length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <FontAwesomeIcon icon={faUserCheck} className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm">No credit limits set</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(businessInsights.creditLimits || []).map(credit => (
                  <div key={credit.clientId} className="border rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm truncate">{credit.clientName}</div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${credit.recommendedAction === 'credit_review' ? 'bg-red-100 text-red-800' :
                          credit.recommendedAction === 'monitor' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'}`}>
                        {credit.riskLevel}
                      </span>
                    </div>
                    
                    {/* Credit Utilization Bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Credit Utilization</span>
                        <span>{credit.utilizationRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            credit.utilizationRate > 90 ? 'bg-red-500' :
                            credit.utilizationRate > 80 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, credit.utilizationRate)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Credit Limit:</span>
                        <span className="font-medium">{formatMoney(credit.currentCreditLimit, tenant?.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Used:</span>
                        <span className="font-medium">{formatMoney(credit.utilizedCredit, tenant?.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Available:</span>
                        <span className="font-medium text-green-600">{formatMoney(credit.availableCredit, tenant?.currency)}</span>
                      </div>
                      
                      {credit.recommendedAction !== 'none' && (
                        <div className="pt-1 border-t border-gray-100">
                          <div className={`text-xs font-medium ${
                            credit.recommendedAction === 'credit_review' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            Action: {credit.recommendedAction === 'credit_review' ? 'Review Required' : 'Monitor Closely'}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 pt-1">
                        <div className={`w-2 h-2 rounded-full ${credit.autoLimitAdjustment ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-xs">Auto-adjust: {credit.autoLimitAdjustment ? 'ON' : 'OFF'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Management & Automation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
        {/* Template-based Invoice Creation */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faCopy} className="w-5 h-5 text-blue-600" />
            Invoice Templates
          </h3>
          <div className="space-y-3">
            {invoiceTemplates.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <FontAwesomeIcon icon={faCopy} className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm">No templates created yet</p>
                <button className="mt-2 text-blue-600 text-sm hover:text-blue-700">
                  Create Template
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {invoiceTemplates.map(template => (
                  <div key={template.id} className="border rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm truncate">{template.name}</div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${template.category === 'Service' ? 'bg-blue-100 text-blue-800' :
                          template.category === 'Subscription' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'}`}>
                        {template.category}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {template.description}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Used {template.usageCount} times
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-700 text-xs">
                          <FontAwesomeIcon icon={faCopy} className="w-3 h-3 mr-1" />
                          Use
                        </button>
                        <button className="text-gray-600 hover:text-gray-700 text-xs">
                          Edit
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Last used: {template.lastUsed.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-3 border-t border-gray-100">
              <button className="w-full text-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3 mr-1" />
                Create New Template
              </button>
            </div>
          </div>
        </div>

        {/* Recurring Invoice Automation */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faSync} className="w-5 h-5 text-green-600" />
            Recurring Invoices
          </h3>
          <div className="space-y-3">
            {recurringInvoices.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <FontAwesomeIcon icon={faSync} className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm">No recurring invoices set up</p>
                <button className="mt-2 text-green-600 text-sm hover:text-green-700">
                  Set Up Recurring
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recurringInvoices.map(recurring => (
                  <div key={recurring.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm truncate">{recurring.clientName}</div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${recurring.status === 'active' ? 'bg-green-100 text-green-800' :
                          recurring.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {recurring.status}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Frequency:</span>
                        <span className="font-medium capitalize">{recurring.frequency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-medium">{formatMoney(recurring.totalAmount, recurring.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Next Run:</span>
                        <span className={`font-medium ${
                          new Date(recurring.nextRunDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-orange-600' : 'text-gray-600'
                        }`}>
                          {recurring.nextRunDate.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Generated:</span>
                        <span className="font-medium">{recurring.totalGenerated} invoices</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${recurring.autoSend ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-xs">Auto-send: {recurring.autoSend ? 'ON' : 'OFF'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-700 text-xs">
                          <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                        </button>
                        <button className="text-green-600 hover:text-green-700 text-xs">
                          <FontAwesomeIcon icon={faCalendarCheck} className="w-3 h-3" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-700 text-xs">
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-3 border-t border-gray-100">
              <button className="w-full text-center text-green-600 hover:text-green-700 text-sm font-medium">
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3 mr-1" />
                Set Up Recurring Invoice
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Operations for Common Tasks */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faLayerGroup} className="w-5 h-5 text-purple-600" />
            Bulk Operations
          </h3>
          <div className="space-y-3">
            {/* Quick Bulk Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium">
                <FontAwesomeIcon icon={faBell} className="w-3 h-3" />
                <div className="text-left">
                  <div>Send Reminders</div>
                  <div className="text-xs text-blue-600">
                    {(bulkOperations.availableCounts || {}).send_reminder || 0} ready
                  </div>
                </div>
              </button>
              
              <button className="flex items-center gap-2 p-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium">
                <FontAwesomeIcon icon={faCheckSquare} className="w-3 h-3" />
                <div className="text-left">
                  <div>Mark Paid</div>
                  <div className="text-xs text-green-600">
                    {(bulkOperations.availableCounts || {}).mark_paid || 0} pending
                  </div>
                </div>
              </button>
              
              <button className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium">
                <FontAwesomeIcon icon={faFileImport} className="w-3 h-3" />
                <div className="text-left">
                  <div>Export CSV</div>
                  <div className="text-xs text-purple-600">
                    {(bulkOperations.availableCounts || {}).export || 0} invoices
                  </div>
                </div>
              </button>
              
              <button className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-medium">
                <FontAwesomeIcon icon={faFileInvoice} className="w-3 h-3" />
                <div className="text-left">
                  <div>Send Drafts</div>
                  <div className="text-xs text-orange-600">
                    {(bulkOperations.availableCounts || {}).send_bulk || 0} drafts
                  </div>
                </div>
              </button>
            </div>

            {/* Recent Bulk Actions */}
            <div className="pt-3 border-t border-gray-100">
              <div className="text-sm font-medium text-gray-700 mb-2">Recent Actions</div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {(bulkOperations.recentActions || []).length === 0 ? (
                  <div className="text-center text-gray-500 py-2">
                    <p className="text-xs">No recent bulk actions</p>
                  </div>
                ) : (
                  (bulkOperations.recentActions || []).map(action => (
                    <div key={action.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <div className="text-xs font-medium">{action.description}</div>
                        <div className="text-xs text-gray-600">
                          {action.successCount}/{action.targetCount} completed
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {action.executedAt.toLocaleDateString()}
                        </div>
                        <div className={`text-xs ${action.executedBy === 'system_auto' ? 'text-blue-600' : 'text-gray-600'}`}>
                          {action.executedBy === 'system_auto' ? 'Auto' : 'Manual'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <button className="w-full text-center text-purple-600 hover:text-purple-700 text-sm font-medium">
                <FontAwesomeIcon icon={faLayerGroup} className="w-3 h-3 mr-1" />
                Advanced Bulk Actions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content grid - responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">
        {/* Recent Invoices - takes full width on mobile, 8 cols on desktop */}
        <section className="lg:col-span-8 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
          <Header title="Recent Invoices" count={invoices.length}>
            <div className="flex items-center gap-2">
              <Link to="/app/invoices" className="text-xs rounded-lg px-2 py-1 ring-1 ring-black/10 hover:bg-black/5 flex items-center gap-1">
                <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                <span className="hidden sm:inline">View All</span>
              </Link>
              <Link to="/app/invoices/wizard" className="text-xs rounded-lg px-2 py-1 bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1">
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                <span className="hidden sm:inline">New Invoice</span>
              </Link>
            </div>
          </Header>

          {msg && <div className="px-4 py-2 text-xs text-black/70 bg-amber-50 border-t border-amber-200">{msg}</div>}

          <div className="overflow-x-auto">
            {loading ? (
              <div className="px-4 py-8 text-sm text-black/60 text-center">Loading…</div>
            ) : invoices.length === 0 ? (
              <div className="px-4 py-8 text-sm text-black/60 text-center">
                <FontAwesomeIcon icon={faFileInvoice} className="w-12 h-12 text-gray-300 mb-3" />
                <p>No invoices yet.</p>
                <Link to="/app/invoices/wizard" className="text-emerald-600 hover:text-emerald-700">Create your first invoice</Link>
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-[#F3F4F6] text-black/60 hidden sm:table-header-group">
                  <tr>
                    <th className="text-left px-4 py-2">Invoice #</th>
                    <th className="text-left px-4 py-2">Client</th>
                    <th className="text-left px-4 py-2">Issued</th>
                    <th className="text-left px-4 py-2">Due</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-right px-4 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {invoices.slice(0, 10).map((r) => {
                    const status = statusOf(r);
                    const badge = statusBadge(status);
                    return (
                      <tr key={r.id} className="sm:table-row flex flex-col sm:flex-row border-b sm:border-b-0 pb-4 sm:pb-0 mb-4 sm:mb-0">
                        <td className="px-4 py-2 font-medium flex justify-between sm:table-cell">
                          <span className="sm:hidden text-gray-500">Invoice:</span>
                          {r.number || r.id}
                        </td>
                        <td className="px-4 py-2 flex justify-between sm:table-cell">
                          <span className="sm:hidden text-gray-500">Client:</span>
                          {r.clientName}
                        </td>
                        <td className="px-4 py-2 flex justify-between sm:table-cell">
                          <span className="sm:hidden text-gray-500">Issued:</span>
                          {formatDate(r.issue_date)}
                        </td>
                        <td className="px-4 py-2 flex justify-between sm:table-cell">
                          <span className="sm:hidden text-gray-500">Due:</span>
                          {formatDate(r.due_date)}
                        </td>
                        <td className="px-4 py-2 flex justify-between sm:table-cell">
                          <span className="sm:hidden text-gray-500">Status:</span>
                          <span className={`inline-flex items-center ${badge.cls} px-2 py-0.5 rounded-full text-xs`}>{badge.text}</span>
                        </td>
                        <td className="px-4 py-2 text-right font-semibold flex justify-between sm:table-cell">
                          <span className="sm:hidden text-gray-500">Amount:</span>
                          {formatMoney(r.total, r.currency || tenant?.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Sidebar content - stacks on mobile, 4 cols on desktop */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recent Quotes */}
          <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
            <Header title="Recent Quotes" count={quotes.length}>
              <Link to="/app/quotes/new" className="text-xs rounded-lg px-2 py-1 bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1">
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                <span className="hidden sm:inline">New</span>
              </Link>
            </Header>
            <ul className="divide-y divide-black/5 text-sm">
              {quotes.length === 0 ? (
                <li className="px-4 py-8 text-center text-black/60">
                  <FontAwesomeIcon icon={faFileContract} className="w-8 h-8 text-gray-300 mb-2" />
                  <p>No quotes yet.</p>
                </li>
              ) : (
                quotes.slice(0, 5).map(q => {
                  const statusBadge = getQuoteStatusBadge(q.status);
                  return (
                    <li key={q.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{q.clientName}</div>
                          <div className="text-black/60 text-xs">{formatMoney(q.total, q.currency || tenant?.currency)}</div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center ${statusBadge.cls} px-2 py-1 rounded-full text-xs font-medium`}>
                            {statusBadge.text}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          {/* Recent Cashflow */}
          <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
            <Header title="Recent Transactions" count={cashflowTransactions.length}>
              <Link to="/app/cashflow/new" className="text-xs rounded-lg px-2 py-1 bg-green-600 text-white hover:bg-green-700 flex items-center gap-1">
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                <span className="hidden sm:inline">Add</span>
              </Link>
            </Header>
            <ul className="divide-y divide-black/5 text-sm">
              {cashflowTransactions.length === 0 ? (
                <li className="px-4 py-8 text-center text-black/60">
                  <FontAwesomeIcon icon={faMoneyBillWave} className="w-8 h-8 text-gray-300 mb-2" />
                  <p>No transactions yet.</p>
                </li>
              ) : (
                cashflowTransactions.slice(0, 5).map(t => (
                  <li key={t.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon 
                            icon={t.transaction_type === 'cash_in' ? faArrowUp : faArrowDown} 
                            className={`w-3 h-3 ${t.transaction_type === 'cash_in' ? 'text-green-600' : 'text-red-600'}`}
                          />
                          <span className="font-medium truncate">{t.description}</span>
                        </div>
                        <div className="text-black/60 text-xs">{t.category || 'Uncategorized'}</div>
                      </div>
                      <div className={`text-right font-medium ${t.transaction_type === 'cash_in' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.transaction_type === 'cash_in' ? '+' : '-'}{formatMoney(t.amount, t.currency)}
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>

      {/* Quick actions */}
      <div className="pb-8">
        <div className="rounded-2xl shadow-sm ring-1 ring-black/5 p-4 sm:p-6" style={{ background: "#E9F5EE" }}>
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link to="/app/invoices/wizard" className="rounded-xl bg-white px-3 py-3 text-sm shadow-sm ring-1 ring-black/5 hover:bg-black/5 text-center">
              <FontAwesomeIcon icon={faFileInvoice} className="w-4 h-4 mb-1 text-emerald-600" />
              <div>Invoice</div>
            </Link>
            <Link to="/app/quotes/new" className="rounded-xl bg-white px-3 py-3 text-sm shadow-sm ring-1 ring-black/5 hover:bg-black/5 text-center">
              <FontAwesomeIcon icon={faFileContract} className="w-4 h-4 mb-1 text-blue-600" />
              <div>Quote</div>
            </Link>
            <Link to="/app/cashflow/new" className="rounded-xl bg-white px-3 py-3 text-sm shadow-sm ring-1 ring-black/5 hover:bg-black/5 text-center">
              <FontAwesomeIcon icon={faMoneyBillWave} className="w-4 h-4 mb-1 text-green-600" />
              <div>Transaction</div>
            </Link>
            <Link to="/app/clients/new" className="rounded-xl bg-white px-3 py-3 text-sm shadow-sm ring-1 ring-black/5 hover:bg-black/5 text-center">
              <FontAwesomeIcon icon={faBuilding} className="w-4 h-4 mb-1 text-indigo-600" />
              <div>Client</div>
            </Link>
            <Link to="/app/items/new" className="rounded-xl bg-white px-3 py-3 text-sm shadow-sm ring-1 ring-black/5 hover:bg-black/5 text-center">
              <FontAwesomeIcon icon={faBoxes} className="w-4 h-4 mb-1 text-purple-600" />
              <div>Item</div>
            </Link>
            <button 
              onClick={seedRouterLimited}
              disabled={seeding}
              className="rounded-xl bg-white px-3 py-3 text-sm shadow-sm ring-1 ring-black/5 hover:bg-black/5 text-center disabled:opacity-50"
            >
              <div>{seeding ? "Seeding..." : "Demo Data"}</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
