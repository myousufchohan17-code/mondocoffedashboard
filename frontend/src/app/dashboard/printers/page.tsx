import type { Metadata } from "next";
import { DashboardShell } from "@/components/DashboardShell";
import { PrinterSettings } from "@/components/PrinterSettings";

export const metadata: Metadata = {
  title: "Printer Settings",
};

export default function PrintersPage() {
  return (
    <DashboardShell active="printers">
      <PrinterSettings />
    </DashboardShell>
  );
}
