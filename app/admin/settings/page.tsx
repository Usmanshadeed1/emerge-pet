"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type SaveState = "idle" | "saving" | "saved" | "error";

interface LlmConfig {
  id:        string;
  label:     string;
  provider:  string;
  baseUrl:   string;
  model:     string;
  isActive:  boolean;
  createdAt: string;
}

interface PromptEntry {
  value:    string;
  isCustom: boolean;
  default:  string;
}

// ─── Provider presets ─────────────────────────────────────────────────────────

const PROVIDERS = [
  { value: "openai",      label: "OpenAI",       url: "https://api.openai.com/v1",                                       suggestions: "gpt-4o · gpt-4o-mini · gpt-3.5-turbo" },
  { value: "groq",        label: "Groq",         url: "https://api.groq.com/openai/v1",                                  suggestions: "llama-3.3-70b-versatile · mixtral-8x7b-32768 · gemma2-9b-it" },
  { value: "gemini",      label: "Gemini",       url: "https://generativelanguage.googleapis.com/v1beta/openai",         suggestions: "gemini-2.0-flash · gemini-1.5-pro" },
  { value: "huggingface", label: "Hugging Face", url: "https://api-inference.huggingface.co/v1",                         suggestions: "microsoft/Phi-3-mini-4k-instruct · HuggingFaceH4/zephyr-7b-beta" },
  { value: "openrouter",  label: "OpenRouter",   url: "https://openrouter.ai/api/v1",                                   suggestions: "meta-llama/llama-3.1-8b-instruct:free · mistralai/mistral-7b-instruct:free" },
  { value: "custom",      label: "Custom",       url: "",                                                                suggestions: "" },
];

const PROMPT_LABELS: Record<string, string> = {
  prompt_symptom_check:  "Symptom Checker",
  prompt_breed_guide:    "Breed Care Guide",
  prompt_health_score:   "Health Score",
  prompt_visit_prep:     "Visit Prep",
  prompt_advisor:        "Pet Care Advisor",
  prompt_weekly_summary: "Weekly Health Summary",
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
    </svg>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-all disabled:opacity-50 ${
        checked ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <span className={`h-5 w-5 rounded-full bg-white dark:bg-gray-900 shadow-sm transition-transform ${
        checked ? "translate-x-5" : "translate-x-0.5"
      }`} />
    </button>
  );
}

function SectionCard({
  title, subtitle, children, saveState, onSave,
}: {
  title:     string;
  subtitle:  string;
  children:  React.ReactNode;
  saveState: SaveState;
  onSave:    () => void;
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {saveState === "error" && <p className="text-xs text-red-600">Save failed.</p>}
          {saveState === "saved" && <p className="text-xs text-green-600">✓ Saved</p>}
          <button
            onClick={onSave}
            disabled={saveState === "saving"}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-all"
          >
            {saveState === "saving" ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; type?: string; hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoComplete="off"
        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
      />
      {hint && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

function SensitiveField({ label, value, onChange, isSet, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; isSet: boolean; placeholder: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {isSet && value === "" && (
          <span className="rounded-full bg-green-50 dark:bg-green-900/20 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800">Saved</span>
        )}
      </div>
      <input
        type="password" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={isSet && value === "" ? "••••••••  (type to update)" : placeholder}
        autoComplete="new-password"
        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
      />
    </div>
  );
}

// ─── Provider Card (accordion) ────────────────────────────────────────────────

function ProviderCard({
  config, onUpdate, onDelete,
}: {
  config:   LlmConfig;
  onUpdate: (id: string, data: Partial<LlmConfig> & { apiKey?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [expanded,   setExpanded]   = useState(false);
  const [label,      setLabel]      = useState(config.label);
  const [provider,   setProvider]   = useState(config.provider);
  const [baseUrl,    setBaseUrl]    = useState(config.baseUrl);
  const [apiKey,     setApiKey]     = useState("");
  const [model,      setModel]      = useState(config.model);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testing,    setTesting]    = useState(false);
  const [toggling,   setToggling]   = useState(false);

  const preset = PROVIDERS.find((p) => p.value === provider);

  function handleProviderChange(val: string) {
    setProvider(val);
    const p = PROVIDERS.find((x) => x.value === val);
    if (p?.url) setBaseUrl(p.url);
  }

  async function handleSave() {
    setSaving(true);
    const payload: Partial<LlmConfig> & { apiKey?: string } = { label, provider, baseUrl, model };
    if (apiKey.trim()) payload.apiKey = apiKey;
    await onUpdate(config.id, payload);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/admin/settings/test-ai", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ baseUrl, apiKey: apiKey.trim() || "__saved__", model, configId: config.id }),
    });
    const data = await res.json() as { response?: string; error?: string };
    setTestResult(data.response
      ? { ok: true,  msg: data.response }
      : { ok: false, msg: data.error ?? "Test failed." }
    );
    setTesting(false);
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`Delete "${config.label}"? This cannot be undone.`)) return;
    setDeleting(true);
    await onDelete(config.id);
  }

  return (
    <div className={`rounded-2xl border transition-all ${
      config.isActive ? "border-green-200 dark:border-green-800 bg-white dark:bg-gray-900" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
    }`}>
      {/* Accordion header — always visible */}
      <div className="flex w-full items-center justify-between gap-3 px-5 py-4">
        {/* Left: click to expand */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpanded((v) => !v)}
          onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
        >
          <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${config.isActive ? "bg-green-500" : "bg-gray-300"}`} />
          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{config.label || "Unnamed Provider"}</span>
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600 flex-shrink-0">
            {PROVIDERS.find((p) => p.value === config.provider)?.label ?? config.provider}
          </span>
          {config.model && (
            <span className="hidden sm:inline rounded-md bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
              {config.model}
            </span>
          )}
        </div>
        {/* Right: action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Toggle checked={config.isActive} onChange={async (val) => {
            setToggling(true);
            await onUpdate(config.id, { isActive: val });
            setToggling(false);
          }} disabled={toggling} />
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:bg-red-900/20 hover:text-red-600 transition-all"
            title="Delete this provider"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setExpanded((v) => !v)}
            onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
            className="cursor-pointer"
          >
            <ChevronIcon open={expanded} />
          </div>
        </div>
      </div>

      {/* Expandable fields */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-5 pb-5 pt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Display name</label>
              <input
                value={label} onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Groq Free Tier"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Provider</label>
              <select
                value={provider} onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all bg-white dark:bg-gray-900"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Base URL</label>
            <input
              value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              API Key <span className="text-gray-400 dark:text-gray-500 font-normal">(leave blank to keep existing)</span>
            </label>
            <input
              type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              placeholder="••••••••  (saved — type to update)"
              autoComplete="new-password"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Model Name</label>
            <input
              value={model} onChange={(e) => setModel(e.target.value)}
              placeholder="Type a model name"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
            />
            {preset?.suggestions && (
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                Examples: <span className="text-gray-500 dark:text-gray-400">{preset.suggestions}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-all"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            {saved && <span className="text-xs text-green-600">✓ Saved</span>}

            <button
              onClick={handleTest}
              disabled={testing}
              className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 text-xs font-semibold text-green-700 dark:text-green-400 hover:bg-green-100 dark:bg-green-900/30 disabled:opacity-50 transition-all"
            >
              {testing && <Spinner />}
              {testing ? "Testing…" : "Test Connection"}
            </button>
          </div>

          {testResult && (
            <div className={`rounded-xl px-4 py-3 text-sm ring-1 ${
              testResult.ok
                ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 ring-green-100 dark:ring-green-900"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-red-100 dark:ring-red-900"
            }`}>
              <strong>{testResult.ok ? "✓ Response:" : "✗ Error:"}</strong> {testResult.msg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── New Provider Form ────────────────────────────────────────────────────────

function NewProviderForm({ onCreated }: { onCreated: (c: LlmConfig) => void }) {
  const [label,    setLabel]    = useState("");
  const [provider, setProvider] = useState("groq");
  const [baseUrl,  setBaseUrl]  = useState(PROVIDERS[1].url);
  const [apiKey,   setApiKey]   = useState("");
  const [model,    setModel]    = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const preset = PROVIDERS.find((p) => p.value === provider);

  function handleProviderChange(val: string) {
    setProvider(val);
    const p = PROVIDERS.find((x) => x.value === val);
    if (p?.url) setBaseUrl(p.url);
  }

  async function handleCreate() {
    if (!label || !apiKey || !model) { setError("Label, API Key, and Model are required."); return; }
    setSaving(true);
    setError("");
    const res  = await fetch("/api/admin/llm", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ label, provider, baseUrl, apiKey, model }),
    });
    const data = await res.json() as LlmConfig & { error?: string };
    if (res.ok) {
      onCreated(data);
      setLabel(""); setApiKey(""); setModel("");
    } else {
      setError(data.error ?? "Failed to create provider.");
    }
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-5 space-y-4 bg-gray-50 dark:bg-gray-800/50">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">New Provider</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Display name</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Groq Free Tier"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"/>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Provider</label>
          <select value={provider} onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all">
            {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Base URL</label>
        <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://..."
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"/>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">API Key</label>
        <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..."
          autoComplete="new-password"
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"/>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Model Name</label>
        <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Type a model name"
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"/>
        {preset?.suggestions && (
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">Examples: <span className="text-gray-500 dark:text-gray-400">{preset.suggestions}</span></p>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button onClick={handleCreate} disabled={saving}
        className="inline-flex h-9 items-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50 transition-all">
        {saving ? "Adding…" : "+ Add Provider"}
      </button>
    </div>
  );
}

// ─── LLM Section ─────────────────────────────────────────────────────────────

function LlmSection() {
  const [configs,     setConfigs]     = useState<LlmConfig[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);

  const load = useCallback(async () => {
    const res  = await fetch("/api/admin/llm");
    const data = await res.json() as LlmConfig[];
    setConfigs(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleUpdate(id: string, data: Partial<LlmConfig> & { apiKey?: string }) {
    await fetch(`/api/admin/llm/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });
    setConfigs((prev) =>
      prev.map((c) => c.id === id ? { ...c, ...data } : c)
    );
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/llm/${id}`, { method: "DELETE" });
    setConfigs((prev) => prev.filter((c) => c.id !== id));
  }

  function handleCreated(config: LlmConfig) {
    setConfigs((prev) => [...prev, config]);
    setShowNewForm(false);
  }

  const activeCount = configs.filter((c) => c.isActive).length;

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">AI / LLM Providers</h2>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          Add multiple providers — the app rotates through all active ones automatically.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <svg className="h-6 w-6 animate-spin text-green-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.length === 0 && !showNewForm && (
            <p className="rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800">
              No providers configured yet. Add one below to enable all AI features.
            </p>
          )}

          {configs.map((config) => (
            <ProviderCard
              key={config.id}
              config={config}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}

          {showNewForm && <NewProviderForm onCreated={handleCreated} />}

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setShowNewForm((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-green-300 hover:bg-green-50 dark:bg-green-900/20 hover:text-green-700 dark:text-green-400 transition-all"
            >
              {showNewForm ? "Cancel" : "+ Add Provider"}
            </button>

            {configs.length > 0 && (
              <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium ring-1 ${
                activeCount > 0
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-green-200 dark:ring-green-800"
                  : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-amber-200 dark:ring-amber-800"
              }`}>
                <span className={`h-2 w-2 rounded-full ${activeCount > 0 ? "bg-green-500" : "bg-amber-400"}`} />
                Rotating through {activeCount} active provider{activeCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Email Section ────────────────────────────────────────────────────────────

interface EmailSettings {
  emailProvider:   string;   // "resend" | "smtp"
  resendKey:       string;
  resendKeySet:    boolean;
  resendFrom:      string;
  smtpHost:        string;
  smtpPort:        string;
  smtpUser:        string;
  smtpPassword:    string;
  smtpPasswordSet: boolean;
  smtpTls:         boolean;
  smtpFrom:        string;
}

function EmailSection() {
  const [settings, setSettings]           = useState<EmailSettings | null>(null);
  const [resendExpanded, setResendExpanded] = useState(false);
  const [smtpExpanded,   setSmtpExpanded]   = useState(false);

  // Resend state
  const [resendKey,  setResendKey]  = useState("");
  const [resendFrom, setResendFrom] = useState("");
  const [resendSave, setResendSave] = useState<SaveState>("idle");
  const [resendTest, setResendTest] = useState<{ ok: boolean; msg: string } | null>(null);
  const [resendTesting, setResendTesting] = useState(false);

  // SMTP state
  const [smtpHost,     setSmtpHost]     = useState("");
  const [smtpPort,     setSmtpPort]     = useState("587");
  const [smtpUser,     setSmtpUser]     = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpTls,      setSmtpTls]      = useState(false);
  const [smtpFrom,     setSmtpFrom]     = useState("");
  const [smtpSave,     setSmtpSave]     = useState<SaveState>("idle");
  const [smtpTest,     setSmtpTest]     = useState<{ ok: boolean; msg: string } | null>(null);
  const [smtpTesting,  setSmtpTesting]  = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data: Record<string, string | boolean | null>) => {
        const s: EmailSettings = {
          emailProvider:   (data.email_provider as string)   ?? "resend",
          resendKey:       "",
          resendKeySet:    !!(data.resend_api_key_set),
          resendFrom:      (data.resend_from_email as string) ?? "",
          smtpHost:        (data.smtp_host as string)         ?? "",
          smtpPort:        (data.smtp_port as string)         ?? "587",
          smtpUser:        (data.smtp_user as string)         ?? "",
          smtpPassword:    "",
          smtpPasswordSet: !!(data.smtp_password_set),
          smtpTls:         (data.smtp_tls as string)         === "true",
          smtpFrom:        (data.smtp_from_email as string)   ?? "",
        };
        setSettings(s);
        setResendFrom(s.resendFrom);
        setSmtpHost(s.smtpHost);
        setSmtpPort(s.smtpPort);
        setSmtpUser(s.smtpUser);
        setSmtpTls(s.smtpTls);
        setSmtpFrom(s.smtpFrom);
      });
  }, []);

  async function saveSettings(payload: Record<string, string>) {
    await fetch("/api/admin/settings", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
  }

  async function activateResend() {
    if (!settings) return;
    setSettings((s) => s ? { ...s, emailProvider: "resend" } : s);
    await saveSettings({ email_provider: "resend" });
  }

  async function activateSmtp() {
    if (!settings) return;
    setSettings((s) => s ? { ...s, emailProvider: "smtp" } : s);
    await saveSettings({ email_provider: "smtp" });
  }

  async function saveResend() {
    setResendSave("saving");
    try {
      const payload: Record<string, string> = { resend_from_email: resendFrom };
      if (resendKey) payload.resend_api_key = resendKey;
      await saveSettings(payload);
      setResendSave("saved");
      if (resendKey) setSettings((s) => s ? { ...s, resendKeySet: true } : s);
      setTimeout(() => setResendSave("idle"), 3000);
    } catch { setResendSave("error"); }
  }

  async function testResend() {
    setResendTesting(true);
    setResendTest(null);
    const res = await fetch("/api/admin/settings/test-email", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ provider: "resend" }),
    });
    const data = await res.json() as { message?: string; error?: string };
    setResendTest(data.message
      ? { ok: true,  msg: data.message }
      : { ok: false, msg: data.error ?? "Test failed." }
    );
    setResendTesting(false);
  }

  async function saveSmtp() {
    setSmtpSave("saving");
    try {
      const payload: Record<string, string> = {
        smtp_host:       smtpHost,
        smtp_port:       smtpPort,
        smtp_user:       smtpUser,
        smtp_tls:        smtpTls ? "true" : "false",
        smtp_from_email: smtpFrom,
      };
      if (smtpPassword) payload.smtp_password = smtpPassword;
      await saveSettings(payload);
      setSmtpSave("saved");
      if (smtpPassword) setSettings((s) => s ? { ...s, smtpPasswordSet: true } : s);
      setTimeout(() => setSmtpSave("idle"), 3000);
    } catch { setSmtpSave("error"); }
  }

  async function testSmtp() {
    setSmtpTesting(true);
    setSmtpTest(null);
    const res = await fetch("/api/admin/settings/test-smtp", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        host:      smtpHost,
        port:      smtpPort,
        user:      smtpUser,
        password:  smtpPassword || undefined,
        tls:       smtpTls,
        fromEmail: smtpFrom,
      }),
    });
    const data = await res.json() as { message?: string; error?: string };
    setSmtpTest(data.message
      ? { ok: true,  msg: data.message }
      : { ok: false, msg: data.error ?? "Test failed." }
    );
    setSmtpTesting(false);
  }

  if (!settings) {
    return (
      <div className="flex justify-center py-8">
        <svg className="h-6 w-6 animate-spin text-green-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
      </div>
    );
  }

  const isResendActive = settings.emailProvider === "resend";
  const isSmtpActive   = settings.emailProvider === "smtp";

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Email</h2>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          Used for password resets, weekly summaries, and notifications. Only one provider is active at a time.
        </p>
      </div>

      {/* ── Resend Card ── */}
      <div className={`rounded-2xl border transition-all ${
        isResendActive ? "border-green-200 dark:border-green-800 bg-white dark:bg-gray-900" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
      }`}>
        <div className="flex w-full items-center justify-between gap-3 px-5 py-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setResendExpanded((v) => !v)}
            onKeyDown={(e) => e.key === "Enter" && setResendExpanded((v) => !v)}
            className="flex items-center gap-2.5 flex-1 cursor-pointer"
          >
            <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${isResendActive ? "bg-green-500" : "bg-gray-300"}`} />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Resend</span>
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">API</span>
            {settings.resendKeySet && (
              <span className="rounded-full bg-green-50 dark:bg-green-900/20 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800">Configured</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Toggle checked={isResendActive} onChange={(val) => { if (val) activateResend(); }} />
            <div
              role="button"
              tabIndex={0}
              onClick={() => setResendExpanded((v) => !v)}
              onKeyDown={(e) => e.key === "Enter" && setResendExpanded((v) => !v)}
              className="cursor-pointer"
            >
              <ChevronIcon open={resendExpanded} />
            </div>
          </div>
        </div>

        {resendExpanded && (
          <div className="border-t border-gray-100 dark:border-gray-800 px-5 pb-5 pt-4 space-y-4">
            <SensitiveField
              label="API Key"
              value={resendKey}
              onChange={setResendKey}
              isSet={settings.resendKeySet}
              placeholder="re_..."
            />
            <Field
              label="From Email"
              value={resendFrom}
              onChange={setResendFrom}
              placeholder="hello@emergepet.com"
            />

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={saveResend}
                disabled={resendSave === "saving"}
                className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-all"
              >
                {resendSave === "saving" ? "Saving…" : "Save"}
              </button>
              {resendSave === "saved"  && <span className="text-xs text-green-600">✓ Saved</span>}
              {resendSave === "error"  && <span className="text-xs text-red-600">Save failed.</span>}

              <button
                onClick={testResend}
                disabled={resendTesting}
                className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 text-xs font-semibold text-green-700 dark:text-green-400 hover:bg-green-100 dark:bg-green-900/30 disabled:opacity-50 transition-all"
              >
                {resendTesting && <Spinner />}
                {resendTesting ? "Testing…" : "Send Test Email"}
              </button>
            </div>

            {resendTest && (
              <div className={`rounded-xl px-4 py-3 text-sm ring-1 ${
                resendTest.ok ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 ring-green-100 dark:ring-green-900" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-red-100 dark:ring-red-900"
              }`}>
                <strong>{resendTest.ok ? "✓" : "✗"}</strong> {resendTest.msg}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── SMTP Card ── */}
      <div className={`rounded-2xl border transition-all ${
        isSmtpActive ? "border-green-200 dark:border-green-800 bg-white dark:bg-gray-900" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
      }`}>
        <div className="flex w-full items-center justify-between gap-3 px-5 py-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setSmtpExpanded((v) => !v)}
            onKeyDown={(e) => e.key === "Enter" && setSmtpExpanded((v) => !v)}
            className="flex items-center gap-2.5 flex-1 cursor-pointer"
          >
            <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${isSmtpActive ? "bg-green-500" : "bg-gray-300"}`} />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">SMTP</span>
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">Server</span>
            {settings.smtpPasswordSet && (
              <span className="rounded-full bg-green-50 dark:bg-green-900/20 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800">Configured</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Toggle checked={isSmtpActive} onChange={(val) => { if (val) activateSmtp(); }} />
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSmtpExpanded((v) => !v)}
              onKeyDown={(e) => e.key === "Enter" && setSmtpExpanded((v) => !v)}
              className="cursor-pointer"
            >
              <ChevronIcon open={smtpExpanded} />
            </div>
          </div>
        </div>

        {smtpExpanded && (
          <div className="border-t border-gray-100 dark:border-gray-800 px-5 pb-5 pt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="SMTP Host" value={smtpHost} onChange={setSmtpHost} placeholder="smtp.gmail.com" />
              <Field label="Port" value={smtpPort} onChange={setSmtpPort} placeholder="587" type="number" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Username / Email" value={smtpUser} onChange={setSmtpUser} placeholder="you@gmail.com" />
              <SensitiveField
                label="Password / App Password"
                value={smtpPassword}
                onChange={setSmtpPassword}
                isSet={settings.smtpPasswordSet}
                placeholder="••••••••"
              />
            </div>

            <Field
              label="From Email (optional)"
              value={smtpFrom}
              onChange={setSmtpFrom}
              placeholder="hello@emergepet.com"
              hint="Defaults to the username if left blank."
            />

            {/* TLS toggle */}
            <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">TLS / SSL</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Use SSL for port 465. For port 587 use STARTTLS (leave off).</p>
              </div>
              <Toggle checked={smtpTls} onChange={setSmtpTls} />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={saveSmtp}
                disabled={smtpSave === "saving"}
                className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-all"
              >
                {smtpSave === "saving" ? "Saving…" : "Save"}
              </button>
              {smtpSave === "saved"  && <span className="text-xs text-green-600">✓ Saved</span>}
              {smtpSave === "error"  && <span className="text-xs text-red-600">Save failed.</span>}

              <button
                onClick={testSmtp}
                disabled={smtpTesting}
                className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 text-xs font-semibold text-green-700 dark:text-green-400 hover:bg-green-100 dark:bg-green-900/30 disabled:opacity-50 transition-all"
              >
                {smtpTesting && <Spinner />}
                {smtpTesting ? "Testing…" : "Send Test Email"}
              </button>
            </div>

            {smtpTest && (
              <div className={`rounded-xl px-4 py-3 text-sm ring-1 ${
                smtpTest.ok ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 ring-green-100 dark:ring-green-900" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-red-100 dark:ring-red-900"
              }`}>
                <strong>{smtpTest.ok ? "✓" : "✗"}</strong> {smtpTest.msg}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AI Prompts Section ───────────────────────────────────────────────────────

function PromptsSection() {
  const [prompts,  setPrompts]  = useState<Record<string, PromptEntry> | null>(null);
  const [saving,   setSaving]   = useState<Record<string, boolean>>({});
  const [saved,    setSaved]    = useState<Record<string, boolean>>({});
  const [drafts,   setDrafts]   = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/settings/prompts")
      .then((r) => r.json())
      .then((data: Record<string, PromptEntry>) => {
        setPrompts(data);
        const d: Record<string, string> = {};
        for (const k of Object.keys(data)) d[k] = data[k].value;
        setDrafts(d);
      });
  }, []);

  async function handleSave(key: string) {
    setSaving((p) => ({ ...p, [key]: true }));
    await fetch("/api/admin/settings/prompts", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ key, value: drafts[key] }),
    });
    setPrompts((p) => p ? { ...p, [key]: { ...p[key], value: drafts[key], isCustom: true } } : p);
    setSaving((p)  => ({ ...p, [key]: false }));
    setSaved((p)   => ({ ...p, [key]: true }));
    setTimeout(() => setSaved((p) => ({ ...p, [key]: false })), 3000);
  }

  async function handleReset(key: string) {
    setSaving((p) => ({ ...p, [key]: true }));
    await fetch("/api/admin/settings/prompts", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ key, value: null }),
    });
    const defaultVal = prompts?.[key]?.default ?? "";
    setDrafts((p)  => ({ ...p, [key]: defaultVal }));
    setPrompts((p) => p ? { ...p, [key]: { ...p[key], value: defaultVal, isCustom: false } } : p);
    setSaving((p)  => ({ ...p, [key]: false }));
  }

  if (!prompts) {
    return (
      <div className="flex justify-center py-12">
        <svg className="h-6 w-6 animate-spin text-green-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        These are the system prompts sent to the AI for each feature. Edit them to change how the AI responds. Admins have full control — nothing is hardcoded.
      </p>
      {Object.entries(prompts).map(([key, entry]) => (
        <div key={key} className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{PROMPT_LABELS[key] ?? key}</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
                entry.isCustom
                  ? "bg-violet-50 text-violet-700 ring-violet-200"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 ring-gray-200 dark:ring-gray-700"
              }`}>
                {entry.isCustom ? "Custom" : "Default"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {saved[key] && <span className="text-xs text-green-600">✓ Saved</span>}
              {entry.isCustom && (
                <button
                  onClick={() => handleReset(key)}
                  disabled={saving[key]}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:border-red-200 dark:border-red-800 hover:text-red-600 disabled:opacity-50 transition-all"
                >
                  Reset to Default
                </button>
              )}
              <button
                onClick={() => handleSave(key)}
                disabled={saving[key]}
                className="inline-flex h-8 items-center rounded-xl bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-all"
              >
                {saving[key] ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
          <textarea
            value={drafts[key] ?? entry.value}
            onChange={(e) => setDrafts((p) => ({ ...p, [key]: e.target.value }))}
            rows={6}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm text-gray-800 dark:text-gray-100 font-mono leading-relaxed outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all resize-y"
          />
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "services" | "prompts";

export default function AdminSettingsPage() {
  const [tab,    setTab]    = useState<Tab>("services");
  const [loaded, setLoaded] = useState(false);

  // Payments
  const [rcKey,        setRcKey]        = useState("");
  const [rcKeySet,     setRcKeySet]     = useState(false);
  const [paymentsSave, setPaymentsSave] = useState<SaveState>("idle");

  // Maps
  const [placesKey,    setPlacesKey]    = useState("");
  const [placesKeySet, setPlacesKeySet] = useState(false);
  const [mapsSave,     setMapsSave]     = useState<SaveState>("idle");

  // Marketing
  const [mcKey,         setMcKey]         = useState("");
  const [mcKeySet,      setMcKeySet]      = useState(false);
  const [mcAudience,    setMcAudience]    = useState("");
  const [marketingSave, setMarketingSave] = useState<SaveState>("idle");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data: Record<string, string | boolean | null>) => {
        setRcKeySet(!!(data.revenuecat_api_key_set));
        setPlacesKeySet(!!(data.google_places_key_set));
        setMcKeySet(!!(data.mailchimp_api_key_set));
        setMcAudience((data.mailchimp_audience_id as string) ?? "");
        setLoaded(true);
      });
  }, []);

  async function save(payload: Record<string, string>, setSave: (s: SaveState) => void) {
    setSave("saving");
    try {
      const res = await fetch("/api/admin/settings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      setSave(res.ok ? "saved" : "error");
      if (res.ok) setTimeout(() => setSave("idle"), 3000);
    } catch { setSave("error"); }
  }

  if (!loaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <svg className="h-6 w-6 animate-spin text-green-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">App Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage external service credentials and AI prompts — stored in the database.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 dark:bg-gray-700 p-1 w-fit">
        {(["services", "prompts"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === t ? "bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
            }`}
          >
            {t === "services" ? "Services" : "AI Prompts"}
          </button>
        ))}
      </div>

      {tab === "services" && (
        <div className="space-y-6">
          <LlmSection />

          <EmailSection />

          <SectionCard
            title="Payments (RevenueCat)"
            subtitle="Used to verify premium subscription status."
            saveState={paymentsSave}
            onSave={() => save({ ...(rcKey ? { revenuecat_api_key: rcKey } : {}) }, setPaymentsSave)}
          >
            <SensitiveField label="RevenueCat API Key" value={rcKey} onChange={setRcKey} isSet={rcKeySet} placeholder="sk_..." />
          </SectionCard>

          <SectionCard
            title="Maps (Google Places)"
            subtitle="Used to find nearby emergency vets for URGENT symptom checker results."
            saveState={mapsSave}
            onSave={() => save({ ...(placesKey ? { google_places_key: placesKey } : {}) }, setMapsSave)}
          >
            <SensitiveField label="Google Places API Key" value={placesKey} onChange={setPlacesKey} isSet={placesKeySet} placeholder="AIza..." />
          </SectionCard>

          <SectionCard
            title="Marketing (Mailchimp)"
            subtitle="Auto-subscribes new users to your mailing list on registration."
            saveState={marketingSave}
            onSave={() => save({ ...(mcKey ? { mailchimp_api_key: mcKey } : {}), mailchimp_audience_id: mcAudience }, setMarketingSave)}
          >
            <SensitiveField label="Mailchimp API Key" value={mcKey} onChange={setMcKey} isSet={mcKeySet} placeholder="xxxxxxxx-us1" />
            <Field label="Audience ID" value={mcAudience} onChange={setMcAudience} placeholder="abc123def" hint="Found in Mailchimp → Audience → Settings → Audience name and defaults" />
          </SectionCard>
        </div>
      )}

      {tab === "prompts" && <PromptsSection />}
    </div>
  );
}
