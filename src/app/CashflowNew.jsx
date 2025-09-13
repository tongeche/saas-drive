import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft,
  faMoneyBillWave,
  faArrowUp,
  faArrowDown,
  faSave
} from '@fortawesome/free-solid-svg-icons';
import { createCashflowTransaction, defaultCashflowCategories } from '../lib/cashflow';

export default function CashflowNew() {
  const { tenant } = useOutletContext();
  const navigate = useNavigate();
  
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
      await createCashflowTransaction({
        ...formData,
        tenant_id: tenant.id,
        amount: parseFloat(formData.amount)
      });
      navigate('/app/cashflow');
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Error creating transaction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const availableCategories = defaultCashflowCategories[formData.transaction_type] || [];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/app/cashflow')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Transaction</h1>
          <p className="text-gray-600">Add a cash in or cash out transaction</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChange('transaction_type', 'cash_in')}
                className={`flex items-center justify-center gap-2 p-4 border-2 rounded-lg transition-colors ${
                  formData.transaction_type === 'cash_in'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={faArrowUp} className="w-5 h-5" />
                <span className="font-medium">Cash In</span>
              </button>
              <button
                type="button"
                onClick={() => handleChange('transaction_type', 'cash_out')}
                className={`flex items-center justify-center gap-2 p-4 border-2 rounded-lg transition-colors ${
                  formData.transaction_type === 'cash_out'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={faArrowDown} className="w-5 h-5" />
                <span className="font-medium">Cash Out</span>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">{tenant?.currency || 'EUR'}</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className="block w-full pl-16 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="What is this transaction for?"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="space-y-2">
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Select a category</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Or enter a custom category"
              />
            </div>
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Number
            </label>
            <input
              type="text"
              value={formData.reference_number}
              onChange={(e) => handleChange('reference_number', e.target.value)}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Invoice #, Receipt #, etc."
            />
          </div>

          {/* Transaction Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.transaction_date}
              onChange={(e) => handleChange('transaction_date', e.target.value)}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <FontAwesomeIcon icon={faSave} className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Transaction'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/cashflow')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Transaction Type Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">
          {formData.transaction_type === 'cash_in' ? 'Cash In' : 'Cash Out'} Examples
        </h3>
        <div className="text-sm text-blue-700">
          {formData.transaction_type === 'cash_in' ? (
            <p>Money coming into your business: sales revenue, service income, investments, loan received, refunds, interest earned, etc.</p>
          ) : (
            <p>Money going out of your business: office supplies, marketing, travel, utilities, rent, salaries, equipment, insurance, taxes, loan payments, etc.</p>
          )}
        </div>
      </div>
    </div>
  );
}
