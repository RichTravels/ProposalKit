import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DocumentType } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  PROPOSAL: "Project Proposal",
  SOW: "Statement of Work",
  BRIEF: "Post-Discovery Brief",
};

export const DOCUMENT_PATHS: Record<
  DocumentType,
  { generate: string; library: string }
> = {
  PROPOSAL: { generate: "/proposal/generate", library: "/proposal/library" },
  SOW: { generate: "/sow/generate", library: "/sow/library" },
  BRIEF: { generate: "/brief/generate", library: "/brief/library" },
};

export const DOCUMENT_BADGE_LABELS: Record<DocumentType, string> = {
  PROPOSAL: "PROPOSAL",
  SOW: "SOW",
  BRIEF: "POST-DISCOVERY BRIEF",
};

export const DOCUMENT_BADGE_STYLES: Record<DocumentType, string> = {
  PROPOSAL: "border-indigo-500/40 bg-indigo-500/10 text-indigo-300",
  SOW: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  BRIEF: "border-green-500/40 bg-green-500/10 text-green-300",
};

export function formatDocumentDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
