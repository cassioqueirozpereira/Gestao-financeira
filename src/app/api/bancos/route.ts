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

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { id, type } = body;

    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    if (type === "CREDIT_CARD") {
      const { nickname, cardBrand, holderName, creditLimit, closingDay, dueDay, bankAccountId } = body;
      const existing = await db.creditCard.findUnique({ where: { id } });
      if (!existing) return NextResponse.json({ error: "Cartão não encontrado" }, { status: 404 });

      const updated = await db.creditCard.update({
        where: { id },
        data: {
          nickname: nickname !== undefined ? nickname : existing.nickname,
          cardBrand: cardBrand !== undefined ? cardBrand : existing.cardBrand,
          holderName: holderName !== undefined ? holderName : existing.holderName,
          creditLimit: creditLimit !== undefined ? Number(creditLimit) : existing.creditLimit,
          closingDay: closingDay !== undefined ? parseInt(closingDay, 10) : existing.closingDay,
          dueDay: dueDay !== undefined ? parseInt(dueDay, 10) : existing.dueDay,
          bankAccountId: bankAccountId !== undefined ? bankAccountId || null : existing.bankAccountId,
        },
      });

      const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
      await logAudit({
        userId: user.id,
        action: "UPDATE",
        entity: "CreditCard",
        entityId: id,
        newValues: updated,
        ipAddress,
        description: `Edição do cartão de crédito "${updated.nickname}"`,
      });

      return NextResponse.json({ success: true, card: updated });
    }

    // Edição de Conta Bancária
    const { bankName, accountType, holderName, accountNumber, currentBalance, initialBalance, companyId } = body;
    const existing = await db.bankAccount.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Conta bancária não encontrada" }, { status: 404 });

    const updated = await db.bankAccount.update({
      where: { id },
      data: {
        bankName: bankName !== undefined ? bankName : existing.bankName,
        accountType: accountType !== undefined ? accountType : existing.accountType,
        holderName: holderName !== undefined ? holderName : existing.holderName,
        accountNumber: accountNumber !== undefined ? accountNumber || null : existing.accountNumber,
        currentBalance: currentBalance !== undefined ? Number(currentBalance) : existing.currentBalance,
        initialBalance: initialBalance !== undefined ? Number(initialBalance) : existing.initialBalance,
        companyId: companyId !== undefined ? companyId || null : existing.companyId,
      },
    });

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "BankAccount",
      entityId: id,
      newValues: updated,
      ipAddress,
      description: `Edição da conta bancária "${updated.bankName}" (${updated.holderName})`,
    });

    return NextResponse.json({ success: true, account: updated });
  } catch (error: any) {
    console.error("Erro ao atualizar banco ou cartão:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");
    let type = searchParams.get("type");

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
      type = body.type;
    }

    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (type === "CREDIT_CARD" || type === "CARD") {
      const existing = await db.creditCard.findUnique({ where: { id } });
      if (!existing) return NextResponse.json({ error: "Cartão não encontrado" }, { status: 404 });

      // Desvincula contas a pagar vinculadas a faturas deste cartão
      const invoices = await db.creditCardInvoice.findMany({ where: { creditCardId: id } });
      const invoiceIds = invoices.map((inv) => inv.id);
      if (invoiceIds.length > 0) {
        await db.accountPayable.updateMany({
          where: { creditCardInvoiceId: { in: invoiceIds } },
          data: { creditCardInvoiceId: null },
        });
        await db.creditCardInvoice.deleteMany({ where: { creditCardId: id } });
      }

      await db.creditCard.delete({ where: { id } });

      await logAudit({
        userId: user.id,
        action: "DELETE",
        entity: "CreditCard",
        entityId: id,
        oldValues: existing,
        ipAddress,
        description: `Exclusão do cartão de crédito "${existing.nickname}"`,
      });

      return NextResponse.json({ success: true, message: "Cartão excluído com sucesso" });
    }

    // Exclusão de Conta Bancária
    const existing = await db.bankAccount.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Conta bancária não encontrada" }, { status: 404 });

    // Desvincula cartões de crédito, contas a pagar e contas a receber
    await db.creditCard.updateMany({ where: { bankAccountId: id }, data: { bankAccountId: null } });
    await db.accountPayable.updateMany({ where: { bankAccountId: id }, data: { bankAccountId: null } });
    await db.accountReceivable.updateMany({ where: { bankAccountId: id }, data: { bankAccountId: null } });
    await db.bankTransaction.deleteMany({ where: { bankAccountId: id } });

    await db.bankAccount.delete({ where: { id } });

    await logAudit({
      userId: user.id,
      action: "DELETE",
      entity: "BankAccount",
      entityId: id,
      oldValues: existing,
      ipAddress,
      description: `Exclusão da conta bancária "${existing.bankName}" (${existing.holderName})`,
    });

    return NextResponse.json({ success: true, message: "Conta bancária excluída com sucesso" });
  } catch (error: any) {
    console.error("Erro ao excluir banco ou cartão:", error);
    return NextResponse.json({ error: error.message || "Erro ao excluir" }, { status: 500 });
  }
}
