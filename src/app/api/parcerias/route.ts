import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const createPartnerSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  documentNumber: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  type: z.enum([
    "AFILIADO",
    "INDICADOR",
    "PARCEIRO_ESTRATEGICO",
    "FORNECEDOR_CONJUNTO",
    "AUTONOMO",
  ]),
  costCenterId: z.string().optional(),
  commissionRate: z.number().min(0).max(100),
  conditions: z.string().optional(),
  internalOwner: z.string().optional(),
});

export async function GET() {
  try {
    const partners = await db.partner.findMany({
      include: {
        costCenter: true,
        customers: true,
        commissions: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ partners });
  } catch (error) {
    console.error("Erro ao listar parceiros:", error);
    return NextResponse.json({ error: "Erro ao listar parceiros" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const parsed = createPartnerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 });
    }

    const {
      name,
      documentNumber,
      email,
      phone,
      type,
      costCenterId,
      commissionRate,
      conditions,
      internalOwner,
    } = parsed.data;

    const partner = await db.partner.create({
      data: {
        name,
        documentNumber: documentNumber || null,
        email: email || null,
        phone: phone || null,
        type,
        costCenterId: costCenterId || null,
        commissionRate,
        conditions: conditions || null,
        internalOwner: internalOwner || null,
        isActive: true,
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "Partner",
      entityId: partner.id,
      newValues: parsed.data,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Cadastro de novo parceiro comercial: ${partner.name} (${partner.type})`,
    });

    return NextResponse.json({ success: true, partner });
  } catch (error) {
    console.error("Erro ao cadastrar parceiro:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
