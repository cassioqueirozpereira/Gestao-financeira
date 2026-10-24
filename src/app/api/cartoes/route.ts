import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const cards = await db.creditCard.findMany({
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
    });

    // Também busca lançamentos a pagar feitos com cartão
    const cardPayables = await db.accountPayable.findMany({
      where: {
        paymentType: "CARTAO",
      },
      include: {
        costCenter: true,
        chartOfAccount: true,
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ cards, cardPayables });
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
