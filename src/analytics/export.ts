/**
 * Analytics exports.
 *
 * Exports are serialisations of the SAME `DashboardResponse` the dashboard
 * renders — there is no second calculation path. CSV, Excel (SpreadsheetML)
 * and PDF all consume the governed KPI/chart/table payload.
 */

import type { DashboardResponse, ValueFormat } from "./types";

export type ExportFormat = "csv" | "excel" | "pdf";

export interface ExportResult {
  filename: string;
  mime_type: string;
  /** Base64 encoded file content. */
  content: string;
  encoding: "base64";
  bytes: number;
}

export function formatValue(value: string | number, format: ValueFormat): string {
  if (typeof value === "string") return value;
  switch (format) {
    case "percent":
      return `${(value * 100).toFixed(1)}%`;
    case "currency":
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(value);
    case "days":
      return `${Math.round(value)} days`;
    case "decimal":
      return value.toFixed(2);
    default:
      return new Intl.NumberFormat("en-IN").format(value);
  }
}

interface ExportSection {
  title: string;
  header: string[];
  rows: (string | number)[][];
}

/** Flatten a dashboard response into governed, tabular sections. */
export function exportSections(dashboard: DashboardResponse): ExportSection[] {
  const sections: ExportSection[] = [];

  sections.push({
    title: "Report",
    header: ["Property", "Value"],
    rows: [
      ["Dashboard", dashboard.title],
      ["Domain", dashboard.domain],
      ["Scope", `${dashboard.scope.level} — ${dashboard.scope.description}`],
      ["Last updated", dashboard.freshness.last_updated],
      ["Data through", dashboard.freshness.data_through],
      ["Pipeline status", dashboard.freshness.pipeline_status],
      ["Refresh mode", `${dashboard.freshness.refresh_mode} (not real time)`],
      ...Object.entries(dashboard.filters_applied).map(([k, v]) => [`Filter: ${k}`, String(v)]),
    ],
  });

  sections.push({
    title: "KPIs",
    header: ["Metric", "Label", "Value", "Definition"],
    rows: dashboard.kpis.map((k) => [
      k.metric,
      k.label,
      formatValue(k.value, k.format),
      k.definition,
    ]),
  });

  for (const chart of dashboard.charts) {
    sections.push({
      title: `Chart: ${chart.title}`,
      header: [chart.xLabel, ...chart.series.map((s) => s.label)],
      rows: chart.data.map((row) => [
        String(row[chart.xKey] ?? row["bucket"] ?? ""),
        ...chart.series.map((s) => formatValue(row[s.key] ?? 0, s.format)),
      ]),
    });
  }

  for (const spec of dashboard.tables) {
    sections.push({
      title: `Table: ${spec.title} (page ${spec.page} of ${spec.total_pages})`,
      header: spec.columns.map((c) => c.label),
      rows: spec.rows.map((row) =>
        spec.columns.map((c) => formatValue(row[c.key] ?? "", c.format)),
      ),
    });
  }

  return sections;
}

const toBase64 = (input: string): string => {
  // Worker + Node both expose btoa via globalThis in this runtime; Buffer is
  // used when available because it handles non-latin1 characters correctly.
  const maybeBuffer = (
    globalThis as { Buffer?: { from(s: string, e: string): { toString(e: string): string } } }
  ).Buffer;
  if (maybeBuffer) return maybeBuffer.from(input, "utf8").toString("base64");
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const csvCell = (value: string | number): string => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

function toCsv(sections: ExportSection[]): string {
  const lines: string[] = [];
  for (const section of sections) {
    lines.push(csvCell(section.title));
    lines.push(section.header.map(csvCell).join(","));
    for (const row of section.rows) lines.push(row.map(csvCell).join(","));
    lines.push("");
  }
  return lines.join("\n");
}

const xmlEscape = (value: string | number): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** SpreadsheetML 2003 — opens natively in Excel, Numbers and LibreOffice. */
function toExcel(sections: ExportSection[], title: string): string {
  const sheets = sections
    .map((section, index) => {
      const rows = [
        `<Row><Cell ss:StyleID="head"><Data ss:Type="String">${xmlEscape(section.title)}</Data></Cell></Row>`,
        `<Row>${section.header
          .map(
            (h) => `<Cell ss:StyleID="head"><Data ss:Type="String">${xmlEscape(h)}</Data></Cell>`,
          )
          .join("")}</Row>`,
        ...section.rows.map(
          (row) =>
            `<Row>${row
              .map((cell) => `<Cell><Data ss:Type="String">${xmlEscape(cell)}</Data></Cell>`)
              .join("")}</Row>`,
        ),
      ].join("");
      const name = `${index + 1}. ${section.title}`.replace(/[\\/?*[\]:]/g, "-").slice(0, 31);
      return `<Worksheet ss:Name="${xmlEscape(name)}"><Table>${rows}</Table></Worksheet>`;
    })
    .join("");

  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Title>${xmlEscape(title)}</Title></DocumentProperties>
<Styles><Style ss:ID="head"><Font ss:Bold="1"/></Style></Styles>
${sheets}
</Workbook>`;
}

const pdfEscape = (value: string): string =>
  value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

/** Minimal single-font PDF writer — no external dependency, valid PDF 1.4. */
function toPdf(sections: ExportSection[], title: string): string {
  const lines: { text: string; bold: boolean }[] = [{ text: title, bold: true }];
  for (const section of sections) {
    lines.push({ text: "", bold: false });
    lines.push({ text: section.title, bold: true });
    lines.push({ text: section.header.join(" | "), bold: false });
    for (const row of section.rows.slice(0, 40)) {
      lines.push({
        text: row
          .map((c) => String(c))
          .join(" | ")
          .slice(0, 110),
        bold: false,
      });
    }
    if (section.rows.length > 40) {
      lines.push({ text: `… ${section.rows.length - 40} more rows (see CSV export)`, bold: false });
    }
  }

  const perPage = 52;
  const pages: { text: string; bold: boolean }[][] = [];
  for (let i = 0; i < lines.length; i += perPage) pages.push(lines.slice(i, i + perPage));
  if (pages.length === 0) pages.push([]);

  const objects: string[] = [];
  const pageObjectIds = pages.map((_, index) => 4 + index * 2);

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
  );
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  pages.forEach((page, index) => {
    const contentId = pageObjectIds[index]! + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    const body = page
      .map((line, lineIndex) => {
        const size = line.bold ? 11 : 8.5;
        const y = 560 - lineIndex * 10.5;
        return `BT /F1 ${size} Tf 32 ${y.toFixed(1)} Td (${pdfEscape(line.text)}) Tj ET`;
      })
      .join("\n");
    objects.push(`__STREAM__${body}`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    if (object.startsWith("__STREAM__")) {
      const stream = object.slice("__STREAM__".length);
      pdf += `${index + 1} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`;
    } else {
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    }
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

export function exportDashboard(dashboard: DashboardResponse, format: ExportFormat): ExportResult {
  const sections = exportSections(dashboard);
  const stamp = dashboard.freshness.data_through;
  const base = `career-connect-${dashboard.domain}-analytics-${stamp}`;

  if (format === "csv") {
    const content = toCsv(sections);
    return {
      filename: `${base}.csv`,
      mime_type: "text/csv;charset=utf-8",
      content: toBase64(content),
      encoding: "base64",
      bytes: content.length,
    };
  }
  if (format === "excel") {
    const content = toExcel(sections, dashboard.title);
    return {
      filename: `${base}.xls`,
      mime_type: "application/vnd.ms-excel",
      content: toBase64(content),
      encoding: "base64",
      bytes: content.length,
    };
  }
  const content = toPdf(sections, `${dashboard.title} — data through ${stamp}`);
  return {
    filename: `${base}.pdf`,
    mime_type: "application/pdf",
    content: toBase64(content),
    encoding: "base64",
    bytes: content.length,
  };
}
