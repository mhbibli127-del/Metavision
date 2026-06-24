"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ScenarioResult } from "@/engines/hyperdimension/brain/executive-brain";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  scenarios?: ScenarioResult[];
};

export default function ManagerScenarioChat({ live }: { live?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Salam, müdir. İnflyasiya, gəlir, qiymət və ya xərc barədə sual verin — bütün ssenariləri nəzərdən keçirib ən uyğununu təklif edəcəyəm.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/intelligence/brain/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Xəta");

      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: data.answer,
          scenarios: data.recommended,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          text: "Bağlantı xətası — bir az sonra yenidən cəhd edin.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  return (
    <section className="mv-chat-panel">
      <header className="mv-chat-header">
        <div>
          <p className="mv-intel-overline">Müdir köməkçisi</p>
          <h2 className="mv-chat-title">Ssenari sorğusu</h2>
        </div>
        {live && <span className="mv-live-pill">Canlı</span>}
      </header>

      <div className="mv-chat-thread">
        {messages.map((msg) => (
          <div key={msg.id} className={`mv-chat-bubble mv-chat-bubble--${msg.role}`}>
            <p>{msg.text}</p>
            {msg.scenarios && msg.scenarios.length > 0 && (
              <ul className="mv-chat-scenarios">
                {msg.scenarios.map((s) => (
                  <li key={s.id}>
                    <strong>#{s.id}</strong> {s.label} — {s.summary}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {loading && <div className="mv-chat-bubble mv-chat-bubble--assistant">Ssenarilər analiz olunur…</div>}
        <div ref={endRef} />
      </div>

      <form
        className="mv-chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          type="text"
          className="mv-chat-input"
          placeholder="Məs: İnflyasiya riskini necə azaldım?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="mv-chat-send" disabled={loading || !input.trim()}>
          Göndər
        </button>
      </form>
    </section>
  );
}
