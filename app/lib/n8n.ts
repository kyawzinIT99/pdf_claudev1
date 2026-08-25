import { applicationRuntime } from "./hostinger-runtime";

type N8nRuntime = {
  CRM_ALERTS_ENABLED?: string;
  CRM_TELEGRAM_CHAT_ID?: string;
  CRM_ALERT_EMAIL?: string;
  N8N_INQUIRY_ALERT_WEBHOOK?: string;
  N8N_INQUIRY_WEBHOOK_SECRET?: string;
  N8N_PUBLISH_WEBHOOK?: string;
  N8N_SUBSCRIBE_ALERT_WEBHOOK?: string;
  N8N_EVENT_MAIL_WEBHOOK?: string;
  N8N_BASE_URL?: string;
};

function runtime() {
  return applicationRuntime() as unknown as N8nRuntime;
}

function secretHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "PDF-Website-Automation/1.0",
  };
  const secret = runtime().N8N_INQUIRY_WEBHOOK_SECRET?.trim();
  if (secret) {
    headers["X-Common-Kind-Secret"] = secret;
  }
  return headers;
}

async function postWebhook(webhook: string, payload: Record<string, unknown>) {
  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: secretHeaders(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    });
    return response.ok ? "delivered" : "failed";
  } catch {
    return "failed";
  }
}

/** Private inquiry alerts for staff AI / CRM automation. */
export async function notifyInquiryAutomation(payload: Record<string, unknown>) {
  const config = runtime();
  const webhook = config.N8N_INQUIRY_ALERT_WEBHOOK?.trim();
  if (config.CRM_ALERTS_ENABLED !== "true" || !webhook) {
    return "disabled";
  }
  return postWebhook(webhook, {
    ...payload,
    telegramChatId: config.CRM_TELEGRAM_CHAT_ID?.trim() || "",
    alertEmail: config.CRM_ALERT_EMAIL?.trim() || "",
  });
}

/**
 * After an authorised human publish, hand the public post to n8n AI automation.
 * Draft and review content must never call this.
 */
export async function notifyPublishAutomation(payload: Record<string, unknown>) {
  const webhook = runtime().N8N_PUBLISH_WEBHOOK?.trim();
  if (!webhook) {
    return "disabled";
  }
  return postWebhook(webhook, {
    event: "community.post.published",
    ...payload,
  });
}

/** New website subscriber → staff Telegram/email via n8n. */
export async function notifySubscribeAutomation(payload: Record<string, unknown>) {
  const config = runtime();
  const webhook =
    config.N8N_SUBSCRIBE_ALERT_WEBHOOK?.trim() ||
    config.N8N_INQUIRY_ALERT_WEBHOOK?.trim();
  if (config.CRM_ALERTS_ENABLED !== "true" || !webhook) {
    return "disabled";
  }
  return postWebhook(webhook, {
    organisation: "PDF Myanmar Relief",
    organisationShort: "PDF",
    tagline: "Civilian humanitarian community",
    ...payload,
    telegramChatId: config.CRM_TELEGRAM_CHAT_ID?.trim() || "",
    alertEmail: config.CRM_ALERT_EMAIL?.trim() || "",
  });
}

/**
 * Published upcoming event → n8n sends mail to active subscribers.
 * Website never emails the public directly; n8n owns delivery.
 */
export async function notifyEventMailAutomation(payload: Record<string, unknown>) {
  const config = runtime();
  const webhook = config.N8N_EVENT_MAIL_WEBHOOK?.trim();
  if (!webhook) {
    return "disabled";
  }
  return postWebhook(webhook, {
    event: "community.event.published",
    ...payload,
    telegramChatId: config.CRM_TELEGRAM_CHAT_ID?.trim() || "",
    alertEmail: config.CRM_ALERT_EMAIL?.trim() || "",
  });
}
