// api/send-inquiry.js
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const EMAIL_REGEX = /^[A-Za-z0-9.!#$%&'*+/=?^_{}|~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
const SITE_URL = (process.env.VITE_SITE_URL || process.env.SITE_URL || "https://example.com").replace(/\/$/, "");
const SITE_ORIGIN_HOST = (() => {
  try {
    return new URL(SITE_URL).hostname.replace(/^www\./, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  } catch {
    return "example\\.com";
  }
})();
const ALLOWED_ORIGIN_REGEX = new RegExp(
  `^(https://([a-zA-Z0-9-]+\\.)?${SITE_ORIGIN_HOST}|http://localhost:(5173|5174|3000)|http://127\\.0\\.0\\.1:(5173|5174|3000))$`
);
const MAX_PAYLOAD_BYTES = 20 * 1024;

function cleanEnvVal(val) {
  if (!val) return "";
  let clean = String(val).trim();
  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'"))
  ) {
    clean = clean.slice(1, -1).trim();
  }
  return clean;
}

function getAdminEmails() {
  const envAdmins = cleanEnvVal(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL);
  if (envAdmins) {
    const parsed = envAdmins
      .split(",")
      .map((e) => cleanEnvVal(e).toLowerCase())
      .filter((e) => EMAIL_REGEX.test(e));
    if (parsed.length > 0) return parsed;
  }
  return [cleanEnvVal(process.env.DEFAULT_CONTACT_EMAIL) || "hello@example.com"];
}

function formatSender(defaultName, defaultEmail, envOverride) {
  const candidate = cleanEnvVal(envOverride);
  if (candidate) {
    const match = candidate.match(/^([^<>\r\n]+)\s*<([^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)>$/);
    if (match) {
      const name = match[1].trim().replace(/[<>\r\n]/g, "");
      const email = match[2].trim().toLowerCase();
      if (EMAIL_REGEX.test(email)) {
        return `${name} <${email}>`;
      }
    }
    if (EMAIL_REGEX.test(candidate.toLowerCase())) {
      return `${defaultName} <${candidate.toLowerCase()}>`;
    }
  }
  return `${defaultName} <${defaultEmail}>`;
}

function getResendClient() {
  const apiKey = cleanEnvVal(process.env.RESEND_API_KEY || process.env.RESEND);
  if (!apiKey) {
    console.warn("[Resend] Warning: RESEND_API_KEY environment variable is not configured.");
    return null;
  }
  try {
    return new Resend(apiKey);
  } catch (err) {
    console.error("[Resend] Error initializing client:", err?.message || err);
    return null;
  }
}

function getSupabaseClient() {
  const url = cleanEnvVal(process.env.SUPABASE_URL);
  const key = cleanEnvVal(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (url && key) {
    try {
      return createClient(url, key);
    } catch (err) {
      console.error("[Supabase] Error initializing client:", err?.message || err);
    }
  }
  return null;
}

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "tempmail.com", "mailinator.com", "guerrillamail.com", "10minutemail.com",
  "trashmail.com", "yopmail.com", "dispostable.com", "sharklasers.com",
  "getairmail.com", "temp-mail.org", "fakeinbox.com", "throwawaymail.com",
  "burnermail.io", "nada.ltd", "mohmal.com", "mytemp.email"
]);

function cleanPhoneNumber(phone) {
  if (!phone) return "";
  return phone.replace(/[^0-9]/g, "");
}

function countUrls(text) {
  if (!text) return 0;
  const matches = text.match(/(https?:\/\/|www\.|\.ru\/|\.xyz\/|\[url=)/gi);
  return matches ? matches.length : 0;
}

function isDisposableEmail(email) {
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(parts[1].toLowerCase());
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGIN_REGEX.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", SITE_URL);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  if (req.body && JSON.stringify(req.body).length > MAX_PAYLOAD_BYTES) {
    return res.status(413).json({ error: "Payload exceeds size limit." });
  }

  let bodyData = req.body;
  if (typeof bodyData === "string") {
    try {
      bodyData = JSON.parse(bodyData);
    } catch {
      try {
        bodyData = Object.fromEntries(new URLSearchParams(bodyData));
      } catch {
        bodyData = {};
      }
    }
  }

  const {
    name,
    email,
    phone,
    service,
    message,
    botcheck,
    website_url_hp,
    _formLoadedAt
  } = bodyData || {};

  if (botcheck || (website_url_hp && typeof website_url_hp === "string" && website_url_hp.trim().length > 0)) {
    return res.status(200).json({ success: true, message: "Inquiry received." });
  }

  if (_formLoadedAt) {
    const elapsed = Date.now() - Number(_formLoadedAt);
    if (!isNaN(elapsed) && elapsed > 0 && elapsed < 1200) {
      return res.status(200).json({ success: true, message: "Inquiry received." });
    }
  }

  if (!name || typeof name !== "string" || !email || typeof email !== "string" || !message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing or invalid required fields (name, email, message)." });
  }

  const cleanName = name.replace(/<[^>]*>?/gm, "").replace(/[<>\r\n]/g, "").trim().slice(0, 100);
  const cleanEmail = email.trim().toLowerCase().slice(0, 100);
  const cleanPhone = String(phone || "Not Provided").replace(/[<>\r\n]/g, "").trim().slice(0, 30);
  const cleanService = String(service || "General Engineering Consultation").replace(/[<>\r\n]/g, "").trim().slice(0, 100);
  const cleanMessage = message.replace(/<[^>]*>?/gm, "").trim().slice(0, 1000);

  if (cleanName.length < 2) {
    return res.status(400).json({ error: "Name must be at least 2 characters long." });
  }

  if (!EMAIL_REGEX.test(cleanEmail)) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  if (isDisposableEmail(cleanEmail)) {
    return res.status(400).json({ error: "Please provide a valid permanent personal or corporate email address." });
  }

  if (cleanMessage.length < 3) {
    return res.status(400).json({ error: "Message must be at least 3 characters long." });
  }

  if (countUrls(cleanMessage) > 3) {
    return res.status(400).json({ error: "Too many web links detected in message. Please describe your project in plain text." });
  }

  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const waPhone = cleanPhoneNumber(cleanPhone);
  const adminEmails = getAdminEmails();
  const supabase = getSupabaseClient();

  if (!supabase) {
    console.error("[Supabase] Missing server-only SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    return res.status(503).json({
      success: false,
      error: "Database service is temporarily unavailable. Please try again later.",
      adminSent: false,
      clientSent: false,
    });
  }

  let dbSaved = false;
  if (supabase) {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { count, error: countError } = await supabase
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .eq("email", cleanEmail)
        .gte("created_at", fifteenMinutesAgo);

      if (!countError && typeof count === "number" && count >= 5) {
        return res.status(429).json({
          error: "You have submitted several inquiries recently. Our engineering team is already reviewing your request."
        });
      }

      const { error: dbError } = await supabase.from("inquiries").insert([
        {
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone !== "Not Provided" ? cleanPhone : null,
          service: cleanService,
          message: cleanMessage,
          status: "unread",
        },
      ]);
      if (dbError) {
        console.error("[Supabase] Inquiry insert error:", dbError.message);
      } else {
        dbSaved = true;
      }
    } catch (err) {
      console.error("[Supabase] Database connection error (continuing with email dispatch):", err?.message || err);
    }
  }

  const resend = getResendClient();
  if (!resend) {
    console.warn("[Resend] Resend API client unavailable. Inquiry email dispatch was skipped.");
    return res.status(503).json({
      success: false,
      error: "Email delivery is temporarily unavailable. Please try again later.",
      adminSent: false,
      clientSent: false,
    });
  }

  try {
    const contactEmail = cleanEnvVal(process.env.DEFAULT_CONTACT_EMAIL) || "hello@example.com";
    const inquiryEmail = cleanEnvVal(process.env.DEFAULT_INQUIRY_EMAIL) || contactEmail;
    const adminSender = `Structura Inquiries <${inquiryEmail}>`;

    const clientSender = formatSender(
      "Structura Architecture & Construction",
      contactEmail,
      process.env.RESEND_FROM_EMAIL_ADDRESS
    );

    const TEMPLATE_ADMIN_INQUIRY = cleanEnvVal(process.env.RESEND_TEMPLATE_ADMIN_INQUIRY);
    const TEMPLATE_CLIENT_INQUIRY = cleanEnvVal(process.env.RESEND_TEMPLATE_CLIENT_INQUIRY);

    const waNumber = cleanPhoneNumber(cleanEnvVal(process.env.DEFAULT_WHATSAPP_NUMBER) || "15550100000");
    const waLink = waPhone && waPhone.length >= 10
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(`Hello ${cleanName}, this is Structura Architecture & Construction regarding your inquiry for ${cleanService}.`)}`
      : `https://wa.me/${waNumber}`;

    const adminEmailPayload = {
      from: adminSender,
      to: adminEmails,
      replyTo: cleanEmail,
      subject: `[New Inquiry] ${cleanService} — ${cleanName}`,
      ...(TEMPLATE_ADMIN_INQUIRY
        ? {
          template: {
            id: TEMPLATE_ADMIN_INQUIRY,
            variables: {
              CLIENT_NAME: cleanName,
              SERVICE: cleanService,
              CLIENT_EMAIL: cleanEmail,
              CLIENT_PHONE: cleanPhone,
              TIMESTAMP: timestamp,
              MESSAGE: cleanMessage || "No additional message provided.",
              WHATSAPP_URL: waLink,
            },
          },
        }
        : {
          text: `New inquiry from ${cleanName} (${cleanEmail}, ${cleanPhone}) for ${cleanService} at ${timestamp}:\n\n${cleanMessage}`,
        }),
    };

    const clientEmailPayload = {
      from: clientSender,
      to: [cleanEmail],
      replyTo: inquiryEmail,
      subject: "Consultation Inquiry Received — Structura Architecture & Construction",
      ...(TEMPLATE_CLIENT_INQUIRY
        ? {
          template: {
            id: TEMPLATE_CLIENT_INQUIRY,
            variables: {
              CLIENT_NAME: cleanName,
              SERVICE: cleanService,
              PHONE: cleanPhone,
              TIMESTAMP: timestamp,
            },
          },
        }
        : {
          text: `Hello ${cleanName},\n\nThank you for contacting Structura Architecture & Construction regarding ${cleanService}. We received your message on ${timestamp} and will respond shortly.`,
        }),
    };

    const [adminResult, clientResult] = await Promise.allSettled([
      resend.emails.send(adminEmailPayload),
      resend.emails.send(clientEmailPayload),
    ]);

    const adminSent = adminResult.status === "fulfilled" && !adminResult.value?.error;
    const clientSent = clientResult.status === "fulfilled" && !clientResult.value?.error;

    if (!adminSent) {
      const err = adminResult.status === "rejected" ? adminResult.reason : adminResult.value?.error;
      console.error("[Resend] Admin inquiry email dispatch error:", err);
    }
    if (!clientSent) {
      const err = clientResult.status === "rejected" ? clientResult.reason : clientResult.value?.error;
      console.error("[Resend] Client inquiry confirmation email error:", err);
    }

    if (!adminSent && !clientSent) {
      if (!dbSaved) {
        return res.status(502).json({
          success: false,
          error: "Unable to save or send your inquiry right now. Please try again shortly.",
          adminSent: false,
          clientSent: false,
        });
      }
      console.warn("[Inquiry API] Email dispatches unconfirmed, but inquiry is saved in Supabase.");
    }

    return res.status(200).json({
      success: true,
      message: "Inquiry registered and acknowledged successfully.",
      adminSent,
      clientSent,
    });
  } catch (err) {
    console.error("[Inquiry API] Unhandled server error:", err);
    return res.status(500).json({
      success: false,
      error: "An error occurred while processing your inquiry. Please try again later or connect with us directly via phone or WhatsApp.",
    });
  }
}
