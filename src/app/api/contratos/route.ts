import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const contracts = await db.contract.findMany({
      include: {
        company: true,
        customer: true,
        receivables: {
          orderBy: { dueDate: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ contracts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const {
      companyId,
      customerId,
      customerName,
      customerDoc,
      type = "CASSARATECH_SUPORTE_MANUTENCAO",
      title,
      scope,
      totalAmount = 0,
      monthlyFee = 0,
      installationFee = 0,
      paymentMethod = "BOLETO",
      billingDay = 10,
      startDate = new Date().toISOString(),
    } = body;

    let targetCustomerId = customerId;

    // Se cliente não existe, cria na hora
    if (!targetCustomerId && customerName) {
      const createdCust = await db.customer.create({
        data: {
          name: customerName,
          documentNumber: customerDoc || null,
          paymentMethod,
          monthlyFee: Number(monthlyFee),
          billingDay: Number(billingDay),
          status: "CONVERTIDA",
        },
      });
      targetCustomerId = createdCust.id;
    }

    const count = await db.contract.count();
    const contractNumber = `CT-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    const newContract = await db.contract.create({
      data: {
        contractNumber,
        companyId,
        customerId: targetCustomerId,
        type,
        title,
        scope,
        totalAmount: Number(totalAmount),
        monthlyFee: Number(monthlyFee),
        installationFee: Number(installationFee),
        paymentMethod,
        billingDay: Number(billingDay),
        startDate: new Date(startDate),
        status: "RASCUNHO",
      },
      include: {
        company: true,
        customer: true,
        receivables: true,
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "Contract",
      entityId: newContract.id,
      newValues: { contractNumber, title, totalAmount },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Emissão de contrato ${contractNumber}`,
    });

    return NextResponse.json({ success: true, contract: newContract });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { id, action = "edit" } = body;

    if (!id) return NextResponse.json({ error: "ID não informado" }, { status: 400 });

    const contract = await db.contract.findUnique({
      where: { id },
      include: { company: true, customer: true },
    });
    if (!contract) return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });

    // AÇÃO 1: EFETIVAÇÃO DO CONTRATO
    if (action === "efetivar") {
      const updated = await db.contract.update({
        where: { id },
        data: { status: "ATIVO" },
      });

      // Verifica se já existe um título financeiro gerado para este contrato (evita duplicidade)
      const existingReceivable = await db.accountReceivable.findFirst({
        where: { contractId: contract.id },
      });

      // Só cria a conta a receber da adesão/primeira mensalidade se ainda não existir
      const fee = Number(contract.installationFee || contract.monthlyFee || contract.totalAmount);
      if (fee > 0 && !existingReceivable) {
        const costCenter = await db.costCenter.findFirst({
          where: { code: "SISTEMAS" },
        }) || await db.costCenter.findFirst();

        const chart = await db.chartOfAccount.findFirst({
          where: { code: "1.1.01" },
        }) || await db.chartOfAccount.findFirst({
          where: { type: "RECEITA_OPERACIONAL" },
        }) || await db.chartOfAccount.findFirst();

        if (costCenter && chart) {
          await db.accountReceivable.create({
            data: {
              description: `Adesão / 1ª Parcela — ${contract.title}`,
              customerId: contract.customerId,
              costCenterId: costCenter.id,
              chartOfAccountId: chart.id,
              contractId: contract.id,
              originalAmount: fee,
              competenceDate: new Date(),
              dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Vence em 5 dias
              status: "A_RECEBER",
              paymentType: contract.paymentMethod || "BOLETO",
              notes: `Gerado automaticamente na efetivação do Contrato ${contract.contractNumber}`,
            },
          });
        }
      }

      await logAudit({
        userId: user.id,
        action: "STATUS_CHANGE",
        entity: "Contract",
        entityId: id,
        newValues: { status: "ATIVO" },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        description: `Efetivação de contrato ${contract.contractNumber}`,
      });

      return NextResponse.json({ success: true, contract: updated });
    }

    // AÇÃO: INATIVAÇÃO DO CONTRATO
    if (action === "inativar") {
      const updated = await db.contract.update({
        where: { id },
        data: { status: "CANCELADO" },
      });

      // Cancela títulos a vencer em aberto vinculados a este contrato
      await db.accountReceivable.updateMany({
        where: { contractId: id, status: "A_RECEBER" },
        data: { status: "CANCELADA" },
      });

      await logAudit({
        userId: user.id,
        action: "STATUS_CHANGE",
        entity: "Contract",
        entityId: id,
        newValues: { status: "CANCELADO" },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        description: `Inativação de contrato ${contract.contractNumber}`,
      });

      return NextResponse.json({ success: true, contract: updated });
    }

    // AÇÃO 2: EDITAR CONTRATO
    const {
      title,
      scope,
      totalAmount,
      monthlyFee,
      installationFee,
      paymentMethod,
      billingDay,
      status,
    } = body;

    const updated = await db.contract.update({
      where: { id },
      data: {
        title: title || contract.title,
        scope: scope || contract.scope,
        totalAmount: totalAmount ? Number(totalAmount) : contract.totalAmount,
        monthlyFee: monthlyFee ? Number(monthlyFee) : contract.monthlyFee,
        installationFee: installationFee !== undefined ? Number(installationFee) : contract.installationFee,
        paymentMethod: paymentMethod || contract.paymentMethod,
        billingDay: billingDay ? Number(billingDay) : contract.billingDay,
        status: status || contract.status,
      },
      include: {
        company: true,
        customer: true,
        receivables: true,
      },
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "Contract",
      entityId: id,
      newValues: { title: updated.title, totalAmount: updated.totalAmount },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Edição de contrato ${updated.contractNumber}`,
    });

    return NextResponse.json({ success: true, contract: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
