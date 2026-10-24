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

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
