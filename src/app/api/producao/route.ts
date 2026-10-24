import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const createProductionSchema = z.object({
  batchNumber: z.string().min(2),
  costCenter: z.enum(["VELAS", "RESINAS"]),
  materialCost: z.number().min(0),
  gasCost: z.number().min(0).default(0.20),
  energyCost: z.number().min(0).default(0.45),
  laborCost: z.number().min(0).default(60.00),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const orders = await db.productionOrder.findMany({
      orderBy: { productionDate: "desc" },
    });
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Erro ao listar produção:", error);
    return NextResponse.json({ error: "Erro ao buscar produção" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const parsed = createProductionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 });
    }

    const { batchNumber, costCenter, materialCost, gasCost, energyCost, laborCost, notes } = parsed.data;
    const totalCost = materialCost + gasCost + energyCost + laborCost;

    const order = await db.productionOrder.create({
      data: {
        batchNumber,
        costCenter,
        materialCost,
        gasCost,
        energyCost,
        laborCost,
        totalCost,
        notes: notes || null,
        isConfirmed: true,
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "ProductionOrder",
      entityId: order.id,
      newValues: { batchNumber, totalCost },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Registrado lote de produção ${batchNumber} (${costCenter}) com custo total de R$ ${totalCost.toFixed(2)}`,
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Erro ao criar ordem de produção:", error);
    return NextResponse.json({ error: "Erro interno ao registrar lote" }, { status: 500 });
  }
}
