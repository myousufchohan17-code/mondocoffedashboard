import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  role: z.enum(["RECEIPT", "KITCHEN", "INVOICE", "OTHER"]).default("RECEIPT"),
  connectionType: z.enum(["USB", "NETWORK", "BROWSER"]).default("BROWSER"),
  paperWidth: z.enum(["58", "80", "A4"]).default("80"),
  printColumns: z.number().int().min(10).max(120).default(42),
  copies: z.number().int().min(1).max(10).default(1),
  autoPrint: z.boolean().default(false),
  mockPrinter: z.boolean().default(false),
  isActive: z.boolean().default(false),
});

export async function GET() {
  const session = await requireStaff();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const printers = await prisma.printerConfig.findMany({
    where: { restaurantId: session.user.restaurantId },
    orderBy: { createdAt: "asc" },
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
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({ printers });
}

export async function POST(request: Request) {
  const session = await requireStaff();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid printer configuration" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid printer configuration" }, { status: 400 });
  }

  const data = parsed.data;
  const printer = await prisma.$transaction(async (tx) => {
    if (data.isActive) {
      await tx.printerConfig.updateMany({
        where: { restaurantId: session.user.restaurantId, role: data.role },
        data: { isActive: false },
      });
    }
    return tx.printerConfig.create({
      data: {
        restaurantId: session.user.restaurantId,
        name: data.name.trim(),
        role: data.role,
        connectionType: data.connectionType,
        paperWidth: data.paperWidth,
        printColumns: data.printColumns,
        copies: data.copies,
        autoPrint: data.autoPrint,
        mockPrinter: data.mockPrinter,
        isActive: data.isActive,
      },
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
  return NextResponse.json({ printer }, { status: 201 });
}
