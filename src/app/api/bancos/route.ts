import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const createBankAccountSchema = z.object({
  bankName: z.string().min(2, "Nome da instituição obrigatório"),
  accountType: z.enum(["CORRENTE", "POUPANCA", "PAGAMENTO", "INVESTIMENTO", "CAIXA_FISICO"]),
  holderName: z.string().min(2, "Titular obrigatório"),
  accountNumber: z.string().optional(),
  initialBalance: z.number().default(0),
  companyId: z.string().optional(),
});

const createCreditCardSchema = z.object({
  holderName: z.string().min(2, "Titular obrigatório"),
  cardBrand: z.string().min(2, "Bandeira obrigatória"),
  nickname: z.string().min(2, "Apelido obrigatório"),
  creditLimit: z.number().positive("Limite deve ser positivo"),
  closingDay: z.number().min(1).max(31),
  dueDay: z.number().min(1).max(31),
  bankAccountId: z.string().optional(),
});

export async function GET() {
  try {
    const bankAccounts = await db.bankAccount.findMany({
      include: { company: true, creditCards: true },
      orderBy: { createdAt: "desc" },
    });
    const creditCards = await db.creditCard.findMany({
      include: { bankAccount: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ bankAccounts, creditCards });
  } catch (error) {
    console.error("Erro ao buscar bancos e cartões:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();

    if (body.type === "CREDIT_CARD") {
      const parsed = createCreditCardSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 });
      }

      const card = await db.creditCard.create({
        data: parsed.data,
      });

      await logAudit({
        userId: user.id,
        action: "CREATE",
        entity: "CreditCard",
        entityId: card.id,
        newValues: { nickname: card.nickname, cardBrand: card.cardBrand },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        description: `Cadastrado cartão de crédito "${card.nickname}" (${card.cardBrand})`,
      });

      return NextResponse.json({ success: true, card });
    }

    const parsed = createBankAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 });
    }

    const { bankName, accountType, holderName, accountNumber, initialBalance, companyId } = parsed.data;

    const account = await db.bankAccount.create({
      data: {
        bankName,
        accountType,
        holderName,
        accountNumber: accountNumber || null,
        initialBalance,
        currentBalance: initialBalance,
        companyId: companyId || null,
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "BankAccount",
      entityId: account.id,
      newValues: { bankName, initialBalance },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Conta bancária cadastrada: ${bankName} (${holderName}) com saldo inicial de R$ ${initialBalance}`,
    });

    return NextResponse.json({ success: true, account });
  } catch (error) {
    console.error("Erro na rota de bancos e cartões:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
