import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import {
  getStoredCatalogSections,
  saveStoredCatalogSections,
} from "@/lib/catalog-sections";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Busca todas as categorias distintas atualmente salvas nos produtos no banco de dados
    const products = await db.product.findMany({
      select: { category: true },
      distinct: ["category"],
    });

    const activeSections: Record<string, string> = {};
    for (const p of products) {
      if (p.category && !p.category.startsWith("SECTION_")) {
        activeSections[p.category] = p.category;
      }
    }

    // 2. Mescla com seções customizadas criadas pelo usuário (se houver)
    const fileSections = getStoredCatalogSections();
    for (const [k, v] of Object.entries(fileSections)) {
      if (!k.startsWith("SECTION_")) {
        activeSections[k] = v;
      }
    }

    return NextResponse.json({ sections: activeSections });
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
      return NextResponse.json({ success: true, sections: updatedSections });
    }

    // Se ação de adicionar/editar individual
    if (!label || !label.trim()) {
      return NextResponse.json({ error: "O nome da seção visual é obrigatório" }, { status: 400 });
    }

    const trimmedLabel = label.trim();
    const finalKey = trimmedLabel;

    // Se estiver editando e a chave anterior for diferente
    if (key && key !== finalKey) {
      try {
        await db.product.updateMany({
          where: { category: key },
          data: { category: finalKey },
        });
      } catch (e) {
        console.warn("Aviso ao atualizar produtos para novo nome:", e);
      }
      delete currentSections[key];
    }

    // Limpa quaisquer chaves residuais com prefixo SECTION_
    for (const [k, v] of Object.entries(currentSections)) {
      if (k.startsWith("SECTION_")) {
        delete currentSections[k];
        currentSections[v] = v;
      }
    }

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

    const currentSections = getStoredCatalogSections();
    delete currentSections[key];

    // Remove também chaves com prefixo SECTION_ correspondentes se houver
    for (const [k, v] of Object.entries(currentSections)) {
      if (k === key || v === key || k.startsWith("SECTION_")) {
        delete currentSections[k];
      }
    }

    saveStoredCatalogSections(currentSections);

    await logAudit({
      userId: user.id,
      action: "DELETE",
      entity: "CatalogSection",
      entityId: key,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Seção visual do catálogo excluída: "${key}"`,
    });

    return NextResponse.json({ success: true, sections: currentSections });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
