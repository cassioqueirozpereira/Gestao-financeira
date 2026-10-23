import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const createGoalSchema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  description: z.string().optional(),
  costCenterId: z.string().min(1),
  period: z.enum(["DIARIA", "SEMANAL", "MENSAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"]),
  direction: z.enum(["AUMENTO", "REDUCAO"]),
  unit: z.string().default("BRL"),
  targetValue: z.number().positive(),
  currentValue: z.number().default(0),
  startDate: z.string(),
  endDate: z.string(),
  responsibleName: z.string().optional(),
});

const updateGoalProgressSchema = z.object({
  goalId: z.string().min(1),
  currentValue: z.number(),
  status: z.enum([
    "NAO_INICIADA",
    "EM_ANDAMENTO",
    "ATINGIDA",
    "SUPERADA",
    "PARCIALMENTE_ATINGIDA",
    "NAO_ATINGIDA",
    "CANCELADA",
  ]),
  justification: z.string().optional(),
  actionPlan: z.string().optional(),
});

export async function GET() {
  try {
    const goals = await db.performanceGoal.findMany({
      include: { costCenter: true },
      orderBy: { endDate: "asc" },
    });
    return NextResponse.json({ goals });
  } catch (error) {
    console.error("Erro ao listar metas:", error);
    return NextResponse.json({ error: "Erro ao buscar metas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();

    // Atualização de progresso / justificativa
    if (body.action === "UPDATE_PROGRESS") {
      const parsed = updateGoalProgressSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 });
      }

      const { goalId, currentValue, status, justification, actionPlan } = parsed.data;

      const updated = await db.performanceGoal.update({
        where: { id: goalId },
        data: {
          currentValue,
          status,
          justification: justification || null,
          actionPlan: actionPlan || null,
        },
      });

      await logAudit({
        userId: user.id,
        action: "STATUS_CHANGE",
        entity: "PerformanceGoal",
        entityId: goalId,
        newValues: { currentValue, status, justification },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        description: `Meta "${updated.title}" atualizada para status ${status} com valor ${currentValue}.`,
      });

      return NextResponse.json({ success: true, goal: updated });
    }

    // Criação de nova meta
    const parsed = createGoalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 });
    }

    const {
      title,
      description,
      costCenterId,
      period,
      direction,
      unit,
      targetValue,
      currentValue,
      startDate,
      endDate,
      responsibleName,
    } = parsed.data;

    const goal = await db.performanceGoal.create({
      data: {
        title,
        description: description || null,
        costCenterId,
        period,
        direction,
        unit,
        targetValue,
        currentValue,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        responsibleName: responsibleName || null,
        status: "EM_ANDAMENTO",
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "PerformanceGoal",
      entityId: goal.id,
      newValues: parsed.data,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Meta cadastrada: ${title} (${period}) com alvo de ${targetValue}`,
    });

    return NextResponse.json({ success: true, goal });
  } catch (error) {
    console.error("Erro na API de metas:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
