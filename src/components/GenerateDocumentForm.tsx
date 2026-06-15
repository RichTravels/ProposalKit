"use client";

import { FormEvent, useState } from "react";
import { flushSync } from "react-dom";
import type { DocumentType } from "@prisma/client";
import DocumentView from "@/components/DocumentView";
import { GenerationError } from "@/components/GenerationError";
import { DOCUMENT_LABELS } from "@/lib/utils";

type Props = {
  type: DocumentType;
};

export default function GenerateDocumentForm({ type }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState("");
  const [title, setTitle] = useState("");
  const [tone, setTone] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsGenerating(true);
    setError(null);
    setGeneratedContent("");
    setTitle("");
    setTone("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      type,
      clientName: String(formData.get("clientName") ?? "").trim(),
      projectSummary: String(formData.get("projectSummary") ?? "").trim(),
      budget: String(formData.get("budget") ?? "").trim(),
      timeline: String(formData.get("timeline") ?? "").trim(),
      tone: String(formData.get("tone") ?? "professional").trim() || "professional",
    };

    if (!payload.clientName || !payload.projectSummary) {
      setError("Client name and project summary are required.");
      setIsGenerating(false);
      return;
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Generation failed");
      }

      if (!response.body) {
        throw new Error("No response stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        console.log("CHUNK:", chunk);
        result += chunk;
        flushSync(() => {
          setGeneratedContent(result);
        });
      }

      result += decoder.decode();
      flushSync(() => {
        setGeneratedContent(result);
      });

      const saveResponse = await fetch("/api/generate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          clientName: payload.clientName,
          content: result,
          tone: payload.tone,
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(saveData.error || "Failed to save document");
      }

      setTitle(saveData.title ?? payload.clientName);
      setTone(saveData.tone ?? payload.tone);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="clientName" className="font-medium">
            Client name
          </label>
          <input
            id="clientName"
            name="clientName"
            type="text"
            required
            placeholder="e.g. Acme Corp"
            className="rounded-lg border p-3 text-black outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="projectSummary" className="font-medium">
            Project summary / discovery notes
          </label>
          <textarea
            id="projectSummary"
            name="projectSummary"
            required
            rows={6}
            placeholder="What does the client need? What did you learn on the discovery call?"
            className="rounded-lg border p-3 text-black outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="budget" className="font-medium">
              Budget (optional)
            </label>
            <input
              id="budget"
              name="budget"
              type="text"
              placeholder="e.g. $15,000 – $20,000"
              className="rounded-lg border p-3 text-black outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="timeline" className="font-medium">
              Timeline (optional)
            </label>
            <input
              id="timeline"
              name="timeline"
              type="text"
              placeholder="e.g. 6 weeks"
              className="rounded-lg border p-3 text-black outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="tone" className="font-medium">
            Tone
          </label>
          <select
            id="tone"
            name="tone"
            defaultValue="professional"
            className="rounded-lg border p-3 text-black outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="formal">Formal</option>
            <option value="concise">Concise</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isGenerating}
          className="w-full rounded-lg bg-indigo-600 py-3 font-bold text-white transition-colors hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {isGenerating ? "Generating..." : `Generate ${DOCUMENT_LABELS[type]}`}
        </button>
      </form>

      {error ? <GenerationError message={error} /> : null}

      {(isGenerating || generatedContent) ? (
        <DocumentView
          title={
            isGenerating && !generatedContent
              ? "Generating..."
              : title || "Generating..."
          }
          content={generatedContent}
          tone={tone || undefined}
        />
      ) : null}
    </div>
  );
}
