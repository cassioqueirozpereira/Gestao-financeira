import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const receivables = await db.accountReceivable.findMany({
      include: {
        customer: true,
        costCenter: true,
        contract: true,
        bankAccount: true,
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ titles: receivables });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { action = "settle_title", titleId, receivedAmount, receivedAt, bankAccountId } = body;

    if (action === "settle_title") {
      const title = await db.accountReceivable.findUnique({ where: { id: titleId } });
      if (!title) return NextResponse.json({ error: "Título não encontrado" }, { status: 404 });

      const finalAmount = Number(receivedAmount || title.originalAmount);
      const paymentDate = receivedAt ? new Date(receivedAt) : new Date();

      const updated = await db.accountReceivable.update({
        where: { id: titleId },
        data: {
          status: "RECEBIDA",
          receivedAmount: finalAmount,
          receivedAt: paymentDate,
          bankAccountId: bankAccountId || null,
        },
      });

      if (bankAccountId) {
        await db.bankAccount.update({
          where: { id: bankAccountId },
          data: {
            currentBalance: { increment: finalAmount },
          },
        });
      }

      await logAudit({
        userId: user.id,
        action: "STATUS_CHANGE",
        entity: "AccountReceivable",
        entityId: titleId,
        newValues: { status: "RECEBIDA", receivedAmount: finalAmount, bankAccountId },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        description: `Baixa no título do cliente: R$ ${finalAmount}`,
      });

      return NextResponse.json({ success: true, updated });
    }

    if (action === "batch_settle") {
      const { titleIds = [] } = body;
      if (!Array.isArray(titleIds) || titleIds.length === 0) {
        return NextResponse.json({ error: "Nenhum título selecionado para baixa" }, { status: 400 });
      }

      const paymentDate = receivedAt ? new Date(receivedAt) : new Date();
      const titlesToSettle = await db.accountReceivable.findMany({
        where: { id: { in: titleIds } },
      });

      let totalAmountSettled = 0;
      for (const t of titlesToSettle) {
        const val = Number(t.originalAmount || 0);
        totalAmountSettled += val;
        await db.accountReceivable.update({
          where: { id: t.id },
          data: {
            status: "RECEBIDA",
            receivedAmount: val,
            receivedAt: paymentDate,
            bankAccountId: bankAccountId || null,
          },
        });
      }

      if (bankAccountId && totalAmountSettled > 0) {
        await db.bankAccount.update({
          where: { id: bankAccountId },
          data: {
            currentBalance: { increment: totalAmountSettled },
          },
        });
      }

      await logAudit({
        userId: user.id,
        action: "STATUS_CHANGE",
        entity: "AccountReceivable",
        entityId: "BATCH",
        newValues: { settledCount: titlesToSettle.length, totalAmountSettled, bankAccountId },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        description: `Baixa em lote de ${titlesToSettle.length} títulos: R$ ${totalAmountSettled.toFixed(2)}`,
      });

      return NextResponse.json({ success: true, count: titlesToSettle.length, totalAmountSettled });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
