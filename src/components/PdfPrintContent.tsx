import ReactMarkdown from "react-markdown";

type PdfPrintContentProps = {
  title: string;
  typeLabel: string;
  date: string;
  content: string;
};

export default function PdfPrintContent({
  title,
  typeLabel,
  date,
  content,
}: PdfPrintContentProps) {
  return (
    <div id="pdf-content" className="hidden bg-white p-12 font-sans text-gray-900">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-base text-gray-600">
        {typeLabel} · {date}
      </p>
      <div className="prose prose-sm mt-8 max-w-none text-base text-gray-900">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
