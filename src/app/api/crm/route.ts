import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const updateLeadStatusSchema = z.object({
  customerId: z.string().min(1),
  status: z.enum([
    "NOVO_CONTATO",
    "EM_ATENDIMENTO",
    "LEVANTAMENTO",
    "PROPOSTA_ELABORACAO",
    "PROPOSTA_ENVIADA",
    "NEGOCIACAO",
    "APROVADA",
    "PERDIDA",
    "CONVERTIDA",
  ]),
});

export async function GET() {
  try {
    const customers = await db.customer.findMany({
      include: {
        contracts: true,
        orders: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Erro ao listar CRM:", error);
    return NextResponse.json({ error: "Erro ao buscar clientes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const parsed = updateLeadStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 });
    }

    const { customerId, status } = parsed.data;

    const customer = await db.customer.update({
      where: { id: customerId },
      data: { status },
    });

    await logAudit({
      userId: user.id,
      action: "STATUS_CHANGE",
      entity: "CustomerLead",
      entityId: customerId,
      newValues: { status },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Lead "${customer.name}" avançou para etapa: ${status}`,
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error("Erro na API de CRM:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
