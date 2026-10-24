import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const orders = await db.order.findMany({
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
        receivables: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const products = await db.product.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    const customers = await db.customer.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ orders, products, customers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const {
      customerId,
      customerName,
      customerPhone,
      items, // array: [{ productId, quantity, unitPrice }]
      discountAmount = 0,
      paymentMethod = "PIX",
      saleDate = new Date().toISOString(),
      dueDate = new Date().toISOString(),
      channel = "Balcão / Instagram",
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "A venda deve conter ao menos 1 item do catálogo" }, { status: 400 });
    }

    let targetCustomerId = customerId;

    // Se cliente avulso informado por nome
    if (!targetCustomerId && customerName) {
      const created = await db.customer.create({
        data: {
          name: customerName,
          phone: customerPhone || null,
          paymentMethod,
          status: "CONVERTIDA",
        },
      });
      targetCustomerId = created.id;
    } else if (!targetCustomerId) {
      const firstCust = await db.customer.findFirst();
      if (firstCust) targetCustomerId = firstCust.id;
    }

    if (!targetCustomerId) {
      return NextResponse.json({ error: "Cliente obrigatório para registrar venda" }, { status: 400 });
    }

    // Calcula total dos itens
    let subtotal = 0;
    const validatedItems = items.map((item: any) => {
      const q = parseInt(item.quantity, 10) || 1;
      const price = parseFloat(item.unitPrice) || 0;
      const totalItem = q * price;
      subtotal += totalItem;
      return {
        productId: item.productId,
        quantity: q,
        unitPrice: price,
        totalPrice: totalItem,
      };
    });

    const totalAmount = Math.max(0, subtotal - (parseFloat(discountAmount) || 0));
    const orderCount = await db.order.count();
    const orderNumber = `VDA-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, "0")}`;

    // 1. Cria a Venda / Order
    const order = await db.order.create({
      data: {
        orderNumber,
        customerId: targetCustomerId,
        totalAmount,
        discountAmount: parseFloat(discountAmount) || 0,
        channel,
        status: "CONCLUIDO",
        createdAt: new Date(saleDate),
        items: {
          create: validatedItems,
        },
      },
      include: {
        items: { include: { product: true } },
        customer: true,
      },
    });

    // 2. Dá baixa no estoque de cada produto
    for (const it of validatedItems) {
      await db.product.update({
        where: { id: it.productId },
        data: {
          stockQuantity: { decrement: it.quantity },
        },
      });
    }

    // 3. Emite automaticamente o Título a Vencer no Contas a Receber
    const costCenterVelas = await db.costCenter.findFirst({
      where: { code: "VELAS" },
    }) || await db.costCenter.findFirst();

    const chartAccount = await db.chartOfAccount.findFirst({
      where: { code: "1.1.02" }, // Receita de Vendas de Velas e Resinas
    }) || await db.chartOfAccount.findFirst({
      where: { type: "RECEITA_OPERACIONAL" },
    }) || await db.chartOfAccount.findFirst();

    const receivable = await db.accountReceivable.create({
      data: {
        description: `Venda ${order.orderNumber} — ${order.customer.name}`,
        customerId: targetCustomerId,
        costCenterId: costCenterVelas!.id,
        chartOfAccountId: chartAccount!.id,
        orderId: order.id,
        originalAmount: totalAmount,
        competenceDate: new Date(saleDate),
        dueDate: new Date(dueDate),
        status: "A_RECEBER",
        paymentType: paymentMethod,
        notes: `Título gerado automaticamente pela venda de velas/resinas ${order.orderNumber}. Forma de pagamento: ${paymentMethod}`,
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "Order",
      entityId: order.id,
      newValues: { orderNumber, totalAmount, receivableId: receivable.id },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Venda ${orderNumber} de R$ ${totalAmount} com emissão de título a vencer para ${order.customer.name}`,
    });

    return NextResponse.json({ success: true, order, receivable });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
