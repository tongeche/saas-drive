import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faFilter, 
  faDownload,
  faArrowUp,
  faArrowDown,
  faEdit,
  faTrash,
  faEye,
  faCalendar,
  faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons';
import { 
  getCashflowTransactions, 
  getCashflowBalance, 
  getCashflowSummary,
  deleteCashflowTransaction 
} from '../lib/cashflow';

export default function Cashflow() {
  const { tenant } = useOutletContext();
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (tenant?.id) {
      loadCashflowData();
    }
  }, [tenant?.id, filters]);

  const loadCashflowData = async () => {
    try {
      setLoading(true);
      const [transactionsData, balanceData, summaryData] = await Promise.all([
        getCashflowTransactions(tenant.id, filters),
        getCashflowBalance(tenant.id, tenant.currency || 'EUR'),
        getCashflowSummary(tenant.id)
      ]);
      
      setTransactions(transactionsData);
      setBalance(balanceData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading cashflow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteCashflowTransaction(id);
        await loadCashflowData();
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const formatAmount = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cashflow</h1>
          <p className="text-gray-600">Track your cash in and cash out transactions</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowNewTransaction(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faMoneyBillWave} className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className={`text-xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatAmount(balance, tenant?.currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faArrowUp} className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Cash In (This Month)</p>
              <p className="text-xl font-bold text-green-600">
                {formatAmount(summary[0]?.total_cash_in || 0, tenant?.currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faArrowDown} className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Cash Out (This Month)</p>
              <p className="text-xl font-bold text-red-600">
                {formatAmount(summary[0]?.total_cash_out || 0, tenant?.currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-4">
          <FontAwesomeIcon icon={faFilter} className="w-4 h-4 text-gray-500" />
          <span className="font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Types</option>
            <option value="cash_in">Cash In</option>
            <option value="cash_out">Cash Out</option>
          </select>

          <input
            type="text"
            placeholder="Category"
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <input
            type="date"
            placeholder="Start Date"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <input
            type="date"
            placeholder="End Date"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg border">
        <div className="px-4 py-3 border-b">
          <h2 className="font-medium">Recent Transactions</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <FontAwesomeIcon icon={faMoneyBillWave} className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No transactions found</p>
            <button
              onClick={() => setShowNewTransaction(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Add Your First Transaction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Category</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Amount</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {formatDate(transaction.transaction_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.transaction_type === 'cash_in' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <FontAwesomeIcon 
                          icon={transaction.transaction_type === 'cash_in' ? faArrowUp : faArrowDown} 
                          className="w-3 h-3" 
                        />
                        {transaction.transaction_type === 'cash_in' ? 'Cash In' : 'Cash Out'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {transaction.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transaction.category || '—'}
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium text-right ${
                      transaction.transaction_type === 'cash_in' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.transaction_type === 'cash_in' ? '+' : '-'}
                      {formatAmount(transaction.amount, transaction.currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Transaction Modal */}
      {showNewTransaction && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <CashflowTransactionForm
              tenant={tenant}
              onSave={() => {
                setShowNewTransaction(false);
                loadCashflowData();
              }}
              onCancel={() => setShowNewTransaction(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Transaction Form Component
function CashflowTransactionForm({ tenant, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    transaction_type: 'cash_in',
    amount: '',
    description: '',
    category: '',
    reference_number: '',
    transaction_date: new Date().toISOString().split('T')[0],
    currency: tenant?.currency || 'EUR'
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { createCashflowTransaction } = await import('../lib/cashflow');
      await createCashflowTransaction({
        ...formData,
        tenant_id: tenant.id,
        amount: parseFloat(formData.amount)
      });
      onSave();
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Error creating transaction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <h2 className="text-lg font-bold mb-4">New Transaction</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Type
          </label>
          <select
            value={formData.transaction_type}
            onChange={(e) => setFormData(prev => ({ ...prev, transaction_type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          >
            <option value="cash_in">Cash In</option>
            <option value="cash_out">Cash Out</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="What is this transaction for?"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g., Sales, Office Supplies, Travel"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reference Number
          </label>
          <input
            type="text"
            value={formData.reference_number}
            onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Invoice #, Receipt #, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Date
          </label>
          <input
            type="date"
            value={formData.transaction_date}
            onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Transaction'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
