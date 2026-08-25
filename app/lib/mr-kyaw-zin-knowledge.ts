export const projectKnowledgeVersion = "2026-08-12.1";

export const projectKnowledge = `
PROJECT: Burmese Catholic Community of Western Australia dynamic community platform.
KNOWLEDGE VERSION: ${projectKnowledgeVersion}.

CONFIRMED CURRENT IMPLEMENTATION
- Public website pages: Home, About, Our Work, Giving, Certificates, News & Stories, Our Approach, Get Involved, Events, Gallery.
- Giving donation amount/total and Certificates gallery are Admin-controlled (Public pages) and published on the website.
- Public contact path is Get Involved only. The floating Ask a question widget has been removed.
- Private staff Admin Panel is separate from the public site.
- Admin uses password sign-in, expiring HttpOnly sessions, and Owner / Administrator / Editor roles.
- Owner manages staff accounts in Team Access.
- Staff create posts, attach up to 4 photos as one story album, choose page placement, save draft, send for review, then authorised publish.
- Mail subscribe on Home/Events stores subscribers in Admin. New/reactivated subscribers alert staff via n8n and also receive a welcome email (website, Facebook group, Events/About links, pdfantimailtary@gmail.com).
- Publishing an upcoming event emails active subscribers via n8n Event Mail and notifies the PDF staff Telegram chat.
- Inquiry alerts and subscribe alerts go to the Telegram staff group and pdfantimailtary@gmail.com when configured.
- Mr. Kyaw Zin (AI, Networking, and Cloud) is Admin-only. WhatsApp support: +66 82 567 4570.
- GitHub: kyawzinIT99/BCC-website. Production Hostinger deployment has not yet been completed.
- n8n runs on the existing Hostinger VPS (inquiry, publish, subscribe, event-mail workflows).

ANSWER POLICY
- Prefer local FAQ answers for website facts (no API spend).
- If unsupported, say: "I don't know from the verified project information yet."
- Never invent government approval, funding, partnerships, or personal details.

CONFIRMED EDITORIAL RULES
- Workflow: draft → human review → authorised publish → then n8n only.
- Never send drafts or review copies to automation.
- No government/endorsement/funding claims without written evidence.

SYSTEM BOUNDARIES
- Hostinger hPanel = owner infrastructure (hosting, domain, email, billing, SSL, backups).
- Admin Panel = staff content and app accounts only (not hPanel).
- Hostinger Pro planned for domain/SSL/mailboxes; existing VPS keeps n8n; website essentials deploy separately.
- Mr. Kyaw Zin cannot publish, change passwords/users, access hPanel, or invent facts.

PLANNED OR NOT YET CONFIGURED
- Hostinger Pro domain/SSL/mailbox go-live.
- Website production VPS cutover.
- Facebook group outbound posting (group ownership/permissions not controlled by BCC website owner alone).
`.trim();

/** Suggested chips shown in Admin chat — answered locally (no OpenAI spend). */
export const assistantFaqPrompts = [
  "What pages are on the website?",
  "How do I publish a post?",
  "How do event emails work?",
  "Where do Get Involved messages go?",
  "What does n8n automate?",
  "How do I add subscribers?",
] as const;

type FaqEntry = {
  keys: RegExp;
  answer: string;
};

const faqBank: FaqEntry[] = [
  {
    keys: /(what pages|which pages|site map|website (have|include|contain)|public pages)/i,
    answer:
      "Confirmed public pages: Home, About, Our Work, Giving, Certificates, News & Stories, Our Approach, Get Involved, Events, and Gallery. Staff work in the private Admin Panel at /admin. Giving totals and Certificates are controlled in Admin → Public pages.",
  },
  {
    keys: /(get involved|enquiry|inquir|contact form|follow-?up queue)/i,
    answer:
      "Confirmed: public contact is Get Involved only. Submissions enter Admin → Enquiries (Community follow-up queue) and alert staff Telegram plus pdfantimailtary@gmail.com when CRM alerts are enabled. The Ask a question floating widget has been removed.",
  },
  {
    keys: /(ask a question|quick question|floating|widget)/i,
    answer:
      "Confirmed: Ask a question was removed to reduce staff triage noise. Use Get Involved for community contact.",
  },
  {
    keys: /(publish|post|draft|review|content workflow|create post)/i,
    answer:
      "Confirmed workflow: Admin → Create post → save draft → Send for review → authorised admin Publish. Only published content appears publicly. After publish, n8n may run distribution automation. Drafts never go to n8n.",
  },
  {
    keys: /(photo|media|upload|gallery|album)/i,
    answer:
      "Confirmed: attach up to 4 approved photos per story as one album (they stay together). Verify consent/media rights before publish. Gallery page shows photos from published posts.",
  },
  {
    keys: /(subscriber|subscribe|mail list|newsletter)/i,
    answer:
      "Confirmed: visitors subscribe on Home or Events with consent. Admin → Subscribers lists them. New/reactivated subscribers trigger n8n staff alerts and a welcome email to the visitor with website, Facebook group and community links. Event Mail uses active consented subscribers only.",
  },
  {
    keys: /(event mail|event email|upcoming event|remind)/i,
    answer:
      "Confirmed: when an upcoming event is first published (date today or future), n8n Event Mail emails active subscribers from BCC Gmail and posts a staff summary to the Telegram group. Drafts and re-saving an already-published event do not re-send. Past-dated events do not trigger mail.",
  },
  {
    keys: /(telegram|staff alert|bcc wa charity)/i,
    answer:
      "Confirmed: PDF staff alerts go to the PDF Telegram credential and pdfantimailtary@gmail.com when CRM alerts are enabled. BCC mailboxes and BCC n8n workflows are not used.",
  },
  {
    keys: /(n8n|automation|webhook)/i,
    answer:
      "Confirmed n8n workflows on the existing Hostinger VPS: Inquiry Alert, Publish Distribution, Subscribe Alert, Event Mail. Website posts only after authorised publish / new subscribe / new Get Involved enquiry. Do not install a second n8n on the website VPS.",
  },
  {
    keys: /(facebook|fb group)/i,
    answer:
      "Confirmed: the website links to the community Facebook group, but outbound auto-posting is not fully controlled because BCC is not the group owner. Member posts may need group admin review. Prefer website publish + manual share until group posting rights are granted.",
  },
  {
    keys: /(admin|login|password|staff|role|owner|editor)/i,
    answer:
      "Confirmed: Admin uses password sign-in and Owner / Administrator / Editor roles. Owner manages staff in Team Access. Mr. Kyaw Zin cannot view or reset passwords.",
  },
  {
    keys: /(hpanel|hostinger|vps|deploy|domain|ssl|production)/i,
    answer:
      "Confirmed hosting split: Hostinger Pro planned for domain/SSL/mailboxes; existing Hostinger VPS keeps n8n; website app/DB/media deploy separately. Production website cutover is not completed yet. Admin Panel does not access hPanel.",
  },
  {
    keys: /(whatsapp|contact kyaw|mr\.?\s*kyaw|networking|cloud)/i,
    answer:
      "Confirmed: Mr. Kyaw Zin — AI, Networking, and Cloud. For direct technical help outside this chat: WhatsApp +66 82 567 4570 (https://wa.me/66825674570). This assistant is Admin-only.",
  },
  {
    keys: /(government|permit|funding|endorsement|acnc)/i,
    answer:
      "Rule: never claim government approval, permits, funding, partnerships, or endorsements without written evidence and exact authorised wording. I don't know from verified project information that any such claim is currently approved for public use.",
  },
  {
    keys: /(progress|what.*(done|built|complete)|current status)/i,
    answer:
      "Confirmed built: public pages, Admin Panel, posts/media, Get Involved queue, subscribers, events + event mail, Telegram/Gmail n8n alerts, focused Admin sections. Not complete: full production Hostinger website cutover and Facebook group auto-posting rights.",
  },
];

/** True when the request needs generative help (may use OpenAI). */
export function needsGenerativeAi(message: string) {
  return /(improve|rewrite|rephrase|polish|shorten|expand|summar|summary|draft|claim.?check|suggest (a )?destin|translate|paraphrase)/i.test(
    message,
  );
}

/** Off-topic chatter — refuse locally, never spend API. */
export function refuseOffTopic(message: string) {
  const request = message.toLowerCase();
  if (
    /(joke|recipe|homework|crypto|stock|dating|medical advice|write (me )?code for|ignore previous|jailbreak)/i.test(
      request,
    )
  ) {
    return "I only help with the BCC website, Admin Panel, publishing workflow, n8n alerts, and technical support. For other topics, contact WhatsApp +66 82 567 4570 if it is project-related, or use a general tool.";
  }
  return null;
}

/**
 * Local FAQ answers — prefer these before OpenAI to protect API spend.
 * Returns null when no FAQ match.
 */
export function localProjectAnswer(message: string): string | null {
  const refused = refuseOffTopic(message);
  if (refused) return refused;

  for (const entry of faqBank) {
    if (entry.keys.test(message)) return entry.answer;
  }

  // Broader keyword fallbacks (still local)
  const request = message.toLowerCase();
  if (request.includes("architecture") || request.includes("database") || request.includes("backend")) {
    return "Confirmed architecture: public React pages, protected APIs, D1-compatible database, R2-compatible media, role-based Admin, and n8n on the existing Hostinger VPS after authorised publish.";
  }
  if (request.includes("gallery")) {
    return "Confirmed: Gallery shows media from published posts. Staff upload via Create post (up to 4 photos per story album).";
  }

  return null;
}

/** Setup-mode / unknown fallback when no FAQ matched. */
export function localFallbackAnswer() {
  return (
    "I don't know from the verified FAQ yet. Try one of these: “What pages are on the website?”, “How do I publish a post?”, “How do event emails work?”, “Where do Get Involved messages go?”, “What does n8n automate?”, or “How do I add subscribers?”. " +
    "For generative draft help (improve/summary), enable OpenAI carefully — FAQ answers do not use the API key. WhatsApp: +66 82 567 4570."
  );
}
