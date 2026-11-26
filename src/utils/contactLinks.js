import { SEO_ENTITY } from "../config/seo.config";

export function getWhatsAppUrl(message = "", phone = "") {
  const cleanPhone = (phone || SEO_ENTITY.whatsappNumber || SEO_ENTITY.whatsappPhone).replace(/\D/g, "");
  const targetPhone = cleanPhone || "15550100000";
  const defaultText = message || "Hello Structura Studio, I would like to inquire about your architecture and construction services.";
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(defaultText)}`;
}

export function getTelUrl(phone = "") {
  const cleanPhone = (phone || SEO_ENTITY.primaryPhone).replace(/[^\d+]/g, "");
  return `tel:${cleanPhone}`;
}

export function getMailtoUrl(email = "", subject = "", body = "") {
  const targetEmail = email || SEO_ENTITY.primaryEmail;
  const params = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  const query = params.length > 0 ? `?${params.join("&")}` : "";
  return `mailto:${targetEmail}${query}`;
}
