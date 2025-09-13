import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function QuotationPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { quotationData, tenant, client, isCreated = false } = location.state || {};

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!quotationData || !tenant || !client) {
      navigate('/app/quotations/new');
    }
  }, [quotationData, tenant, client, navigate]);

  if (!quotationData || !tenant || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading quotation preview...</div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatMoney = (amount, currency = 'EUR') => {
    try {
      return new Intl.NumberFormat(undefined, { 
        style: 'currency', 
        currency 
      }).format(Number(amount || 0));
    } catch {
      return `${currency} ${Number(amount || 0).toFixed(2)}`;
    }
  };

  // Calculate totals
  const subtotal = quotationData.items.reduce((sum, item) => sum + (item.line_subtotal || 0), 0);
  const taxTotal = quotationData.items.reduce((sum, item) => sum + (item.line_tax || 0), 0);
  const total = subtotal + taxTotal;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Action Bar - Hidden when printing */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 print:hidden">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              {isCreated ? 'Your Quotation is Ready!' : 'Quotation Preview'}
            </h1>
            {isCreated && (
              <p className="text-sm text-gray-600 mt-1">
                Quotation #{quotationData.number} has been successfully created
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            {!isCreated && (
              <button
                type="button"
                onClick={() => navigate('/app/quotations/new')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-center"
              >
                ← Back to Edit
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-center"
            >
              🖨️ Print
            </button>
            <button
              type="button"
              onClick={() => navigate('/app')}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 text-center"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Quote Document */}
      <div className="max-w-4xl mx-auto p-4 sm:p-8 print:p-0">
        <div className="bg-white shadow-lg rounded-lg print:shadow-none print:rounded-none">
          {/* Document Header */}
          <div className="p-6 sm:p-8 print:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start mb-8 gap-6">
              {/* Company Info */}
              <div className="w-full lg:w-1/2">
                {tenant.logo_url && (
                  <img 
                    src={tenant.logo_url} 
                    alt="Company Logo" 
                    className="h-12 sm:h-16 mb-4 object-contain"
                  />
                )}
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {tenant.business_name || 'Your Company'}
                </h1>
                {tenant.business_address && (
                  <div className="text-sm text-gray-600 whitespace-pre-line mb-2">
                    {tenant.business_address}
                  </div>
                )}
                <div className="text-sm text-gray-600 space-y-1">
                  {tenant.business_email && <div>Email: {tenant.business_email}</div>}
                  {tenant.business_phone && <div>Phone: {tenant.business_phone}</div>}
                  {tenant.business_website && <div>Web: {tenant.business_website}</div>}
                </div>
              </div>

              {/* Quotation Info */}
              <div className="w-full lg:w-1/2 lg:text-right">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">QUOTATION</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex flex-col lg:items-end">
                    <span className="font-medium text-gray-700">Quotation #</span>
                    <span className="text-lg font-semibold">{quotationData.number}</span>
                  </div>
                  <div className="flex flex-col lg:items-end">
                    <span className="font-medium text-gray-700">Date</span>
                    <span>{formatDate(quotationData.date)}</span>
                  </div>
                  <div className="flex flex-col lg:items-end">
                    <span className="font-medium text-gray-700">Valid Until</span>
                    <span>{formatDate(quotationData.valid_until)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-semibold text-gray-900">{client.name}</div>
                {client.email && <div className="text-gray-600">{client.email}</div>}
                {client.phone && <div className="text-gray-600">{client.phone}</div>}
                {client.billing_address && (
                  <div className="text-gray-600 mt-2 whitespace-pre-line">
                    {client.billing_address}
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 pr-4 font-semibold text-gray-900">Description</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-900 min-w-[60px]">Qty</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-900 min-w-[60px]">Unit</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-900 min-w-[80px]">Price</th>
                    <th className="text-right py-3 pl-4 font-semibold text-gray-900 min-w-[80px]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quotationData.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-3 pr-4 text-gray-900">
                        <div className="font-medium">{item.description}</div>
                      </td>
                      <td className="py-3 px-2 text-center text-gray-700">{item.qty}</td>
                      <td className="py-3 px-2 text-center text-gray-700">{item.unit}</td>
                      <td className="py-3 px-2 text-right text-gray-700">
                        {formatMoney(item.unit_price, quotationData.currency)}
                      </td>
                      <td className="py-3 pl-4 text-right font-medium text-gray-900">
                        {formatMoney(item.line_subtotal, quotationData.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-full sm:w-80">
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-medium text-gray-700">Subtotal:</span>
                    <span className="font-semibold text-gray-900">
                      {formatMoney(subtotal, quotationData.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-medium text-gray-700">Tax:</span>
                    <span className="font-semibold text-gray-900">
                      {formatMoney(taxTotal, quotationData.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-gray-300">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatMoney(total, quotationData.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {quotationData.notes && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes:</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-line">{quotationData.notes}</p>
                </div>
              </div>
            )}

            {/* Terms & Conditions */}
            <div className="text-sm text-gray-600 space-y-2">
              <h3 className="font-semibold text-gray-900 mb-2">Terms & Conditions:</h3>
              <p>• This quotation is valid until {formatDate(quotationData.valid_until)}</p>
              <p>• Prices are subject to change without notice</p>
              <p>• Payment terms and conditions apply as per our standard agreement</p>
              <p>• Please contact us if you have any questions about this quotation</p>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>Thank you for considering our services!</p>
              {tenant.business_website && (
                <p className="mt-1">Visit us at {tenant.business_website}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          .print\\:p-8 {
            padding: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
}
