"use client";

import { FormEvent, useState } from "react";
import type { PublicPlacement } from "../lib/content";
import { assistantFaqPrompts } from "../lib/mr-kyaw-zin-knowledge";
import { itSolutionsZoneLogoDataUrl } from "./itSolutionsZoneLogo";

export type AssistantDraft = {
  title: string;
  excerpt: string;
  body: string;
  placement: PublicPlacement;
};

type Message = {
  id: number;
  role: "assistant" | "user";
  text: string;
  suggestion?: Partial<AssistantDraft>;
};

type Props = {
  draft: AssistantDraft;
  onApplySuggestion: (suggestion: Partial<AssistantDraft>) => void;
};

const quickPrompts = [...assistantFaqPrompts];

export function MrKyawZinAssistant({ draft, onApplySuggestion }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<"setup" | "ready">("setup");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      text:
        "Hello. I’m Mr. Kyaw Zin — AI, Networking, and Cloud.\n\nWebsite questions use a free local FAQ (no API spend). OpenAI is only for draft help like improve/summary when enabled.\n\nTry a chip below, or WhatsApp +66 82 567 4570.",
    },
  ]);

  async function sendMessage(value: string) {
    const cleanMessage = value.trim();
    if (!cleanMessage || sending) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      text: cleanMessage,
    };
    setMessages((current) => [...current, userMessage]);
    setMessage("");
    setSending(true);

    try {
      const response = await fetch("/api/ai/mr-kyaw-zin", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: cleanMessage,
          draft,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        mode?: "setup" | "ready";
        reply?: string;
        suggestion?: Partial<AssistantDraft>;
      };
      if (!response.ok) throw new Error(payload.error || "Assistant unavailable");
      setMode(payload.mode === "ready" ? "ready" : "setup");
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: payload.reply || "I’m ready to help with this draft.",
          suggestion: payload.suggestion,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          text:
            error instanceof Error
              ? error.message
              : "The private assistant is temporarily unavailable.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(message);
  }

  return (
    <aside
      className={`assistant-widget ${open ? "is-open" : ""}`}
      id="assistant"
      aria-label="Mr. Kyaw Zin private Admin assistant"
    >
      {open && (
        <section className="assistant-popover" aria-labelledby="assistant-title">
          <header className="assistant-header">
            <div className="assistant-identity">
              <span className="assistant-avatar" aria-hidden="true">
                <img
                  src={itSolutionsZoneLogoDataUrl}
                  alt=""
                  width={38}
                  height={38}
                />
              </span>
              <div>
                <h2 id="assistant-title">Mr. Kyaw Zin</h2>
                <p className="assistant-brand-line">iT Solutions ZONE</p>
                <p className="assistant-brand-sub">AI · Automation · Innovation</p>
                <p>
                  <i className={mode} aria-hidden="true" />
                  {mode === "ready" ? "Private AI assistant" : "Private · Setup mode"}
                </p>
              </div>
            </div>
            <button
              className="assistant-close"
              type="button"
              aria-label="Close Mr. Kyaw Zin"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </header>

          <div className="assistant-messages" aria-live="polite">
            {messages.map((item) => (
              <article className={`assistant-message ${item.role}`} key={item.id}>
                <div>
                  <p>{item.text}</p>
                  {item.suggestion && Object.keys(item.suggestion).length > 0 && (
                    <button
                      type="button"
                      onClick={() => onApplySuggestion(item.suggestion!)}
                    >
                      Apply to draft
                    </button>
                  )}
                </div>
              </article>
            ))}
            {sending && (
              <article className="assistant-message assistant thinking">
                <div><p>Reviewing…</p></div>
              </article>
            )}
          </div>

          <div className="assistant-quick-prompts">
            {quickPrompts.map((prompt) => (
              <button key={prompt} type="button" onClick={() => void sendMessage(prompt)}>
                {prompt}
              </button>
            ))}
            <button type="button" onClick={() => void sendMessage("Improve this draft")}>
              Improve this draft
            </button>
          </div>

          <form className="assistant-composer" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="assistant-message">
              Ask Mr. Kyaw Zin
            </label>
            <textarea
              id="assistant-message"
              rows={1}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask about the website or technical support…"
              disabled={sending}
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={sending || !message.trim()}
            >
              ↑
            </button>
          </form>

          <p className="assistant-footnote">
            Suggestions only · Human approval required
            <a
              className="assistant-whatsapp"
              href="https://wa.me/66825674570"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp +66 82 567 4570
            </a>
          </p>
        </section>
      )}

      <button
        className="assistant-launcher"
        type="button"
        aria-label={open ? "Close Mr. Kyaw Zin" : "Open Mr. Kyaw Zin"}
        aria-expanded={open}
        aria-controls="assistant"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? (
          <span aria-hidden="true">×</span>
        ) : (
          <img
            src={itSolutionsZoneLogoDataUrl}
            alt=""
            width={40}
            height={40}
          />
        )}
      </button>
    </aside>
  );
}
