export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/;

export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  return EMAIL_REGEX.test(email.trim());
}

export function isValidPhone(phone) {
  if (!phone || typeof phone !== "string") return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export function isBotSubmission(formData, loadTimestamp) {
  if (formData.botcheck) return true;
  if (formData.website_url_hp && formData.website_url_hp.trim().length > 0) return true;
  if (loadTimestamp && Date.now() - loadTimestamp < 400) return true;
  return false;
}

export function checkRateLimit(storageKey = "app_form_submissions", maxSubmissions = 10, windowMs = 15 * 60 * 1000) {
  try {
    const raw = localStorage.getItem(storageKey);
    const now = Date.now();
    const timestamps = raw ? JSON.parse(raw) : [];
    
    const active = timestamps.filter((ts) => now - ts < windowMs);
    
    if (active.length >= maxSubmissions) {
      return { allowed: false, remaining: 0 };
    }
    
    return { allowed: true, remaining: maxSubmissions - active.length };
  } catch {
    return { allowed: true, remaining: maxSubmissions };
  }
}

export function recordSubmission(storageKey = "app_form_submissions", windowMs = 15 * 60 * 1000) {
  try {
    const raw = localStorage.getItem(storageKey);
    const now = Date.now();
    const timestamps = raw ? JSON.parse(raw) : [];
    const active = timestamps.filter((ts) => now - ts < windowMs);
    active.push(now);
    localStorage.setItem(storageKey, JSON.stringify(active));
  } catch (err) {
    console.warn("Could not save submission rate limit:", err);
  }
}
