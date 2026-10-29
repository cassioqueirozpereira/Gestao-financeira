import fs from "fs";
import path from "path";

const SECTIONS_FILE_PATH = path.join(process.cwd(), "src", "data", "catalog-sections.json");

// Seções visuais pré-definidas padrão
export const DEFAULT_CATALOG_SECTIONS: Record<string, string> = {
  VELAS_NORMAIS_COLORIDAS: "Velas Normais e Coloridas",
  VELAS_DECORADAS_FLORES: "Velas Decoradas com Flores",
  CHANTILLY_E_FLOR: "Chantilly e Flor",
  VASOS_DECORATIVOS: "Vasos e Produtos Decorativos",
  COLECAO_NATAL: "Coleção Natal",
  ARVORES_NATAL_AVULSAS: "Árvores de Natal Avulsas",
  ARVORES_NATAL_COPO: "Árvores de Natal Dentro do Copo",
  RESINAS_DIVERSAS: "Resinas e Peças Decorativas",
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
