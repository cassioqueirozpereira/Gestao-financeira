import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bankAccountId = searchParams.get("bankAccountId");

    if (!bankAccountId) {
      return NextResponse.json({ error: "bankAccountId é obrigatório" }, { status: 400 });
    }

    // Busca transações bancárias não conciliadas
    const transactions = await db.bankTransaction.findMany({
      where: { bankAccountId },
      orderBy: { date: "desc" },
    });

    // Busca títulos em aberto para cruzamento automático
    const openPayables = await db.accountPayable.findMany({
      where: { status: { in: ["EM_ABERTO", "A_VENCER", "VENCIDA"] } },
      include: { supplier: true, chartOfAccount: true },
      orderBy: { dueDate: "asc" },
    });

    const openReceivables = await db.accountReceivable.findMany({
      where: { status: { in: ["A_RECEBER", "A_VENCER", "VENCIDA"] } },
      include: { customer: true, chartOfAccount: true },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({
      transactions,
      openPayables,
      openReceivables,
    });
  } catch (error: any) {
    console.error("Erro ao carregar dados de conciliação:", error);
    return NextResponse.json({ error: error.message || "Erro ao carregar dados" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { action } = body;
    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // 1. IMPORTAÇÃO DE EXTRATO (OFX / CSV / Lançamentos)
    if (action === "IMPORT") {
      const { bankAccountId, transactions } = body;
      if (!bankAccountId || !Array.isArray(transactions) || transactions.length === 0) {
        return NextResponse.json({ error: "Conta bancária e transações são obrigatórias" }, { status: 400 });
      }

      let importedCount = 0;
      for (const t of transactions) {
        try {
          const fitid = t.fitid || `${bankAccountId}-${new Date(t.date).getTime()}-${Math.abs(Number(t.amount))}-${t.description.slice(0, 10)}`;
          const exists = await db.bankTransaction.findFirst({
            where: {
              bankAccountId,
              OR: [{ fitid }, { date: new Date(t.date), amount: Number(t.amount), description: t.description }],
            },
          });

          if (!exists) {
            await db.bankTransaction.create({
              data: {
                bankAccountId,
                date: new Date(t.date),
                description: t.description.trim(),
                amount: Number(t.amount),
                fitid,
                isReconciled: false,
              },
            });
            importedCount++;
          }
        } catch (errT) {
          console.warn("Item ignorado (possível duplicata):", errT);
        }
      }

      await logAudit({
        userId: user.id,
        action: "CREATE",
        entity: "BankTransaction",
        entityId: bankAccountId,
        newValues: { importedCount },
        ipAddress,
        description: `Importadas ${importedCount} transações bancárias para conciliação`,
      });

      return NextResponse.json({ success: true, importedCount });
    }

    // 2. CONCILIAR COM TÍTULO EXISTENTE
    if (action === "MATCH_AND_SETTLE") {
      const { transactionId, targetType, targetId } = body; // targetType: 'PAYABLE' | 'RECEIVABLE'
      if (!transactionId || !targetType || !targetId) {
        return NextResponse.json({ error: "transactionId, targetType e targetId são obrigatórios" }, { status: 400 });
      }

      const txRecord = await db.bankTransaction.findUnique({ where: { id: transactionId } });
      if (!txRecord) return NextResponse.json({ error: "Transação bancária não encontrada" }, { status: 404 });

      await db.$transaction(async (tx) => {
        if (targetType === "PAYABLE") {
          const payable = await tx.accountPayable.findUnique({ where: { id: targetId } });
          if (!payable) throw new Error("Conta a pagar não encontrada");

          await tx.accountPayable.update({
            where: { id: targetId },
            data: {
              status: "PAGA",
              paidAmount: Math.abs(Number(txRecord.amount)),
              paidAt: txRecord.date,
              bankAccountId: txRecord.bankAccountId,
            },
          });

          await tx.bankAccount.update({
            where: { id: txRecord.bankAccountId },
            data: { currentBalance: { decrement: Math.abs(Number(txRecord.amount)) } },
          });

          await tx.bankTransaction.update({
            where: { id: transactionId },
            data: { isReconciled: true, reconciledWith: `PAYABLE:${targetId}` },
          });
        } else if (targetType === "RECEIVABLE") {
          const receivable = await tx.accountReceivable.findUnique({ where: { id: targetId } });
          if (!receivable) throw new Error("Conta a receber não encontrada");

          await tx.accountReceivable.update({
            where: { id: targetId },
            data: {
              status: "RECEBIDA",
              receivedAmount: Math.abs(Number(txRecord.amount)),
              receivedAt: txRecord.date,
              bankAccountId: txRecord.bankAccountId,
            },
          });

          await tx.bankAccount.update({
            where: { id: txRecord.bankAccountId },
            data: { currentBalance: { increment: Math.abs(Number(txRecord.amount)) } },
          });

          await tx.bankTransaction.update({
            where: { id: transactionId },
            data: { isReconciled: true, reconciledWith: `RECEIVABLE:${targetId}` },
          });

          // Amortiza capital recovery se aplicável
          const costCenter = await tx.costCenter.findUnique({ where: { id: receivable.costCenterId } });
          if (costCenter && (costCenter.code === "VELAS" || costCenter.name.toUpperCase().includes("VELA"))) {
            const recovery = await tx.capitalRecovery.findFirst();
            if (recovery) {
              await tx.capitalRecovery.update({
                where: { id: recovery.id },
                data: { recoveredAmount: { increment: Math.abs(Number(txRecord.amount)) } },
              });
              await tx.capitalRecoveryEntry.create({
                data: {
                  capitalRecoveryId: recovery.id,
                  receivableId: receivable.id,
                  amount: Math.abs(Number(txRecord.amount)),
                  description: `Conciliação bancária: ${receivable.description}`,
                },
              });
            }
          }
        }
      });

      await logAudit({
        userId: user.id,
        action: "RECONCILE",
        entity: "BankTransaction",
        entityId: transactionId,
        newValues: { targetType, targetId },
        ipAddress,
        description: `Conciliação bancária realizada com sucesso para transação ${txRecord.description}`,
      });

      return NextResponse.json({ success: true, message: "Conciliado e liquidado com sucesso!" });
    }

    // 3. CRIAR TÍTULO INLINE E LIQUIDAR IMEDIATAMENTE
    if (action === "CREATE_AND_SETTLE") {
      const { transactionId, targetType, chartOfAccountId, costCenterId, description, supplierId, customerId } = body;
      if (!transactionId || !targetType || !chartOfAccountId || !costCenterId) {
        return NextResponse.json({ error: "Campos obrigatórios ausentes para criação inline" }, { status: 400 });
      }

      const txRecord = await db.bankTransaction.findUnique({ where: { id: transactionId } });
      if (!txRecord) return NextResponse.json({ error: "Transação bancária não encontrada" }, { status: 404 });

      const amount = Math.abs(Number(txRecord.amount));

      await db.$transaction(async (tx) => {
        if (targetType === "PAYABLE") {
          const payable = await tx.accountPayable.create({
            data: {
              description: description || txRecord.description,
              costCenterId,
              chartOfAccountId,
              supplierId: supplierId || null,
              originalAmount: amount,
              paidAmount: amount,
              competenceDate: txRecord.date,
              dueDate: txRecord.date,
              paidAt: txRecord.date,
              status: "PAGA",
              bankAccountId: txRecord.bankAccountId,
              notes: "Criado automaticamente via conciliação bancária",
            },
          });

          await tx.bankAccount.update({
            where: { id: txRecord.bankAccountId },
            data: { currentBalance: { decrement: amount } },
          });

          await tx.bankTransaction.update({
            where: { id: transactionId },
            data: { isReconciled: true, reconciledWith: `PAYABLE:${payable.id}` },
          });
        } else if (targetType === "RECEIVABLE") {
          const receivable = await tx.accountReceivable.create({
            data: {
              description: description || txRecord.description,
              costCenterId,
              chartOfAccountId,
              customerId: customerId || null,
              originalAmount: amount,
              receivedAmount: amount,
              competenceDate: txRecord.date,
              dueDate: txRecord.date,
              receivedAt: txRecord.date,
              status: "RECEBIDA",
              bankAccountId: txRecord.bankAccountId,
              notes: "Criado automaticamente via conciliação bancária",
            },
          });

          await tx.bankAccount.update({
            where: { id: txRecord.bankAccountId },
            data: { currentBalance: { increment: amount } },
          });

          await tx.bankTransaction.update({
            where: { id: transactionId },
            data: { isReconciled: true, reconciledWith: `RECEIVABLE:${receivable.id}` },
          });
        }
      });

      await logAudit({
        userId: user.id,
        action: "CREATE",
        entity: targetType === "PAYABLE" ? "AccountPayable" : "AccountReceivable",
        entityId: transactionId,
        ipAddress,
        description: `Criado título inline e liquidado via conciliação para "${txRecord.description}"`,
      });

      return NextResponse.json({ success: true, message: "Título criado e conciliado com sucesso!" });
    }

    return NextResponse.json({ error: "Ação não suportada" }, { status: 400 });
  } catch (error: any) {
    console.error("Erro na conciliação bancária:", error);
    return NextResponse.json({ error: error.message || "Erro no processamento" }, { status: 500 });
  }
}
