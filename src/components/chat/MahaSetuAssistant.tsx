'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Send, X } from 'lucide-react';
import { CHAT_SUGGESTED_PROMPTS, CHAT_WELCOME } from '@/lib/chatbot/knowledge';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  links?: { label: string; href: string }[];
};

export default function MahaSetuAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: CHAT_WELCOME },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      const replyText = data.success
        ? data.reply
        : data.error || 'Something went wrong. Try again with a MahaSetu-related question.';
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: replyText,
          links: data.links,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: 'Unable to reach the assistant. Check your connection and try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="no-print fixed bottom-5 right-4 sm:right-6 z-50 h-12 w-12 rounded-full border border-line bg-surface text-ink shadow-lift flex items-center justify-center hover:bg-elevated transition"
        aria-label={open ? 'Close MahaSetu assistant' : 'Open MahaSetu assistant'}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {open && (
        <div
          className="no-print fixed bottom-[4.75rem] right-4 sm:right-6 z-50 w-[min(100vw-2rem,24rem)] flex flex-col rounded-ms border border-line bg-surface shadow-lift overflow-hidden"
          role="dialog"
          aria-label="MahaSetu assistant"
        >
          <header className="px-4 py-3 border-b border-line bg-elevated/60">
            <p className="text-sm font-medium text-ink">MahaSetu assistant</p>
            <p className="text-[11px] text-mute mt-0.5">Platform help only — not a general chatbot</p>
          </header>

          <div ref={listRef} className="flex-1 max-h-[min(50vh,22rem)] overflow-y-auto p-3 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[92%] rounded-ms px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user' ? 'bg-accent text-accent-fg' : 'bg-canvas border border-line text-ink'
                  }`}
                >
                  {msg.text}
                  {msg.links && msg.links.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="text-xs underline underline-offset-2 opacity-90 hover:opacity-100"
                          onClick={() => setOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <p className="text-xs text-mute px-1" aria-live="polite">Thinking…</p>
            )}
          </div>

          {messages.length <= 2 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {CHAT_SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => send(prompt)}
                  className="text-[11px] px-2 py-1 rounded-full border border-line text-mute hover:text-ink hover:bg-elevated transition text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <form
            className="p-3 border-t border-line flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about MahaSetu…"
              maxLength={500}
              className="ms-input flex-1 h-10 text-sm"
              aria-label="Your question"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="ms-btn ms-btn-primary h-10 w-10 p-0 shrink-0"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
