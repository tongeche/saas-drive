/**
 * Finovo persona presets — safe fields only
 * (No schema changes needed.)
 */
export const PERSONAS = [
  {
    key: "freelancer",
    name: "Freelancer",
    description: "Solo consultant / creative / contractor",
    currency: "USD",
    invoice_prefix: "INV",
    brand_color: "#3c6b5b",
    footer_note: "Payment due within 7 days. Thank you!",
    emoji: "🧑‍💻",
  },
  {
    key: "cafe",
    name: "Café / Retail",
    description: "Small shop / café / salon",
    currency: "KES",
    invoice_prefix: "RCPT",
    brand_color: "#2f5548",
    footer_note: "Thank you for your business. Karibu tena!",
    emoji: "☕",
  },
  {
    key: "agency",
    name: "Agency",
    description: "Creative / marketing / dev studio",
    currency: "EUR",
    invoice_prefix: "AGY",
    brand_color: "#365A8C",
    footer_note: "Standard NET 14 terms apply.",
    emoji: "🏢",
  },
  {
    key: "services",
    name: "Services",
    description: "Trades / field / professional services",
    currency: "USD",
    invoice_prefix: "SRV",
    brand_color: "#4f6f60",
    footer_note: "Please settle via bank transfer or M-PESA.",
    emoji: "🛠️",
  },
];

export function getPreset(key) {
  return PERSONAS.find(p => p.key === key) || null;
}
