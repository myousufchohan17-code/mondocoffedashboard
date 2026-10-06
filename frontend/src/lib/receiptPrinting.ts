"use client";

import { printHtmlDocument } from "@/lib/printReceipt";
import { buildOrderReceiptHtml, type PersistedReceipt } from "@/lib/printers";

export type ReceiptPrintResult =
  | { status: "dialog-opened"; fallback: boolean }
  | { status: "simulated" }
  | { status: "skipped" };

export async function printReceipt(
  orderId: string,
  options: { onlyIfAutoPrint?: boolean } = {}
): Promise<ReceiptPrintResult> {
  const response = await fetch(`/api/dashboard/orders/${encodeURIComponent(orderId)}/receipt`, {
    cache: "no-store",
  });
  const data: PersistedReceipt & { error?: string } = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not load the order receipt.");
  }

  if (options.onlyIfAutoPrint && !data.printer?.autoPrint) {
    return { status: "skipped" };
  }

  if (!data.printer) {
    throw new Error("No active printer is configured. Add or activate a printer in Printer Settings.");
  }

  const html = buildOrderReceiptHtml(data.order, data.restaurant, data.printer);
  if (data.printer.mockPrinter) {
    return { status: "simulated" };
  }

  const opened = await printHtmlDocument(html);
  if (!opened) {
    throw new Error("Browser printing is unavailable. You can print this receipt manually from the order.");
  }

  return {
    status: "dialog-opened",
    fallback: data.printer.connectionType !== "BROWSER",
  };
}
