import { ProductCategory } from "@prisma/client";

export interface CatalogItemSeed {
  name: string;
  category: ProductCategory;
  weightGrams?: number;
  volumeMl?: number;
  basePrice: number;
  description: string;
}

export const OFFICIAL_CATALOG_ITEMS: CatalogItemSeed[] = [
  // 14.1. Velas normais e coloridas
  {
    name: "Mini vela lisa — 25 g",
    category: "VELAS_NORMAIS_COLORIDAS",
    weightGrams: 25,
    basePrice: 10.99,
    description: "Mini vela aromática lisa para lembrancinhas ou uso diário.",
  },
  {
    name: "Vela lisa/colorida — 70 g",
    category: "VELAS_NORMAIS_COLORIDAS",
    weightGrams: 70,
    basePrice: 20.99,
    description: "Vela média lisa ou colorida em recipiente de vidro.",
  },
  {
    name: "Vela clássica — 100 g",
    category: "VELAS_NORMAIS_COLORIDAS",
    weightGrams: 100,
    basePrice: 25.99,
    description: "Vela clássica aromática em pote de 100 g.",
  },
  {
    name: "Vela clássica — 150 g",
    category: "VELAS_NORMAIS_COLORIDAS",
    weightGrams: 150,
    basePrice: 33.99,
    description: "Vela clássica grande aromática com longa queima em pote de 150 g.",
  },

  // 14.2. Velas decoradas com flores
  {
    name: "Latinha com 1 rosa",
    category: "VELAS_DECORADAS_FLORES",
    weightGrams: 30,
    basePrice: 12.99,
    description: "Latinha decorativa com 1 rosa de cera artesanal no topo.",
  },
  {
    name: "Latinha com 3 rosas",
    category: "VELAS_DECORADAS_FLORES",
    weightGrams: 30,
    basePrice: 15.99,
    description: "Latinha decorativa com arranjo de 3 rosas de cera no topo.",
  },
  {
    name: "Floral em vidro — 70 g",
    category: "VELAS_DECORADAS_FLORES",
    weightGrams: 70,
    basePrice: 29.99,
    description: "Vela floral aromática em copo de vidro 70 g com rosas de cera.",
  },
  {
    name: "Floral em vidro — 100 g",
    category: "VELAS_DECORADAS_FLORES",
    weightGrams: 100,
    basePrice: 36.99,
    description: "Vela floral aromática em vidro 100 g com acabamento decorativo floral.",
  },
  {
    name: "Floral em vidro — 150 g",
    category: "VELAS_DECORADAS_FLORES",
    weightGrams: 150,
    basePrice: 46.99,
    description: "Vela floral premium em pote de vidro de 150 g decorada.",
  },

  // 14.3. Chantilly e flor
  {
    name: "Chantilly floral — 70 g",
    category: "CHANTILLY_E_FLOR",
    weightGrams: 70,
    basePrice: 36.99,
    description: "Vela com efeito de cera batida estilo chantilly e rosas de cera (70 g).",
  },
  {
    name: "Chantilly premium — 100 g",
    category: "CHANTILLY_E_FLOR",
    weightGrams: 100,
    basePrice: 46.99,
    description: "Vela com cobertura generosa de chantilly de cera e flores artesanais (100 g).",
  },
  {
    name: "Chantilly especial — 150 g",
    category: "CHANTILLY_E_FLOR",
    weightGrams: 150,
    basePrice: 57.99,
    description: "Vela especial tamanho família com textura chantilly e rosas (150 g).",
  },

  // 14.4. Vasos e produtos decorativos
  {
    name: "Canelado simples — ~65 ml",
    category: "VASOS_DECORATIVOS",
    volumeMl: 65,
    basePrice: 31.99,
    description: "Vaso de concreto/gesso canelado com vela aromática simples.",
  },
  {
    name: "Canelado floral — ~65 ml",
    category: "VASOS_DECORATIVOS",
    volumeMl: 65,
    basePrice: 38.99,
    description: "Vaso canelado decorativo com acabamento e flores de cera.",
  },
  {
    name: "Canelado natalino — ~65 ml",
    category: "VASOS_DECORATIVOS",
    volumeMl: 65,
    basePrice: 41.99,
    description: "Vaso canelado temático natalino com elementos festivos e aroma de especiarias.",
  },
  {
    name: "Trançado simples — ~25 g",
    category: "VASOS_DECORATIVOS",
    weightGrams: 25,
    basePrice: 14.99,
    description: "Recipiente com relevo trançado artesanal e mini vela lisa.",
  },
  {
    name: "Trançado floral — ~25 g",
    category: "VASOS_DECORATIVOS",
    weightGrams: 25,
    basePrice: 19.99,
    description: "Recipiente com relevo trançado artesanal decorado com flor de cera.",
  },
  {
    name: "Trançado natalino — ~25 g",
    category: "VASOS_DECORATIVOS",
    weightGrams: 25,
    basePrice: 21.99,
    description: "Recipiente trançado com elementos e paleta natalina.",
  },

  // 14.5. Coleção Natal
  {
    name: "Natal mini — 25 g",
    category: "COLECAO_NATAL",
    weightGrams: 25,
    basePrice: 15.99,
    description: "Mini vela natalina colecionável para presentes e lembrancinhas de final de ano.",
  },
  {
    name: "Natal clássico — 70 g",
    category: "COLECAO_NATAL",
    weightGrams: 70,
    basePrice: 29.99,
    description: "Vela natalina 70 g com aroma especial de pinho, canela e especiarias.",
  },
  {
    name: "Natal especial — 100 g",
    category: "COLECAO_NATAL",
    weightGrams: 100,
    basePrice: 36.99,
    description: "Vela natalina decorada com árvores e laços aromáticos (100 g).",
  },
  {
    name: "Natal premium — 150 g",
    category: "COLECAO_NATAL",
    weightGrams: 150,
    basePrice: 46.99,
    description: "Vela premium de Natal com múltiplos pavios e decorações temáticas (150 g).",
  },

  // 14.6. Árvores de Natal avulsas
  {
    name: "Árvore pequena — 20 g",
    category: "ARVORES_NATAL_AVULSAS",
    weightGrams: 20,
    basePrice: 12.99,
    description: "Vela esculpida em formato de árvore de natal (20 g).",
  },
  {
    name: "Árvore média — 40 g",
    category: "ARVORES_NATAL_AVULSAS",
    weightGrams: 40,
    basePrice: 18.99,
    description: "Vela esculpida em formato de árvore de natal (40 g).",
  },
  {
    name: "Árvore grande — 60 g",
    category: "ARVORES_NATAL_AVULSAS",
    weightGrams: 60,
    basePrice: 25.99,
    description: "Vela de destaque em formato de pinheiro de natal artesanal (60 g).",
  },

  // 14.7. Árvores de Natal dentro do copo
  {
    name: "Árvore no copo — 70 g",
    category: "ARVORES_NATAL_COPO",
    weightGrams: 70,
    basePrice: 36.99,
    description: "Vela em copo de vidro com mini árvore de natal esculpida internamente (70 g).",
  },
  {
    name: "Árvore no copo — 100 g",
    category: "ARVORES_NATAL_COPO",
    weightGrams: 100,
    basePrice: 46.99,
    description: "Vela em copo com árvore de natal e detalhes decorativos em cera (100 g).",
  },
  {
    name: "Árvore no copo — 150 g",
    category: "ARVORES_NATAL_COPO",
    weightGrams: 150,
    basePrice: 57.99,
    description: "Vela em copo grande com árvore de natal central e aroma festivo exclusivo (150 g).",
  },

  // 14.8. Resinas e Peças Decorativas
  {
    name: "Peça Decorativa em Resina Personalizada",
    category: "RESINAS_DIVERSAS",
    basePrice: 35.00,
    description: "Peça personalizada em resina epóxi (chaveiro, pingente, marcador de página ou descanso de copo).",
  },
];
