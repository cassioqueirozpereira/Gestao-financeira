import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const createDebtSchema = z.object({
  creditorName: z.string().min(2, "Nome do credor obrigatório"),
  type: z.enum([
    "EMPRESTIMO_BANCARIO",
    "FINANCIAMENTO",
    "DIVIDA_FORNECEDOR",
    "MUTUO_SOCIO",
    "OBRIGACAO_TERCEIROS",
    "PARCELAMENTO_FISCAL",
    "RENEGOCIACAO",
  ]),
  companyId: z.string().min(1),
  costCenterId: z.string().min(1),
  chartOfAccountId: z.string().min(1), // Conta do plano de contas para as parcelas
  contractDate: z.string(),
  originalAmount: z.number().positive(),
  interestRate: z.number().optional(),
  totalInstallments: z.number().int().min(1),
  firstDueDate: z.string(),
  guarantees: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const debts = await db.debtObligation.findMany({
      include: {
        company: true,
        costCenter: true,
        installments: {
          orderBy: { installmentNumber: "asc" },
        },
      },
      orderBy: { contractDate: "desc" },
    });
    return NextResponse.json({ debts });
  } catch (error) {
    console.error("Erro ao listar dívidas:", error);
    return NextResponse.json({ error: "Erro ao buscar dívidas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const parsed = createDebtSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 });
    }

    const {
      creditorName,
      type,
      companyId,
      costCenterId,
      chartOfAccountId,
      contractDate,
      originalAmount,
      interestRate,
      totalInstallments,
      firstDueDate,
      guarantees,
      notes,
    } = parsed.data;

    // Calcula valor por parcela (amortização simples)
    const principalPerInstallment = originalAmount / totalInstallments;
    const monthlyRate = interestRate ? interestRate / 100 : 0;
    const interestPerInstallment = originalAmount * monthlyRate;
    const totalPerInstallment = principalPerInstallment + interestPerInstallment;

    // Transação: Cria a Dívida, as Parcelas e as Contas a Pagar correspondentes no financeiro
    const result = await db.$transaction(async (tx) => {
      const debt = await tx.debtObligation.create({
        data: {
          creditorName,
          type,
          companyId,
          costCenterId,
          contractDate: new Date(contractDate),
          originalAmount,
          currentBalance: originalAmount,
          interestRate: interestRate || 0,
          totalInstallments,
          guarantees: guarantees || null,
          notes: notes || null,
          status: "ATIVO",
        },
      });

      const startDate = new Date(firstDueDate);

      for (let i = 1; i <= totalInstallments; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));

        const installment = await tx.debtInstallment.create({
          data: {
            debtId: debt.id,
            installmentNumber: i,
            dueDate,
            principalAmount: principalPerInstallment,
            interestAmount: interestPerInstallment,
            totalAmount: totalPerInstallment,
            isPaid: false,
          },
        });

        // Gera automaticamente a Conta a Pagar correspondente (sem duplicidade futura)
        await tx.accountPayable.create({
          data: {
            description: `Dívida: ${creditorName} (Parcela ${i}/${totalInstallments})`,
            costCenterId,
            chartOfAccountId,
            originalAmount: totalPerInstallment,
            competenceDate: new Date(contractDate),
            dueDate,
            debtInstallmentId: installment.id,
            installmentNumber: i,
            totalInstallments,
            status: "EM_ABERTO",
            notes: `Amortização Principal: R$ ${principalPerInstallment.toFixed(2)} | Juros: R$ ${interestPerInstallment.toFixed(2)}`,
          },
        });
      }

      return debt;
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "DebtObligation",
      entityId: result.id,
      newValues: { creditorName, originalAmount, totalInstallments },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Contratada obrigação/dívida com ${creditorName} no valor de R$ ${originalAmount} em ${totalInstallments} parcelas.`,
    });

    return NextResponse.json({ success: true, debt: result });
  } catch (error) {
    console.error("Erro ao registrar dívida:", error);
    return NextResponse.json({ error: "Erro interno ao cadastrar dívida" }, { status: 500 });
  }
}
