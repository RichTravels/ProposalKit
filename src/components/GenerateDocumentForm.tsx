"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { DocumentType } from "@prisma/client";
import { generateDocument } from "@/app/actions/generateDocument";
import type { GenerateDocumentState } from "@/app/actions/generateDocument.types";
import DocumentView from "@/components/DocumentView";
import { GenerationError } from "@/components/GenerationError";
import { DOCUMENT_LABELS } from "@/lib/utils";

const initialState: GenerateDocumentState = {};

type Props = {
  type: DocumentType;
};

function SubmitButton({ type }: { type: DocumentType }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-indigo-600 py-3 font-bold text-white transition-colors hover:bg-indigo-700 disabled:bg-gray-400"
    >
      {pending ? "Generating..." : `Generate ${DOCUMENT_LABELS[type]}`}
    </button>
  );
}

export default function GenerateDocumentForm({ type }: Props) {
  const boundAction = generateDocument.bind(null, type);
  const [state, formAction] = useFormState(boundAction, initialState);
  const [displayState, setDisplayState] = useState<GenerateDocumentState>(initialState);
  const prevStateRef = useRef<GenerateDocumentState>(initialState);

  useEffect(() => {
    if (state !== prevStateRef.current) {
      prevStateRef.current = state;
      setDisplayState(state);
    }
  }, [state]);

  async function handleAction(formData: FormData) {
    setDisplayState(initialState);
    try {
      await formAction(formData);
    } catch {
      window.location.reload();
    }
  }

  return (
    <div className="space-y-8">
      <form action={handleAction} className="mx-auto max-w-2xl space-y-4">
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

        <SubmitButton type={type} />
      </form>

      {displayState.error ? <GenerationError message={displayState.error} /> : null}

      {displayState.content && displayState.title ? (
        <DocumentView
          title={displayState.title}
          content={displayState.content}
          tone={displayState.tone}
        />
      ) : null}
    </div>
  );
}
