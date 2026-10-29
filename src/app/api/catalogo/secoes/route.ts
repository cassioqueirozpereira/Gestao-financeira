import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import fs from "fs";
import path from "path";

const SECTIONS_FILE_PATH = path.join(process.cwd(), "src", "data", "catalog-sections.json");

// Seções visuais pré-definidas padrão
export const DEFAULT_CATALOG_SECTIONS: Record<string, string> = {
  VELAS_NORMAIS_COLORIDAS: "14.1. Velas Normais e Coloridas",
  VELAS_DECORADAS_FLORES: "14.2. Velas Decoradas com Flores",
  CHANTILLY_E_FLOR: "14.3. Chantilly e Flor",
  VASOS_DECORATIVOS: "14.4. Vasos e Produtos Decorativos",
  COLECAO_NATAL: "14.5. Coleção Natal",
  ARVORES_NATAL_AVULSAS: "14.6. Árvores de Natal Avulsas",
  ARVORES_NATAL_COPO: "14.7. Árvores de Natal Dentro do Copo",
  RESINAS_DIVERSAS: "14.8. Resinas e Peças Decorativas",
};

export function getStoredCatalogSections(): Record<string, string> {
  try {
    if (fs.existsSync(SECTIONS_FILE_PATH)) {
      const data = fs.readFileSync(SECTIONS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      return { ...DEFAULT_CATALOG_SECTIONS, ...parsed };
    }
  } catch (err) {
    console.error("Erro ao ler catalog-sections.json:", err);
  }
  return { ...DEFAULT_CATALOG_SECTIONS };
}

export function saveStoredCatalogSections(sections: Record<string, string>) {
  try {
    const dir = path.dirname(SECTIONS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SECTIONS_FILE_PATH, JSON.stringify(sections, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar catalog-sections.json:", err);
  }
}

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
