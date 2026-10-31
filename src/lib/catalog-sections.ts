import fs from "fs";
import path from "path";

const SECTIONS_FILE_PATH = path.join(process.cwd(), "src", "data", "catalog-sections.json");

// Seções padrão vazias: o catálogo carrega exclusivamente as seções reais salvas no banco de dados
export const DEFAULT_CATALOG_SECTIONS: Record<string, string> = {};

export function getStoredCatalogSections(): Record<string, string> {
  try {
    if (fs.existsSync(SECTIONS_FILE_PATH)) {
      const data = fs.readFileSync(SECTIONS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      if (typeof parsed === "object" && parsed !== null) {
        // Filtra para nunca reinjetar seções técnicas antigas ou excluídas
        const filtered: Record<string, string> = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (!k.startsWith("SECTION_")) {
            filtered[k] = String(v);
          }
        }
        return filtered;
      }
    }
  } catch (err) {
    console.error("Erro ao ler catalog-sections.json:", err);
  }
  return {};
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
