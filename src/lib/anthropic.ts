import Anthropic from "@anthropic-ai/sdk";
import { getRequiredEnv } from "@/lib/env";
import type { DocumentType } from "@prisma/client";

export async function createClaudeCompletion(content: string) {
  const apiKey = getRequiredEnv("ANTHROPIC_API_KEY");
  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content }],
    });

    const block = message.content[0];
    if (block.type !== "text") {
      throw new Error("Unexpected response format from Claude");
    }

    return block.text;
  } catch (error) {
    if (error instanceof Anthropic.APIError && error.status === 401) {
      throw new Error(
        "Anthropic rejected the API key. Update ANTHROPIC_API_KEY and restart."
      );
    }
    throw error;
  }
}

type PromptInput = {
  clientName: string;
  projectSummary: string;
  budget?: string;
  timeline?: string;
  tone: string;
};

export function buildPrompt(type: DocumentType, input: PromptInput): string {
  const context = `
Client: ${input.clientName}
Project summary: ${input.projectSummary}
Budget: ${input.budget || "Not specified"}
Timeline: ${input.timeline || "Not specified"}
Tone: ${input.tone}
`.trim();

  if (type === "PROPOSAL") {
    return `
Write a professional Project Proposal for a solo consultant. Use clean Markdown.

${context}

Include these sections:
1. Executive Summary
2. Understanding of the Challenge
3. Proposed Approach
4. Deliverables
5. Timeline & Milestones
6. Investment
7. Why Work With Me

Keep it concise, client-ready, and aligned with the requested tone.
`.trim();
  }

  if (type === "SOW") {
    return `
Write a Statement of Work (SOW) for a solo consultant engagement. Use clean Markdown.

${context}

Include these sections:
1. Project Overview
2. Scope of Work (in scope / out of scope)
3. Deliverables
4. Timeline & Milestones
5. Assumptions & Dependencies
6. Acceptance Criteria
7. Fees & Payment Terms

Be specific and contract-ready while staying readable.
`.trim();
  }

  return `
Write a Post-Discovery Brief summarizing findings after a client discovery call. Use clean Markdown.

${context}

Include these sections:
1. Client & Context
2. Problem Statement
3. Goals & Success Metrics
4. Key Findings
5. Constraints & Risks
6. Recommended Next Steps
7. Open Questions

Write for an internal handoff that can also be shared with the client.
`.trim();
}
