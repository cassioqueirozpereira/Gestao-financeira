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
      installmentsCount = 1,
      notes,
    } = body;

    if (!description || !costCenterId || !chartOfAccountId || !originalAmount || !dueDate) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    const totalAmount = Number(originalAmount);
    const installments = Math.max(1, Math.min(60, Number(installmentsCount || 1)));
    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (installments > 1) {
      const baseAmount = Math.floor((totalAmount / installments) * 100) / 100;
      const firstAmount = parseFloat((totalAmount - baseAmount * (installments - 1)).toFixed(2));
      const baseDate = new Date(dueDate);

      const createdPayables = await db.$transaction(async (tx) => {
        const list = [];
        for (let i = 1; i <= installments; i++) {
          const installmentDueDate = new Date(baseDate);
          // Soma 1 mês por parcela
          installmentDueDate.setMonth(installmentDueDate.getMonth() + (i - 1));

          const item = await tx.accountPayable.create({
            data: {
              description: `${description} (${i}/${installments})`,
              costCenterId,
              chartOfAccountId,
              supplierId: supplierId || null,
              originalAmount: i === 1 ? firstAmount : baseAmount,
              competenceDate: competenceDate ? new Date(competenceDate) : new Date(),
              dueDate: installmentDueDate,
              scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
              paymentType,
              isFixed: Boolean(isFixed),
              status: "EM_ABERTO",
              notes: notes ? `${notes} (Parcela ${i}/${installments})` : `Parcela ${i}/${installments}`,
            },
          });
          list.push(item);
        }
        return list;
      });

      await logAudit({
        userId: user.id,
        action: "CREATE",
        entity: "AccountPayable",
        entityId: createdPayables[0]?.id || "MULTIPLE",
        newValues: { description, totalAmount, installments },
        ipAddress,
        description: `Lançamento parcelado de conta a pagar: ${description} em ${installments}x de R$ ${baseAmount.toFixed(2)}`,
      });

      return NextResponse.json({ success: true, payables: createdPayables, count: createdPayables.length });
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

    // AÇÃO: ESTORNAR BAIXA DE PAGAMENTO
    if (action === "revert" || action === "estorno" || action === "estornar") {
      const paidAmount = Number(existing.paidAmount || existing.originalAmount);

      // Se tinha conta bancária vinculada, estorna o saldo creditando de volta
      if (existing.bankAccountId && paidAmount > 0) {
        await db.bankAccount.update({
          where: { id: existing.bankAccountId },
          data: {
            currentBalance: { increment: paidAmount },
          },
        });
      }

      const updated = await db.accountPayable.update({
        where: { id },
        data: {
          status: "EM_ABERTO",
          paidAmount: 0,
          paidAt: null,
          bankAccountId: null,
        },
      });

      const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
      await logAudit({
        userId: user.id,
        action: "STATUS_CHANGE",
        entity: "AccountPayable",
        entityId: id,
        newValues: { status: "EM_ABERTO", estornado: true, estornadoValor: paidAmount },
        ipAddress,
        description: `Estorno de baixa da conta a pagar: ${existing.description} (R$ ${paidAmount.toFixed(2)})`,
      });

      return NextResponse.json({
        success: true,
        updated,
        message: `Baixa de pagamento de ${existing.description} estornada com sucesso. Saldo bancário reajustado.`,
      });
    }

    // AÇÃO: PARCELAR CONTA A PAGAR EXISTENTE
    if (action === "parcelar") {
      const installments = Math.max(2, Math.min(60, Number(body.installmentsCount || 2)));
      const totalAmount = Number(existing.originalAmount);
      const baseAmount = Math.floor((totalAmount / installments) * 100) / 100;
      const firstInstallmentAmount = parseFloat((totalAmount - baseAmount * (installments - 1)).toFixed(2));
      const intervalDays = Number(body.intervalDays || 30);

      const originalDueDate = new Date(existing.dueDate);
      const baseDesc = existing.description.replace(/\s*\(\d+\/\d+\)$/, "");

      // Atualiza a primeira parcela aproveitando o registro existente
      const updatedFirst = await db.accountPayable.update({
        where: { id: existing.id },
        data: {
          description: `${baseDesc} (1/${installments})`,
          originalAmount: firstInstallmentAmount,
        },
      });

      // Cria as parcelas 2 até N
      const newPayablesData = [];
      for (let i = 2; i <= installments; i++) {
        const nextDueDate = new Date(originalDueDate);
        nextDueDate.setDate(nextDueDate.getDate() + (i - 1) * intervalDays);

        newPayablesData.push({
          description: `${baseDesc} (${i}/${installments})`,
          costCenterId: existing.costCenterId,
          chartOfAccountId: existing.chartOfAccountId,
          supplierId: existing.supplierId,
          originalAmount: baseAmount,
          competenceDate: existing.competenceDate,
          dueDate: nextDueDate,
          scheduledDate: null,
          paymentType: existing.paymentType,
          isFixed: existing.isFixed,
          status: "EM_ABERTO" as any,
          notes: existing.notes
            ? `${existing.notes} (Parcela ${i}/${installments})`
            : `Parcela ${i}/${installments} desmembrada da conta original`,
        });
      }

      if (newPayablesData.length > 0) {
        await db.accountPayable.createMany({ data: newPayablesData });
      }

      const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
      await logAudit({
        userId: user.id,
        action: "UPDATE",
        entity: "AccountPayable",
        entityId: id,
        newValues: { installments, totalAmount, firstInstallmentAmount, baseAmount },
        ipAddress,
        description: `Parcelamento de conta a pagar: ${baseDesc} desmembrado em ${installments} parcelas`,
      });

      return NextResponse.json({
        success: true,
        message: `Conta parcelada com sucesso em ${installments} parcelas.`,
        firstPayable: updatedFirst,
      });
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

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");
    let ids: string[] = [];

    const body = await req.json().catch(() => ({}));
    if (body.ids && Array.isArray(body.ids)) {
      ids = body.ids;
    } else if (body.id) {
      id = body.id;
    }

    if (id && ids.length === 0) {
      ids = [id];
    }

    if (ids.length === 0) {
      return NextResponse.json({ error: "Nenhum ID fornecido para exclusão" }, { status: 400 });
    }

    // Limpa vínculos dependentes se existirem
    await db.costAllocation.deleteMany({ where: { accountPayableId: { in: ids } } });
    await db.commissionRecord.updateMany({
      where: { accountPayableId: { in: ids } },
      data: { accountPayableId: null },
    });

    const deleted = await db.accountPayable.deleteMany({
      where: { id: { in: ids } },
    });

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await logAudit({
      userId: user.id,
      action: "DELETE",
      entity: "AccountPayable",
      entityId: ids.join(",").slice(0, 50),
      ipAddress,
      description: `Exclusão de ${deleted.count} conta(s) a pagar`,
    });

    return NextResponse.json({
      success: true,
      count: deleted.count,
      message: `${deleted.count} conta(s) a pagar excluída(s) com sucesso`,
    });
  } catch (error: any) {
    console.error("Erro ao excluir conta a pagar:", error);
    return NextResponse.json({ error: error.message || "Erro interno ao excluir" }, { status: 500 });
  }
}
