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
