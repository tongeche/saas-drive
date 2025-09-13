import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faDownload, 
  faPrint,
  faArrowLeft,
  faCheck,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { generateQuotePDF } from '../lib/quotes';

export default function QuotePreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant } = useOutletContext() || {};
  const { quoteData, client, isCreated = false } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (!quoteData || !tenant || !client) {
      navigate('/app/quotes/new');
    }
  }, [quoteData, tenant, client, navigate]);

  const generatePDF = async () => {
    console.log('Generating PDF with data:', { 
      tenantSlug: tenant?.slug, 
      quoteId: quoteData?.id, 
      quoteNumber: quoteData?.number,
      quoteData,
      tenant 
    });

    if (!tenant?.slug) {
      alert('Unable to generate PDF: Missing tenant information');
      return null;
    }

    if (!quoteData?.id) {
      alert('Unable to generate PDF: Missing quote ID. Please ensure the quote is saved first.');
      return null;
    }

    try {
      setLoading(true);
      const result = await generateQuotePDF(tenant.slug, quoteData.id);
      setPdfUrl(result.signedUrl);
      return result.signedUrl;
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert(`Failed to generate PDF: ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  if (!quoteData || !tenant || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading quote preview...</div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const url = pdfUrl || await generatePDF();
    if (url) {
      // Create a temporary link to download the PDF
      const link = document.createElement('a');
      link.href = url;
      link.download = `quote-${quoteData.number || quoteData.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleWhatsAppShare = async () => {
    if (!client.phone) {
      alert('Client phone number is not available. Please add a phone number to the client profile.');
      return;
    }
    
    // Generate PDF first
    const url = pdfUrl || await generatePDF();
    if (!url) return;
    
    const message = `Hi ${client.name},\n\nI hope this message finds you well. Please find your quote #${quoteData.number || quoteData.id} for your review.\n\nQuote Total: ${formatMoney(total, quoteData.currency)}\nValid Until: ${formatDate(quoteData.valid_until)}\n\nI've prepared a detailed PDF for you. Please let me know if you have any questions or would like to proceed.\n\nBest regards,\n${tenant.business_name}`;
    
    // Clean phone number (remove non-digits)
    const cleanPhone = client.phone.replace(/\D/g, '');
    
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmailShare = async () => {
    // Generate PDF first
    const url = pdfUrl || await generatePDF();
    if (!url) return;
    
    const subject = `Quote #${quoteData.number || quoteData.id} from ${tenant.business_name}`;
    const body = `Dear ${client.name},

I hope this email finds you well. Please find attached your quote for your review.

Quote Details:
- Quote Number: #${quoteData.number || quoteData.id}
- Total Amount: ${formatMoney(total, quoteData.currency)}
- Valid Until: ${formatDate(quoteData.valid_until)}

The PDF quote is available at: ${url}

Please let me know if you have any questions or would like to proceed with this quote.

Best regards,
${tenant.business_name}
${tenant.business_email || ''}
${tenant.business_phone || ''}`;

    const mailtoUrl = `mailto:${client.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const generateAndDownloadPDF = async () => {
    // Create a temporary window with clean quote HTML
    return new Promise((resolve) => {
      const printWindow = window.open('', '_blank');
      const cleanHTML = generateCleanQuoteHTML();
      
      printWindow.document.write(cleanHTML);
      printWindow.document.close();
      
      // Auto-download the PDF
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
          resolve();
        }, 1000);
      };
    });
  };

  const generateCleanQuoteHTML = () => {
    const subtotal = quoteData.items.reduce((sum, item) => sum + (item.line_subtotal || 0), 0);
    const taxTotal = quoteData.items.reduce((sum, item) => sum + (item.line_tax || 0), 0);
    const total = subtotal + taxTotal;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Quote #${quoteData.number || quoteData.id}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { border-bottom: 2px solid #e5e5e5; padding-bottom: 20px; margin-bottom: 30px; }
        .company { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 10px; }
        .quote-number { font-size: 18px; font-weight: bold; color: #059669; margin-bottom: 20px; }
        .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .from, .to { width: 45%; }
        .section-title { font-weight: bold; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f9f9f9; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals { width: 300px; margin-left: auto; }
        .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .total-final { font-weight: bold; font-size: 18px; color: #059669; border-top: 2px solid #e5e5e5; padding-top: 10px; }
        .notes { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; font-size: 12px; color: #666; }
        @media print {
            body { margin: 0; }
            @page { margin: 0.5in; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company">${tenant.business_name}</div>
        <div class="quote-number">Quote #${quoteData.number || quoteData.id}</div>
    </div>
    
    <div class="details">
        <div class="from">
            <div class="section-title">From:</div>
            <div>${tenant.business_name}</div>
            ${tenant.business_address ? `<div>${tenant.business_address.replace(/\n/g, '<br>')}</div>` : ''}
            ${tenant.business_email ? `<div>Email: ${tenant.business_email}</div>` : ''}
            ${tenant.business_phone ? `<div>Phone: ${tenant.business_phone}</div>` : ''}
            ${tenant.tax_id ? `<div>Tax ID: ${tenant.tax_id}</div>` : ''}
        </div>
        <div class="to">
            <div class="section-title">To:</div>
            <div><strong>${client.name}</strong></div>
            ${client.email ? `<div>Email: ${client.email}</div>` : ''}
            ${client.phone ? `<div>Phone: ${client.phone}</div>` : ''}
            ${client.address ? `<div>${client.address.replace(/\n/g, '<br>')}</div>` : ''}
            <br>
            <div><strong>Quote Date:</strong> ${formatDate(new Date())}</div>
            <div><strong>Valid Until:</strong> ${formatDate(quoteData.valid_until)}</div>
            <div><strong>Currency:</strong> ${quoteData.currency}</div>
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th class="text-center">Unit</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Tax %</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            ${quoteData.items.map(item => `
                <tr>
                    <td>${item.description}</td>
                    <td class="text-center">${item.unit}</td>
                    <td class="text-center">${item.qty}</td>
                    <td class="text-right">${formatMoney(item.unit_price, quoteData.currency)}</td>
                    <td class="text-right">${item.tax_rate}%</td>
                    <td class="text-right">${formatMoney(item.line_total, quoteData.currency)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="totals">
        <div class="totals-row">
            <span>Subtotal:</span>
            <span>${formatMoney(subtotal, quoteData.currency)}</span>
        </div>
        <div class="totals-row">
            <span>Tax Total:</span>
            <span>${formatMoney(taxTotal, quoteData.currency)}</span>
        </div>
        <div class="totals-row total-final">
            <span>Total:</span>
            <span>${formatMoney(total, quoteData.currency)}</span>
        </div>
    </div>
    
    ${quoteData.notes ? `
        <div class="notes">
            <div class="section-title">Notes:</div>
            <div>${quoteData.notes.replace(/\n/g, '<br>')}</div>
        </div>
    ` : ''}
    
    <div class="footer">
        <div>Thank you for your business! For questions about this quote, please contact us.</div>
        <div style="margin-top: 10px; font-size: 10px;">Quote ID: ${quoteData.id}</div>
    </div>
</body>
</html>`;
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
  const subtotal = quoteData.items.reduce((sum, item) => sum + (item.line_subtotal || 0), 0);
  const taxTotal = quoteData.items.reduce((sum, item) => sum + (item.line_tax || 0), 0);
  const total = subtotal + taxTotal;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Action Bar - Hidden when printing */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {isCreated ? 'Your Quote is Ready!' : 'Quote Preview'}
            </h1>
            {isCreated && (
              <p className="text-sm text-gray-600 mt-1">
                Quote #{quoteData.number} has been successfully created
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {!isCreated && (
              <button
                type="button"
                onClick={() => navigate('/app/quotes/new')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                Back to Edit
              </button>
            )}
            
            {/* Sharing Options - only show for saved quotes */}
            {quoteData?.id && (
              <>
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  disabled={loading || !client.phone}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title={!client.phone ? "Client phone number required" : "Share via WhatsApp"}
                >
                  {loading ? <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" /> : <FontAwesomeIcon icon={faWhatsapp} className="w-4 h-4" />}
                  WhatsApp
                </button>
                
                <button
                  type="button"
                  onClick={handleEmailShare}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" /> : <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4" />}
                  Email
                </button>
                
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" /> : <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />}
                  Download PDF
                </button>
              </>
            )}
            
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPrint} className="w-4 h-4" />
              Print
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/app')}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={isCreated ? faCheck : faArrowLeft} className="w-4 h-4" />
              {isCreated ? 'Done' : 'Dashboard'}
            </button>
          </div>
        </div>
      </div>

      {/* Quote Document */}
      <div className="max-w-4xl mx-auto p-6 print:p-0">
        <div className="bg-white shadow-lg rounded-lg print:shadow-none print:rounded-none">
          
          {/* Header */}
          <div className="border-b border-gray-200 p-8 print:border-b-2 print:border-gray-300">
            <div className="grid grid-cols-2 gap-8">
              {/* From - Tenant Details */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">QUOTE</h2>
                <div className="text-sm">
                  <div className="font-semibold text-gray-900 mb-2">From:</div>
                  <div className="font-bold text-lg text-emerald-600">{tenant.business_name}</div>
                  {tenant.business_address && (
                    <div className="text-gray-600 mt-1 whitespace-pre-line">{tenant.business_address}</div>
                  )}
                  {tenant.business_email && (
                    <div className="text-gray-600">Email: {tenant.business_email}</div>
                  )}
                  {tenant.business_phone && (
                    <div className="text-gray-600">Phone: {tenant.business_phone}</div>
                  )}
                  {tenant.tax_id && (
                    <div className="text-gray-600">Tax ID: {tenant.tax_id}</div>
                  )}
                </div>
              </div>

              {/* To - Client Details */}
              <div className="text-right">
                <div className="text-sm">
                  <div className="font-semibold text-gray-900 mb-2">To:</div>
                  <div className="font-bold text-lg text-gray-900">{client.name}</div>
                  {client.email && (
                    <div className="text-gray-600">Email: {client.email}</div>
                  )}
                  {client.phone && (
                    <div className="text-gray-600">Phone: {client.phone}</div>
                  )}
                  {client.address && (
                    <div className="text-gray-600 mt-1 whitespace-pre-line">{client.address}</div>
                  )}
                </div>
                
                {/* Quote Details */}
                <div className="mt-6 text-sm">
                  <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Quote Date:</span>
                      <span>{formatDate(new Date())}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Valid Until:</span>
                      <span>{formatDate(quoteData.valid_until)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Currency:</span>
                      <span>{quoteData.currency}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Body - Items Table */}
          <div className="p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Items & Services</h3>
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tax %
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {quoteData.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm text-gray-900">
                          <div className="font-medium">{item.description}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 text-center">
                          {item.unit}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 text-center">
                          {item.qty}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 text-right">
                          {formatMoney(item.unit_price, quoteData.currency)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 text-right">
                          {item.tax_rate}%
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900 text-right">
                          {formatMoney(item.line_total, quoteData.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-80">
                <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatMoney(subtotal, quoteData.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax Total:</span>
                      <span className="font-medium">{formatMoney(taxTotal, quoteData.currency)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-gray-900">Total:</span>
                        <span className="text-emerald-600">{formatMoney(total, quoteData.currency)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Notes */}
          {quoteData.notes && (
            <div className="border-t border-gray-200 p-8 print:border-t-2 print:border-gray-300">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Notes:</h4>
              <div className="text-sm text-gray-600 whitespace-pre-line">
                {quoteData.notes}
              </div>
            </div>
          )}

          {/* Footer - Terms */}
          <div className="border-t border-gray-200 p-8 bg-gray-50 print:bg-gray-100 print:border-t-2 print:border-gray-300">
            <div className="text-xs text-gray-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold mb-2">Payment Terms:</h5>
                  <p>Payment is due within 30 days of quote acceptance. Late payments may incur additional charges.</p>
                </div>
                <div>
                  <h5 className="font-semibold mb-2">Validity:</h5>
                  <p>This quote is valid until {formatDate(quoteData.valid_until)}. Prices may change after this date.</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-300 text-center">
                <p>Thank you for your business! For questions about this quote, please contact us.</p>
                {(quoteData.number || quoteData.id) && (
                  <div className="mt-2 text-xs text-gray-400">
                    Quote Reference: #{quoteData.number || quoteData.id}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            margin: 0.5in;
            size: A4;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          
          .print\\:p-0 {
            padding: 0 !important;
          }
          
          .print\\:border-b-2 {
            border-bottom-width: 2px !important;
          }
          
          .print\\:border-t-2 {
            border-top-width: 2px !important;
          }
          
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }
          
          .print\\:bg-gray-100 {
            background-color: #f3f4f6 !important;
          }
        }
      `}</style>
    </div>
  );
}
