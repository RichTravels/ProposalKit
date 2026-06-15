import jsPDF from "jspdf";

const stripEmoji = (text: string) =>
  text
    .replace(
      /[\u{1F300}-\u{1FFFF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}|\u00a9|\u00ae|\u2000-\u3300]/gu,
      ""
    )
    .trim();

export async function exportToPdf(
  content: string,
  title: string,
  documentType: string,
  date: string
) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPage = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  pdf.setFontSize(10);
  pdf.setTextColor(120, 120, 120);
  pdf.text(`${documentType} · ${date}`, margin, y);
  y += 8;

  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = stripEmoji(line);

    if (!trimmed) {
      y += 4;
      continue;
    }

    if (trimmed.startsWith("# ")) {
      checkPage(14);
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(20, 20, 20);
      const text = trimmed.replace(/^# /, "");
      pdf.text(text, margin, y);
      y += 10;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      checkPage(12);
      y += 4;
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(20, 20, 20);
      const text = trimmed.replace(/^## /, "");
      pdf.text(text, margin, y);
      y += 8;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      checkPage(10);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(40, 40, 40);
      const text = trimmed.replace(/^### /, "");
      pdf.text(text, margin, y);
      y += 7;
      continue;
    }

    if (trimmed === "---") {
      checkPage(6);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 6;
      continue;
    }

    if (trimmed.startsWith("|") && trimmed.includes("---")) {
      continue;
    }

    if (trimmed.startsWith("|")) {
      checkPage(7);
      const cells = trimmed.split("|").filter((c) => c.trim() !== "");
      const colWidth = contentWidth / cells.length;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(40, 40, 40);
      cells.forEach((cell, i) => {
        const cellText = cell.trim().replace(/\*\*/g, "");
        pdf.text(cellText, margin + i * colWidth, y, { maxWidth: colWidth - 2 });
      });
      y += 7;
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      checkPage(7);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(40, 40, 40);
      const text = trimmed.replace(/^[-*] /, "").replace(/\*\*(.*?)\*\*/g, "$1");
      pdf.text("•", margin, y);
      const wrapped = pdf.splitTextToSize(text, contentWidth - 6);
      pdf.text(wrapped, margin + 6, y);
      y += wrapped.length * 5 + 2;
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      checkPage(7);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(40, 40, 40);
      const text = trimmed.replace(/\*\*(.*?)\*\*/g, "$1");
      const wrapped = pdf.splitTextToSize(text, contentWidth - 6);
      pdf.text(wrapped, margin + 4, y);
      y += wrapped.length * 5 + 2;
      continue;
    }

    if (trimmed.startsWith("> ")) {
      checkPage(7);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(80, 80, 80);
      const text = trimmed.replace(/^> /, "").replace(/\*\*(.*?)\*\*/g, "$1");
      const wrapped = pdf.splitTextToSize(text, contentWidth - 8);
      pdf.text(wrapped, margin + 4, y);
      y += wrapped.length * 5 + 2;
      continue;
    }

    checkPage(7);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(40, 40, 40);
    const text = trimmed.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
    const wrapped = pdf.splitTextToSize(text, contentWidth);
    pdf.text(wrapped, margin, y);
    y += wrapped.length * 5 + 3;
  }

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, {
      align: "center",
    });
  }

  pdf.save(`${title}-${documentType}.pdf`);
}
