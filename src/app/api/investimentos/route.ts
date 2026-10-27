import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const updateRecoverySchema = z.object({
  initialCapital: z.number().min(0).optional(),
  recoveredAmount: z.number().min(0),
  additionalAports: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const capitalRecovery = await db.capitalRecovery.findFirst();
    return NextResponse.json({ capitalRecovery });
  } catch (error) {
    console.error("Erro ao buscar dados de investimentos:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const parsed = updateRecoverySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 });
    }

    const { initialCapital, recoveredAmount, additionalAports, notes } = parsed.data;

    let recovery = await db.capitalRecovery.findFirst();
    if (recovery) {
      recovery = await db.capitalRecovery.update({
        where: { id: recovery.id },
        data: {
          initialCapital: initialCapital !== undefined ? initialCapital : recovery.initialCapital,
          recoveredAmount,
          additionalAports,
          notes: notes !== undefined ? notes : recovery.notes,
        },
      });
    } else {
      recovery = await db.capitalRecovery.create({
        data: {
          initialCapital: initialCapital || 1600.0,
          recoveredAmount,
          additionalAports,
          notes: notes || "Controle do capital inicial da D.A. Com Carinho",
        },
      });
    }

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "CapitalRecovery",
      entityId: recovery.id,
      newValues: { recoveredAmount, additionalAports },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Atualizado controle de recuperação de capital D.A.: R$ ${recoveredAmount} recuperado de R$ ${recovery.initialCapital}.`,
    });

    return NextResponse.json({ success: true, capitalRecovery: recovery });
  } catch (error) {
    console.error("Erro na API de investimentos:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
