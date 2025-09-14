// PDF Receipt Generator
// Creates receipt-sized PDFs with proper formatting for sharing

import jsPDF from 'jspdf';

export class ReceiptPDFGenerator {
  constructor() {
    // Receipt dimensions (thermal receipt size: 80mm wide)
    this.width = 80; // mm
    this.height = 'auto'; // Will be calculated based on content
    this.margin = 4; // mm
    this.lineHeight = 4; // mm
    this.fontSize = {
      title: 12,
      normal: 8,
      small: 7
    };
  }

  async generateReceiptPDF(receiptData, tenantData, clientData = null) {
    try {
      // Create PDF with custom dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [this.width, 200] // Start with height, will trim later
      });

      let currentY = this.margin;
      const maxWidth = this.width - (this.margin * 2);

      // Helper function to add text
      const addText = (text, fontSize, align = 'left', isBold = false) => {
        pdf.setFontSize(fontSize);
        if (isBold) {
          pdf.setFont('helvetica', 'bold');
        } else {
          pdf.setFont('helvetica', 'normal');
        }
        
        if (align === 'center') {
          pdf.text(text, this.width / 2, currentY, { align: 'center' });
        } else if (align === 'right') {
          pdf.text(text, this.width - this.margin, currentY, { align: 'right' });
        } else {
          pdf.text(text, this.margin, currentY);
        }
        currentY += this.lineHeight;
      };

      // Helper function to add line
      const addLine = () => {
        pdf.line(this.margin, currentY, this.width - this.margin, currentY);
        currentY += this.lineHeight / 2;
      };

      // Helper function to add space
      const addSpace = (multiplier = 1) => {
        currentY += this.lineHeight * multiplier;
      };

      // Business Header
      addText(tenantData.business_name || 'Business Name', this.fontSize.title, 'center', true);
      
      if (tenantData.owner_email) {
        addText(tenantData.owner_email, this.fontSize.small, 'center');
      }
      
      if (tenantData.phone) {
        addText(tenantData.phone, this.fontSize.small, 'center');
      }
      
      if (tenantData.address) {
        // Split long addresses
        const addressLines = this.splitText(pdf, tenantData.address, maxWidth, this.fontSize.small);
        addressLines.forEach(line => {
          addText(line, this.fontSize.small, 'center');
        });
      }

      addSpace();
      addLine();
      addSpace();

      // Receipt Header
      addText('RECEIPT', this.fontSize.title, 'center', true);
      addSpace();

      // Receipt Details
      addText(`Receipt No: ${receiptData.number || 'N/A'}`, this.fontSize.normal);
      addText(`Date: ${this.formatDate(receiptData.date)}`, this.fontSize.normal);
      addText(`Time: ${this.formatTime(receiptData.created_at)}`, this.fontSize.normal);
      
      if (receiptData.vendor_name) {
        addText(`Vendor: ${receiptData.vendor_name}`, this.fontSize.normal);
      }

      // Client Information (if available)
      if (clientData && clientData.name) {
        addSpace();
        addText('Bill To:', this.fontSize.normal, 'left', true);
        addText(clientData.name, this.fontSize.normal);
        if (clientData.email) {
          addText(clientData.email, this.fontSize.small);
        }
        if (clientData.phone) {
          addText(clientData.phone, this.fontSize.small);
        }
      }

      addSpace();
      addLine();
      addSpace();

      // Item Details
      addText('DESCRIPTION', this.fontSize.normal, 'left', true);
      addSpace(0.5);
      
      if (receiptData.description) {
        const descLines = this.splitText(pdf, receiptData.description, maxWidth, this.fontSize.normal);
        descLines.forEach(line => {
          addText(line, this.fontSize.normal);
        });
      }

      if (receiptData.category) {
        addText(`Category: ${this.getCategoryLabel(receiptData.category)}`, this.fontSize.small);
      }

      if (receiptData.payment_method) {
        addText(`Payment: ${receiptData.payment_method}`, this.fontSize.small);
      }

      addSpace();
      addLine();
      addSpace();

      // Amount Details
      const currency = receiptData.currency || tenantData.currency || 'EUR';
      
      // Subtotal (if available)
      if (receiptData.amount && receiptData.amount !== receiptData.total) {
        const subtotalLine = `Subtotal: ${this.formatCurrency(receiptData.amount, currency)}`;
        addText(subtotalLine, this.fontSize.normal);
      }

      // Tax (if available)
      if (receiptData.tax_amount && receiptData.tax_amount > 0) {
        const taxLine = `Tax: ${this.formatCurrency(receiptData.tax_amount, currency)}`;
        addText(taxLine, this.fontSize.normal);
      }

      addSpace();
      addLine();

      // Total
      const total = receiptData.total || receiptData.amount || 0;
      const totalLine = `TOTAL: ${this.formatCurrency(total, currency)}`;
      addText(totalLine, this.fontSize.title, 'center', true);

      addSpace();
      addLine();
      addSpace();

      // Status
      if (receiptData.status) {
        const statusText = receiptData.status.toUpperCase();
        addText(`Status: ${statusText}`, this.fontSize.normal, 'center');
        addSpace();
      }

      // Footer
      addText('Thank you for your business!', this.fontSize.small, 'center');
      addSpace();
      
      if (tenantData.business_name) {
        addText(tenantData.business_name, this.fontSize.small, 'center');
      }

      // Add timestamp
      addSpace();
      addText(`Generated: ${new Date().toLocaleString()}`, this.fontSize.small, 'center');

      // Trim PDF height to actual content
      const finalHeight = currentY + this.margin;
      const finalPdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [this.width, finalHeight]
      });

      // Copy content to final PDF
      const imgData = pdf.output('datauristring');
      finalPdf.addImage(imgData, 'JPEG', 0, 0, this.width, finalHeight);

      return finalPdf;

    } catch (error) {
      console.error('Error generating receipt PDF:', error);
      throw new Error('Failed to generate receipt PDF');
    }
  }

  // Helper method to split long text into multiple lines
  splitText(pdf, text, maxWidth, fontSize) {
    pdf.setFontSize(fontSize);
    return pdf.splitTextToSize(text, maxWidth);
  }

  // Format currency based on locale
  formatCurrency(amount, currency = 'EUR') {
    if (currency === 'KES') {
      return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES'
      }).format(amount);
    }
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Format date for receipt
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  // Format time for receipt
  formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Get category label
  getCategoryLabel(category) {
    const labels = {
      office_supplies: 'Office Supplies',
      travel: 'Travel',
      meals: 'Meals & Entertainment',
      equipment: 'Equipment',
      utilities: 'Utilities',
      other: 'Other'
    };
    return labels[category] || category;
  }
}

// Receipt sharing utilities
export class ReceiptSharing {
  constructor() {
    this.pdfGenerator = new ReceiptPDFGenerator();
  }

  async generateAndDownload(receiptData, tenantData, clientData = null) {
    try {
      const pdf = await this.pdfGenerator.generateReceiptPDF(receiptData, tenantData, clientData);
      const filename = `receipt_${receiptData.number || receiptData.id}_${Date.now()}.pdf`;
      pdf.save(filename);
      return { success: true, filename };
    } catch (error) {
      console.error('Error downloading receipt:', error);
      return { success: false, error: error.message };
    }
  }

  async generateAndView(receiptData, tenantData, clientData = null) {
    try {
      const pdf = await this.pdfGenerator.generateReceiptPDF(receiptData, tenantData, clientData);
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Open in new window/tab
      window.open(pdfUrl, '_blank');
      
      return { success: true, url: pdfUrl };
    } catch (error) {
      console.error('Error viewing receipt:', error);
      return { success: false, error: error.message };
    }
  }

  async generateAndShare(receiptData, tenantData, clientData = null) {
    try {
      const pdf = await this.pdfGenerator.generateReceiptPDF(receiptData, tenantData, clientData);
      const pdfBlob = pdf.output('blob');
      
      // Create filename
      const filename = `receipt_${receiptData.number || receiptData.id}.pdf`;
      
      // Prepare sharing content
      const shareText = this.generateShareText(receiptData, tenantData);
      
      // Check if Web Share API is available (mobile)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], filename, { type: 'application/pdf' })] })) {
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });
        await navigator.share({
          title: `Receipt ${receiptData.number}`,
          text: shareText,
          files: [file]
        });
        return { success: true, method: 'native' };
      }
      
      // Fallback to WhatsApp Web sharing
      const whatsappUrl = this.generateWhatsAppUrl(shareText, tenantData.phone);
      
      // Create download link for PDF
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = pdfUrl;
      downloadLink.download = filename;
      downloadLink.click();
      
      // Open WhatsApp after a short delay
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 1000);
      
      return { 
        success: true, 
        method: 'whatsapp', 
        whatsappUrl,
        downloadUrl: pdfUrl 
      };
      
    } catch (error) {
      console.error('Error sharing receipt:', error);
      return { success: false, error: error.message };
    }
  }

  generateShareText(receiptData, tenantData) {
    const currency = receiptData.currency || tenantData.currency || 'EUR';
    const total = receiptData.total || receiptData.amount || 0;
    const formattedAmount = this.pdfGenerator.formatCurrency(total, currency);
    
    return `Receipt from ${tenantData.business_name || 'Business'}
Receipt No: ${receiptData.number || 'N/A'}
Date: ${this.pdfGenerator.formatDate(receiptData.date)}
Amount: ${formattedAmount}
${receiptData.description ? `Details: ${receiptData.description}` : ''}

Thank you for your business!`;
  }

  generateWhatsAppUrl(text, phoneNumber = null) {
    const encodedText = encodeURIComponent(text);
    
    if (phoneNumber) {
      // Remove any non-numeric characters and ensure proper format
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      return `https://wa.me/${cleanPhone}?text=${encodedText}`;
    } else {
      // Open WhatsApp without specific number
      return `https://wa.me/?text=${encodedText}`;
    }
  }
}

// Export default instance
export const receiptPDFGenerator = new ReceiptPDFGenerator();
export const receiptSharing = new ReceiptSharing();
