"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

interface Pet {
  id:      string;
  name:    string;
  species: string;
}

interface Message {
  role:    "user" | "assistant";
  content: string;
  links?:  { text: string; url: string }[];
}

const STARTER_QUESTIONS: Record<string, string[]> = {
  DOG: [
    "What's the best diet for my dog's age and size?",
    "How often should I bathe and groom my dog?",
    "What vaccinations does my dog need yearly?",
    "How can I reduce my dog's anxiety during thunderstorms?",
  ],
  CAT: [
    "How much water should my cat drink each day?",
    "What are the signs of dental disease in cats?",
    "How do I switch my cat to a new food safely?",
    "Is it normal for my cat to sleep 16 hours a day?",
  ],
  BIRD: [
    "What foods are toxic to birds?",
    "How do I keep my bird mentally stimulated?",
    "How often should a bird visit the vet?",
    "What are signs my bird might be sick?",
  ],
  RABBIT: [
    "What vegetables are safe for rabbits?",
    "How do I rabbit-proof my home?",
    "How often should I clean my rabbit's cage?",
    "What are signs of GI stasis in rabbits?",
  ],
  DEFAULT: [
    "What should I feed my pet for optimal health?",
    "How often does my pet need vet checkups?",
    "What are the signs my pet needs immediate care?",
    "How do I keep my pet mentally stimulated?",
  ],
};

function getStarters(species: string): string[] {
  const key = species.toUpperCase();
  return STARTER_QUESTIONS[key] ?? STARTER_QUESTIONS.DEFAULT;
}

export default function AdvisorPage() {
  const { data: session } = useSession();
  const [pets,       setPets]       = useState<Pet[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [petsLoading, setPetsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/pets")
      .then((r) => r.json())
      .then((data: Pet[]) => {
        setPets(data ?? []);
        if (data?.length > 0) setSelectedId(data[0].id);
      })
      .catch(() => {})
      .finally(() => setPetsLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const selectedPet = pets.find((p) => p.id === selectedId);
  const starters    = selectedPet ? getStarters(selectedPet.species) : STARTER_QUESTIONS.DEFAULT;

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    try {
      const res  = await fetch("/api/ai/advisor", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          petId:               selectedId || undefined,
          message:             text,
          conversationHistory: messages,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed.");
      setMessages([...history, { role: "assistant", content: data.response, links: data.links }]);
    } catch (e) {
      setMessages([...history, {
        role:    "assistant",
        content: e instanceof Error ? `Sorry, I ran into an error: ${e.message}` : "Sorry, something went wrong.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  function newConversation() {
    setMessages([]);
    setInput("");
  }

  if (!session) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Pet Care Advisor</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ask me anything about pet health, nutrition, or behaviour.</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={newConversation}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-800 transition"
          >
            New Conversation
          </button>
        )}
      </div>

      {/* Pet selector */}
      <div className="mb-4 shrink-0">
        {petsLoading ? (
          <div className="h-9 w-48 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
        ) : pets.length > 0 ? (
          <select
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); newConversation(); }}
            className="h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">No pet selected (general advice)</option>
            {pets.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.species})</option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">No pets found — <a href="/dashboard/pets/new" className="text-green-600 underline">add a pet</a> for personalised advice.</p>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 py-8">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl">🐾</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
              {selectedPet
                ? `Hi! I&apos;m here to help with anything about ${selectedPet.name}. Try one of these:`
                : "Hi! Ask me anything about pet care. Select a pet above for personalised advice."}
            </p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {starters.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-left px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 hover:border-green-300 hover:bg-green-50 dark:bg-green-900/20 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-green-600 text-white rounded-br-sm"
                      : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  {msg.links && msg.links.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {msg.links.map((link, li) => (
                        <a
                          key={li}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline text-green-700 dark:text-green-400 hover:text-green-900"
                        >
                          {link.text}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-end gap-2 mt-3 shrink-0"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
          }}
          placeholder="Ask about diet, health, behaviour…"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[42px] max-h-32 overflow-y-auto"
          style={{ fieldSizing: "content" } as React.CSSProperties}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="h-[42px] w-[42px] shrink-0 flex items-center justify-center rounded-xl bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-40"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </form>
    </div>
  );
}
