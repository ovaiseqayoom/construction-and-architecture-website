// api/subscribe.js
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
const MAX_PAYLOAD_BYTES = 10 * 1024;

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
  "burnermail.io", "nada.ltd", "mohmal.com", "mytemp.email", "crazymailing.com",
  "disposablemail.com", "mailcatch.com", "inboxkitten.com", "maildrop.cc",
  "guerrillamail.net", "guerrillamail.biz", "guerrillamail.org", "grr.la",
  "guerrillamailblock.com", "pokemail.net", "spam4.me", "10minutemail.net",
  "tempail.com", "emailondeck.com", "getnada.com", "abcvg.com", "dropmail.me"
]);

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
    return res.status(413).json({ error: "Payload exceeds 10KB limit." });
  }

  const {
    email,
    action = "subscribe",
    botcheck,
    website_url_hp,
    company_tax_hp,
    _formLoadedAt
  } = req.body || {};

  if (
    botcheck ||
    (website_url_hp && typeof website_url_hp === "string" && website_url_hp.trim().length > 0) ||
    (company_tax_hp && typeof company_tax_hp === "string" && company_tax_hp.trim().length > 0)
  ) {
    return res.status(200).json({ success: true, message: "Subscription received." });
  }

  if (_formLoadedAt) {
    const elapsed = Date.now() - Number(_formLoadedAt);
    if (!isNaN(elapsed) && elapsed > 0 && elapsed < 800) {
      return res.status(200).json({ success: true, message: "Subscription received." });
    }
  }

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email address is required." });
  }

  const cleanEmail = email.trim().toLowerCase().slice(0, 100);
  if (action !== "subscribe" && action !== "unsubscribe") {
    return res.status(400).json({ error: "Invalid subscription action." });
  }
  const isUnsubscribe = action === "unsubscribe";

  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    return res.status(400).json({ error: "Please provide a valid email address (max 100 characters)." });
  }

  if (isDisposableEmail(cleanEmail)) {
    return res.status(400).json({ error: "Please provide a permanent personal or corporate email address." });
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

  const adminEmails = getAdminEmails();
  const supabase = getSupabaseClient();

  if (!supabase) {
    console.error("[Supabase] Missing server-only SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    return res.status(503).json({
      success: false,
      action,
      error: "Database service is temporarily unavailable. Please try again later.",
      adminSent: false,
      subscriberSent: false,
      userSent: false,
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
          error: "Too many subscription requests for this email. Please try again later."
        });
      }

      const { error: dbError } = await supabase.from("inquiries").insert([
        {
          name: isUnsubscribe ? "Newsletter Unsubscribe" : "Newsletter Subscriber",
          email: cleanEmail,
          phone: null,
          service: isUnsubscribe ? "Newsletter Unsubscribe" : "Newsletter Subscription",
          message: isUnsubscribe
            ? `User requested to unsubscribe from newsletter communications at ${timestamp}.`
            : `User opted-in to newsletter communications from website footer on ${timestamp}.`,
          status: "unread",
        },
      ]);
      if (dbError) {
        console.error("[Supabase] Newsletter log error:", dbError.message);
      } else {
        dbSaved = true;
      }
    } catch (err) {
      console.error("[Supabase] Database connection error (continuing with email dispatch):", err?.message || err);
    }
  }

  const resend = getResendClient();
  if (!resend) {
    console.warn("[Resend] Resend API client unavailable. Newsletter email dispatch was skipped.");
    return res.status(503).json({
      success: false,
      action,
      error: "Email delivery is temporarily unavailable. Please try again later.",
      adminSent: false,
      subscriberSent: false,
    });
  }

  try {
    const contactEmail = cleanEnvVal(process.env.DEFAULT_CONTACT_EMAIL) || "hello@example.com";
    const newsletterEmail = cleanEnvVal(process.env.DEFAULT_NEWSLETTER_EMAIL) || contactEmail;
    const adminNewsletterSender = `Structura Newsletter <${newsletterEmail}>`;
    const adminUnsubSender = `Newsletter Unsubscribe <${newsletterEmail}>`;

    const publicUserSender = formatSender(
      "Structura Architecture & Construction",
      contactEmail,
      process.env.RESEND_FROM_EMAIL_ADDRESS
    );

    const TEMPLATE_ADMIN_UNSUB = cleanEnvVal(process.env.RESEND_TEMPLATE_ADMIN_NEWSLETTER_UNSUB);
    const TEMPLATE_USER_UNSUB = cleanEnvVal(process.env.RESEND_TEMPLATE_NEWSLETTER_UNSUB);
    const TEMPLATE_ADMIN_NEWSLETTER = cleanEnvVal(process.env.RESEND_TEMPLATE_ADMIN_NEWSLETTER);
    const TEMPLATE_NEWSLETTER_WELCOME = cleanEnvVal(process.env.RESEND_TEMPLATE_NEWSLETTER_WELCOME);

    if (isUnsubscribe) {
      const adminUnsubPromise = resend.emails.send({
        from: adminUnsubSender,
        to: adminEmails,
        replyTo: cleanEmail,
        subject: `[Unsubscribe] ${cleanEmail}`,
        ...(TEMPLATE_ADMIN_UNSUB
          ? {
              template: {
                id: TEMPLATE_ADMIN_UNSUB,
                variables: {
                  SUBSCRIBER_EMAIL: cleanEmail,
                  TIMESTAMP: timestamp,
                },
              },
            }
          : {
              text: `${cleanEmail} unsubscribed at ${timestamp}.`,
            }),
      });

      const userUnsubPromise = resend.emails.send({
        from: publicUserSender,
        to: [cleanEmail],
        replyTo: adminEmails[0] || contactEmail,
        subject: "You have been unsubscribed — Structura Architecture & Construction",
        ...(TEMPLATE_USER_UNSUB
          ? {
              template: {
                id: TEMPLATE_USER_UNSUB,
                variables: {
                  SUBSCRIBER_EMAIL: cleanEmail,
                  TIMESTAMP: timestamp,
                },
              },
            }
          : {
              text: `You have been unsubscribed from Structura Architecture & Construction updates (${timestamp}).`,
            }),
      });

      const [adminResult, userResult] = await Promise.allSettled([adminUnsubPromise, userUnsubPromise]);
      const adminSent = adminResult.status === "fulfilled" && !adminResult.value?.error;
      const userSent = userResult.status === "fulfilled" && !userResult.value?.error;

      if (!adminSent && !userSent && !dbSaved) {
        return res.status(502).json({
          success: false,
          action: "unsubscribe",
          error: "Unable to process unsubscribe request right now. Please try again later.",
          adminSent: false,
          userSent: false,
        });
      }

      return res.status(200).json({
        success: true,
        action: "unsubscribe",
        message: "You have been unsubscribed from the newsletter successfully.",
        adminSent,
        userSent,
      });
    }

    const adminNotificationPromise = resend.emails.send({
      from: adminNewsletterSender,
      to: adminEmails,
      replyTo: cleanEmail,
      subject: `[New Subscriber] ${cleanEmail}`,
      ...(TEMPLATE_ADMIN_NEWSLETTER
        ? {
            template: {
              id: TEMPLATE_ADMIN_NEWSLETTER,
              variables: {
                SUBSCRIBER_EMAIL: cleanEmail,
                TIMESTAMP: timestamp,
              },
            },
          }
        : {
            text: `New newsletter subscriber: ${cleanEmail} (${timestamp}).`,
          }),
    });

    const subscriberEmailPromise = resend.emails.send({
      from: publicUserSender,
      to: [cleanEmail],
      replyTo: adminEmails[0] || contactEmail,
      subject: "Welcome to Structura Engineering Insights",
      ...(TEMPLATE_NEWSLETTER_WELCOME
        ? {
            template: {
              id: TEMPLATE_NEWSLETTER_WELCOME,
              variables: {
                SUBSCRIBER_EMAIL: cleanEmail,
                TIMESTAMP: timestamp,
              },
            },
          }
        : {
            text: `Thank you for subscribing to Structura Architecture & Construction (${timestamp}).`,
          }),
    });

    const [adminResult, subscriberResult] = await Promise.allSettled([adminNotificationPromise, subscriberEmailPromise]);

    const adminSent = adminResult.status === "fulfilled" && !adminResult.value?.error;
    const subscriberSent = subscriberResult.status === "fulfilled" && !subscriberResult.value?.error;

    if (!adminSent) {
      const err = adminResult.status === "rejected" ? adminResult.reason : adminResult.value?.error;
      console.error("[Resend] Admin subscription notification error:", err);
    }
    if (!subscriberSent) {
      const err = subscriberResult.status === "rejected" ? subscriberResult.reason : subscriberResult.value?.error;
      console.error("[Resend] Subscriber welcome email error:", err);
    }

    if (!adminSent && !subscriberSent) {
      if (!dbSaved) {
        return res.status(502).json({
          success: false,
          action: "subscribe",
          error: "Unable to register subscription right now. Please try again later.",
          adminSent: false,
          subscriberSent: false,
        });
      }
      console.warn("[Subscribe API] Email dispatches unconfirmed, but subscription is saved in Supabase.");
    }

    return res.status(200).json({
      success: true,
      action: "subscribe",
      message: "Subscribed successfully and confirmation dispatched.",
      adminSent,
      subscriberSent,
    });
  } catch (err) {
    console.error("[Subscribe API] Unhandled server error:", err);
    return res.status(500).json({
      success: false,
      error: "An error occurred while processing your subscription request. Please try again later.",
    });
  }
}
