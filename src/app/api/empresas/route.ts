import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const companies = await db.company.findMany({
      include: { costCenters: true },
      orderBy: { createdAt: "asc" },
    });
    const costCenters = await db.costCenter.findMany({
      include: { company: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ companies, costCenters });
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
      type = "company", // "company" ou "cost_center"
      // Company fields
      code,
      name,
      tradeName,
      documentNumber,
      email,
      phone,
      isPersonal = false,
      // CostCenter fields
      costCenterCode,
      costCenterName,
      description,
      companyId,
    } = body;

    if (type === "cost_center" || costCenterName) {
      const finalCode = (costCenterCode || costCenterName || "CC")
        .toUpperCase()
        .replace(/[^A-Z0-9_]/g, "_")
        .slice(0, 30);

      const newCostCenter = await db.costCenter.create({
        data: {
          code: finalCode,
          name: costCenterName || name,
          description: description || null,
          companyId: companyId || null,
        },
        include: { company: true },
      });

      await logAudit({
        userId: user.id,
        action: "CREATE",
        entity: "CostCenter",
        entityId: newCostCenter.id,
        newValues: { code: newCostCenter.code, name: newCostCenter.name },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        description: `Cadastro de novo Centro de Custo: ${newCostCenter.name}`,
      });

      return NextResponse.json({ success: true, costCenter: newCostCenter });
    }

    // Criação de Empresa
    if (!tradeName && !name) {
      return NextResponse.json({ error: "Nome fantasia ou razão social é obrigatório" }, { status: 400 });
    }

    const finalCompanyCode = (code || tradeName || name || "EMP")
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, "_")
      .slice(0, 30);

    const newCompany = await db.company.create({
      data: {
        code: finalCompanyCode,
        tradeName: tradeName || name,
        name: name || tradeName,
        documentNumber: documentNumber || null,
        email: email || null,
        phone: phone || null,
        isPersonal: Boolean(isPersonal),
      },
      include: { costCenters: true },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "Company",
      entityId: newCompany.id,
      newValues: { code: newCompany.code, tradeName: newCompany.tradeName },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Cadastro de nova Empresa: ${newCompany.tradeName}`,
    });

    return NextResponse.json({ success: true, company: newCompany });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const {
      id,
      type = "company",
      // Company fields
      code,
      name,
      tradeName,
      documentNumber,
      email,
      phone,
      isPersonal,
      // CostCenter fields
      costCenterCode,
      costCenterName,
      description,
      companyId,
    } = body;

    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    if (type === "cost_center") {
      const updatedCostCenter = await db.costCenter.update({
        where: { id },
        data: {
          code: costCenterCode || undefined,
          name: costCenterName || name || undefined,
          description: description !== undefined ? description : undefined,
          companyId: companyId !== undefined ? companyId || null : undefined,
        },
        include: { company: true },
      });

      await logAudit({
        userId: user.id,
        action: "UPDATE",
        entity: "CostCenter",
        entityId: id,
        newValues: { name: updatedCostCenter.name, code: updatedCostCenter.code },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        description: `Edição do Centro de Custo: ${updatedCostCenter.name}`,
      });

      return NextResponse.json({ success: true, costCenter: updatedCostCenter });
    }

    // Edição de Empresa
    const updatedCompany = await db.company.update({
      where: { id },
      data: {
        code: code || undefined,
        tradeName: tradeName || undefined,
        name: name || undefined,
        documentNumber: documentNumber !== undefined ? documentNumber : undefined,
        email: email !== undefined ? email : undefined,
        phone: phone !== undefined ? phone : undefined,
        isPersonal: isPersonal !== undefined ? Boolean(isPersonal) : undefined,
      },
      include: { costCenters: true },
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "Company",
      entityId: id,
      newValues: { tradeName: updatedCompany.tradeName, code: updatedCompany.code },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Edição da Empresa: ${updatedCompany.tradeName}`,
    });

    return NextResponse.json({ success: true, company: updatedCompany });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
