export type PrinterPaperWidth = "58" | "80" | "A4";

export const PAPER_COLUMN_SUGGESTIONS: Record<PrinterPaperWidth, number> = {
  "58": 32,
  "80": 48,
  A4: 80,
};

export const ROLE_LABELS: Record<string, string> = {
  RECEIPT: "Receipt / Cashier",
  KITCHEN: "Kitchen",
  INVOICE: "Invoice",
  OTHER: "Other",
};

export const CONNECTION_LABELS: Record<string, string> = {
  USB: "USB (Windows installed printer)",
  NETWORK: "Network Printer",
  BROWSER: "Browser / System Printer",
};

export function suggestColumns(paperWidth: PrinterPaperWidth): number {
  return PAPER_COLUMN_SUGGESTIONS[paperWidth] ?? 42;
}

export type TestReceiptConfig = {
  name: string;
  role?: string;
  connectionType: string;
  printerName?: string | null;
  paperWidth: PrinterPaperWidth;
  printColumns: number;
  copies: number;
};

export type PersistedReceipt = {
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string | null;
    orderType: string;
    total: number;
    createdAt: string;
    table: { tableNumber: number };
    items: { itemName: string; quantity: number; unitPrice: number; subtotal: number }[];
    paidAmount: number;
    remainingBalance: number;
    paymentStatus: "PAID" | "PARTIALLY PAID" | "UNPAID";
  };
  restaurant: {
    name: string;
    logo: string | null;
    address: string | null;
    phone: string | null;
  };
  printer: {
    id: string;
    name: string;
    role: string;
    connectionType: string;
    paperWidth: PrinterPaperWidth;
    printColumns: number;
    copies: number;
    autoPrint: boolean;
    mockPrinter: boolean;
  } | null;
};

function esc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function receiptMoney(amount: number): string {
  return `Rs. ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 2 }).format(amount)}`;
}

function receiptDate(value: string): { date: string; time: string } {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

/** Builds an invoice from the order, payment totals and business loaded server-side. */
export function buildOrderReceiptHtml(
  receipt: PersistedReceipt["order"],
  business: PersistedReceipt["restaurant"],
  printer: NonNullable<PersistedReceipt["printer"]>
): string {
  const { date, time } = receiptDate(receipt.createdAt);
  const copies = Math.min(10, Math.max(1, printer.copies));
  const a4 = printer.paperWidth === "A4";
  const width = printer.paperWidth === "58" ? "58mm" : "80mm";
  const columns = Math.min(120, Math.max(10, printer.printColumns));
  const lines = receipt.items
    .map(
      (item) => `<tr>
        <td>${esc(item.itemName)}<small>${item.quantity} × ${receiptMoney(item.unitPrice)}</small></td>
        <td class="amount">${receiptMoney(item.subtotal)}</td>
      </tr>`
    )
    .join("");

  const body = `
    ${business.logo ? `<img class="logo" src="${esc(business.logo)}" alt="" />` : ""}
    <h1>${esc(business.name)}</h1>
    ${business.address ? `<p class="muted">${esc(business.address)}</p>` : ""}
    ${business.phone ? `<p class="muted">${esc(business.phone)}</p>` : ""}
    <hr />
    <dl>
      <dt>Receipt</dt><dd>${esc(receipt.orderNumber)}</dd>
      <dt>Order ID</dt><dd>${esc(receipt.id)}</dd>
      <dt>Date</dt><dd>${esc(date)}</dd>
      <dt>Time</dt><dd>${esc(time)}</dd>
      <dt>Customer</dt><dd>${esc(receipt.customerName)}</dd>
      ${receipt.customerPhone ? `<dt>Phone</dt><dd>${esc(receipt.customerPhone)}</dd>` : ""}
      <dt>Service</dt><dd>${esc(receipt.orderType === "TAKE_AWAY" ? "Take Away" : `Table ${receipt.table.tableNumber}`)}</dd>
    </dl>
    <hr />
    <table><thead><tr><th>Item</th><th class="amount">Amount</th></tr></thead><tbody>${lines}</tbody></table>
    <hr />
    <dl class="totals">
      <dt>Discount</dt><dd>Not recorded</dd>
      <dt>Total</dt><dd>${receiptMoney(receipt.total)}</dd>
      <dt>Paid</dt><dd>${receiptMoney(receipt.paidAmount)}</dd>
      <dt>Remaining</dt><dd>${receiptMoney(receipt.remainingBalance)}</dd>
      <dt>Payment status</dt><dd>${esc(receipt.paymentStatus)}</dd>
    </dl>
    <hr /><p class="thanks">THANK YOU</p>`;

  const copiesHtml = Array.from({ length: copies }, (_, index) =>
    `<main class="receipt${index < copies - 1 ? " next-copy" : ""}">${body}</main>`
  ).join("");

  if (a4) {
    return `<!doctype html><html><head><meta charset="utf-8"/><title>Invoice ${esc(receipt.orderNumber)}</title>
      <style>
        *{box-sizing:border-box}html,body{margin:0;color:#171713;background:#fff;font:11pt Arial,sans-serif}
        .receipt{width:210mm;max-width:min(170mm,${columns}ch);min-height:297mm;padding:18mm 0;margin:0 auto}
        .logo{display:block;max-width:34mm;max-height:24mm;object-fit:contain;margin-bottom:6mm}
        h1{font:700 22pt Georgia,serif;margin:0 0 2mm}.muted{color:#555;margin:1mm 0}
        hr{border:0;border-top:1px solid #bbb;margin:6mm 0}
        dl{display:grid;grid-template-columns:35mm 1fr;gap:2mm 4mm;margin:0}
        dt{color:#555}dd{margin:0;text-align:right;overflow-wrap:anywhere}
        table{width:100%;border-collapse:collapse;margin:5mm 0}
        th,td{text-align:left;padding:3mm 1mm;border-bottom:1px solid #ddd}
        th{font-size:9pt;text-transform:uppercase;color:#555}.amount{text-align:right;white-space:nowrap}
        small{display:block;color:#666;margin-top:1mm}.totals{grid-template-columns:1fr auto}
        .totals dt:last-of-type,.totals dd:last-of-type{font-weight:700}
        .thanks{text-align:center;margin-top:14mm;font-weight:700;letter-spacing:.1em}
        .next-copy{break-before:page;page-break-before:always}
        @page{size:A4;margin:0}@media print{.receipt{margin:0}}
      </style></head><body>${copiesHtml}</body></html>`;
  }

  const contentWidth = printer.paperWidth === "58" ? "48mm" : "72mm";
  const fontSize = printer.paperWidth === "58" ? "9px" : "11px";
  return `<!doctype html><html><head><meta charset="utf-8"/><title>Receipt ${esc(receipt.orderNumber)}</title>
    <style>
      *{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#000}
      body{font: ${fontSize}/${printer.paperWidth === "58" ? "1.25" : "1.35"} ui-monospace,Consolas,monospace}
      .receipt{width:min(${contentWidth},${columns}ch);max-width:min(${contentWidth},${columns}ch);margin:0 auto;padding:2mm 1mm;overflow-wrap:anywhere}
      .logo{display:block;width:12mm;height:12mm;object-fit:contain;margin:0 auto 1mm}
      h1{text-align:center;font-size:1.2em;margin:0 0 1mm;overflow-wrap:anywhere}
      .muted{text-align:center;margin:0 0 .5mm;font-size:.9em;overflow-wrap:anywhere}
      hr{border:0;border-top:1px dashed #000;margin:2mm 0}
      dl{display:grid;grid-template-columns:34% 66%;gap:.8mm 0;margin:0}
      dt{color:#333;padding-right:1mm}dd{margin:0;text-align:right;font-weight:600;overflow-wrap:anywhere}
      table{width:100%;border-collapse:collapse;table-layout:fixed}
      th,td{text-align:left;padding:.8mm 0;vertical-align:top;overflow-wrap:anywhere}
      th{border-bottom:1px solid #000;text-transform:uppercase;font-size:.85em}
      .amount{text-align:right;white-space:normal;word-break:break-word}
      small{display:block;font-size:.85em;color:#333}
      .totals{grid-template-columns:45% 55%}
      .totals dt:last-of-type,.totals dd:last-of-type{font-weight:800}
      .thanks{text-align:center;font-weight:700;letter-spacing:.08em;margin:2mm 0}
      .next-copy{break-before:page;page-break-before:always}
      @page{size:${width} auto;margin:0}
      @media print{.receipt{margin:0;break-inside:avoid}}
    </style></head><body>${copiesHtml}</body></html>`;
}

/** Builds a real test receipt document for the selected configuration. */
export function buildTestReceiptHtml(cfg: TestReceiptConfig, businessName: string): string {
  const now = new Date();
  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString();
  const connectionLabel = CONNECTION_LABELS[cfg.connectionType] ?? cfg.connectionType;
  const printerLabel = cfg.printerName || cfg.name;

  if (cfg.paperWidth === "A4") {
    const copiesHtml = Array.from(
      { length: Math.min(10, Math.max(1, cfg.copies)) },
      (_, index) => `
        <main class="test-copy${index ? " next-copy" : ""}">
          <h1>${esc(businessName)}</h1>
          <p class="sub">TEST RECEIPT — Printer Configuration Test</p>
          <table>
            <tr><td>Printer</td><td>${esc(printerLabel)}</td></tr>
            <tr><td>Role</td><td>${esc(ROLE_LABELS[cfg.role ?? "RECEIPT"] ?? "Receipt / Cashier")}</td></tr>
            <tr><td>Paper</td><td>A4</td></tr>
            <tr><td>Columns</td><td>${cfg.printColumns}</td></tr>
            <tr><td>Copy</td><td>${index + 1} of ${cfg.copies}</td></tr>
            <tr><td>Connection</td><td>${esc(connectionLabel)}</td></tr>
            <tr><td>Date</td><td>${esc(date)}</td></tr>
            <tr><td>Time</td><td>${esc(time)}</td></tr>
          </table>
          <p class="footer">Verify this test page in the print dialog.</p>
        </main>`
    ).join("");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Test Print</title>
      <style>
        *{box-sizing:border-box}body{font-family:Georgia,serif;color:#171713;margin:0;padding:24mm}
        .test-copy{min-height:249mm} .next-copy{break-before:page}
        h1{margin:0 0 4mm;font-size:22pt} .sub{color:#555;margin-bottom:10mm}
        table{width:100%;border-collapse:collapse}td{padding:2mm 0;border-bottom:1px solid #ddd;font-size:11pt}
        .footer{margin-top:12mm;text-align:center;color:#666;font-size:9pt}
        @page{size:A4;margin:0}
      </style></head><body>${copiesHtml}</body></html>`;
  }

  const contentMm = cfg.paperWidth === "80" ? 72 : 48;
  const pageMm = cfg.paperWidth;
  const line = "-".repeat(Math.max(10, cfg.printColumns));
  const fontSize = cfg.paperWidth === "80" ? "11px" : "9px";

  const copiesHtml = Array.from(
    { length: Math.min(10, Math.max(1, cfg.copies)) },
    (_, index) => `
      <main class="test-copy${index ? " next-copy" : ""}">
        <p class="center b">${esc(businessName).toUpperCase()}</p>
        <pre>${esc(line)}
TEST RECEIPT
Printer: ${esc(printerLabel)}
Paper: ${esc(cfg.paperWidth === "A4" ? "A4" : cfg.paperWidth + "mm")}
Connection: ${esc(connectionLabel)}
Copy: ${index + 1} of ${cfg.copies}
${esc(line)}
Verify this test page in the print dialog.
Date: ${esc(date)}
Time: ${esc(time)}
${esc(line)}
THANK YOU
${esc(line)}</pre>
      </main>`
  ).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Test Print</title>
    <style>
      *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      html,body{margin:0;padding:0;background:#fff}
      body{font-family:ui-monospace,Menlo,Consolas,monospace;color:#000;font-size:${fontSize};
           line-height:1.35;width:${contentMm}mm;max-width:${contentMm}mm;margin:0 auto;padding:2mm 1mm}
      .center{text-align:center} .b{font-weight:700} pre{font:inherit;margin:0;white-space:pre-wrap;overflow-wrap:anywhere}
      .test-copy{width:100%;max-width:${cfg.printColumns}ch}
      .next-copy{break-before:page;page-break-before:always}
      @page{size:${pageMm}mm auto;margin:0}
    </style></head><body>${copiesHtml}</body></html>`;
}
