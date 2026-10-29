import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "TODOS") {
      where.status = status;
    }

    const purchases = await db.purchase.findMany({
      where,
      include: {
        supplier: true,
        items: true,
        accountPayable: true,
      },
      orderBy: { orderDate: "desc" },
    });

    return NextResponse.json({ purchases });
  } catch (error: any) {
    console.error("Erro ao listar compras:", error);
    return NextResponse.json({ error: error.message || "Erro ao listar compras" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const {
      supplierId,
      orderDate,
      deliveryDate,
      freightAmount = 0,
      invoiceNumber,
      notes,
      items, // array: [{ itemType, itemId, name, quantity, unit, unitCost }]
      generatePayables = true,
      financialDestination, // "CONTAS_PAGAR" | "CARTAO_CREDITO" | "NENHUM"
      creditCardId,
      cardInstallments = 1,
      installmentsCount = 1,
      firstDueDate,
      costCenterId,
      chartOfAccountId,
    } = body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Fornecedor e itens da compra são obrigatórios" }, { status: 400 });
    }

    const supplier = await db.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 });

    // Calcula valor total dos itens
    const itemsTotal = items.reduce(
      (acc: number, it: any) => acc + Number(it.quantity) * Number(it.unitCost),
      0
    );
    const totalAmount = itemsTotal + Number(freightAmount || 0);

    const purchaseNumber = `COM-${Date.now().toString().slice(-6)}`;
    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const result = await db.$transaction(async (tx) => {
      // 1. Cria a compra com status PENDENTE_ENTREGA
      const newPurchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierId,
          orderDate: orderDate ? new Date(orderDate) : new Date(),
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          status: "PENDENTE_ENTREGA",
          totalAmount,
          freightAmount: Number(freightAmount) || 0,
          invoiceNumber: invoiceNumber?.trim() || null,
          notes: notes?.trim() || null,
          items: {
            create: items.map((it: any) => ({
              itemType: it.itemType, // MATERIA_PRIMA ou EMBALAGEM
              itemId: it.itemId,
              name: it.name,
              quantity: Number(it.quantity),
              unit: it.unit,
              unitCost: Number(it.unitCost),
              totalCost: Number(it.quantity) * Number(it.unitCost),
            })),
          },
        },
        include: { items: true },
      });

      // 2. Integração Financeira Automática (Contas a Pagar ou Faturas de Cartão de Crédito)
      const isCard =
        financialDestination === "CARTAO_CREDITO" ||
        (creditCardId && financialDestination !== "CONTAS_PAGAR" && financialDestination !== "NENHUM");
      const isPayables =
        (financialDestination === "CONTAS_PAGAR" || (!financialDestination && generatePayables)) &&
        !isCard &&
        financialDestination !== "NENHUM";

      if ((isCard && creditCardId) || (isPayables && firstDueDate)) {
        // Tenta puxar o centro de custo e plano de contas pré-cadastrados no próprio item do estoque
        let cCenterId = costCenterId;
        let cAccountId = chartOfAccountId;

        if (!cCenterId || !cAccountId) {
          const firstItem = items[0];
          if (firstItem?.itemId) {
            if (firstItem.itemType === "MATERIA_PRIMA") {
              const raw = await tx.rawMaterial.findUnique({
                where: { id: firstItem.itemId },
                select: { costCenterId: true, chartOfAccountId: true },
              });
              if (!cCenterId && raw?.costCenterId) cCenterId = raw.costCenterId;
              if (!cAccountId && raw?.chartOfAccountId) cAccountId = raw.chartOfAccountId;
            } else if (firstItem.itemType === "EMBALAGEM") {
              const pack = await tx.packaging.findUnique({
                where: { id: firstItem.itemId },
                select: { costCenterId: true, chartOfAccountId: true },
              });
              if (!cCenterId && pack?.costCenterId) cCenterId = pack.costCenterId;
              if (!cAccountId && pack?.chartOfAccountId) cAccountId = pack.chartOfAccountId;
            }
          }
        }

        // Se ainda não definidos, usa fallback seguro
        if (!cCenterId) {
          const defaultCC = await tx.costCenter.findFirst({ where: { code: "VELAS" } });
          cCenterId = defaultCC ? defaultCC.id : (await tx.costCenter.findFirst())?.id;
        }

        if (!cAccountId) {
          const defaultAcc = await tx.chartOfAccount.findFirst({
            where: { type: "CUSTO_DIRETO", isActive: true },
          });
          cAccountId = defaultAcc ? defaultAcc.id : (await tx.chartOfAccount.findFirst())?.id;
        }

        if (cCenterId && cAccountId) {
          if (isCard && creditCardId) {
            // Lança nas Faturas do Cartão de Crédito
            const card = await tx.creditCard.findUnique({ where: { id: creditCardId } });
            if (card) {
              const numInstallments = Math.max(1, parseInt(cardInstallments || installmentsCount, 10) || 1);
              const installmentValue = Number((totalAmount / numInstallments).toFixed(2));
              const pDate = orderDate ? new Date(orderDate) : new Date();

              for (let i = 1; i <= numInstallments; i++) {
                let invMonth = pDate.getMonth() + (i - 1);
                let invYear = pDate.getFullYear();

                // Se a data da compra for posterior ao dia de fechamento, a primeira parcela entra no próximo ciclo
                if (pDate.getDate() > (card.closingDay || 25)) {
                  invMonth += 1;
                }
                if (invMonth > 11) {
                  invYear += Math.floor(invMonth / 12);
                  invMonth = invMonth % 12;
                }

                const dueDay = card.dueDay || 10;
                const dueDate = new Date(invYear, invMonth, dueDay);

                // Busca ou cria fatura de cartão para este ciclo
                let invoice = await tx.creditCardInvoice.findFirst({
                  where: {
                    creditCardId: card.id,
                    referenceMonth: invMonth + 1,
                    referenceYear: invYear,
                  },
                });

                if (!invoice) {
                  invoice = await tx.creditCardInvoice.create({
                    data: {
                      creditCardId: card.id,
                      referenceMonth: invMonth + 1,
                      referenceYear: invYear,
                      closingDate: new Date(invYear, invMonth, card.closingDay || 25),
                      dueDate,
                      totalAmount: installmentValue,
                      isPaid: false,
                    },
                  });
                } else {
                  await tx.creditCardInvoice.update({
                    where: { id: invoice.id },
                    data: {
                      totalAmount: { increment: installmentValue },
                    },
                  });
                }

                const payable = await tx.accountPayable.create({
                  data: {
                    description:
                      numInstallments > 1
                        ? `Compra ${purchaseNumber} - ${supplier.name} (${i}/${numInstallments})`
                        : `Compra ${purchaseNumber} - ${supplier.name}`,
                    supplierId: supplier.id,
                    costCenterId: cCenterId,
                    chartOfAccountId: cAccountId,
                    originalAmount: installmentValue,
                    competenceDate: pDate,
                    dueDate,
                    scheduledDate: dueDate,
                    paymentType: "CARTAO",
                    creditCardInvoiceId: invoice.id,
                    installmentNumber: i,
                    totalInstallments: numInstallments,
                    notes: `Cartão: ${card.nickname} (${card.cardBrand}) • Pedido ${purchaseNumber} - ${notes || ""}`.trim(),
                    status: "EM_ABERTO",
                  },
                });

                if (i === 1) {
                  await tx.purchase.update({
                    where: { id: newPurchase.id },
                    data: { accountPayableId: payable.id },
                  });
                }
              }
            }
          } else if (isPayables && firstDueDate) {
            // Lança no Contas a Pagar tradicional
            const numInstallments = Math.max(1, parseInt(installmentsCount, 10) || 1);
            const installmentValue = Number((totalAmount / numInstallments).toFixed(2));
            const baseDueDate = new Date(firstDueDate);

            for (let i = 1; i <= numInstallments; i++) {
              const dueDate = new Date(baseDueDate);
              dueDate.setMonth(dueDate.getMonth() + (i - 1));

              const payable = await tx.accountPayable.create({
                data: {
                  description: `Compra ${purchaseNumber} - ${supplier.name} (${i}/${numInstallments})`,
                  supplierId: supplier.id,
                  costCenterId: cCenterId,
                  chartOfAccountId: cAccountId,
                  originalAmount: installmentValue,
                  competenceDate: new Date(),
                  dueDate,
                  status: "EM_ABERTO",
                  installmentNumber: i,
                  totalInstallments: numInstallments,
                  notes: `Gerado automaticamente pelo pedido de compra ${purchaseNumber}`,
                },
              });

              if (i === 1) {
                await tx.purchase.update({
                  where: { id: newPurchase.id },
                  data: { accountPayableId: payable.id },
                });
              }
            }
          }
        }
      }

      return newPurchase;
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "Purchase",
      entityId: result.id,
      newValues: { purchaseNumber, totalAmount, supplierId },
      ipAddress,
      description: `Criado pedido de compra ${purchaseNumber} de R$ ${totalAmount.toFixed(2)} para ${supplier.name}`,
    });

    return NextResponse.json({ success: true, purchase: result });
  } catch (error: any) {
    console.error("Erro ao registrar compra:", error);
    return NextResponse.json({ error: error.message || "Erro ao registrar compra" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { id, action = "UPDATE" } = body; // action: 'RECEIVE' | 'REVERT_RECEIPT' | 'CANCEL' | 'UPDATE'

    if (!id) {
      return NextResponse.json({ error: "ID da compra é obrigatório" }, { status: 400 });
    }

    const purchase = await db.purchase.findUnique({
      where: { id },
      include: { items: true, supplier: true },
    });

    if (!purchase) return NextResponse.json({ error: "Compra não encontrada" }, { status: 404 });

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // 1. Confirmar Recebimento Físico
    if (action === "RECEIVE") {
      if (purchase.status === "RECEBIDO") {
        return NextResponse.json({ error: "Esta compra já foi recebida anteriormente" }, { status: 400 });
      }

      if (purchase.status === "CANCELADO") {
        return NextResponse.json({ error: "Não é possível receber uma compra cancelada" }, { status: 400 });
      }

      const updated = await db.$transaction(async (tx) => {
        // Atualiza status da compra
        const p = await tx.purchase.update({
          where: { id },
          data: {
            status: "RECEBIDO",
            deliveryDate: new Date(),
          },
          include: { items: true, supplier: true, accountPayable: true },
        });

        // Dá entrada no estoque físico de cada item e registra movimentação
        for (const item of purchase.items) {
          if (item.itemType === "MATERIA_PRIMA") {
            const raw = await tx.rawMaterial.findUnique({ where: { id: item.itemId } });
            if (raw) {
              const newStock = Number(raw.currentStock) + Number(item.quantity);
              await tx.rawMaterial.update({
                where: { id: item.itemId },
                data: {
                  currentStock: newStock,
                  unitCost: Number(item.unitCost) > 0 ? Number(item.unitCost) : raw.unitCost,
                },
              });

              await tx.stockMovement.create({
                data: {
                  itemType: "MATERIA_PRIMA",
                  itemId: raw.id,
                  itemName: raw.name,
                  movementType: "ENTRADA",
                  quantity: Number(item.quantity),
                  unit: item.unit,
                  unitCost: Number(item.unitCost),
                  totalCost: Number(item.totalCost),
                  origin: "COMPRA",
                  documentReference: purchase.purchaseNumber,
                  notes: `Recebimento físico de compra do fornecedor ${purchase.supplier.name}`,
                  userId: user.id,
                },
              });
            }
          } else if (item.itemType === "EMBALAGEM") {
            const pack = await tx.packaging.findUnique({ where: { id: item.itemId } });
            if (pack) {
              const newStock = pack.currentStock + Math.round(Number(item.quantity));
              await tx.packaging.update({
                where: { id: item.itemId },
                data: {
                  currentStock: newStock,
                  unitCost: Number(item.unitCost) > 0 ? Number(item.unitCost) : pack.unitCost,
                },
              });

              await tx.stockMovement.create({
                data: {
                  itemType: "EMBALAGEM",
                  itemId: pack.id,
                  itemName: pack.name,
                  movementType: "ENTRADA",
                  quantity: Number(item.quantity),
                  unit: item.unit,
                  unitCost: Number(item.unitCost),
                  totalCost: Number(item.totalCost),
                  origin: "COMPRA",
                  documentReference: purchase.purchaseNumber,
                  notes: `Recebimento físico de compra do fornecedor ${purchase.supplier.name}`,
                  userId: user.id,
                },
              });
            }
          }
        }

        return p;
      });

      await logAudit({
        userId: user.id,
        action: "UPDATE",
        entity: "Purchase",
        entityId: id,
        newValues: { status: "RECEBIDO" },
        ipAddress,
        description: `Confirmado recebimento físico da compra ${purchase.purchaseNumber}. Estoque atualizado automaticamente.`,
      });

      return NextResponse.json({
        success: true,
        message: "Recebimento confirmado e estoque atualizado com sucesso!",
        purchase: updated,
      });
    }

    // 2. Estornar Recebimento Físico (Reverter entrada de estoque)
    if (action === "REVERT_RECEIPT") {
      if (purchase.status !== "RECEBIDO") {
        return NextResponse.json({ error: "Apenas compras com status RECEBIDO podem ser estornadas" }, { status: 400 });
      }

      const updated = await db.$transaction(async (tx) => {
        // Reverte as quantidades adicionadas no estoque
        for (const item of purchase.items) {
          if (item.itemType === "MATERIA_PRIMA") {
            const raw = await tx.rawMaterial.findUnique({ where: { id: item.itemId } });
            if (raw) {
              const newStock = Math.max(0, Number(raw.currentStock) - Number(item.quantity));
              await tx.rawMaterial.update({
                where: { id: item.itemId },
                data: { currentStock: newStock },
              });

              await tx.stockMovement.create({
                data: {
                  itemType: "MATERIA_PRIMA",
                  itemId: raw.id,
                  itemName: raw.name,
                  movementType: "SAIDA",
                  quantity: Number(item.quantity),
                  unit: item.unit,
                  unitCost: Number(item.unitCost),
                  totalCost: Number(item.totalCost),
                  origin: "AJUSTE",
                  documentReference: purchase.purchaseNumber,
                  notes: `Estorno de recebimento físico da compra ${purchase.purchaseNumber}`,
                  userId: user.id,
                },
              });
            }
          } else if (item.itemType === "EMBALAGEM") {
            const pack = await tx.packaging.findUnique({ where: { id: item.itemId } });
            if (pack) {
              const newStock = Math.max(0, pack.currentStock - Math.round(Number(item.quantity)));
              await tx.packaging.update({
                where: { id: item.itemId },
                data: { currentStock: newStock },
              });

              await tx.stockMovement.create({
                data: {
                  itemType: "EMBALAGEM",
                  itemId: pack.id,
                  itemName: pack.name,
                  movementType: "SAIDA",
                  quantity: Number(item.quantity),
                  unit: item.unit,
                  unitCost: Number(item.unitCost),
                  totalCost: Number(item.totalCost),
                  origin: "AJUSTE",
                  documentReference: purchase.purchaseNumber,
                  notes: `Estorno de recebimento físico da compra ${purchase.purchaseNumber}`,
                  userId: user.id,
                },
              });
            }
          }
        }

        // Volta status para PENDENTE_ENTREGA e remove deliveryDate
        const p = await tx.purchase.update({
          where: { id },
          data: {
            status: "PENDENTE_ENTREGA",
            deliveryDate: null,
          },
          include: { items: true, supplier: true, accountPayable: true },
        });

        return p;
      });

      await logAudit({
        userId: user.id,
        action: "STATUS_CHANGE",
        entity: "Purchase",
        entityId: id,
        newValues: { status: "PENDENTE_ENTREGA" },
        ipAddress,
        description: `Estorno de recebimento físico da compra ${purchase.purchaseNumber}. Itens subtraídos do estoque.`,
      });

      return NextResponse.json({
        success: true,
        message: "Recebimento físico estornado com sucesso! Os itens foram deduzidos do estoque e o status voltou para Pendente.",
        purchase: updated,
      });
    }

    // 3. Cancelar Pedido de Compra
    if (action === "CANCEL") {
      if (purchase.status === "RECEBIDO") {
        return NextResponse.json(
          { error: "Não é possível cancelar uma compra já recebida. Por favor, estorne o recebimento físico primeiro para regularizar o estoque." },
          { status: 400 }
        );
      }

      if (purchase.status === "CANCELADO") {
        return NextResponse.json({ error: "Esta compra já está cancelada." }, { status: 400 });
      }

      const updated = await db.$transaction(async (tx) => {
        // Atualiza status da compra para CANCELADO
        const p = await tx.purchase.update({
          where: { id },
          data: { status: "CANCELADO" },
          include: { items: true, supplier: true, accountPayable: true },
        });

        // Cancela títulos a pagar vinculados que estejam em aberto
        const payablesToCancel = await tx.accountPayable.findMany({
          where: {
            OR: [
              { id: purchase.accountPayableId || undefined },
              { notes: { contains: purchase.purchaseNumber } },
            ],
            status: { in: ["EM_ABERTO", "A_VENCER"] },
          },
        });

        for (const payable of payablesToCancel) {
          await tx.accountPayable.update({
            where: { id: payable.id },
            data: { status: "CANCELADA" },
          });
        }

        return p;
      });

      await logAudit({
        userId: user.id,
        action: "STATUS_CHANGE",
        entity: "Purchase",
        entityId: id,
        newValues: { status: "CANCELADO" },
        ipAddress,
        description: `Cancelamento do pedido de compra ${purchase.purchaseNumber} e cancelamento dos títulos a pagar vinculados.`,
      });

      return NextResponse.json({
        success: true,
        message: "Pedido de compra cancelado com sucesso! Os títulos a pagar vinculados foram cancelados.",
        purchase: updated,
      });
    }

    // 4. Editar Pedido de Compra (action: 'UPDATE')
    if (action === "UPDATE") {
      if (purchase.status === "CANCELADO") {
        return NextResponse.json({ error: "Não é possível editar uma compra cancelada." }, { status: 400 });
      }

      const {
        supplierId,
        invoiceNumber,
        freightAmount,
        notes,
        orderDate,
        items, // Opcional se for alterar itens (apenas permitido se PENDENTE_ENTREGA)
      } = body;

      const updated = await db.$transaction(async (tx) => {
        let newTotalAmount = Number(purchase.totalAmount);
        const newFreight = freightAmount !== undefined ? Number(freightAmount) : Number(purchase.freightAmount);

        // Se a compra for PENDENTE_ENTREGA e foram enviados novos itens:
        if (purchase.status === "PENDENTE_ENTREGA" && items && Array.isArray(items) && items.length > 0) {
          const itemsTotal = items.reduce(
            (acc: number, it: any) => acc + Number(it.quantity) * Number(it.unitCost),
            0
          );
          newTotalAmount = itemsTotal + newFreight;

          // Remove itens antigos
          await tx.purchaseItem.deleteMany({
            where: { purchaseId: id },
          });

          // Cria novos itens
          await tx.purchaseItem.createMany({
            data: items.map((it: any) => ({
              purchaseId: id,
              itemType: it.itemType,
              itemId: it.itemId,
              name: it.name,
              quantity: Number(it.quantity),
              unit: it.unit,
              unitCost: Number(it.unitCost),
              totalCost: Number(it.quantity) * Number(it.unitCost),
            })),
          });
        } else if (freightAmount !== undefined && purchase.status === "PENDENTE_ENTREGA") {
          // Apenas recalcula frete com os itens existentes
          const itemsTotal = purchase.items.reduce(
            (acc: number, it: any) => acc + Number(it.totalCost),
            0
          );
          newTotalAmount = itemsTotal + newFreight;
        }

        const p = await tx.purchase.update({
          where: { id },
          data: {
            supplierId: supplierId || purchase.supplierId,
            invoiceNumber: invoiceNumber !== undefined ? (invoiceNumber?.trim() || null) : purchase.invoiceNumber,
            freightAmount: newFreight,
            totalAmount: newTotalAmount,
            notes: notes !== undefined ? (notes?.trim() || null) : purchase.notes,
            orderDate: orderDate ? new Date(orderDate) : purchase.orderDate,
          },
          include: { items: true, supplier: true, accountPayable: true },
        });

        return p;
      });

      await logAudit({
        userId: user.id,
        action: "UPDATE",
        entity: "Purchase",
        entityId: id,
        newValues: { supplierId, invoiceNumber, freightAmount, notes },
        ipAddress,
        description: `Edição dos dados do pedido de compra ${purchase.purchaseNumber}.`,
      });

      return NextResponse.json({
        success: true,
        message: "Pedido de compra atualizado com sucesso!",
        purchase: updated,
      });
    }

    return NextResponse.json({ error: "Ação não suportada" }, { status: 400 });
  } catch (error: any) {
    console.error("Erro ao atualizar compra:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar compra" }, { status: 500 });
  }
}
