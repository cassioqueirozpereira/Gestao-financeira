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

      // 2. Se optou por gerar Contas a Pagar
      if (generatePayables && firstDueDate) {
        // Busca centro de custo e plano de contas padrão se não fornecidos
        let cCenterId = costCenterId;
        if (!cCenterId) {
          const defaultCC = await tx.costCenter.findFirst({ where: { code: "VELAS" } });
          cCenterId = defaultCC ? defaultCC.id : (await tx.costCenter.findFirst())?.id;
        }

        let cAccountId = chartOfAccountId;
        if (!cAccountId) {
          const defaultAcc = await tx.chartOfAccount.findFirst({
            where: { type: "CUSTO_DIRETO", isActive: true },
          });
          cAccountId = defaultAcc ? defaultAcc.id : (await tx.chartOfAccount.findFirst())?.id;
        }

        if (cCenterId && cAccountId) {
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
    const { id, action } = body; // action: 'RECEIVE' | 'CANCEL'

    if (!id || !action) {
      return NextResponse.json({ error: "ID e ação são obrigatórios" }, { status: 400 });
    }

    const purchase = await db.purchase.findUnique({
      where: { id },
      include: { items: true, supplier: true },
    });

    if (!purchase) return NextResponse.json({ error: "Compra não encontrada" }, { status: 404 });

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (action === "RECEIVE") {
      if (purchase.status === "RECEBIDO") {
        return NextResponse.json({ error: "Esta compra já foi recebida anteriormente" }, { status: 400 });
      }

      await db.$transaction(async (tx) => {
        // 1. Atualiza status da compra
        await tx.purchase.update({
          where: { id },
          data: {
            status: "RECEBIDO",
            deliveryDate: new Date(),
          },
        });

        // 2. Dá entrada no estoque físico de cada item e registra movimentação
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

      return NextResponse.json({ success: true, message: "Recebimento confirmado e estoque atualizado com sucesso!" });
    }

    if (action === "CANCEL") {
      if (purchase.status === "RECEBIDO") {
        return NextResponse.json({ error: "Não é possível cancelar uma compra já recebida no estoque físico." }, { status: 400 });
      }

      await db.purchase.update({
        where: { id },
        data: { status: "CANCELADO" },
      });

      await logAudit({
        userId: user.id,
        action: "UPDATE",
        entity: "Purchase",
        entityId: id,
        newValues: { status: "CANCELADO" },
        ipAddress,
        description: `Cancelamento do pedido de compra ${purchase.purchaseNumber}`,
      });

      return NextResponse.json({ success: true, message: "Compra cancelada com sucesso" });
    }

    return NextResponse.json({ error: "Ação não suportada" }, { status: 400 });
  } catch (error: any) {
    console.error("Erro ao atualizar compra:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar compra" }, { status: 500 });
  }
}
