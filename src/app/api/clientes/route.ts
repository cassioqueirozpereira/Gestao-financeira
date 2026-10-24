import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const customers = await db.customer.findMany({
      include: {
        contracts: {
          orderBy: { createdAt: "desc" },
        },
        accountsReceivable: {
          orderBy: { dueDate: "desc" },
          take: 5,
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(customers);
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
      name,
      documentNumber,
      email,
      phone,
      address,
      city,
      state,
      notes,
      paymentMethod = "PIX",
      monthlyFee = 0,
      billingDay = 10,
      action, // 'generate_monthly_fee' or 'create_customer'
      customerId,
      costCenterCode = "SISTEMAS",
    } = body;

    // Ação Especial: Gerar Mensalidade do Mês para o Cliente
    if (action === "generate_monthly_fee") {
      if (!customerId) {
        return NextResponse.json({ error: "Cliente não informado" }, { status: 400 });
      }

      const client = await db.customer.findUnique({
        where: { id: customerId },
        include: { contracts: { where: { status: "ATIVO" } } },
      });

      if (!client) {
        return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
      }

      const fee = Number(client.monthlyFee || body.amount || 0);
      if (fee <= 0) {
        return NextResponse.json({ error: "Cliente não possui valor de mensalidade configurado" }, { status: 400 });
      }

      // Encontrar Centro de Custo e Plano de Contas
      const costCenter = await db.costCenter.findFirst({
        where: { code: costCenterCode },
      }) || await db.costCenter.findFirst();

      const chartAccount = await db.chartOfAccount.findFirst({
        where: { code: "1.1.01" }, // Receita de Serviços / Sistemas
      }) || await db.chartOfAccount.findFirst({
        where: { type: "RECEITA_OPERACIONAL" },
      }) || await db.chartOfAccount.findFirst();

      if (!costCenter || !chartAccount) {
        return NextResponse.json({ error: "Centro de custo ou plano de contas não configurado" }, { status: 400 });
      }

      const now = new Date();
      const bDay = client.billingDay || 10;
      const dueDate = new Date(now.getFullYear(), now.getMonth(), bDay);
      // Se dia já passou no mês, agenda para próximo mês ou dia atual
      const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      const competence = `${monthNames[now.getMonth()]}/${now.getFullYear()}`;

      const activeContract = client.contracts[0];

      const receivable = await db.accountReceivable.create({
        data: {
          description: `Mensalidade ${competence} — ${client.name}`,
          customerId: client.id,
          costCenterId: costCenter.id,
          chartOfAccountId: chartAccount.id,
          originalAmount: fee,
          competenceDate: now,
          dueDate: dueDate,
          status: "A_RECEBER",
          paymentType: client.paymentMethod || "PIX",
          contractId: activeContract?.id || null,
          notes: `Geração automática de mensalidade recorrente. Forma de pgto: ${client.paymentMethod || "PIX"}`,
        },
      });

      // Log de Auditoria
      await logAudit({
        userId: user.id,
        action: "CREATE",
        entity: "AccountReceivable",
        entityId: receivable.id,
        newValues: { description: receivable.description, originalAmount: fee },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        description: `Geração de mensalidade para ${client.name} (R$ ${fee})`,
      });

      return NextResponse.json({ success: true, receivable });
    }

    // Criar Cliente
    const newCustomer = await db.customer.create({
      data: {
        name,
        documentNumber,
        email,
        phone,
        address,
        city,
        state,
        notes,
        paymentMethod,
        monthlyFee: Number(monthlyFee) || 0,
        billingDay: Number(billingDay) || 10,
        status: "CONVERTIDA",
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "Customer",
      entityId: newCustomer.id,
      newValues: { name, email, phone, monthlyFee, paymentMethod },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Cadastro de novo cliente: ${name}`,
    });

    return NextResponse.json(newCustomer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { id, name, documentNumber, email, phone, address, notes, paymentMethod, monthlyFee, billingDay } = body;

    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    const updated = await db.customer.update({
      where: { id },
      data: {
        name,
        documentNumber,
        email,
        phone,
        address,
        notes,
        paymentMethod,
        monthlyFee: Number(monthlyFee) || 0,
        billingDay: Number(billingDay) || 10,
      },
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "Customer",
      entityId: updated.id,
      newValues: { name, email, phone, monthlyFee, paymentMethod },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Atualização cadastral do cliente: ${name}`,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
