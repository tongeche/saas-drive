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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
            <FontAwesomeIcon icon={icon} className={`w-4 h-4 ${accent}`} />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{title}</div>
            <div className="text-lg font-semibold dark:text-white">{children}</div>
            {subtitle && <div className={`text-xs ${accent}`}>{subtitle}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ title, count, children }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-gray-700">
      <h2 className="font-semibold text-gray-900 dark:text-white">
        {title} {count !== undefined && <span className="text-gray-500 dark:text-gray-400">({count})</span>}
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
        return { cls: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200', text: 'Draft' };
      case 'Sent':
        return { cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300', text: 'Sent' };
      case 'Accepted':
        return { cls: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300', text: 'Accepted' };
      case 'Rejected':
        return { cls: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300', text: 'Rejected' };
      default:
        return { cls: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200', text: status || 'Unknown' };
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Essential KPI cards - minimal and focused */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-8">
        {/* Money In */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm ring-1 ring-black/5 dark:ring-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
              <FontAwesomeIcon icon={faArrowUp} className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">This Month</div>
              <div className="text-xs text-green-600 dark:text-green-400">+12.5%</div>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Money In</h3>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatMoney(businessRevenue.thisMonth, tenant?.currency)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Today: {formatMoney(businessRevenue.today, tenant?.currency)}
            </div>
          </div>
        </div>

        {/* Money Out */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm ring-1 ring-black/5 dark:ring-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
              <FontAwesomeIcon icon={faArrowDown} className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Expenses</div>
              <div className="text-xs text-red-600 dark:text-red-400">-8.2%</div>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Money Out</h3>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatMoney(Math.abs(cashflowTransactions.filter(t => t.transaction_type === 'cash_out').reduce((sum, t) => sum + (t.amount || 0), 0)), tenant?.currency)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Balance: {formatMoney(cashflowBalance, tenant?.currency)}
            </div>
          </div>
        </div>

        {/* Clients */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm ring-1 ring-black/5 dark:ring-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <FontAwesomeIcon icon={faUsers} className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <Link to="/app/clients" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
              View All →
            </Link>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Clients</h3>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {clients.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {quickStats.overdueInvoices > 0 ? `${quickStats.overdueInvoices} need attention` : 'All up to date'}
            </div>
          </div>
        </div>

        {/* Business Assets */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm ring-1 ring-black/5 dark:ring-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <FontAwesomeIcon icon={faBoxes} className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <Link to="/app/inventory" className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
              Manage →
            </Link>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Assets</h3>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {items.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {items.filter(i => i.is_service).length} services, {items.filter(i => !i.is_service).length} products
            </div>
          </div>
        </div>
      </div>

      {/* Business Health Alerts - Only show important alerts */}
      {(quickStats.overdueInvoices > 0 || quickStats.upcomingPayments > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-gray-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-amber-600" />
            Attention Required
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickStats.overdueInvoices > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5" />
                <div className="flex-1">
                  <div className="font-medium">{quickStats.overdueInvoices} Overdue Invoice{quickStats.overdueInvoices > 1 ? 's' : ''}</div>
                  <div className="text-sm">{formatMoney(quickStats.overdueAmount, tenant?.currency)} needs collection</div>
                </div>
                <Link to="/app/invoices" className="text-sm underline">View →</Link>
              </div>
            )}
            {quickStats.upcomingPayments > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                <FontAwesomeIcon icon={faClock} className="w-5 h-5" />
                <div className="flex-1">
                  <div className="font-medium">{quickStats.upcomingPayments} Payment{quickStats.upcomingPayments > 1 ? 's' : ''} Due Soon</div>
                  <div className="text-sm">Follow up recommended</div>
                </div>
                <Link to="/app/invoices" className="text-sm underline">View →</Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions - Simplified */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faRocket} className="w-5 h-5 text-blue-600" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link 
            to="/app/invoices/new" 
            className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-700 dark:text-blue-300 transition-colors shadow-sm"
          >
            <FontAwesomeIcon icon={faFileInvoice} className="w-8 h-8" />
            <span className="font-medium">New Invoice</span>
          </Link>
          <Link 
            to="/app/quotes/new" 
            className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-green-700 dark:text-green-300 transition-colors shadow-sm"
          >
            <FontAwesomeIcon icon={faFileContract} className="w-8 h-8" />
            <span className="font-medium">New Quote</span>
          </Link>
          <Link 
            to="/app/clients/new" 
            className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-700 dark:text-purple-300 transition-colors shadow-sm"
          >
            <FontAwesomeIcon icon={faUsers} className="w-8 h-8" />
            <span className="font-medium">Add Client</span>
          </Link>
          <Link 
            to="/app/cashflow/new" 
            className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-orange-700 dark:text-orange-300 transition-colors shadow-sm"
          >
            <FontAwesomeIcon icon={faMoneyBillWave} className="w-8 h-8" />
            <span className="font-medium">Log Transaction</span>
          </Link>
        </div>
      </div>

      {/* Business Insights - Simplified with links to detailed pages */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-gray-700 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Business Insights</h3>
          <Link 
            to="/app/business/analytics" 
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            View Full Analytics →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Performance Summary */}
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <FontAwesomeIcon icon={faChartLine} className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {businessRevenue.thisMonth > businessRevenue.yesterday * 30 ? '+' : '-'}
              {Math.abs(((businessRevenue.thisMonth - (businessRevenue.yesterday * 30)) / (businessRevenue.yesterday * 30) * 100) || 0).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Growth</div>
            <Link to="/app/business/analytics" className="text-xs text-green-600 dark:text-green-400 hover:underline">
              View trends →
            </Link>
          </div>

          {/* Customer Health */}
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <FontAwesomeIcon icon={faUsers} className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {Math.round(((clients.length - quickStats.overdueInvoices) / Math.max(clients.length, 1)) * 100)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Healthy Clients</div>
            <Link to="/app/crm" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Manage clients →
            </Link>
          </div>

          {/* Business Efficiency */}
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
            <FontAwesomeIcon icon={faTrophy} className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-3" />
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {formatMoney(quickStats.avgInvoiceValue, tenant?.currency)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Invoice Value</div>
            <Link to="/app/reports" className="text-xs text-purple-600 dark:text-purple-400 hover:underline">
              View reports →
            </Link>
          </div>
        </div>
      </div>

      {/* Main content - Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices - Main focus */}
        <section className="lg:col-span-2 rounded-2xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-black/5 dark:ring-gray-700 overflow-hidden">
          <Header title="Recent Invoices" count={invoices.length}>
            <div className="flex items-center gap-2">
              <Link to="/app/invoices" className="text-xs rounded-lg px-3 py-2 ring-1 ring-black/10 hover:bg-black/5 flex items-center gap-1">
                <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                View All
              </Link>
              <Link to="/app/invoices/wizard" className="text-xs rounded-lg px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1">
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                Create
              </Link>
            </div>
          </Header>

          {msg && <div className="px-4 py-2 text-xs text-black/70 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-700">{msg}</div>}

          <div className="overflow-x-auto">
            {loading ? (
              <div className="px-4 py-8 text-sm text-black/60 dark:text-gray-300 text-center">Loading…</div>
            ) : invoices.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <FontAwesomeIcon icon={faFileInvoice} className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No invoices yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Get started by creating your first invoice</p>
                <Link 
                  to="/app/invoices/wizard" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                  Create Invoice
                </Link>
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Invoice</th>
                    <th className="text-left px-4 py-3 font-medium">Client</th>
                    <th className="text-left px-4 py-3 font-medium">Due Date</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {invoices.slice(0, 8).map((r) => {
                    const status = statusOf(r);
                    const badge = statusBadge(status);
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 font-medium dark:text-white">
                          {r.number || `#${r.id.slice(-6)}`}
                        </td>
                        <td className="px-4 py-3 dark:text-white">
                          {r.clientName}
                        </td>
                        <td className="px-4 py-3 dark:text-white">
                          {formatDate(r.due_date)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center ${badge.cls} px-2 py-1 rounded-full text-xs font-medium`}>
                            {badge.text}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold dark:text-white">
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

        {/* Sidebar - Recent Activity */}
        <div className="space-y-6">
          {/* Recent Quotes */}
          <section className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-black/5 dark:ring-gray-700 overflow-hidden">
            <Header title="Recent Quotes" count={quotes.length}>
              <Link to="/app/quotes/new" className="text-xs rounded-lg px-2 py-1 bg-blue-600 text-white hover:bg-blue-700">
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
              </Link>
            </Header>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {quotes.length === 0 ? (
                <li className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  <FontAwesomeIcon icon={faFileContract} className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                  <p>No quotes yet</p>
                </li>
              ) : (
                quotes.slice(0, 5).map(q => {
                  const statusBadge = getQuoteStatusBadge(q.status);
                  return (
                    <li key={q.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate dark:text-white">{q.clientName}</div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {formatMoney(q.total, q.currency || tenant?.currency)}
                          </div>
                        </div>
                        <span className={`inline-flex items-center ${statusBadge.cls} px-2 py-1 rounded-full text-xs font-medium`}>
                          {statusBadge.text}
                        </span>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          {/* Recent Transactions */}
          <section className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-black/5 dark:ring-gray-700 overflow-hidden">
            <Header title="Recent Transactions" count={cashflowTransactions.length}>
              <Link to="/app/cashflow/new" className="text-xs rounded-lg px-2 py-1 bg-green-600 text-white hover:bg-green-700">
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
              </Link>
            </Header>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {cashflowTransactions.length === 0 ? (
                <li className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  <FontAwesomeIcon icon={faMoneyBillWave} className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                  <p>No transactions yet</p>
                </li>
              ) : (
                cashflowTransactions.slice(0, 5).map(t => (
                  <li key={t.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon 
                            icon={t.transaction_type === 'cash_in' ? faArrowUp : faArrowDown} 
                            className={`w-3 h-3 ${t.transaction_type === 'cash_in' ? 'text-green-600' : 'text-red-600'}`}
                          />
                          <span className="font-medium truncate dark:text-white">{t.description}</span>
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs">{t.category || 'Uncategorized'}</div>
                      </div>
                      <div className={`text-right font-semibold ${t.transaction_type === 'cash_in' ? 'text-green-600' : 'text-red-600'}`}>
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

      {/* Demo Data Button - Only show if no data */}
      {invoices.length === 0 && quotes.length === 0 && cashflowTransactions.length === 0 && (
        <div className="mt-8 text-center">
          <button 
            onClick={seedRouterLimited}
            disabled={seeding}
            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {seeding ? "Generating Demo Data..." : "Generate Demo Data"}
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Add sample invoices and transactions to explore the dashboard
          </p>
        </div>
      )}
    </div>
  );
}
