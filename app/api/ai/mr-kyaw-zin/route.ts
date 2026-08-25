import { authenticateRequest, authRuntime } from "../../../lib/auth";
import { applicationRuntime } from "../../../lib/hostinger-runtime";
import { sectionKeys, type SectionKey } from "../../../lib/sections";
import {
  localFallbackAnswer,
  localProjectAnswer,
  needsGenerativeAi,
  projectKnowledge,
  projectKnowledgeVersion,
  refuseOffTopic,
} from "../../../lib/mr-kyaw-zin-knowledge";
import {
  checkRateLimit,
  mutationRejected,
  noStoreHeaders,
  rateLimitKey,
  recordAudit,
} from "../../../lib/security";

type RuntimeEnv = {
  MR_KYAW_ZIN_AI_ENABLED?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  OPENAI_VECTOR_STORE_ID?: string;
};

type DraftContext = {
  title?: string;
  excerpt?: string;
  body?: string;
  placement?: SectionKey;
};

const instructions = `You are Mr. Kyaw Zin (AI, Networking, and Cloud), the private Admin assistant for the Burmese Catholic Community of Western Australia platform.
Staff may also contact you on WhatsApp at +66 82 567 4570 for technical support outside the chat.
You help authenticated staff with drafting, summarising, claim review, and content organisation for the current private draft.
Use only the verified PROJECT KNOWLEDGE below, the current private draft, or approved project files retrieved by file search.
Treat CONFIRMED, PLANNED, NOT CONFIGURED, and UNKNOWN as different states. Never describe planned work as completed.
If the answer is unsupported, say exactly: "I don't know from the verified project information yet." Then explain what evidence is needed.
You never publish, schedule, distribute, modify users or passwords, access Hostinger hPanel, or claim that an external action occurred.
Never invent government approval, funding, partnerships, permits, impact numbers, participant details, or consent.
Flag claims that require evidence. Keep advice clear, practical, respectful, and suitable for an Australian community organisation.
The workflow is draft, human review, then an authorised administrator publishes.
Do not answer unrelated general questions; explain that your scope is the BCC website draft and technical support.
Prefer short replies. Do not spend tokens on chit-chat.

PROJECT KNOWLEDGE:
${projectKnowledge}`;

function runtime() {
  return applicationRuntime() as unknown as RuntimeEnv;
}

function cleanDraft(value: unknown): DraftContext {
  if (!value || typeof value !== "object") return {};
  const draft = value as Record<string, unknown>;
  return {
    title: typeof draft.title === "string" ? draft.title.slice(0, 180) : "",
    excerpt: typeof draft.excerpt === "string" ? draft.excerpt.slice(0, 800) : "",
    body: typeof draft.body === "string" ? draft.body.slice(0, 6000) : "",
    placement: sectionKeys.includes(draft.placement as SectionKey)
      ? (draft.placement as SectionKey)
      : "stories",
  };
}

function extractText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string") return payload.output_text;
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as Record<string, unknown>).content)
      ? ((item as Record<string, unknown>).content as unknown[])
      : [];
    for (const part of content) {
      if (
        part &&
        typeof part === "object" &&
        typeof (part as Record<string, unknown>).text === "string"
      ) {
        return String((part as Record<string, unknown>).text);
      }
    }
  }
  return "";
}

function setupReply(message: string, draft: DraftContext) {
  const local = localProjectAnswer(message);
  if (local) return local;

  const request = message.toLowerCase();
  if (request.includes("summary") || request.includes("summar")) {
    if (!draft.body?.trim()) {
      return "Add the full story first. OpenAI summary is only used when AI mode is enabled; FAQ answers never spend the API key.";
    }
    return "I can see the draft. AI generation is not enabled yet (setup mode). Configure MR_KYAW_ZIN_AI_ENABLED and OPENAI_API_KEY for summaries. Website FAQ questions still answer locally for free.";
  }
  if (request.includes("claim")) {
    return "Claim-check checklist: names, dates, consent, impact numbers, funding, permits, partnerships, and government references — verify against written evidence before publishing.";
  }
  if (request.includes("destination") || request.includes("placement")) {
    return `Current public destination is “${draft.placement || "stories"}”. A human still chooses the final page.`;
  }
  return localFallbackAnswer();
}

export async function POST(request: Request) {
  const rejected = mutationRejected(request);
  if (rejected) return rejected;
  const user = await authenticateRequest(request);
  if (!user) {
    return Response.json({ error: "Sign in to use Mr. Kyaw Zin" }, { status: 401 });
  }

  try {
    const db = authRuntime().DB;
    if (!db) {
      return Response.json(
        { error: "Database is not connected" },
        { status: 503, headers: noStoreHeaders() },
      );
    }
    // Overall chat limit (local + AI)
    const chatKey = await rateLimitKey("admin-assistant", request, String(user.id));
    const chatLimit = await checkRateLimit(db, {
      key: chatKey,
      limit: 40,
      windowSeconds: 60 * 60,
      blockSeconds: 15 * 60,
    });
    if (!chatLimit.allowed) {
      return Response.json(
        {
          error:
            "Assistant limit reached (40/hour). Use FAQ chips or WhatsApp +66 82 567 4570.",
        },
        {
          status: 429,
          headers: noStoreHeaders({ "Retry-After": String(chatLimit.retryAfter) }),
        },
      );
    }

    const payload = (await request.json()) as {
      message?: string;
      draft?: unknown;
    };
    const message = payload.message?.trim().slice(0, 1200) || "";
    const draft = cleanDraft(payload.draft);
    if (!message) {
      return Response.json({ error: "A message is required" }, { status: 400 });
    }

    // Always prefer local FAQ / refuse off-topic — zero OpenAI spend
    const offTopic = refuseOffTopic(message);
    if (offTopic) {
      await recordAudit(db, user.id, "assistant.request", "assistant", null, {
        mode: "local-refuse",
      });
      return Response.json(
        { mode: "setup", reply: offTopic, source: "local" },
        { headers: noStoreHeaders() },
      );
    }

    const faq = localProjectAnswer(message);
    if (faq) {
      await recordAudit(db, user.id, "assistant.request", "assistant", null, {
        mode: "local-faq",
      });
      return Response.json(
        { mode: "setup", reply: faq, source: "local" },
        { headers: noStoreHeaders() },
      );
    }

    const config = runtime();
    const enabled = config.MR_KYAW_ZIN_AI_ENABLED === "true";
    const wantsAi = needsGenerativeAi(message);

    // No FAQ match and not a generative draft task → still local (saves API)
    if (!enabled || !config.OPENAI_API_KEY || !wantsAi) {
      await recordAudit(db, user.id, "assistant.request", "assistant", null, {
        mode: "setup",
      });
      return Response.json(
        {
          mode: "setup",
          reply: setupReply(message, draft),
          source: "local",
        },
        { headers: noStoreHeaders() },
      );
    }

    // Stricter limit for paid OpenAI calls only
    const aiKey = await rateLimitKey("admin-assistant-openai", request, String(user.id));
    const aiLimit = await checkRateLimit(db, {
      key: aiKey,
      limit: 8,
      windowSeconds: 60 * 60,
      blockSeconds: 30 * 60,
    });
    if (!aiLimit.allowed) {
      return Response.json(
        {
          mode: "setup",
          reply:
            "OpenAI draft-help limit reached (8/hour). Website FAQ questions still work free — try the suggested chips. Or WhatsApp +66 82 567 4570.",
          source: "local",
        },
        { headers: noStoreHeaders({ "Retry-After": String(aiLimit.retryAfter) }) },
      );
    }

    const tools = config.OPENAI_VECTOR_STORE_ID
      ? [
          {
            type: "file_search",
            vector_store_ids: [config.OPENAI_VECTOR_STORE_ID],
            max_num_results: 5,
          },
        ]
      : undefined;
    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.OPENAI_MODEL || "gpt-4.1-mini",
        instructions,
        store: false,
        max_output_tokens: 450,
        tools,
        input: `Staff member: ${user.displayName} (${user.role})
Verified project knowledge version: ${projectKnowledgeVersion}
Current private draft:
${JSON.stringify(draft)}

Generative request only (improve / summary / claim-check / destination):
${message}`,
      }),
    });
    const result = (await openAIResponse.json()) as Record<string, unknown>;
    if (!openAIResponse.ok) {
      const detail =
        result.error && typeof result.error === "object"
          ? String((result.error as Record<string, unknown>).message || "")
          : "";
      throw new Error(detail || "OpenAI response failed");
    }

    const reply = extractText(result);
    if (!reply) throw new Error("Mr. Kyaw Zin returned an empty response");
    await recordAudit(db, user.id, "assistant.request", "assistant", null, {
      mode: "ready",
      knowledgeVersion: projectKnowledgeVersion,
    });
    return Response.json(
      {
        mode: "ready",
        reply,
        knowledgeVersion: projectKnowledgeVersion,
        source: "openai",
      },
      { headers: noStoreHeaders() },
    );
  } catch {
    return Response.json(
      { error: "Mr. Kyaw Zin is temporarily unavailable" },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
