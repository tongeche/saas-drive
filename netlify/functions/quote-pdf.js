// netlify/functions/quote-pdf.js
import { supaAdmin } from "./_supa.js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function money(v, cur) { const n = Number(v || 0); return `${n.toFixed(2)}${cur ? ` ${cur}` : ""}`; }
function hexToRgb(hex, fallback = rgb(0,0,0)) {
  if (!hex) return fallback;
  const m = String(hex).trim().replace('#','');
  if (![3,6].includes(m.length)) return fallback;
  const to = (s)=>parseInt(s.length===1?s+s:s,16)/255;
  const r = to(m.length===3?m[0]:m.slice(0,2));
  const g = to(m.length===3?m[1]:m.slice(2,4));
  const b = to(m.length===3?m[2]:m.slice(4,6));
  return rgb(r,g,b);
}

// simple word-wrap for centered text
function wrapText(text, font, size, maxWidth) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    const width = font.widthOfTextAtSize(test, size);
    if (width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export const handler = async (event) => {
  const allowedOrigins = ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178", "http://localhost:8888"];
  const origin = event.headers.origin;
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    ...(allowedOrigins.includes(origin) && { "Access-Control-Allow-Origin": origin }),
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    const { tenant, quote_id } = JSON.parse(event.body || "{}");
    if (!tenant) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing tenant" }) };
    if (!quote_id) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing quote_id" }) };

    // Initialize Supabase admin client
    const supa = supaAdmin();

    // 1) Get tenant
    const { data: tenantData, error: tErr } = await supa
      .from("tenants")
      .select("*")
      .eq("slug", tenant)
      .single();
    if (tErr || !tenantData) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: "Tenant not found" }) };
    }

    // 2) Get quote with items
    const { data: quoteData, error: qErr } = await supa
      .from("quotes")
      .select(`
        *,
        quote_items(*)
      `)
      .eq("id", quote_id)
      .eq("tenant_id", tenantData.id)
      .single();

    if (qErr || !quoteData) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: "Quote not found" }) };
    }

    // 3) Get client
    let clientData = null;
    if (quoteData.client_id) {
      const { data: cData } = await supa
        .from("clients")
        .select("*")
        .eq("id", quoteData.client_id)
        .single();
      clientData = cData;
    }

    // 4) Generate PDF
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    const margin = 50;
    const contentWidth = width - 2 * margin;

    let y = height - margin;

    // Helper functions
    const drawText = (text, x, yPos, options = {}) => {
      const font = options.bold ? helveticaBold : helvetica;
      const size = options.size || 12;
      const color = options.color || rgb(0, 0, 0);
      page.drawText(String(text || ""), { x, y: yPos, size, font, color });
      return yPos - (options.lineHeight || size + 4);
    };

    const drawLine = (x1, y1, x2, y2, color = rgb(0.8, 0.8, 0.8)) => {
      page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color, thickness: 1 });
    };

    // Title and Quote Number
    const brandColor = hexToRgb(tenantData.brand_color, rgb(0.23, 0.42, 0.36));
    y = drawText("QUOTE", margin, y, { bold: true, size: 24, color: brandColor });
    y -= 10;

    // Company Info (Left Side)
    const leftX = margin;
    const rightX = width - margin - 200;
    
    let leftY = y;
    leftY = drawText("From:", leftX, leftY, { bold: true, size: 10 });
    leftY = drawText(tenantData.business_name || "", leftX, leftY, { bold: true, size: 14, color: brandColor });
    
    if (tenantData.business_address) {
      const addressLines = String(tenantData.business_address).split('\n');
      for (const line of addressLines) {
        leftY = drawText(line, leftX, leftY, { size: 10 });
      }
    }
    
    if (tenantData.business_email) {
      leftY = drawText(`Email: ${tenantData.business_email}`, leftX, leftY, { size: 10 });
    }
    if (tenantData.business_phone) {
      leftY = drawText(`Phone: ${tenantData.business_phone}`, leftX, leftY, { size: 10 });
    }
    if (tenantData.tax_id) {
      leftY = drawText(`Tax ID: ${tenantData.tax_id}`, leftX, leftY, { size: 10 });
    }

    // Client Info (Right Side)
    let rightY = y;
    rightY = drawText("To:", rightX, rightY, { bold: true, size: 10 });
    if (clientData) {
      rightY = drawText(clientData.name || "", rightX, rightY, { bold: true, size: 14 });
      if (clientData.email) {
        rightY = drawText(`Email: ${clientData.email}`, rightX, rightY, { size: 10 });
      }
      if (clientData.phone) {
        rightY = drawText(`Phone: ${clientData.phone}`, rightX, rightY, { size: 10 });
      }
      if (clientData.address) {
        const addressLines = String(clientData.address).split('\n');
        for (const line of addressLines) {
          rightY = drawText(line, rightX, rightY, { size: 10 });
        }
      }
    }

    // Quote Details Box
    rightY -= 20;
    const boxTop = rightY;
    const boxHeight = 80;
    page.drawRectangle({
      x: rightX - 10,
      y: rightY - boxHeight,
      width: 200,
      height: boxHeight,
      color: rgb(0.95, 0.95, 0.95),
    });

    rightY -= 10;
    rightY = drawText("Quote Date:", rightX, rightY, { bold: true, size: 10 });
    rightY = drawText(new Date().toLocaleDateString(), rightX + 100, rightY + 14, { size: 10 });
    
    rightY = drawText("Valid Until:", rightX, rightY, { bold: true, size: 10 });
    rightY = drawText(new Date(quoteData.valid_until).toLocaleDateString(), rightX + 100, rightY + 14, { size: 10 });
    
    rightY = drawText("Currency:", rightX, rightY, { bold: true, size: 10 });
    rightY = drawText(quoteData.currency || "EUR", rightX + 100, rightY + 14, { size: 10 });

    // Move Y position for items table
    y = Math.min(leftY, rightY) - 40;

    // Items Table
    y = drawText("Items & Services", margin, y, { bold: true, size: 14 });
    y -= 20;

    // Table Header
    const tableTop = y;
    const rowHeight = 25;
    const cols = [
      { title: "Description", x: margin, width: 200 },
      { title: "Unit", x: margin + 210, width: 50 },
      { title: "Qty", x: margin + 270, width: 40 },
      { title: "Unit Price", x: margin + 320, width: 80 },
      { title: "Tax %", x: margin + 410, width: 50 },
      { title: "Total", x: margin + 470, width: 75 }
    ];

    // Header background
    page.drawRectangle({
      x: margin,
      y: y - rowHeight,
      width: contentWidth,
      height: rowHeight,
      color: rgb(0.95, 0.95, 0.95),
    });

    // Header text
    for (const col of cols) {
      drawText(col.title, col.x + 5, y - 15, { bold: true, size: 10 });
    }

    // Header border
    drawLine(margin, y, width - margin, y);
    drawLine(margin, y - rowHeight, width - margin, y - rowHeight);

    y -= rowHeight;

    // Items
    const items = quoteData.quote_items || [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowY = y - (i * rowHeight);

      // Row background (alternating)
      if (i % 2 === 1) {
        page.drawRectangle({
          x: margin,
          y: rowY - rowHeight,
          width: contentWidth,
          height: rowHeight,
          color: rgb(0.98, 0.98, 0.98),
        });
      }

      // Item data
      drawText(item.description || "", cols[0].x + 5, rowY - 15, { size: 10 });
      drawText(item.unit || "each", cols[1].x + 5, rowY - 15, { size: 10 });
      drawText(String(item.qty || 1), cols[2].x + 5, rowY - 15, { size: 10 });
      drawText(money(item.unit_price, ""), cols[3].x + 5, rowY - 15, { size: 10 });
      drawText(`${item.tax_rate || 0}%`, cols[4].x + 5, rowY - 15, { size: 10 });
      drawText(money(item.line_total, ""), cols[5].x + 5, rowY - 15, { size: 10 });

      // Row border
      drawLine(margin, rowY - rowHeight, width - margin, rowY - rowHeight);
    }

    y -= items.length * rowHeight + 20;

    // Totals
    const totalsX = width - margin - 200;
    const currency = quoteData.currency || "EUR";
    
    y = drawText("Subtotal:", totalsX, y, { size: 12 });
    drawText(money(quoteData.subtotal, currency), totalsX + 120, y + 14, { size: 12 });
    
    y = drawText("Tax Total:", totalsX, y, { size: 12 });
    drawText(money(quoteData.tax_total, currency), totalsX + 120, y + 14, { size: 12 });
    
    // Total line
    drawLine(totalsX, y - 5, width - margin, y - 5);
    y -= 10;
    
    y = drawText("Total:", totalsX, y, { bold: true, size: 14, color: brandColor });
    drawText(money(quoteData.total, currency), totalsX + 120, y + 16, { bold: true, size: 14, color: brandColor });

    // Notes
    if (quoteData.notes) {
      y -= 40;
      y = drawText("Notes:", margin, y, { bold: true, size: 12 });
      const noteLines = wrapText(quoteData.notes, helvetica, 10, contentWidth);
      for (const line of noteLines) {
        y = drawText(line, margin, y, { size: 10 });
      }
    }

    // Footer
    y = margin + 60;
    drawLine(margin, y, width - margin, y);
    y -= 20;
    
    const footerText = "Thank you for your business! For questions about this quote, please contact us.";
    const footerLines = wrapText(footerText, helvetica, 10, contentWidth);
    for (const line of footerLines) {
      y = drawText(line, margin + (contentWidth - helvetica.widthOfTextAtSize(line, 10)) / 2, y, { size: 10 });
    }
    
    // Quote ID in footer
    y -= 10;
    const quoteRef = `Quote Reference: #${quoteData.number || quoteData.id}`;
    drawText(quoteRef, margin + (contentWidth - helvetica.widthOfTextAtSize(quoteRef, 8)) / 2, y, { size: 8, color: rgb(0.6, 0.6, 0.6) });

    // 5) Generate PDF bytes and return as base64
    const pdfBytes = await pdfDoc.save();
    const fileName = `quote-${quoteData.number || quoteData.id}.pdf`;
    const base64Pdf = Buffer.from(pdfBytes).toString('base64');

    return {
      statusCode: 200,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        pdfData: base64Pdf,
        fileName,
        quoteNumber: quoteData.number || quoteData.id,
        contentType: 'application/pdf'
      })
    };

  } catch (err) {
    console.error("Quote PDF error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || "Internal server error" })
    };
  }
};
