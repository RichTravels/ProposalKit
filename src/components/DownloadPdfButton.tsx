"use client";

import { useState } from "react";
import { exportToPdf } from "@/lib/exportPdf";

type DownloadPdfButtonProps = {
  filename: string;
};

export default function DownloadPdfButton({ filename }: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      await exportToPdf("pdf-content", filename);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
    >
      {loading ? "Generating PDF..." : "Download PDF"}
    </button>
  );
}
