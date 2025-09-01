import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/** Capture a DOM element and return a PDF Blob (A4 portrait). */
export async function elementToPdfBlob(el, { scale = 2 } = {}) {
  if (!el) throw new Error("Missing element to render");
  const canvas = await html2canvas(el, { scale, backgroundColor: "#ffffff", useCORS: true });
  const img = canvas.toDataURL("image/png");

  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 36; // 0.5in
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;

  // fit image into page box while keeping aspect
  let w = maxW;
  let h = (canvas.height / canvas.width) * w;
  if (h > maxH) { h = maxH; w = (canvas.width / canvas.height) * h; }

  const x = (pageW - w) / 2;
  const y = margin;
  pdf.addImage(img, "PNG", x, y, w, h, undefined, "FAST");
  return pdf.output("blob");
}
