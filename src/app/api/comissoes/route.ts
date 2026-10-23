import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const createRuleSchema = z.object({
  name: z.string().min(2, "Nome da regra obrigatório"),
  beneficiary: z.string().min(2, "Beneficiário obrigatório"),
  costCenterId: z.string().min(1, "Centro de custo obrigatório"),
  baseType: z.enum(["VALOR_BRUTO", "VALOR_LIQUIDO", "VALOR_FIXO"]),
  percentage: z.number().optional(),
  fixedAmount: z.number().optional(),
  triggerEvent: z.enum([
    "VENDA_REALIZADA",
    "RECEBIMENTO_EFETIVO",
    "CONTRATO_ASSINADO",
    "INDICACAO_CONVERTIDA",
  ]),
  paymentTerms: z.string().optional(),
});

const approveCommissionSchema = z.object({
  recordId: z.string().min(1),
  chartOfAccountId: z.string().min(1), // Categoria do plano de contas para a despesa
  dueDate: z.string(), // Vencimento para a conta a pagar gerada
});

export async function GET() {
  try {
    const rules = await db.commissionRule.findMany({
      include: { costCenter: true },
      orderBy: { createdAt: "desc" },
    });

    const records = await db.commissionRecord.findMany({
      include: {
        rule: true,
        partner: true,
        contract: true,
        order: true,
        accountPayable: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ rules, records });
  } catch (error) {
    console.error("Erro ao listar comissões:", error);
    return NextResponse.json({ error: "Erro ao buscar comissões" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();

    // Se for aprovação de comissão -> gera Conta a Pagar sem duplicidade
    if (body.action === "APPROVE") {
      const parsed = approveCommissionSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 });
      }

      const { recordId, chartOfAccountId, dueDate } = parsed.data;

      const record = await db.commissionRecord.findUnique({
        where: { id: recordId },
        include: { rule: true },
      });

      if (!record) return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
      if (record.status === "APROVADA" || record.status === "A_PAGAR" || record.accountPayableId) {
        return NextResponse.json({ error: "Esta comissão já foi aprovada e possui obrigação vinculada." }, { status: 400 });
      }

      const costCenterId = record.rule?.costCenterId || (await db.costCenter.findFirst())?.id!;

      // Cria Conta a Pagar formal no módulo financeiro
      const payable = await db.accountPayable.create({
        data: {
          description: `Comissão: ${record.beneficiary} (Origem: ${record.rule?.name || "Comissão Manual"})`,
          costCenterId,
          chartOfAccountId,
          originalAmount: record.calculatedAmount,
          competenceDate: new Date(),
          dueDate: new Date(dueDate),
          status: "EM_ABERTO",
          notes: `Gerada automaticamente da comissão ID ${record.id}`,
        },
      });

      // Atualiza registro de comissão vinculando a conta criada
      const updatedRecord = await db.commissionRecord.update({
        where: { id: record.id },
        data: {
          status: "APROVADA",
          accountPayableId: payable.id,
          approvalNotes: `Aprovado por ${user.name} em ${new Date().toLocaleDateString("pt-BR")}. Conta a pagar criada.`,
        },
      });

      await logAudit({
        userId: user.id,
        action: "STATUS_CHANGE",
        entity: "CommissionRecord",
        entityId: record.id,
        newValues: { status: "APROVADA", accountPayableId: payable.id },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        description: `Comissão de R$ ${record.calculatedAmount} aprovada para ${record.beneficiary}. Conta a pagar vinculada gerada.`,
      });

      return NextResponse.json({ success: true, record: updatedRecord, payable });
    }

    // Criação de nova Regra de Comissão
    const parsedRule = createRuleSchema.safeParse(body);
    if (!parsedRule.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsedRule.error.format() }, { status: 400 });
    }

    const newRule = await db.commissionRule.create({
      data: parsedRule.data,
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "CommissionRule",
      entityId: newRule.id,
      newValues: parsedRule.data,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Criada regra de comissão: ${newRule.name} para ${newRule.beneficiary}`,
    });

    return NextResponse.json({ success: true, rule: newRule });
  } catch (error) {
    console.error("Erro na rota de comissões:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
