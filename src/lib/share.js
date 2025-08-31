export function whatsappShareLink(invoiceNumber, link) {
  const text = `Invoice ${invoiceNumber}\n${link}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
