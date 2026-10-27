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

    // Determina o próximo número sequencial de venda de forma segura
    const year = new Date().getFullYear();
    const latestOrder = await db.order.findFirst({
      where: {
        orderNumber: { startsWith: `VDA-${year}-` },
      },
      orderBy: { createdAt: "desc" },
      select: { orderNumber: true },
    });

    let nextSeq = 1;
    if (latestOrder?.orderNumber) {
      const parts = latestOrder.orderNumber.split("-");
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    } else {
      const count = await db.order.count();
      nextSeq = count + 1;
    }

    // 1. Cria a Venda / Order com tentativa de desempate em caso de concorrência
    let order: any = null;
    let finalOrderNumber = "";
    let attempts = 0;

    while (!order && attempts < 5) {
      finalOrderNumber = `VDA-${year}-${String(nextSeq + attempts).padStart(4, "0")}`;
      try {
        order = await db.order.create({
          data: {
            orderNumber: finalOrderNumber,
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
      } catch (err: any) {
        // Se der conflito de chave única (P2002) no orderNumber por clique simultâneo, tenta o próximo número
        if (err.code === "P2002" && JSON.stringify(err.meta || "").includes("orderNumber")) {
          attempts++;
        } else {
          throw err;
        }
      }
    }

    if (!order) {
      throw new Error("Não foi possível gerar um número único de pedido. Tente novamente.");
    }

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
      newValues: { orderNumber: order.orderNumber, totalAmount, receivableId: receivable.id },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Venda ${order.orderNumber} de R$ ${totalAmount} com emissão de título a vencer para ${order.customer.name}`,
    });

    return NextResponse.json({ success: true, order, receivable });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { id, action = "edit", channel, discountAmount, status, items } = body;

    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    const existingOrder = await db.order.findUnique({
      where: { id },
      include: { items: true, receivables: true },
    });
    if (!existingOrder) return NextResponse.json({ error: "Venda não encontrada" }, { status: 404 });

    // AÇÃO 1: INATIVAR / CANCELAR VENDA (E DEVOLVER ITENS AO ESTOQUE)
    if (action === "inactivate" || status === "CANCELADO") {
      if (existingOrder.status === "CANCELADO") {
        return NextResponse.json({ error: "Esta venda já está cancelada/inativada" }, { status: 400 });
      }

      // Restaura o estoque de cada produto vendido
      for (const item of existingOrder.items) {
        await db.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
          },
        });
      }

      // Cancela o título a receber vinculado
      await db.accountReceivable.updateMany({
        where: { orderId: existingOrder.id },
        data: { status: "CANCELADA" },
      });

      // Atualiza o pedido
      const updatedOrder = await db.order.update({
        where: { id },
        data: { status: "CANCELADO" },
        include: { items: { include: { product: true } }, customer: true, receivables: true },
      });

      await logAudit({
        userId: user.id,
        action: "STATUS_CHANGE",
        entity: "Order",
        entityId: id,
        newValues: { status: "CANCELADO" },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        description: `Inativação da venda ${existingOrder.orderNumber} e devolução dos itens ao estoque`,
      });

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    // AÇÃO 2: EDITAR VENDA (Itens, Canal, Desconto)
    let validatedItems = null;
    let newSubtotal = 0;

    if (items && Array.isArray(items)) {
      if (items.length === 0) {
        return NextResponse.json({ error: "A venda deve conter pelo menos 1 item." }, { status: 400 });
      }

      validatedItems = items.map((item: any) => {
        const q = Math.max(1, parseInt(item.quantity, 10) || 1);
        const price = parseFloat(item.unitPrice) || 0;
        const totalItem = q * price;
        newSubtotal += totalItem;
        return {
          orderId: id,
          productId: item.productId,
          quantity: q,
          unitPrice: price,
          totalPrice: totalItem,
        };
      });

      // Se a venda não estava cancelada, faz a reconciliação do estoque:
      if (existingOrder.status !== "CANCELADO") {
        // 1. Devolve os itens antigos para o estoque
        for (const oldIt of existingOrder.items) {
          await db.product.update({
            where: { id: oldIt.productId },
            data: { stockQuantity: { increment: oldIt.quantity } },
          });
        }
        // 2. Dá baixa nos novos itens do estoque
        for (const newIt of validatedItems) {
          await db.product.update({
            where: { id: newIt.productId },
            data: { stockQuantity: { decrement: newIt.quantity } },
          });
        }
      }

      // 3. Substitui os OrderItems
      await db.orderItem.deleteMany({
        where: { orderId: id },
      });
      await Promise.all(
        validatedItems.map((it) =>
          db.orderItem.create({
            data: it,
          })
        )
      );
    } else {
      newSubtotal = existingOrder.items.reduce((s, it) => s + Number(it.totalPrice), 0);
    }

    const newDiscount = discountAmount !== undefined ? parseFloat(discountAmount) : Number(existingOrder.discountAmount);
    const newTotal = Math.max(0, newSubtotal - newDiscount);

    const updatedOrder = await db.order.update({
      where: { id },
      data: {
        channel: channel !== undefined ? channel : existingOrder.channel,
        discountAmount: newDiscount,
        totalAmount: newTotal,
      },
      include: { items: { include: { product: true } }, customer: true, receivables: true },
    });

    // Se o valor total mudou e há conta a receber pendente, atualiza o valor do título
    if (existingOrder.receivables.length > 0) {
      await db.accountReceivable.updateMany({
        where: { orderId: existingOrder.id, status: "A_RECEBER" },
        data: { originalAmount: newTotal },
      });
    }

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "Order",
      entityId: id,
      newValues: {
        totalAmount: newTotal,
        discountAmount: newDiscount,
        channel,
        itemsCount: validatedItems ? validatedItems.length : existingOrder.items.length,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Edição dos dados e itens da venda ${existingOrder.orderNumber}`,
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return NextResponse.json({ error: "Venda não encontrada" }, { status: 404 });

    // Se a venda não estava cancelada, restaura o estoque
    if (order.status !== "CANCELADO") {
      for (const item of order.items) {
        await db.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
          },
        });
      }
    }

    // Remove contas a receber vinculadas
    await db.accountReceivable.deleteMany({
      where: { orderId: order.id },
    });

    await db.order.delete({
      where: { id },
    });

    await logAudit({
      userId: user.id,
      action: "DELETE",
      entity: "Order",
      entityId: id,
      newValues: { orderNumber: order.orderNumber },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Exclusão da venda ${order.orderNumber} e devolução dos itens ao estoque`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
