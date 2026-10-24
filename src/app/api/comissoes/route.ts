import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const rules = await db.commissionRule.findMany({
      include: { costCenter: true },
      orderBy: { createdAt: "desc" },
    });

    const records = await db.commissionRecord.findMany({
      include: {
        rule: true,
        partner: true,
        contract: {
          include: { customer: true },
        },
        order: true,
        accountPayable: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const contracts = await db.contract.findMany({
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ rules, records, contracts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { action = "create_record" } = body;

    // AÇÃO 1: APROVAR COMISSÃO -> Gera Conta a Pagar
    if (action === "APPROVE") {
      const { recordId, chartOfAccountId, dueDate } = body;
      const record = await db.commissionRecord.findUnique({
        where: { id: recordId },
        include: { rule: true, contract: true },
      });

      if (!record) return NextResponse.json({ error: "Comissão não encontrada" }, { status: 404 });
      if (record.status === "APROVADA" || record.accountPayableId) {
        return NextResponse.json({ error: "Comissão já aprovada." }, { status: 400 });
      }

      const costCenter = await db.costCenter.findFirst({
        where: { code: "SISTEMAS" },
      }) || await db.costCenter.findFirst();

      const payable = await db.accountPayable.create({
        data: {
          description: `Comissão: ${record.beneficiary} (Contrato: ${record.contract?.contractNumber || "Origem Direta"})`,
          costCenterId: costCenter!.id,
          chartOfAccountId,
          originalAmount: record.calculatedAmount,
          competenceDate: new Date(),
          dueDate: new Date(dueDate),
          status: "EM_ABERTO",
          notes: `Comissão aprovada por ${user.name}`,
        },
      });

      const updated = await db.commissionRecord.update({
        where: { id: recordId },
        data: {
          status: "APROVADA",
          accountPayableId: payable.id,
          approvalNotes: `Aprovada em ${new Date().toLocaleDateString("pt-BR")}. Conta a pagar criada.`,
        },
      });

      await logAudit({
        userId: user.id,
        action: "STATUS_CHANGE",
        entity: "CommissionRecord",
        entityId: recordId,
        newValues: { status: "APROVADA", accountPayableId: payable.id },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        description: `Comissão aprovada para ${record.beneficiary}`,
      });

      return NextResponse.json({ success: true, record: updated, payable });
    }

    // AÇÃO 2: CRIAR COMISSÃO VINCULADA AO CONTRATO [Item 12]
    const {
      contractId,
      beneficiary,
      baseType = "TOTAL", // TOTAL, INSTALACAO, MENSALIDADE
      rateApplied = 10, // %
      status = "PREVISTA",
    } = body;

    if (!contractId || !beneficiary) {
      return NextResponse.json({ error: "Contrato e Beneficiário são obrigatórios" }, { status: 400 });
    }

    const contract = await db.contract.findUnique({ where: { id: contractId } });
    if (!contract) return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });

    let baseAmount = Number(contract.totalAmount);
    if (baseType === "INSTALACAO") {
      baseAmount = Number(contract.installationFee || 0);
    } else if (baseType === "MENSALIDADE") {
      baseAmount = Number(contract.monthlyFee || 0);
    }

    const calculatedAmount = Number((baseAmount * (Number(rateApplied) / 100)).toFixed(2));

    const newRecord = await db.commissionRecord.create({
      data: {
        contractId,
        beneficiary,
        baseType,
        calculationBase: baseAmount,
        rateApplied: Number(rateApplied),
        calculatedAmount,
        status: status as any,
      },
      include: {
        contract: { include: { customer: true } },
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "CommissionRecord",
      entityId: newRecord.id,
      newValues: newRecord,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Comissão calculada sobre ${baseType} do contrato ${contract.contractNumber}: R$ ${calculatedAmount}`,
    });

    return NextResponse.json({ success: true, record: newRecord });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { id, beneficiary, baseType, rateApplied, calculatedAmount, status } = body;

    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    const existing = await db.commissionRecord.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Comissão não encontrada" }, { status: 404 });

    const updated = await db.commissionRecord.update({
      where: { id },
      data: {
        beneficiary: beneficiary || existing.beneficiary,
        baseType: baseType || existing.baseType,
        rateApplied: rateApplied !== undefined ? Number(rateApplied) : existing.rateApplied,
        calculatedAmount: calculatedAmount !== undefined ? Number(calculatedAmount) : existing.calculatedAmount,
        status: status || existing.status,
      },
      include: {
        contract: { include: { customer: true } },
      },
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "CommissionRecord",
      entityId: id,
      newValues: updated,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Edição de comissão para ${updated.beneficiary}`,
    });

    return NextResponse.json({ success: true, record: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID não informado" }, { status: 400 });

    const existing = await db.commissionRecord.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Comissão não encontrada" }, { status: 404 });

    if (existing.status === "PAGA") {
      return NextResponse.json({ error: "Não é possível excluir comissão já paga." }, { status: 400 });
    }

    await db.commissionRecord.delete({ where: { id } });

    await logAudit({
      userId: user.id,
      action: "DELETE",
      entity: "CommissionRecord",
      entityId: id,
      newValues: existing,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Exclusão de comissão de ${existing.beneficiary}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
