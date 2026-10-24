import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { action = "create_lead" } = body;

    // AÇÃO 1: AVANÇAR ETAPA / PRÓXIMO PASSO
    if (action === "update_step" || action === "advance_status") {
      const { customerId, status, notes } = body;
      const customer = await db.customer.update({
        where: { id: customerId },
        data: {
          status,
          notes: notes !== undefined ? notes : undefined,
        },
      });

      await logAudit({
        userId: user.id,
        action: "STATUS_CHANGE",
        entity: "CustomerLead",
        entityId: customerId,
        newValues: { status, notes },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        description: `Lead "${customer.name}" avançou para etapa: ${status}`,
      });

      return NextResponse.json({ success: true, customer });
    }

    // AÇÃO 2: ADICIONAR NOVO LEAD / CLIENTE
    const {
      name,
      email,
      phone,
      documentNumber,
      interestedIn = "Sistemas",
      notes,
      estimatedBudget = 0,
    } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Nome e Telefone são obrigatórios" }, { status: 400 });
    }

    const newLead = await db.customer.create({
      data: {
        name,
        email: email || null,
        phone,
        documentNumber: documentNumber || null,
        interestedIn,
        notes: notes ? `Orçamento Estimado: R$ ${estimatedBudget}. ${notes}` : `Orçamento Estimado: R$ ${estimatedBudget}`,
        status: "NOVO_CONTATO",
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "CustomerLead",
      entityId: newLead.id,
      newValues: newLead,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Cadastro de novo lead no CRM: ${name}`,
    });

    return NextResponse.json({ success: true, customer: newLead });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
