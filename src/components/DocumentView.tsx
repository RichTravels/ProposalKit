import CopyButton from "@/components/CopyButton";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type DocumentViewProps = {
  title: string;
  content: string;
  tone?: string;
  theme?: "light" | "dark";
  actions?: ReactNode;
};

export default function DocumentView({
  title,
  content,
  tone,
  theme = "light",
  actions,
}: DocumentViewProps) {
  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "rounded-xl border shadow-sm",
        isDark
          ? "border-slate-800 bg-slate-900"
          : "border-slate-200 bg-white"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b px-6 py-4",
          isDark ? "border-slate-800" : "border-slate-200"
        )}
      >
        <div>
          <h2
            className={cn(
              "text-lg font-semibold",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            {title}
          </h2>
          {tone ? (
            <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
              Tone: {tone}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <CopyButton text={content} copyKey={`${title}-copy`} />
        </div>
      </div>
      <div
        className={cn(
          "prose prose-sm max-w-none px-6 py-5",
          isDark ? "prose-invert text-slate-300" : "text-slate-800"
        )}
      >
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
