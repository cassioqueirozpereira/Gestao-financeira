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
    const mergedSections: Record<string, string> = { ...DEFAULT_CATALOG_SECTIONS, ...fileSections };

    // Limpa chaves antigas com prefixo SECTION_
    for (const [k, v] of Object.entries(mergedSections)) {
      if (k.startsWith("SECTION_")) {
        delete mergedSections[k];
        mergedSections[v] = v;
      }
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
      return NextResponse.json({ success: true, sections: updatedSections });
    }

    // Se ação de adicionar/editar individual
    if (!label || !label.trim()) {
      return NextResponse.json({ error: "O nome da seção visual é obrigatório" }, { status: 400 });
    }

    const trimmedLabel = label.trim();
    // A chave agora é SEMPRE o próprio nome exato criado pelo usuário (sem prefixo SECTION_)
    const finalKey = trimmedLabel;

    // Se estiver editando e a chave anterior for diferente (ou chave antiga com SECTION_)
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

    // Limpa quaisquer chaves residuais com prefixo SECTION_ do dicionário
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
      if (k === key || v === key) {
        delete currentSections[k];
      }
    }

    saveStoredCatalogSections(currentSections);

    return NextResponse.json({ success: true, sections: currentSections });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
