import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const costCenterId = searchParams.get("costCenterId");
    const paymentType = searchParams.get("paymentType");
    const isFixed = searchParams.get("isFixed");
    const status = searchParams.get("status");

    const where: any = {};
    if (costCenterId && costCenterId !== "TODOS") where.costCenterId = costCenterId;
    if (paymentType && paymentType !== "TODOS") where.paymentType = paymentType;
    if (isFixed === "true") where.isFixed = true;
    if (status && status !== "TODOS") where.status = status;

    const payables = await db.accountPayable.findMany({
      where,
      include: {
        costCenter: true,
        chartOfAccount: true,
        supplier: true,
        bankAccount: true,
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ payables });
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
      description,
      costCenterId,
      chartOfAccountId,
      supplierId,
      originalAmount,
      competenceDate,
      dueDate,
      scheduledDate,
      paymentType = "BOLETO",
      isFixed = false,
      notes,
    } = body;

    if (!description || !costCenterId || !chartOfAccountId || !originalAmount || !dueDate) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    const payable = await db.accountPayable.create({
      data: {
        description,
        costCenterId,
        chartOfAccountId,
        supplierId: supplierId || null,
        originalAmount: Number(originalAmount),
        competenceDate: competenceDate ? new Date(competenceDate) : new Date(),
        dueDate: new Date(dueDate),
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        paymentType,
        isFixed: Boolean(isFixed),
        status: "EM_ABERTO",
        notes,
      },
    });

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "AccountPayable",
      entityId: payable.id,
      newValues: { description, originalAmount, dueDate, paymentType, isFixed },
      ipAddress,
      description: `Lançamento de conta a pagar: ${description} (R$ ${originalAmount})`,
    });

    return NextResponse.json({ success: true, payable });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { id, action = "edit" } = body;

    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    const existing = await db.accountPayable.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });

    // AÇÃO 1: DAR BAIXA DE PAGAMENTO
    if (action === "settle" || action === "baixa") {
      const {
        paidAmount,
        paidAt,
        bankAccountId,
        discountAmount = 0,
        interestAmount = 0,
      } = body;

      const finalPaid = Number(paidAmount || existing.originalAmount);
      const paymentDate = paidAt ? new Date(paidAt) : new Date();

      // Atualiza a Conta a Pagar
      const updated = await db.accountPayable.update({
        where: { id },
        data: {
          paidAmount: finalPaid,
          paidAt: paymentDate,
          bankAccountId: bankAccountId || null,
          discountAmount: Number(discountAmount),
          interestAmount: Number(interestAmount),
          status: "PAGA",
        },
      });

      // Se informou conta bancária, debita o saldo
      if (bankAccountId) {
        await db.bankAccount.update({
          where: { id: bankAccountId },
          data: {
            currentBalance: { decrement: finalPaid },
          },
        });
      }

      const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
      await logAudit({
        userId: user.id,
        action: "STATUS_CHANGE",
        entity: "AccountPayable",
        entityId: id,
        newValues: { paidAmount: finalPaid, paidAt: paymentDate, bankAccountId },
        ipAddress,
        description: `Baixa de conta a pagar: ${existing.description} - R$ ${finalPaid}`,
      });

      return NextResponse.json({ success: true, updated });
    }

    // AÇÃO 2: EDITAR LANÇAMENTO EFETUADO
    const {
      description,
      originalAmount,
      dueDate,
      scheduledDate,
      costCenterId,
      chartOfAccountId,
      paymentType,
      isFixed,
      notes,
      status,
    } = body;

    const updated = await db.accountPayable.update({
      where: { id },
      data: {
        description: description || existing.description,
        originalAmount: originalAmount ? Number(originalAmount) : existing.originalAmount,
        dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : existing.scheduledDate,
        costCenterId: costCenterId || existing.costCenterId,
        chartOfAccountId: chartOfAccountId || existing.chartOfAccountId,
        paymentType: paymentType || existing.paymentType,
        isFixed: isFixed !== undefined ? Boolean(isFixed) : existing.isFixed,
        notes: notes !== undefined ? notes : existing.notes,
        status: status || existing.status,
      },
    });

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "AccountPayable",
      entityId: id,
      newValues: updated,
      ipAddress,
      description: `Edição de lançamento conta a pagar: ${updated.description}`,
    });

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
