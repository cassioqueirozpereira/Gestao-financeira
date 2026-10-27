import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { AccountType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const accounts = await db.chartOfAccount.findMany({
      include: {
        parent: true,
        children: true,
      },
      orderBy: { code: "asc" },
    });
    return NextResponse.json({ accounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { code, name, type, parentId } = body;

    if (!code || !name || !type) {
      return NextResponse.json({ error: "Código, nome e tipo de conta são obrigatórios" }, { status: 400 });
    }

    // Calcula o nível da conta com base nos pontos do código ou no pai (Ex: "1" = 1, "1.1" = 2, "1.1.1" = 3)
    const level = code.split(".").length;

    const newAccount = await db.chartOfAccount.create({
      data: {
        code: code.trim(),
        name: name.trim(),
        type: type as AccountType,
        level,
        parentId: parentId || null,
      },
      include: { parent: true },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "ChartOfAccount",
      entityId: newAccount.id,
      newValues: { code: newAccount.code, name: newAccount.name, type: newAccount.type },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Inclusão de conta no Plano de Contas: ${newAccount.code} - ${newAccount.name}`,
    });

    return NextResponse.json({ success: true, account: newAccount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { id, code, name, type, parentId } = body;

    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    const existing = await db.chartOfAccount.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });

    const level = code ? code.split(".").length : existing.level;

    const updated = await db.chartOfAccount.update({
      where: { id },
      data: {
        code: code ? code.trim() : undefined,
        name: name ? name.trim() : undefined,
        type: type ? (type as AccountType) : undefined,
        level,
        parentId: parentId !== undefined ? parentId || null : undefined,
      },
      include: { parent: true },
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "ChartOfAccount",
      entityId: id,
      newValues: { code: updated.code, name: updated.name, type: updated.type },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Edição de conta no Plano de Contas: ${updated.code} - ${updated.name}`,
    });

    return NextResponse.json({ success: true, account: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
