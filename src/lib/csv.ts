/** Builds a CSV (RFC 4180 quoting) and hands it to the browser as a download. */
export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]): void {
  const cell = (value: string | number | null | undefined) => {
    const text = value == null ? "" : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  // A BOM so Excel opens UTF-8 (Bangla names) correctly.
  const csv = "﻿" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
