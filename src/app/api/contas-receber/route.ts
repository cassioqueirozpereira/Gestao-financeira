import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const createReceivableSchema = z.object({
  description: z.string().min(2, "Descrição obrigatória"),
  customerId: z.string().optional(),
  costCenterId: z.string().min(1, "Centro de custo obrigatório"),
  chartOfAccountId: z.string().min(1, "Categoria contábil obrigatória"),
  originalAmount: z.number().positive("Valor deve ser positivo"),
  competenceDate: z.string(),
  dueDate: z.string(),
  notes: z.string().optional(),
});

const receiveSchema = z.object({
  receivableId: z.string().min(1),
  receivedAmount: z.number().positive(),
  receivedAt: z.string(),
  bankAccountId: z.string().optional(),
});

export async function GET() {
  try {
    const receivables = await db.accountReceivable.findMany({
      include: {
        costCenter: true,
        chartOfAccount: true,
        customer: true,
      },
      orderBy: { dueDate: "asc" },
    });
    return NextResponse.json({ receivables });
  } catch (error) {
    console.error("Erro ao listar contas a receber:", error);
    return NextResponse.json({ error: "Erro ao buscar recebíveis" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();

    // Se for baixa/liquidação de recebimento
    if (body.action === "RECEIVE") {
      const parsed = receiveSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 });
      }

      const { receivableId, receivedAmount, receivedAt, bankAccountId } = parsed.data;

      const rec = await db.accountReceivable.findUnique({ where: { id: receivableId } });
      if (!rec) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });

      // Atualiza a conta a receber
      const updated = await db.accountReceivable.update({
        where: { id: receivableId },
        data: {
          receivedAmount,
          receivedAt: new Date(receivedAt),
          status: "RECEBIDA",
          bankAccountId: bankAccountId || null,
        },
      });

      // Se informou conta bancária, incrementa o saldo bancário da instituição
      if (bankAccountId) {
        await db.bankAccount.update({
          where: { id: bankAccountId },
          data: {
            currentBalance: { increment: receivedAmount },
          },
        });
      }

      await logAudit({
        userId: user.id,
        action: "STATUS_CHANGE",
        entity: "AccountReceivable",
        entityId: receivableId,
        newValues: { status: "RECEBIDA", receivedAmount, receivedAt },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        description: `Recebimento confirmado de R$ ${receivedAmount} na conta a receber "${rec.description}".`,
      });

      return NextResponse.json({ success: true, receivable: updated });
    }

    // Criação de nova conta a receber
    const parsed = createReceivableSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 });
    }

    const {
      description,
      customerId,
      costCenterId,
      chartOfAccountId,
      originalAmount,
      competenceDate,
      dueDate,
      notes,
    } = parsed.data;

    const receivable = await db.accountReceivable.create({
      data: {
        description,
        customerId: customerId || null,
        costCenterId,
        chartOfAccountId,
        originalAmount,
        competenceDate: new Date(competenceDate),
        dueDate: new Date(dueDate),
        status: "A_RECEBER",
        notes: notes || null,
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "AccountReceivable",
      entityId: receivable.id,
      newValues: parsed.data,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Lançamento de conta a receber: ${description} (R$ ${originalAmount})`,
    });

    return NextResponse.json({ success: true, receivable });
  } catch (error) {
    console.error("Erro na rota de contas a receber:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { id, description, originalAmount, dueDate, competenceDate, costCenterId, customerId, chartOfAccountId, paymentType, notes, status } = body;

    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    const existing = await db.accountReceivable.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Conta a receber não encontrada" }, { status: 404 });

    const updated = await db.accountReceivable.update({
      where: { id },
      data: {
        description: description || existing.description,
        originalAmount: originalAmount ? Number(originalAmount) : existing.originalAmount,
        dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
        competenceDate: competenceDate ? new Date(competenceDate) : existing.competenceDate,
        costCenterId: costCenterId || existing.costCenterId,
        customerId: customerId !== undefined ? customerId : existing.customerId,
        chartOfAccountId: chartOfAccountId || existing.chartOfAccountId,
        paymentType: paymentType || existing.paymentType,
        notes: notes !== undefined ? notes : existing.notes,
        status: status || existing.status,
      },
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "AccountReceivable",
      entityId: id,
      newValues: updated,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Edição de conta a receber: ${updated.description}`,
    });

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
