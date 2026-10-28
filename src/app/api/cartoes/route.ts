import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const [cards, cardPayables, costCenters, chartOfAccounts] = await Promise.all([
      db.creditCard.findMany({
        include: {
          bankAccount: true,
          invoices: {
            include: {
              items: {
                include: {
                  costCenter: true,
                  chartOfAccount: true,
                },
              },
            },
            orderBy: [{ referenceYear: "asc" }, { referenceMonth: "asc" }],
          },
        },
        orderBy: { nickname: "asc" },
      }),
      db.accountPayable.findMany({
        where: {
          paymentType: "CARTAO",
        },
        include: {
          costCenter: true,
          chartOfAccount: true,
        },
        orderBy: { dueDate: "asc" },
      }),
      db.costCenter.findMany({ orderBy: { name: "asc" } }),
      db.chartOfAccount.findMany({
        where: {
          type: {
            in: [
              "DESPESA_ADMINISTRATIVA",
              "CUSTO_DIRETO",
              "CUSTO_INDIRETO",
              "DESPESA_COMERCIAL_MARKETING",
              "INVESTIMENTO_ATIVO",
            ],
          },
        },
        orderBy: { code: "asc" },
      }),
    ]);

    return NextResponse.json({ cards, cardPayables, costCenters, chartOfAccounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { action = "create_expense" } = body;

    // 1. Criar novo Cartão de Crédito
    if (action === "create_card") {
      const { nickname, cardBrand, holderName, creditLimit, closingDay, dueDay, bankAccountId } = body;
      const newCard = await db.creditCard.create({
        data: {
          nickname,
          cardBrand,
          holderName,
          creditLimit: Number(creditLimit) || 0,
          closingDay: Number(closingDay) || 1,
          dueDay: Number(dueDay) || 10,
          bankAccountId: bankAccountId || null,
        },
      });
      return NextResponse.json({ success: true, card: newCard });
    }

    // 2. Importação em Lote de Fatura de Cartão de Crédito (CSV / Extrato)
    if (action === "import_invoice") {
      const { cardId, defaultDueDate, items } = body;
      if (!cardId || !items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: "Nenhum item válido para importação" }, { status: 400 });
      }

      const card = await db.creditCard.findUnique({ where: { id: cardId } });
      if (!card) return NextResponse.json({ error: "Cartão não encontrado" }, { status: 404 });

      // Centros de custo disponíveis
      const allCostCenters = await db.costCenter.findMany();
      const defaultCostCenter = allCostCenters.find((c) => c.code === "CASA") || allCostCenters[0];
      const defaultChartAccount =
        (await db.chartOfAccount.findFirst({
          where: { type: "DESPESA_ADMINISTRATIVA" },
        })) || (await db.chartOfAccount.findFirst());

      const categoryCache = new Map<string, any>();
      const createdPayables = [];

      for (const it of items) {
        const amount = Number(it.amount) || 0;
        if (amount <= 0) continue; // Pula transações zeradas ou pagamentos negativos

        const rawCat = (it.category || "").trim();

        // 1. Resolve ou cria a Categoria (Plano de Contas) correspondente
        let cAccountId = it.chartOfAccountId;
        if (!cAccountId && rawCat) {
          const cacheKey = rawCat.toLowerCase();
          if (categoryCache.has(cacheKey)) {
            cAccountId = categoryCache.get(cacheKey).id;
          } else {
            let account = await db.chartOfAccount.findFirst({
              where: { name: { equals: rawCat, mode: "insensitive" } },
            });

            if (!account) {
              const parent = await db.chartOfAccount.findFirst({ where: { code: "3" } });
              const slug = rawCat
                .toUpperCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^A-Z0-9]/g, "_")
                .slice(0, 15);
              const uniqueCode = `3.CAT_${slug || "GERAL"}_${Math.floor(100 + Math.random() * 900)}`;

              account = await db.chartOfAccount.create({
                data: {
                  code: uniqueCode,
                  name: rawCat,
                  level: 2,
                  type: "DESPESA_ADMINISTRATIVA",
                  parentId: parent?.id || null,
                },
              });
            }

            categoryCache.set(cacheKey, account);
            cAccountId = account.id;
          }
        }

        if (!cAccountId) {
          cAccountId = defaultChartAccount?.id;
        }

        // 2. Determina Centro de Custo inteligente se não definido
        let cCenterId = it.costCenterId;
        if (!cCenterId) {
          const normCat = rawCat.toLowerCase();
          const normDesc = (it.description || "").toLowerCase();

          if (normCat === "d.a" || normCat.includes("d.a") || normDesc.includes("embalaroma") || normDesc.includes("da embalagens")) {
            const daCenter = allCostCenters.find((c) => c.code === "VELAS" || c.code === "DA_VELAS" || c.name.toLowerCase().includes("velas"));
            cCenterId = daCenter?.id || defaultCostCenter?.id;
          } else if (normCat.includes("assinatur") && (normDesc.includes("adobe") || normDesc.includes("aws") || normDesc.includes("google") || normDesc.includes("chatgpt"))) {
            const sisCenter = allCostCenters.find((c) => c.code === "SISTEMAS" || c.name.toLowerCase().includes("sistemas"));
            cCenterId = sisCenter?.id || defaultCostCenter?.id;
          } else {
            cCenterId = defaultCostCenter?.id;
          }
        }

        const compDate = it.date ? new Date(it.date) : new Date();

        // Determina data de vencimento da fatura
        let due: Date;
        if (it.dueDate) {
          due = new Date(it.dueDate);
        } else if (defaultDueDate) {
          due = new Date(defaultDueDate);
        } else {
          let invMonth = compDate.getMonth();
          let invYear = compDate.getFullYear();
          if (compDate.getDate() > (card.closingDay || 25)) {
            invMonth += 1;
            if (invMonth > 11) {
              invYear += 1;
              invMonth = 0;
            }
          }
          due = new Date(invYear, invMonth, card.dueDay || 10);
        }

        const payable = await db.accountPayable.create({
          data: {
            description: it.description,
            costCenterId: cCenterId,
            chartOfAccountId: cAccountId,
            originalAmount: amount,
            competenceDate: compDate,
            dueDate: due,
            scheduledDate: due,
            paymentType: "CARTAO",
            installmentNumber: it.installmentNumber ? parseInt(it.installmentNumber, 10) : null,
            totalInstallments: it.totalInstallments ? parseInt(it.totalInstallments, 10) : null,
            notes: `Fatura Importada • Cartão ${card.nickname}`,
            status: "EM_ABERTO",
          },
        });
        createdPayables.push(payable);
      }

      return NextResponse.json({ success: true, count: createdPayables.length });
    }

    // 2. Lançar Compra / Despesa no Cartão (com suporte a parcelamento em Faturas Futuras)
    const {
      cardId,
      description,
      totalAmount,
      installments = 1,
      costCenterId,
      chartOfAccountId,
      purchaseDate = new Date().toISOString(),
      notes,
    } = body;

    const card = await db.creditCard.findUnique({ where: { id: cardId } });
    if (!card) return NextResponse.json({ error: "Cartão não encontrado" }, { status: 404 });

    const numInstallments = Math.max(1, parseInt(installments, 10));
    const totalVal = Number(totalAmount);
    const installmentValue = Number((totalVal / numInstallments).toFixed(2));

    const pDate = new Date(purchaseDate);
    const createdItems = [];

    for (let i = 0; i < numInstallments; i++) {
      // Calcula o mês de vencimento da parcela
      let invoiceMonth = pDate.getMonth() + i;
      let invoiceYear = pDate.getFullYear();
      if (invoiceMonth > 11) {
        invoiceYear += Math.floor(invoiceMonth / 12);
        invoiceMonth = invoiceMonth % 12;
      }

      // Se a data de compra for após o dia de fechamento, joga para o próximo ciclo
      if (i === 0 && pDate.getDate() > card.closingDay) {
        invoiceMonth += 1;
        if (invoiceMonth > 11) {
          invoiceYear += 1;
          invoiceMonth = 0;
        }
      }

      const dueDay = card.dueDay || 10;
      const dueDate = new Date(invoiceYear, invoiceMonth, dueDay);

      const payable = await db.accountPayable.create({
        data: {
          description: numInstallments > 1 ? `${description} (${i + 1}/${numInstallments})` : description,
          costCenterId,
          chartOfAccountId,
          originalAmount: installmentValue,
          competenceDate: pDate,
          dueDate: dueDate,
          scheduledDate: dueDate,
          paymentType: "CARTAO",
          installmentNumber: i + 1,
          totalInstallments: numInstallments,
          notes: `Cartão: ${card.nickname} (${card.cardBrand}) - ${notes || ""}`,
          status: "EM_ABERTO",
        },
      });

      createdItems.push(payable);
    }

    return NextResponse.json({ success: true, createdCount: createdItems.length, items: createdItems });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { id, nickname, cardBrand, holderName, creditLimit, closingDay, dueDay } = body;

    if (!id) return NextResponse.json({ error: "ID do cartão é obrigatório" }, { status: 400 });

    const updatedCard = await db.creditCard.update({
      where: { id },
      data: {
        ...(nickname && { nickname }),
        ...(cardBrand && { cardBrand }),
        ...(holderName !== undefined && { holderName }),
        ...(creditLimit !== undefined && { creditLimit: Number(creditLimit) || 0 }),
        ...(closingDay !== undefined && { closingDay: Number(closingDay) || 1 }),
        ...(dueDay !== undefined && { dueDay: Number(dueDay) || 10 }),
      },
    });

    return NextResponse.json({ success: true, card: updatedCard });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const payableId = searchParams.get("payableId");
    const cardId = searchParams.get("cardId");

    if (payableId) {
      const existing = await db.accountPayable.findUnique({ where: { id: payableId } });
      if (!existing) return NextResponse.json({ error: "Lançamento não encontrado" }, { status: 404 });

      await db.accountPayable.delete({ where: { id: payableId } });
      return NextResponse.json({ success: true, message: "Lançamento excluído com sucesso" });
    }

    if (cardId) {
      const existing = await db.creditCard.findUnique({ where: { id: cardId } });
      if (!existing) return NextResponse.json({ error: "Cartão não encontrado" }, { status: 404 });

      // Desvincula lançamentos antes de excluir cartão
      const invoices = await db.creditCardInvoice.findMany({ where: { creditCardId: cardId } });
      const invoiceIds = invoices.map((inv) => inv.id);
      if (invoiceIds.length > 0) {
        await db.accountPayable.updateMany({
          where: { creditCardInvoiceId: { in: invoiceIds } },
          data: { creditCardInvoiceId: null },
        });
        await db.creditCardInvoice.deleteMany({ where: { creditCardId: cardId } });
      }

      await db.creditCard.delete({ where: { id: cardId } });
      return NextResponse.json({ success: true, message: "Cartão excluído com sucesso" });
    }

    return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
