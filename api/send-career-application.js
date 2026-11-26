// api/send-career-application.js
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
const MAX_PAYLOAD_BYTES = 25 * 1024;

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

function cleanPhoneNumber(phone) {
  if (!phone) return "";
  const cleaned = phone.replace(/[^0-9+]/g, "");
  return cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const isAllowedOrigin = ALLOWED_ORIGIN_REGEX.test(origin);

  if (isAllowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "Only POST requests are supported on this endpoint.",
    });
  }

  const contentLength = parseInt(req.headers["content-length"] || "0", 10);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return res.status(413).json({
      error: "Payload Too Large",
      message: "Application payload exceeds maximum permitted size.",
    });
  }

  let parsedBody = req.body;
  if (typeof parsedBody === "string") {
    if (Buffer.byteLength(parsedBody, "utf8") > MAX_PAYLOAD_BYTES) {
      return res.status(413).json({
        error: "Payload Too Large",
        message: "Application payload exceeds maximum permitted size.",
      });
    }
    try {
      parsedBody = JSON.parse(parsedBody);
    } catch {
      return res.status(400).json({ error: "Invalid JSON payload." });
    }
  } else if (parsedBody && Buffer.byteLength(JSON.stringify(parsedBody), "utf8") > MAX_PAYLOAD_BYTES) {
    return res.status(413).json({
      error: "Payload Too Large",
      message: "Application payload exceeds maximum permitted size.",
    });
  }

  const {
    fullName,
    name,
    email,
    phone,
    position,
    experience,
    portfolioUrl,
    portfolio,
    message,
    coverLetter,
    briefIntro,
    keyProjects,
    botcheck,
    website_url_hp,
  } = parsedBody || {};

  if (botcheck || website_url_hp) {
    return res.status(200).json({
      success: true,
      message: "Application submitted successfully.",
    });
  }

  if (typeof email !== "string" || (fullName !== undefined && typeof fullName !== "string") || (name !== undefined && typeof name !== "string")) {
    return res.status(400).json({ error: "Validation Error", message: "Invalid input field types." });
  }

  const candidateName = String(fullName || name || "").trim().slice(0, 100);
  const candidateEmail = email.trim().toLowerCase().slice(0, 100);
  const candidatePhone = String(phone || "").trim().slice(0, 30);
  const targetPosition = String(position || "General Engineering Application").trim().slice(0, 100);
  const totalExp = String(experience || "Not Specified").trim().slice(0, 50);
  const portfolioLink = String(portfolioUrl || portfolio || "").trim().slice(0, 250);
  const coverNote = String(message || coverLetter || parsedBody?.coverNote || briefIntro || keyProjects || "").trim().slice(0, 5000);

  if (!candidateName || candidateName.length < 2) {
    return res.status(400).json({ error: "Validation Error", message: "Please provide a valid full name." });
  }

  if (!candidateEmail || !EMAIL_REGEX.test(candidateEmail)) {
    return res.status(400).json({ error: "Validation Error", message: "Please provide a valid email address." });
  }

  if (!candidatePhone || candidatePhone.length < 8) {
    return res.status(400).json({ error: "Validation Error", message: "Please provide a valid phone number." });
  }

  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "UTC",
    dateStyle: "full",
    timeStyle: "short",
  });

  const contactEmail = cleanEnvVal(process.env.DEFAULT_CONTACT_EMAIL) || "hello@example.com";
  const careersEmail = cleanEnvVal(process.env.DEFAULT_CAREERS_EMAIL) || contactEmail;
  const careersSender = formatSender(
    "Structura Careers",
    careersEmail,
    process.env.RESEND_CAREERS_FROM_EMAIL_ADDRESS
  );
  const candidateSender = formatSender(
    "Structura Architecture & Construction",
    contactEmail,
    process.env.RESEND_FROM_EMAIL_ADDRESS
  );
  const adminRecipients = getAdminEmails();
  const replyCareersEmail = careersEmail;

  let dbSaved = false;
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const sixtySecondsAgo = new Date(Date.now() - 60 * 1000).toISOString();
      const { data: existingApp } = await supabase
        .from("inquiries")
        .select("id")
        .eq("email", candidateEmail)
        .gte("created_at", sixtySecondsAgo)
        .limit(1);

      if (!existingApp || existingApp.length === 0) {
        const { error: dbErr } = await supabase.from("inquiries").insert([
          {
            name: candidateName,
            email: candidateEmail,
            phone: candidatePhone,
            service: `Career: ${targetPosition}`,
            message: `Position: ${targetPosition}\nExperience: ${totalExp}\nPortfolio/Resume: ${portfolioLink || "Not Provided"}\n\nBrief Introduction / Key Projects:\n${coverNote || "Not Provided"}`,
            status: "unread",
          },
        ]);
        if (dbErr) {
          console.warn("[Supabase] Direct insert error for career application:", dbErr.message);
        } else {
          dbSaved = true;
        }
      } else {
        dbSaved = true;
        console.warn("[Supabase] Duplicate career application detected within 60s, skipping duplicate insert.");
      }
    } catch (dbErr) {
      console.warn("[Supabase] Direct insert error for career application:", dbErr);
    }
  }

  const resend = getResendClient();
  if (!resend) {
    console.warn("[Resend] Offline/Dev mode: Resend client not configured. Saved to DB only.");
    return res.status(200).json({
      success: true,
      message: "Application received and saved successfully (Local/Dev mode).",
    });
  }

  const waPhone = cleanPhoneNumber(candidatePhone);

  const TEMPLATE_ADMIN_CAREER = cleanEnvVal(process.env.RESEND_TEMPLATE_ADMIN_CAREER);
  const TEMPLATE_CAREER_CONFIRMATION = cleanEnvVal(process.env.RESEND_TEMPLATE_CAREER_CONFIRMATION);

  const waNumber = cleanPhoneNumber(cleanEnvVal(process.env.DEFAULT_WHATSAPP_NUMBER) || "15550100000");
  const waLink = waPhone && waPhone.length >= 8
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(`Hello ${candidateName}, this is Structura Architecture & Construction regarding your application for the ${targetPosition} role.`)}`
    : `https://wa.me/${waNumber}`;

  try {
    const adminEmailPromise = resend.emails.send({
      from: careersSender,
      to: adminRecipients,
      replyTo: candidateEmail,
      subject: `[New Application] ${targetPosition} — ${candidateName}`,
      ...(TEMPLATE_ADMIN_CAREER
        ? {
            template: {
              id: TEMPLATE_ADMIN_CAREER,
              variables: {
                CANDIDATE_NAME: candidateName,
                POSITION: targetPosition,
                EXPERIENCE: totalExp,
                CANDIDATE_EMAIL: candidateEmail,
                CANDIDATE_PHONE: candidatePhone,
                PORTFOLIO_URL: portfolioLink || "Not Provided",
                COVER_NOTE: coverNote || "No additional cover note provided.",
                TIMESTAMP: timestamp,
                WHATSAPP_URL: waLink,
              },
            },
          }
        : {
            text: `New career application for ${targetPosition} from ${candidateName} (${candidateEmail}, ${candidatePhone}) at ${timestamp}.\nExperience: ${totalExp}\nPortfolio: ${portfolioLink || "Not Provided"}\n\n${coverNote}`,
          }),
    });

    const candidateEmailPromise = resend.emails.send({
      from: candidateSender,
      to: [candidateEmail],
      replyTo: replyCareersEmail,
      subject: `Application Received: ${targetPosition} — Structura Architecture & Construction`,
      ...(TEMPLATE_CAREER_CONFIRMATION
        ? {
            template: {
              id: TEMPLATE_CAREER_CONFIRMATION,
              variables: {
                CANDIDATE_NAME: candidateName,
                POSITION: targetPosition,
                EXPERIENCE: totalExp,
                TIMESTAMP: timestamp,
              },
            },
          }
        : {
            text: `Hello ${candidateName},\n\nThank you for applying for the ${targetPosition} role at Structura Architecture & Construction. We received your application on ${timestamp}.`,
          }),
    });

    const [adminResult, candidateResult] = await Promise.allSettled([adminEmailPromise, candidateEmailPromise]);

    const adminSent = adminResult.status === "fulfilled" && !adminResult.value?.error;
    const candidateSent = candidateResult.status === "fulfilled" && !candidateResult.value?.error;

    if (!adminSent) {
      console.error("[Resend] Admin career application email dispatch error:", adminResult);
    }
    if (!candidateSent) {
      console.error("[Resend] Candidate confirmation email error:", candidateResult);
    }

    if (!adminSent && !candidateSent && !dbSaved) {
      return res.status(502).json({
        success: false,
        error: "Unable to process your application right now. Please try again later.",
        adminSent: false,
        candidateSent: false,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Your application has been received. A confirmation email has been dispatched to your inbox.",
      adminSent,
      candidateSent,
    });
  } catch (err) {
    console.error("[API] Error in career application workflow:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "An unexpected error occurred while processing your application. Please try again or contact us via WhatsApp.",
    });
  }
}
