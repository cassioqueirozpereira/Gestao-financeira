import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  getStoredCatalogSections,
  saveStoredCatalogSections,
} from "@/lib/catalog-sections";

export const dynamic = "force-dynamic";

export async function GET() {
  const sections = getStoredCatalogSections();
  return NextResponse.json({ sections });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { key, label, action, updatedSections } = body;

    const currentSections = getStoredCatalogSections();

    // Se enviado o dicionário completo já atualizado
    if (action === "sync" && updatedSections && typeof updatedSections === "object") {
      saveStoredCatalogSections(updatedSections);
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
    saveStoredCatalogSections(currentSections);

    return NextResponse.json({ success: true, sections: currentSections });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
