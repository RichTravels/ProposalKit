import CopyButton from "@/components/CopyButton";
import ReactMarkdown from "react-markdown";

type DocumentViewProps = {
  title: string;
  content: string;
  tone?: string;
};

export default function DocumentView({ title, content, tone }: DocumentViewProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {tone ? <p className="text-sm text-slate-500">Tone: {tone}</p> : null}
        </div>
        <CopyButton text={content} copyKey={`${title}-copy`} />
      </div>
      <div className="prose prose-sm max-w-none px-6 py-5 text-slate-800">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
