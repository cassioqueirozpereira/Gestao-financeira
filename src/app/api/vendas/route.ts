import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, checkUserRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

// Schema de validação Zod para os itens da venda
const saleItemSchema = z.object({
  productId: z.string().min(1, "ID do produto é obrigatório"),
  quantity: z.number().int().min(1, "A quantidade deve ser de no mínimo 1 unidade"),
  unitPrice: z.number().min(0, "O preço unitário não pode ser negativo").optional(),
});

// Schema de validação Zod para registro de venda
const createSaleSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "A venda deve conter ao menos 1 item do catálogo"),
  packagingId: z.string().optional(),
  packagingQuantity: z.number().int().min(1).default(1),
  packagingPrice: z.number().min(0).default(0),
  discountAmount: z.number().min(0, "O desconto não pode ser negativo").default(0),
  paymentMethod: z.string().default("PIX"),
  saleDate: z.string().optional(),
  dueDate: z.string().optional(),
  channel: z.string().default("Balcão / Instagram"),
});

export async function GET() {
  try {
    const [orders, products, customers, packagings] = await Promise.all([
      db.order.findMany({
        include: {
          customer: true,
          items: {
            include: { product: true },
          },
          receivables: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      db.product.findMany({
        orderBy: [{ category: "asc" }, { name: "asc" }],
      }),
      db.customer.findMany({
        orderBy: { name: "asc" },
      }),
      db.packaging.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ orders, products, customers, packagings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    // RBAC: Apenas ADMIN, FINANCIAL e OPERATOR podem registrar vendas
    const roleCheck = checkUserRole(user, ["ADMIN", "FINANCIAL", "OPERATOR"]);
    if (!roleCheck.allowed) {
      return NextResponse.json({ error: roleCheck.error }, { status: roleCheck.status });
    }

    const rawBody = await req.json();

    // 1. Validação estrita de schema com Zod
    const parsed = createSaleSchema.safeParse(rawBody);
    if (!parsed.success) {
      const errorMsg = parsed.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const {
      customerId,
      customerName,
      customerPhone,
      items,
      packagingId,
      packagingQuantity = 1,
      packagingPrice = 0,
      discountAmount,
      paymentMethod,
      saleDate = new Date().toISOString(),
      dueDate = new Date().toISOString(),
      channel,
    } = parsed.data;

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

    // 2. Conferência de cada item no banco de dados (Preço Oficial e Trava de Estoque)
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Produto com ID ${item.productId} não foi encontrado no catálogo.` },
          { status: 400 }
        );
      }

      // Trava de estoque: Rejeita se estoque for insuficiente antes de tocar no banco
      if (product.stockQuantity < item.quantity) {
        return NextResponse.json(
          {
            error: `Estoque insuficiente para "${product.name}". Solicitado: ${item.quantity} un, Disponível em estoque: ${product.stockQuantity} un.`,
          },
          { status: 400 }
        );
      }

      // Preço oficial do banco para blindar contra manipulação do frontend
      const officialPrice = Number(product.basePrice);
      const totalItem = item.quantity * officialPrice;
      subtotal += totalItem;

      validatedItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: officialPrice,
        totalPrice: totalItem,
      });
    }

    // Conferência da embalagem selecionada (se houver)
    let selectedPackaging: any = null;
    let packagingTotal = 0;
    if (packagingId) {
      selectedPackaging = await db.packaging.findUnique({
        where: { id: packagingId },
      });

      if (!selectedPackaging) {
        return NextResponse.json({ error: "Embalagem selecionada não foi encontrada no estoque." }, { status: 400 });
      }

      if (selectedPackaging.currentStock < packagingQuantity) {
        return NextResponse.json(
          {
            error: `Estoque insuficiente para a embalagem "${selectedPackaging.name}". Solicitado: ${packagingQuantity} un, Disponível em estoque: ${selectedPackaging.currentStock} un.`,
          },
          { status: 400 }
        );
      }

      packagingTotal = packagingQuantity * Number(packagingPrice || 0);
    }

    // Trava de desconto: o desconto não pode superar o subtotal dos produtos + embalagem
    const grossTotal = subtotal + packagingTotal;
    if (discountAmount > grossTotal) {
      return NextResponse.json(
        {
          error: `O desconto concedido (R$ ${discountAmount.toFixed(2)}) não pode ser superior ao subtotal da venda (R$ ${grossTotal.toFixed(2)}).`,
        },
        { status: 400 }
      );
    }

    const totalAmount = Math.max(0, grossTotal - discountAmount);

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

    // 3. Criação da Venda / Order
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
            discountAmount,
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

    // 4. Baixa segura no estoque de cada produto
    for (const it of validatedItems) {
      await db.product.update({
        where: { id: it.productId },
        data: {
          stockQuantity: { decrement: it.quantity },
        },
      });
    }

    // 4.1 Baixa automática de embalagem selecionada
    if (selectedPackaging && packagingQuantity > 0) {
      await db.packaging.update({
        where: { id: selectedPackaging.id },
        data: {
          currentStock: { decrement: packagingQuantity },
        },
      });

      await db.stockMovement.create({
        data: {
          itemType: "EMBALAGEM",
          itemId: selectedPackaging.id,
          itemName: selectedPackaging.name,
          movementType: "SAIDA",
          quantity: packagingQuantity,
          unit: selectedPackaging.unit || "UN",
          unitCost: selectedPackaging.unitCost,
          totalCost: Number(selectedPackaging.unitCost) * packagingQuantity,
          origin: "VENDA",
          documentReference: order.orderNumber,
          notes: `Baixa de embalagem para entrega na Venda ${order.orderNumber}. Valor de venda praticado: R$ ${Number(packagingPrice).toFixed(2)}`,
          userId: user!.id,
        },
      });
    }

    // 5. Emissão do Título a Vencer no Contas a Receber
    const costCenterVelas = await db.costCenter.findFirst({
      where: { code: "VELAS" },
    }) || await db.costCenter.findFirst();

    const chartAccount = await db.chartOfAccount.findFirst({
      where: { code: "1.1.02" }, // Receita de Vendas de Velas e Resinas
    }) || await db.chartOfAccount.findFirst({
      where: { type: "RECEITA_OPERACIONAL" },
    }) || await db.chartOfAccount.findFirst();

    const packagingNote = selectedPackaging
      ? ` | Embalagem: ${selectedPackaging.name} (${packagingQuantity} un x R$ ${Number(packagingPrice).toFixed(2)})`
      : "";

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
        notes: `Título gerado automaticamente pela venda ${order.orderNumber}. Forma de pgto: ${paymentMethod}${packagingNote}`,
      },
    });

    await logAudit({
      userId: user!.id,
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
      // RBAC: Apenas ADMIN e FINANCIAL podem inativar/cancelar vendas
      const roleCheck = checkUserRole(user, ["ADMIN", "FINANCIAL"]);
      if (!roleCheck.allowed) {
        return NextResponse.json({ error: roleCheck.error }, { status: roleCheck.status });
      }

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
        userId: user!.id,
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
    // RBAC: ADMIN, FINANCIAL e OPERATOR podem editar dados da venda
    const roleCheck = checkUserRole(user, ["ADMIN", "FINANCIAL", "OPERATOR"]);
    if (!roleCheck.allowed) {
      return NextResponse.json({ error: roleCheck.error }, { status: roleCheck.status });
    }

    let validatedItems = null;
    let newSubtotal = 0;

    if (items && Array.isArray(items)) {
      if (items.length === 0) {
        return NextResponse.json({ error: "A venda deve conter pelo menos 1 item." }, { status: 400 });
      }

      // Validar cada item contra o banco de dados e checar estoque
      validatedItems = [];
      for (const rawItem of items) {
        const q = Math.max(1, parseInt(rawItem.quantity, 10) || 1);
        const product = await db.product.findUnique({
          where: { id: rawItem.productId },
        });

        if (!product) {
          return NextResponse.json(
            { error: `Produto ${rawItem.productId} não encontrado no catálogo.` },
            { status: 400 }
          );
        }

        // Se a venda estiver ativa, calcula a diferença de estoque necessária
        if (existingOrder.status !== "CANCELADO") {
          const prevItem = existingOrder.items.find((x) => x.productId === rawItem.productId);
          const prevQuantity = prevItem ? prevItem.quantity : 0;
          const diff = q - prevQuantity;

          // Se está pedindo mais unidades do que tinha antes, confere se há saldo em estoque
          if (diff > 0 && product.stockQuantity < diff) {
            return NextResponse.json(
              {
                error: `Estoque insuficiente para "${product.name}". Adicional solicitado: ${diff} un, disponível no estoque: ${product.stockQuantity} un.`,
              },
              { status: 400 }
            );
          }
        }

        const officialPrice = Number(product.basePrice);
        const totalItem = q * officialPrice;
        newSubtotal += totalItem;

        validatedItems.push({
          orderId: id,
          productId: product.id,
          quantity: q,
          unitPrice: officialPrice,
          totalPrice: totalItem,
        });
      }

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

    const rawDiscount = discountAmount !== undefined ? parseFloat(discountAmount) : Number(existingOrder.discountAmount);
    const newDiscount = Math.max(0, isNaN(rawDiscount) ? 0 : rawDiscount);

    if (newDiscount > newSubtotal) {
      return NextResponse.json(
        {
          error: `O desconto (R$ ${newDiscount.toFixed(2)}) não pode ser superior ao subtotal dos itens (R$ ${newSubtotal.toFixed(2)}).`,
        },
        { status: 400 }
      );
    }

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
      userId: user!.id,
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
      description: `Edição conferida dos dados e itens da venda ${existingOrder.orderNumber}`,
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    // RBAC: Apenas ADMIN e FINANCIAL podem excluir vendas
    const roleCheck = checkUserRole(user, ["ADMIN", "FINANCIAL"]);
    if (!roleCheck.allowed) {
      return NextResponse.json({ error: roleCheck.error }, { status: roleCheck.status });
    }

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
      userId: user!.id,
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
