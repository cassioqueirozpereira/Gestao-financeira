import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const createMediaExpenseSchema = z.object({
  costCenterId: z.string().min(1),
  targetType: z.enum(["DIVULGACAO_PROPRIA", "VERBA_CLIENTE", "GESTAO_HONORARIOS"]),
  platform: z.string().min(2),
  campaignName: z.string().min(2),
  budgeted: z.number().min(0).default(0),
  spentAmount: z.number().min(0),
  clientName: z.string().optional(),
  date: z.string(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const expenses = await db.mediaExpense.findMany({
      include: { costCenter: true },
      orderBy: { date: "desc" },
    });
    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("Erro ao listar gastos de mídia:", error);
    return NextResponse.json({ error: "Erro ao buscar despesas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const parsed = createMediaExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 });
    }

    const {
      costCenterId,
      targetType,
      platform,
      campaignName,
      budgeted,
      spentAmount,
      clientName,
      date,
      notes,
    } = parsed.data;

    const expense = await db.mediaExpense.create({
      data: {
        costCenterId,
        targetType,
        platform,
        campaignName,
        budgeted,
        spentAmount,
        clientName: clientName || null,
        date: new Date(date),
        notes: notes || null,
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "MediaExpense",
      entityId: expense.id,
      newValues: { platform, campaignName, spentAmount, targetType },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Gasto de mídia registrado: ${campaignName} (${platform}) - R$ ${spentAmount} (${targetType})`,
    });

    return NextResponse.json({ success: true, expense });
  } catch (error) {
    console.error("Erro na API de mídia:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
