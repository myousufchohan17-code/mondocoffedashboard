"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/ToastProvider";
import { printHtmlDocument } from "@/lib/printReceipt";
import {
  buildTestReceiptHtml,
  suggestColumns,
  CONNECTION_LABELS,
  ROLE_LABELS,
  type PrinterPaperWidth,
} from "@/lib/printers";

type Printer = {
  id: string;
  name: string;
  role: string;
  connectionType: string;
  paperWidth: string;
  printColumns: number;
  copies: number;
  autoPrint: boolean;
  mockPrinter: boolean;
  isActive: boolean;
};

type FormState = {
  name: string;
  role: string;
  connectionType: string;
  paperWidth: PrinterPaperWidth;
  printColumns: number;
  copies: number;
  autoPrint: boolean;
  mockPrinter: boolean;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  role: "RECEIPT",
  connectionType: "BROWSER",
  paperWidth: "80",
  printColumns: 48,
  copies: 1,
  autoPrint: false,
  mockPrinter: false,
  isActive: false,
};

export function PrinterSettings() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [columnsTouched, setColumnsTouched] = useState(false);
  const [businessName, setBusinessName] = useState("Business");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/printers");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load printer settings.");
      setPrinters(data.printers ?? []);
      const profileResponse = await fetch("/api/dashboard/profile", { cache: "no-store" });
      if (!profileResponse.ok) throw new Error("Could not load business details for the test receipt.");
      const profile = await profileResponse.json();
      if (typeof profile.restaurant?.name !== "string") {
        throw new Error("Business name is missing from the profile.");
      }
      setBusinessName(profile.restaurant.name);
    } catch (error) {
      console.error("Could not load printer settings.", error);
      toast.error("Could not load printer settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  function setPaperWidth(w: PrinterPaperWidth) {
    setForm((f) => ({
      ...f,
      paperWidth: w,
      printColumns: columnsTouched ? f.printColumns : suggestColumns(w),
    }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setColumnsTouched(false);
  }

  function editPrinter(p: Printer) {
    setEditingId(p.id);
    setColumnsTouched(true);
    setForm({
      name: p.name,
      role: p.role,
      connectionType: p.connectionType,
      paperWidth: (p.paperWidth === "58" || p.paperWidth === "A4" ? p.paperWidth : "80") as PrinterPaperWidth,
      printColumns: p.printColumns,
      copies: p.copies,
      autoPrint: p.autoPrint,
      mockPrinter: p.mockPrinter,
      isActive: p.isActive,
    });
  }

  async function savePrinter(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Printer name is required.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      role: form.role,
      connectionType: form.connectionType,
      paperWidth: form.paperWidth,
      printColumns: form.printColumns,
      copies: form.copies,
      autoPrint: form.autoPrint,
      mockPrinter: form.mockPrinter,
      isActive: form.isActive,
    };
    try {
      const res = await fetch(editingId ? `/api/dashboard/printers/${editingId}` : "/api/dashboard/printers", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not save printer.");
        return;
      }
      toast.success(editingId ? "Printer updated." : "Printer saved.");
      resetForm();
      void load();
    } catch (error) {
      console.error("Could not save printer configuration.", error);
      toast.error("Could not save printer. Check your connection and try again.");
    }
  }

  async function deletePrinter(p: Printer) {
    if (!window.confirm(`Delete printer "${p.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/dashboard/printers/${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Could not delete printer.");
        return;
      }
      toast.success("Printer deleted.");
      if (editingId === p.id) resetForm();
      void load();
    } catch (error) {
      console.error("Could not delete printer configuration.", error);
      toast.error("Could not delete printer. Check your connection and try again.");
    }
  }

  async function toggleActive(p: Printer) {
    try {
      const res = await fetch(`/api/dashboard/printers/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      if (!res.ok) {
        toast.error("Could not update printer.");
        return;
      }
      toast.success(p.isActive ? "Printer disabled." : "Printer set as active.");
      void load();
    } catch (error) {
      console.error("Could not update printer configuration.", error);
      toast.error("Could not update printer. Check your connection and try again.");
    }
  }

  async function testPrint(cfg: FormState | Printer) {
    if (
      !cfg.name.trim() ||
      !Number.isInteger(cfg.printColumns) ||
      cfg.printColumns < 10 ||
      cfg.printColumns > 120 ||
      !Number.isInteger(cfg.copies) ||
      cfg.copies < 1 ||
      cfg.copies > 10
    ) {
      toast.error("Enter a printer name, 10–120 columns, and 1–10 copies before testing.");
      return;
    }
    const paperWidth = (cfg.paperWidth === "58" || cfg.paperWidth === "A4" ? cfg.paperWidth : "80") as PrinterPaperWidth;
    const html = buildTestReceiptHtml(
      {
        name: cfg.name || "Printer",
        role: cfg.role,
        connectionType: cfg.connectionType,
        printerName: cfg.name,
        paperWidth,
        printColumns: cfg.printColumns,
        copies: cfg.copies,
      },
      businessName
    );

    if (cfg.mockPrinter) {
      const w = window.open("", "_blank", "width=480,height=720");
      if (!w) {
        toast.error("The test preview was blocked. Allow pop-ups and try again.");
        return;
      }
      try {
        w.document.open();
        w.document.write(html);
        w.document.close();
      } catch (error) {
        w.close();
        console.error("Could not render mock printer test receipt.", error);
        toast.error("Could not generate the mock test receipt.");
        return;
      }
      toast.info("Mock printer: test receipt generated (simulated, not sent to a physical printer).");
      return;
    }

    try {
      const opened = await printHtmlDocument(html);
      if (!opened) {
        toast.error("Browser printing is unavailable. Check your browser's print settings.");
        return;
      }
      toast.info(
        cfg.connectionType === "BROWSER"
          ? "Print dialog opened. Select the printer and confirm the test print."
          : "Direct device printing is unavailable here. Use the browser print dialog as the printer fallback."
      );
    } catch (error) {
      console.error("Could not open the printer test dialog.", error);
      toast.error("Browser printing is unavailable. Check your browser's print settings.");
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--gold)]";
  const labelClass = "mb-1 block text-xs uppercase tracking-wider text-[var(--text-dim)]";

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Printer Settings</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Configure receipt, kitchen and invoice printers for this account.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <form onSubmit={savePrinter} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <h2 className="text-lg font-semibold">{editingId ? "Edit Printer" : "Add Printer"}</h2>

          <label className="mt-4 block">
            <span className={labelClass}>Printer Name</span>
            <input required maxLength={80} className={inputClass} placeholder="e.g. Counter receipt printer" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Role</span>
              <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="RECEIPT">Receipt / Cashier</option>
                <option value="KITCHEN">Kitchen</option>
                <option value="INVOICE">Invoice</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label>
              <span className={labelClass}>Connection</span>
              <select className={inputClass} value={form.connectionType} onChange={(e) => setForm({ ...form, connectionType: e.target.value })}>
                <option value="USB">USB (Windows installed printer)</option>
                <option value="NETWORK">Network Printer</option>
                <option value="BROWSER">Browser / System Printer</option>
              </select>
            </label>
          </div>

          <div className="mt-4 block">
            <span className={labelClass}>Installed Printer</span>
            <select className={inputClass} value="" disabled>
              <option value="">No printer detected</option>
            </select>
            <span className="mt-1 block text-[11px] text-[var(--text-dim)]">
              This browser does not expose installed-printer detection. Choose the physical printer in the system print dialog.
            </span>
            {form.connectionType !== "BROWSER" && (
              <span className="mt-1 block text-[11px] text-[var(--text-dim)]">
                Direct {form.connectionType === "USB" ? "USB" : "network"} printing is not available in this web app; printing uses the browser/system dialog.
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label>
              <span className={labelClass}>Paper Width</span>
              <select className={inputClass} value={form.paperWidth} onChange={(e) => setPaperWidth(e.target.value as PrinterPaperWidth)}>
                <option value="58">58mm</option>
                <option value="80">80mm</option>
                <option value="A4">A4</option>
              </select>
            </label>
            <label>
              <span className={labelClass}>Print Columns</span>
              <input required className={inputClass} type="number" min={10} max={120} value={form.printColumns} onChange={(e) => { setColumnsTouched(true); setForm({ ...form, printColumns: Number(e.target.value) }); }} />
            </label>
            <label>
              <span className={labelClass}>Copies</span>
              <input required className={inputClass} type="number" min={1} max={10} value={form.copies} onChange={(e) => setForm({ ...form, copies: Number(e.target.value) })} />
            </label>
          </div>

          <div className="mt-4 space-y-2">
            <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <input type="checkbox" checked={form.autoPrint} onChange={(e) => setForm({ ...form, autoPrint: e.target.checked })} />
              Auto print after order
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <input type="checkbox" checked={form.mockPrinter} onChange={(e) => setForm({ ...form, mockPrinter: e.target.checked })} />
              Mock printer (simulate, do not send to a physical printer)
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Set as active printer
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="submit" className="rounded-xl px-5 py-2 text-sm font-semibold text-[#171713]" style={{ background: "linear-gradient(135deg,#A88A4A,#D4B76A)" }}>
              Save Printer
            </button>
            <button type="button" onClick={() => testPrint(form)} className="rounded-xl border border-[#A88A4A] px-5 py-2 text-sm font-semibold text-[var(--gold-bright)]">
              Test Print
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="rounded-xl border border-[var(--border)] px-5 py-2 text-sm text-[var(--text-muted)]">
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* List */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <h2 className="text-lg font-semibold">Configured Printers</h2>
          {loading ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">Loading…</p>
          ) : printers.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">No printer configured yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {printers.map((p) => (
                <li key={p.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {p.name}{" "}
                        {p.isActive && <span className="ml-1 rounded-full border border-[var(--gold)]/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--gold-bright)]">Active</span>}
                        {p.mockPrinter && <span className="ml-1 rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--text-dim)]">Mock</span>}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {ROLE_LABELS[p.role] ?? p.role} • {CONNECTION_LABELS[p.connectionType] ?? p.connectionType} • {p.paperWidth === "A4" ? "A4" : `${p.paperWidth}mm`} • {p.printColumns} cols • {p.copies} {p.copies === 1 ? "copy" : "copies"}
                        {p.autoPrint ? " • Auto print" : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <button className="rounded-lg border border-[var(--border)] px-2.5 py-1" onClick={() => editPrinter(p)}>Edit</button>
                      <button className="rounded-lg border border-[var(--border)] px-2.5 py-1" onClick={() => testPrint(p)}>Test</button>
                      <button className="rounded-lg border border-[var(--border)] px-2.5 py-1" onClick={() => toggleActive(p)}>{p.isActive ? "Disable" : "Set Active"}</button>
                      <button className="rounded-lg border border-red-500/40 px-2.5 py-1 text-red-400" onClick={() => deletePrinter(p)}>Delete</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
