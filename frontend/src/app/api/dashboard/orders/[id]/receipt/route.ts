import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, restaurantId: session.user.restaurantId },
    include: {
      items: true,
      table: { select: { tableNumber: true } },
      payments: {
        where: { status: "PAID" },
        select: { amount: true },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const [restaurant, printer] = await Promise.all([
    prisma.restaurant.findUnique({
      where: { id: session.user.restaurantId },
      select: { name: true, logo: true, address: true, phone: true },
    }),
    prisma.printerConfig.findFirst({
      where: {
        restaurantId: session.user.restaurantId,
        isActive: true,
        role: { in: ["RECEIPT", "INVOICE"] },
      },
      orderBy: [{ role: "desc" }, { createdAt: "asc" }],
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
      },
    }),
  ]);

  if (!restaurant) {
    return NextResponse.json({ error: "Business details not found" }, { status: 404 });
  }

  const paidAmount = order.payments.reduce((total, payment) => total + payment.amount, 0);
  const remainingBalance = Math.max(0, order.total - paidAmount);
  const paymentStatus =
    paidAmount >= order.total ? "PAID" : paidAmount > 0 ? "PARTIALLY PAID" : "UNPAID";

  return NextResponse.json({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      orderType: order.orderType,
      total: order.total,
      createdAt: order.createdAt,
      table: order.table,
      items: order.items.map((item) => ({
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
      paidAmount,
      remainingBalance,
      paymentStatus,
    },
    restaurant,
    printer,
  });
}
