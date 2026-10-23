import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

const orcamentoSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().min(8, "Telefone / WhatsApp obrigatório"),
  interestedIn: z.enum(["Sistemas", "Velas", "Resinas", "Mídia Social"]),
  notes: z.string().min(5, "Detalhes da solicitação obrigatórios"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = orcamentoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, email, phone, interestedIn, notes } = parsed.data;

    // Busca se cliente já existe por telefone ou e-mail para não duplicar
    let customer = await db.customer.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          { phone },
        ],
      },
    });

    if (customer) {
      // Atualiza notas e interesse
      customer = await db.customer.update({
        where: { id: customer.id },
        data: {
          interestedIn,
          status: "NOVO_CONTATO",
          notes: `${customer.notes ? customer.notes + "\n---\n" : ""}Novo orçamento solicitado em ${new Date().toLocaleDateString("pt-BR")}: ${notes}`,
        },
      });
    } else {
      // Cria novo lead no CRM
      customer = await db.customer.create({
        data: {
          name,
          email: email || null,
          phone,
          interestedIn,
          status: "NOVO_CONTATO",
          notes: `Orçamento inicial: ${notes}`,
        },
      });
    }

    await logAudit({
      userId: null,
      action: "CREATE",
      entity: "CustomerLead",
      entityId: customer.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Novo orçamento público recebido de ${name} para área de ${interestedIn}`,
    });

    return NextResponse.json({
      success: true,
      message: "Orçamento enviado com sucesso! Nossa equipe entrará em contato em breve.",
    });
  } catch (error) {
    console.error("Erro ao registrar orçamento público:", error);
    return NextResponse.json(
      { error: "Erro ao processar orçamento. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}
