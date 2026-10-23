import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const createPayableSchema = z.object({
  description: z.string().min(2, "Descrição obrigatória"),
  costCenterId: z.string().min(1, "Centro de custo obrigatório"),
  chartOfAccountId: z.string().min(1, "Categoria do plano de contas obrigatória"),
  originalAmount: z.number().positive("Valor deve ser maior que zero"),
  competenceDate: z.string(),
  dueDate: z.string(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createPayableSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      description,
      costCenterId,
      chartOfAccountId,
      originalAmount,
      competenceDate,
      dueDate,
      notes,
    } = parsed.data;

    const payable = await db.accountPayable.create({
      data: {
        description,
        costCenterId,
        chartOfAccountId,
        originalAmount,
        competenceDate: new Date(competenceDate),
        dueDate: new Date(dueDate),
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
      newValues: { description, originalAmount, dueDate, costCenterId },
      ipAddress,
      description: `Lançamento de conta a pagar: ${description} (R$ ${originalAmount})`,
    });

    return NextResponse.json({ success: true, payable });
  } catch (error) {
    console.error("Erro ao criar conta a pagar:", error);
    return NextResponse.json(
      { error: "Erro interno ao cadastrar conta a pagar" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const costCenterId = searchParams.get("costCenterId");

    const payables = await db.accountPayable.findMany({
      where: costCenterId ? { costCenterId } : {},
      include: {
        costCenter: true,
        chartOfAccount: true,
        supplier: true,
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ payables });
  } catch (error) {
    console.error("Erro ao listar contas a pagar:", error);
    return NextResponse.json({ error: "Erro ao buscar contas" }, { status: 500 });
  }
}
