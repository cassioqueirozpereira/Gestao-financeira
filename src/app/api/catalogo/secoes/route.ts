import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import {
  DEFAULT_CATALOG_SECTIONS,
  getStoredCatalogSections,
  saveStoredCatalogSections,
} from "@/lib/catalog-sections";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const fileSections = getStoredCatalogSections();
    let dbCategories: any[] = [];
    try {
      dbCategories = await db.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });
    } catch (e) {
      console.warn("db.category query failed:", e);
    }

    const mergedSections: Record<string, string> = { ...DEFAULT_CATALOG_SECTIONS, ...fileSections };
    for (const cat of dbCategories) {
      const k = cat.code || cat.name;
      mergedSections[k] = cat.name;
    }

    return NextResponse.json({ sections: mergedSections });
  } catch (error: any) {
    return NextResponse.json({ sections: getStoredCatalogSections() });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { key, label, action, updatedSections } = body;

    const currentSections = getStoredCatalogSections();

    // Se ação de sincronização em lote
    if (action === "sync" && updatedSections && typeof updatedSections === "object") {
      saveStoredCatalogSections(updatedSections);
      for (const [k, lbl] of Object.entries(updatedSections)) {
        if (typeof lbl === "string" && lbl.trim()) {
          try {
            await db.category.upsert({
              where: { code: k },
              update: { name: lbl.trim(), isActive: true },
              create: { code: k, name: lbl.trim(), isActive: true },
            });
          } catch {}
        }
      }
      return NextResponse.json({ success: true, sections: updatedSections });
    }

    // Se ação de adicionar/editar individual
    if (!label || !label.trim()) {
      return NextResponse.json({ error: "O nome da seção visual é obrigatório" }, { status: 400 });
    }

    const trimmedLabel = label.trim();
    let finalKey = key;

    if (!finalKey) {
      // Gera uma chave amigável normalizada
      const slug = trimmedLabel
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .toUpperCase()
        .slice(0, 30);
      finalKey = `SECTION_${slug}_${Date.now().toString().slice(-4)}`;
    }

    // 1. Salva no banco de dados PostgreSQL (Category)
    try {
      const existingByCode = await db.category.findUnique({ where: { code: finalKey } });
      if (existingByCode) {
        await db.category.update({
          where: { id: existingByCode.id },
          data: { name: trimmedLabel, isActive: true },
        });
      } else {
        const existingByName = await db.category.findUnique({ where: { name: trimmedLabel } });
        if (existingByName) {
          await db.category.update({
            where: { id: existingByName.id },
            data: { code: finalKey, isActive: true },
          });
        } else {
          await db.category.create({
            data: {
              code: finalKey,
              name: trimmedLabel,
              isActive: true,
            },
          });
        }
      }
    } catch (dbErr) {
      console.warn("Aviso ao persistir seção no banco de dados:", dbErr);
    }

    // 2. Salva no arquivo JSON para redundância
    currentSections[finalKey] = trimmedLabel;
    saveStoredCatalogSections(currentSections);

    await logAudit({
      userId: user.id,
      action: key ? "UPDATE" : "CREATE",
      entity: "CatalogSection",
      entityId: finalKey,
      newValues: { key: finalKey, label: trimmedLabel },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Seção visual do catálogo salva: "${trimmedLabel}"`,
    });

    return NextResponse.json({
      success: true,
      key: finalKey,
      label: trimmedLabel,
      sections: currentSections,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Chave da seção não informada" }, { status: 400 });
    }

    // Desativa no banco de dados
    try {
      await db.category.updateMany({
        where: { OR: [{ code: key }, { name: key }] },
        data: { isActive: false },
      });
    } catch (dbErr) {
      console.warn("Aviso ao desativar categoria no banco:", dbErr);
    }

    const currentSections = getStoredCatalogSections();
    delete currentSections[key];
    saveStoredCatalogSections(currentSections);

    return NextResponse.json({ success: true, sections: currentSections });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
