import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  role: z.enum(["RECEIPT", "KITCHEN", "INVOICE", "OTHER"]).optional(),
  connectionType: z.enum(["USB", "NETWORK", "BROWSER"]).optional(),
  paperWidth: z.enum(["58", "80", "A4"]).optional(),
  printColumns: z.number().int().min(10).max(120).optional(),
  copies: z.number().int().min(1).max(10).optional(),
  autoPrint: z.boolean().optional(),
  mockPrinter: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.printerConfig.findFirst({
    where: { id, restaurantId: session.user.restaurantId },
  });
  if (!existing) return NextResponse.json({ error: "Printer not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid printer configuration" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid printer configuration" }, { status: 400 });
  }

  const printer = await prisma.$transaction(async (tx) => {
    const targetRole = parsed.data.role ?? existing.role;
    const shouldActivate =
      parsed.data.isActive === true ||
      (parsed.data.isActive === undefined &&
        existing.isActive &&
        targetRole !== existing.role);
    if (shouldActivate) {
      await tx.printerConfig.updateMany({
        where: { restaurantId: session.user.restaurantId, role: targetRole },
        data: { isActive: false },
      });
    }
    return tx.printerConfig.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        role: true,
        connectionType: true,
        paperWidth: true,
        printColumns: true,
        copies: true,
        autoPrint: true,
        mockPrinter: true,
        isActive: true,
      },
    });
  });
  return NextResponse.json({ printer });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.printerConfig.findFirst({
    where: { id, restaurantId: session.user.restaurantId },
  });
  if (!existing) return NextResponse.json({ error: "Printer not found" }, { status: 404 });

  await prisma.printerConfig.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
