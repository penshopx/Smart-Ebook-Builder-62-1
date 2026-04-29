import { jsPDF } from 'jspdf';
import {
  Document, Paragraph, TextRun, HeadingLevel, Packer,
  AlignmentType, Table, TableRow, TableCell, WidthType,
} from 'docx';

function pdfFooter(doc: jsPDF, pageW: number, pageH: number, margin: number) {
  doc.setFontSize(7.5);
  doc.setTextColor(170, 170, 170);
  doc.setFont('helvetica', 'normal');
  doc.text('Chaesa AI Studio', margin, pageH - 7);
  const pageNum = String((doc.internal as any).pages.length - 1);
  doc.text(pageNum, pageW - margin, pageH - 7, { align: 'right' });
}

function isTableSeparator(line: string) {
  return /^\|[\s\-|:]+\|$/.test(line.trim());
}

function parseTableRow(line: string): string[] {
  return line
    .split('|')
    .map(c => c.trim())
    .filter((_, i, arr) => i > 0 && i < arr.length - 1);
}

function stripMd(text: string) {
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '');
}

function renderTablePDF(
  doc: jsPDF,
  rows: string[][],
  x: number,
  startY: number,
  tableW: number,
  pageH: number,
  margin: number,
  headerRgb: [number, number, number]
): number {
  if (!rows.length) return startY;
  const colCount = Math.max(...rows.map(r => r.length));
  if (colCount === 0) return startY;
  const colW = tableW / colCount;
  let y = startY;

  rows.forEach((row, rIdx) => {
    const isHeader = rIdx === 0;
    const ch = isHeader ? 9 : 7;
    if (y + ch > pageH - 22) {
      pdfFooter(doc, tableW + x * 2, pageH, margin);
      doc.addPage();
      y = 20;
    }
    for (let c = 0; c < colCount; c++) {
      const cx = x + c * colW;
      if (isHeader) {
        doc.setFillColor(...headerRgb);
        doc.rect(cx, y, colW, ch, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFillColor(rIdx % 2 === 0 ? 248 : 255, 249, 255);
        doc.rect(cx, y, colW, ch, 'F');
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'normal');
      }
      doc.setDrawColor(210, 210, 220);
      doc.setLineWidth(0.3);
      doc.rect(cx, y, colW, ch, 'S');
      doc.setFontSize(8);
      const cell = stripMd(row[c] || '');
      const maxChars = Math.max(5, Math.floor(colW / 1.9));
      const txt = cell.length > maxChars ? cell.slice(0, maxChars - 1) + '…' : cell;
      doc.text(txt, cx + 1.5, y + ch / 2 + 1.2);
    }
    y += ch;
  });
  return y + 3;
}

export function exportContentAsPDF(
  content: string,
  title: string,
  subtitle: string,
  filename: string,
  headerColor: [number, number, number] = [37, 99, 235]
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const textW = pageW - margin * 2;

  doc.setFillColor(...headerColor);
  doc.rect(0, 0, pageW, 52, 'F');
  doc.setFillColor(headerColor[0] - 10, headerColor[1] - 10, headerColor[2] - 8);
  doc.rect(0, 42, pageW, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(title, textW);
  doc.text(titleLines.slice(0, 2), margin, 20);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(210, 225, 255);
  doc.text(subtitle || 'Chaesa AI Studio', margin, 43);

  doc.setTextColor(30, 30, 30);
  let y = 62;
  const lines = content.split('\n');
  const tableBuffer: string[][] = [];
  let inTable = false;

  const flushTable = () => {
    if (tableBuffer.length > 0) {
      y = renderTablePDF(doc, [...tableBuffer], margin, y, textW, pageH, margin, headerColor);
      tableBuffer.length = 0;
    }
    inTable = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith('|')) {
      if (isTableSeparator(line)) continue;
      tableBuffer.push(parseTableRow(line));
      inTable = true;
      continue;
    }
    if (inTable) flushTable();

    if (!line) { y += 3; continue; }

    const isH1 = /^# /.test(line);
    const isH2 = /^## /.test(line);
    const isH3 = /^### /.test(line);
    const isBullet = /^[-*•] /.test(line) || /^\d+\. /.test(line);
    const isFullBold = /^\*\*[^*]+\*\*:?\s*$/.test(line);

    if (isH1 || isH2) {
      if (y > pageH - 40) { pdfFooter(doc, pageW, pageH, margin); doc.addPage(); y = 20; }
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(isH1 ? 13 : 11);
      doc.setTextColor(...headerColor);
      const cleaned = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');
      const w = doc.splitTextToSize(cleaned, textW);
      doc.text(w, margin, y);
      y += w.length * (isH1 ? 7 : 6) + 2;
      doc.setTextColor(30, 30, 30);
    } else if (isH3 || isFullBold) {
      if (y > pageH - 35) { pdfFooter(doc, pageW, pageH, margin); doc.addPage(); y = 20; }
      y += 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(50, 50, 50);
      const cleaned = stripMd(line.replace(/^#+\s*/, ''));
      const w = doc.splitTextToSize(cleaned, textW);
      doc.text(w, margin, y);
      y += w.length * 5.8 + 1;
      doc.setTextColor(30, 30, 30);
    } else if (isBullet) {
      const cleaned = stripMd(line.replace(/^[-*•]\s/, '').replace(/^\d+\.\s/, ''));
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const w = doc.splitTextToSize(cleaned, textW - 5);
      for (const wl of w) {
        if (y > pageH - 25) { pdfFooter(doc, pageW, pageH, margin); doc.addPage(); y = 20; }
        doc.text('•', margin, y);
        doc.text(wl, margin + 5, y);
        y += 5.5;
      }
    } else {
      const hasBold = line.includes('**');
      if (hasBold) {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        let cx = margin;
        doc.setFontSize(10);
        if (y > pageH - 25) { pdfFooter(doc, pageW, pageH, margin); doc.addPage(); y = 20; cx = margin; }
        for (const part of parts) {
          if (part.startsWith('**') && part.endsWith('**')) {
            doc.setFont('helvetica', 'bold');
            const t = part.slice(2, -2);
            const tw = doc.getTextWidth(t);
            if (cx + tw > margin + textW) { y += 5.5; cx = margin; if (y > pageH - 25) { pdfFooter(doc, pageW, pageH, margin); doc.addPage(); y = 20; } }
            doc.text(t, cx, y); cx += tw;
          } else if (part) {
            doc.setFont('helvetica', 'normal');
            const tw = doc.getTextWidth(part);
            if (cx + tw > margin + textW) { y += 5.5; cx = margin; if (y > pageH - 25) { pdfFooter(doc, pageW, pageH, margin); doc.addPage(); y = 20; } }
            doc.text(part, cx, y); cx += tw;
          }
        }
        y += 5.5;
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        const w = doc.splitTextToSize(line, textW);
        for (const wl of w) {
          if (y > pageH - 25) { pdfFooter(doc, pageW, pageH, margin); doc.addPage(); y = 20; }
          doc.text(wl, margin, y);
          y += 5.5;
        }
      }
    }
  }
  if (inTable) flushTable();
  pdfFooter(doc, pageW, pageH, margin);
  doc.save(`${filename}.pdf`);
}

export async function exportContentAsDocx(
  content: string,
  title: string,
  filename: string
): Promise<void> {
  const children: any[] = [
    new Paragraph({ text: title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    new Paragraph({}),
  ];

  const lines = content.split('\n');
  const tableBuffer: string[][] = [];
  let inTable = false;

  const flushTable = () => {
    if (!tableBuffer.length) { inTable = false; return; }
    const colCount = Math.max(...tableBuffer.map(r => r.length));
    const rows = tableBuffer.map((row, rIdx) =>
      new TableRow({
        tableHeader: rIdx === 0,
        children: Array.from({ length: colCount }, (_, cIdx) =>
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({
                text: stripMd(row[cIdx] || ''),
                bold: rIdx === 0,
                font: 'Calibri',
                size: 18,
              })],
            })],
          })
        ),
      })
    );
    children.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
    children.push(new Paragraph({}));
    tableBuffer.length = 0;
    inTable = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith('|')) {
      if (/^\|[\s\-|:]+\|$/.test(line)) continue;
      tableBuffer.push(parseTableRow(line));
      inTable = true;
      continue;
    }
    if (inTable) flushTable();

    if (!line) { children.push(new Paragraph({})); continue; }

    if (/^# /.test(line)) {
      children.push(new Paragraph({ text: stripMd(line.slice(2)), heading: HeadingLevel.HEADING_1 }));
    } else if (/^## /.test(line)) {
      children.push(new Paragraph({ text: stripMd(line.slice(3)), heading: HeadingLevel.HEADING_2 }));
    } else if (/^### /.test(line)) {
      children.push(new Paragraph({ text: stripMd(line.slice(4)), heading: HeadingLevel.HEADING_3 }));
    } else if (/^[-*•] /.test(line) || /^\d+\. /.test(line)) {
      children.push(new Paragraph({
        text: stripMd(line.replace(/^[-*•]\s/, '').replace(/^\d+\.\s/, '')),
        bullet: { level: 0 },
      }));
    } else {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const runs = parts.map(part =>
        part.startsWith('**') && part.endsWith('**')
          ? new TextRun({ text: part.slice(2, -2), bold: true, font: 'Calibri', size: 22 })
          : new TextRun({ text: part, font: 'Calibri', size: 22 })
      );
      children.push(new Paragraph({ children: runs }));
    }
  }
  if (inTable) flushTable();

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
