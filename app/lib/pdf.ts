/**
 * Minimal multi-page PDF builder (no dependency).
 * Uses built-in Helvetica; good enough for staff report export.
 */

export type PdfColumn = { key: string; label: string; width: number };
export type PdfSection = {
  title: string;
  columns: PdfColumn[];
  rows: Array<Record<string, unknown>>;
};

const PAGE_W = 841.89; // A4 landscape
const PAGE_H = 595.28;
const MARGIN = 36;
const FONT_SIZE = 8;
const TITLE_SIZE = 14;
const LINE_H = 11;

function pdfEscape(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?");
}

function cellText(value: unknown, maxChars: number) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(1, maxChars - 1))}…`;
}

function buildPageContent(
  lines: Array<{ x: number; y: number; size: number; text: string; bold?: boolean }>,
) {
  const ops: string[] = ["BT"];
  for (const line of lines) {
    const font = line.bold ? "/F2" : "/F1";
    ops.push(
      `${font} ${line.size} Tf`,
      `1 0 0 1 ${line.x.toFixed(2)} ${line.y.toFixed(2)} Tm`,
      `(${pdfEscape(line.text)}) Tj`,
    );
  }
  ops.push("ET");
  return ops.join("\n");
}

export function buildPdfReport(options: {
  title: string;
  subtitle?: string;
  sections: PdfSection[];
}): Uint8Array {
  const generated = new Date().toISOString().slice(0, 10);
  const pages: string[] = [];

  for (const section of options.sections) {
    const usableWidth = PAGE_W - MARGIN * 2;
    const totalWidth = section.columns.reduce((sum, column) => sum + column.width, 0) || 1;
    const scaled = section.columns.map((column) => ({
      ...column,
      width: (column.width / totalWidth) * usableWidth,
    }));

    let rowIndex = 0;
    let pageInSection = 0;
    while (rowIndex < section.rows.length || pageInSection === 0) {
      const lines: Array<{
        x: number;
        y: number;
        size: number;
        text: string;
        bold?: boolean;
      }> = [];
      let y = PAGE_H - MARGIN;

      if (pageInSection === 0 && pages.length === 0) {
        lines.push({ x: MARGIN, y, size: TITLE_SIZE, text: options.title, bold: true });
        y -= 16;
        if (options.subtitle) {
          lines.push({ x: MARGIN, y, size: 9, text: options.subtitle });
          y -= 12;
        }
        lines.push({
          x: MARGIN,
          y,
          size: 8,
          text: `Generated ${generated}`,
        });
        y -= 18;
      }

      lines.push({
        x: MARGIN,
        y,
        size: 11,
        text:
          pageInSection === 0
            ? section.title
            : `${section.title} (continued)`,
        bold: true,
      });
      y -= 14;

      let x = MARGIN;
      for (const column of scaled) {
        const maxChars = Math.max(4, Math.floor(column.width / 4.2));
        lines.push({
          x,
          y,
          size: FONT_SIZE,
          text: cellText(column.label, maxChars),
          bold: true,
        });
        x += column.width;
      }
      y -= LINE_H;

      const startRow = rowIndex;
      while (rowIndex < section.rows.length && y > MARGIN + LINE_H) {
        const row = section.rows[rowIndex]!;
        x = MARGIN;
        for (const column of scaled) {
          const maxChars = Math.max(4, Math.floor(column.width / 4.2));
          lines.push({
            x,
            y,
            size: FONT_SIZE,
            text: cellText(row[column.key], maxChars),
          });
          x += column.width;
        }
        y -= LINE_H;
        rowIndex += 1;
      }

      if (startRow === rowIndex && section.rows.length === 0) {
        lines.push({
          x: MARGIN,
          y,
          size: FONT_SIZE,
          text: "No rows for this section.",
        });
      }

      pages.push(buildPageContent(lines));
      pageInSection += 1;
      if (section.rows.length === 0) break;
    }
  }

  const encoder = new TextEncoder();
  const fontRegularId = 2;
  const fontBoldId = 3;
  const pagesId = 4;
  const firstPageId = 5;

  const header = encoder.encode("%PDF-1.4\n");
  const parts: Uint8Array[] = [header];
  const objOffsets: number[] = [];
  let cursor = header.length;

  function writeObj(id: number, body: string) {
    const chunk = encoder.encode(`${id} 0 obj\n${body}\nendobj\n`);
    objOffsets[id] = cursor;
    parts.push(chunk);
    cursor += chunk.length;
  }

  const pageIds = pages.map((_, index) => firstPageId + index * 2);
  const contentIds = pages.map((_, index) => firstPageId + index * 2 + 1);

  writeObj(
    1,
    `<< /Type /Catalog /Pages ${pagesId} 0 R >>`,
  );
  writeObj(
    fontRegularId,
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`,
  );
  writeObj(
    fontBoldId,
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`,
  );
  writeObj(
    pagesId,
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
  );

  pages.forEach((content, index) => {
    const pageId = pageIds[index]!;
    const contentId = contentIds[index]!;
    writeObj(
      pageId,
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    const stream = encoder.encode(content);
    writeObj(
      contentId,
      `<< /Length ${stream.length} >>\nstream\n${content}\nendstream`,
    );
  });

  const xrefStart = cursor;
  const maxId = contentIds[contentIds.length - 1] || pagesId;
  let xref = `xref\n0 ${maxId + 1}\n`;
  xref += "0000000000 65535 f \n";
  for (let id = 1; id <= maxId; id += 1) {
    const offset = objOffsets[id] ?? 0;
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  const xrefBytes = encoder.encode(xref);
  parts.push(xrefBytes);
  cursor += xrefBytes.length;

  const trailer = encoder.encode(
    `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`,
  );
  parts.push(trailer);

  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
