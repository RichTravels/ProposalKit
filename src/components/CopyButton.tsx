"use client";

import { useState } from "react";

type CopyButtonProps = {
  text: string;
  label?: string;
  copyKey: string;
};

export default function CopyButton({ text, label = "Copy", copyKey }: CopyButtonProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopiedKey(copyKey);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
    >
      {copiedKey === copyKey ? "Copied!" : label}
    </button>
  );
}
