import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const prisma = new PrismaClient();

const ARGON2_CONFIG = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

async function main() {
  console.log("🌱 Iniciando sementeira (seed) completa do Sistema de Gestão Empresarial...");

  // 1. Criar Usuário Administrador padrão com Argon2id
  const adminPasswordHash = await hash("Admin@123456", ARGON2_CONFIG);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@cassaratech.com.br" },
    update: {},
    create: {
      name: "Administrador Geral",
      email: "admin@cassaratech.com.br",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log(`✅ Usuário administrador: ${adminUser.email}`);

  // 2. Criar as 5 Empresas / Unidades de Negócio
  const companies = [
    {
      code: "CASSARATECH",
      name: "CassaraTech Soluções em Tecnologia",
      tradeName: "CassaraTech",
      documentNumber: "00.000.000/0001-00",
      email: "contato@cassaratech.com.br",
      isPersonal: false,
    },
    {
      code: "DA_VELAS",
      name: "D.A. Com Carinho — Velas Artesanais",
      tradeName: "D.A. Com Carinho Velas",
      documentNumber: "00.000.000/0001-01",
      email: "velas@dacomcarinho.com.br",
      isPersonal: false,
    },
    {
      code: "DA_RESINAS",
      name: "D.A. Com Carinho — Resinas",
      tradeName: "D.A. Com Carinho Resinas",
      documentNumber: "00.000.000/0001-02",
      email: "resinas@dacomcarinho.com.br",
      isPersonal: false,
    },
    {
      code: "MIDIA_SOCIAL",
      name: "Operação Mídia Social e Marketing Digital",
      tradeName: "Mídia Social",
      documentNumber: "00.000.000/0001-03",
      email: "midia@cassaratech.com.br",
      isPersonal: false,
    },
    {
      code: "CASA",
      name: "Controle Residencial e Doméstico",
      tradeName: "Casa",
      documentNumber: null,
      email: null,
      isPersonal: true,
    },
  ];

  const createdCompanies = {};
  for (const comp of companies) {
    const c = await prisma.company.upsert({
      where: { code: comp.code },
      update: comp,
      create: comp,
    });
    createdCompanies[comp.code] = c;
  }
  console.log("✅ 5 Unidades de Negócio cadastradas.");

  // 3. Criar os 5 Centros de Custo
  const costCenters = [
    {
      code: "SISTEMAS",
      name: "Sistemas — CassaraTech",
      description: "Desenvolvimento, hospedagem, implantação e manutenção de tecnologia.",
      companyId: createdCompanies["CASSARATECH"].id,
    },
    {
      code: "VELAS",
      name: "Velas — D.A. Com Carinho",
      description: "Matérias-primas, embalagens, produção e comercialização de velas.",
      companyId: createdCompanies["DA_VELAS"].id,
    },
    {
      code: "RESINAS",
      name: "Resinas — D.A. Com Carinho",
      description: "Resinas, pigmentos, moldes, produção e venda de peças de resina.",
      companyId: createdCompanies["DA_RESINAS"].id,
    },
    {
      code: "MIDIA_SOCIAL",
      name: "Mídia Social",
      description: "Serviços, ferramentas, campanhas e divulgação das redes sociais.",
      companyId: createdCompanies["MIDIA_SOCIAL"].id,
    },
    {
      code: "CASA",
      name: "Casa",
      description: "Despesas domésticas e pessoais da residência.",
      companyId: createdCompanies["CASA"].id,
    },
  ];

  const createdCostCenters = {};
  for (const cc of costCenters) {
    const c = await prisma.costCenter.upsert({
      where: { code: cc.code },
      update: cc,
      create: cc,
    });
    createdCostCenters[cc.code] = c;
  }
  console.log("✅ 5 Centros de Custo vinculados.");

  // 4. Plano de Contas Hierárquico Padrão
  const accounts = [
    { code: "1", name: "Receitas", level: 1, type: "RECEITA_OPERACIONAL" },
    { code: "1.1", name: "Receita com Velas", level: 2, type: "RECEITA_OPERACIONAL", parentCode: "1" },
    { code: "1.2", name: "Receita com Resinas", level: 2, type: "RECEITA_OPERACIONAL", parentCode: "1" },
    { code: "1.3", name: "Serviços de Desenvolvimento e Suporte (CassaraTech)", level: 2, type: "RECEITA_OPERACIONAL", parentCode: "1" },
    { code: "1.4", name: "Gestão e Consultoria de Mídia Social", level: 2, type: "RECEITA_OPERACIONAL", parentCode: "1" },

    { code: "2", name: "Custos Diretos de Produção e Execução", level: 1, type: "CUSTO_DIRETO" },
    { code: "2.1", name: "Matéria-Prima para Velas (Ceras, Essências, Pavios)", level: 2, type: "CUSTO_DIRETO", parentCode: "2" },
    { code: "2.2", name: "Matéria-Prima para Resinas (Epóxi, Pigmentos, Moldes)", level: 2, type: "CUSTO_DIRETO", parentCode: "2" },
    { code: "2.3", name: "Embalagens e Recipientes", level: 2, type: "CUSTO_DIRETO", parentCode: "2" },
    { code: "2.4", name: "Consumo Operacional (Gás e Energia)", level: 2, type: "CUSTO_DIRETO", parentCode: "2" },

    { code: "3", name: "Despesas Operacionais e Administrativas", level: 1, type: "DESPESA_ADMINISTRATIVA" },
    { code: "3.1", name: "Hospedagem, Domínios e Infraestrutura Tech", level: 2, type: "DESPESA_ADMINISTRATIVA", parentCode: "3" },
    { code: "3.2", name: "Ferramentas de Criação e Design (Canva, Adobe, IA)", level: 2, type: "DESPESA_ADMINISTRATIVA", parentCode: "3" },
    { code: "3.3", name: "Despesas Domésticas da Casa (Luz, Água, Mercado)", level: 2, type: "DESPESA_ADMINISTRATIVA", parentCode: "3" },
    { code: "3.4", name: "Tarifas Bancárias e de Cartão", level: 2, type: "DESPESA_ADMINISTRATIVA", parentCode: "3" },

    { code: "4", name: "Despesas Comerciais e Mídia", level: 1, type: "DESPESA_COMERCIAL_MARKETING" },
    { code: "4.1", name: "Tráfego Pago Meta Ads (Facebook/Instagram)", level: 2, type: "DESPESA_COMERCIAL_MARKETING", parentCode: "4" },
    { code: "4.2", name: "Tráfego Pago Google Ads / TikTok", level: 2, type: "DESPESA_COMERCIAL_MARKETING", parentCode: "4" },
    { code: "4.3", name: "Comissões de Vendas e Parceiros", level: 2, type: "DESPESA_COMERCIAL_MARKETING", parentCode: "4" },

    { code: "5", name: "Obrigações Financeiras e Mútuos", level: 1, type: "OBRIGACAO_FINANCEIRA" },
    { code: "5.1", name: "Amortização de Empréstimos e Financiamentos", level: 2, type: "OBRIGACAO_FINANCEIRA", parentCode: "5" },
    { code: "5.2", name: "Mútuo de Sócios", level: 2, type: "OBRIGACAO_FINANCEIRA", parentCode: "5" },

    { code: "6", name: "Movimentações Não Operacionais", level: 1, type: "TRANSFERENCIA_INTERNA" },
    { code: "6.1", name: "Transferência entre Contas Próprias", level: 2, type: "TRANSFERENCIA_INTERNA", parentCode: "6" },
    { code: "6.2", name: "Aporte de Capital dos Sócios", level: 2, type: "APORTE_CAPITAL", parentCode: "6" },
  ];

  const createdAccounts = {};
  for (const acc of accounts) {
    const parentId = acc.parentCode ? createdAccounts[acc.parentCode]?.id : null;
    const a = await prisma.chartOfAccount.upsert({
      where: { code: acc.code },
      update: { name: acc.name, level: acc.level, type: acc.type, parentId },
      create: { code: acc.code, name: acc.name, level: acc.level, type: acc.type, parentId },
    });
    createdAccounts[acc.code] = a;
  }
  console.log("✅ Plano de contas hierárquico estruturado.");

  // 5. Catálogo Oficial D.A. Com Carinho (29 modelos)
  const catalog = [
    { name: "Mini vela lisa — 25 g", category: "VELAS_NORMAIS_COLORIDAS", weightGrams: 25, basePrice: 10.99 },
    { name: "Vela lisa/colorida — 70 g", category: "VELAS_NORMAIS_COLORIDAS", weightGrams: 70, basePrice: 20.99 },
    { name: "Vela clássica — 100 g", category: "VELAS_NORMAIS_COLORIDAS", weightGrams: 100, basePrice: 25.99 },
    { name: "Vela clássica — 150 g", category: "VELAS_NORMAIS_COLORIDAS", weightGrams: 150, basePrice: 33.99 },
    { name: "Latinha com 1 rosa", category: "VELAS_DECORADAS_FLORES", weightGrams: 30, basePrice: 12.99 },
    { name: "Latinha com 3 rosas", category: "VELAS_DECORADAS_FLORES", weightGrams: 30, basePrice: 15.99 },
    { name: "Floral em vidro — 70 g", category: "VELAS_DECORADAS_FLORES", weightGrams: 70, basePrice: 29.99 },
    { name: "Floral em vidro — 100 g", category: "VELAS_DECORADAS_FLORES", weightGrams: 100, basePrice: 36.99 },
    { name: "Floral em vidro — 150 g", category: "VELAS_DECORADAS_FLORES", weightGrams: 150, basePrice: 46.99 },
    { name: "Chantilly floral — 70 g", category: "CHANTILLY_E_FLOR", weightGrams: 70, basePrice: 36.99 },
    { name: "Chantilly premium — 100 g", category: "CHANTILLY_E_FLOR", weightGrams: 100, basePrice: 46.99 },
    { name: "Chantilly especial — 150 g", category: "CHANTILLY_E_FLOR", weightGrams: 150, basePrice: 57.99 },
    { name: "Canelado simples — aproximadamente 65 ml", category: "VASOS_DECORATIVOS", volumeMl: 65, basePrice: 31.99 },
    { name: "Canelado floral — aproximadamente 65 ml", category: "VASOS_DECORATIVOS", volumeMl: 65, basePrice: 38.99 },
    { name: "Canelado natalino — aproximadamente 65 ml", category: "VASOS_DECORATIVOS", volumeMl: 65, basePrice: 41.99 },
    { name: "Trançado simples — aproximadamente 25 g", category: "VASOS_DECORATIVOS", weightGrams: 25, basePrice: 14.99 },
    { name: "Trançado floral — aproximadamente 25 g", category: "VASOS_DECORATIVOS", weightGrams: 25, basePrice: 19.99 },
    { name: "Trançado natalino — aproximadamente 25 g", category: "VASOS_DECORATIVOS", weightGrams: 25, basePrice: 21.99 },
    { name: "Natal mini — 25 g", category: "COLECAO_NATAL", weightGrams: 25, basePrice: 15.99 },
    { name: "Natal clássico — 70 g", category: "COLECAO_NATAL", weightGrams: 70, basePrice: 29.99 },
    { name: "Natal especial — 100 g", category: "COLECAO_NATAL", weightGrams: 100, basePrice: 36.99 },
    { name: "Natal premium — 150 g", category: "COLECAO_NATAL", weightGrams: 150, basePrice: 46.99 },
    { name: "Árvore pequena — 20 g", category: "ARVORES_NATAL_AVULSAS", weightGrams: 20, basePrice: 12.99 },
    { name: "Árvore média — 40 g", category: "ARVORES_NATAL_AVULSAS", weightGrams: 40, basePrice: 18.99 },
    { name: "Árvore grande — 60 g", category: "ARVORES_NATAL_AVULSAS", weightGrams: 60, basePrice: 25.99 },
    { name: "Árvore no copo — 70 g", category: "ARVORES_NATAL_COPO", weightGrams: 70, basePrice: 36.99 },
    { name: "Árvore no copo — 100 g", category: "ARVORES_NATAL_COPO", weightGrams: 100, basePrice: 46.99 },
    { name: "Árvore no copo — 150 g", category: "ARVORES_NATAL_COPO", weightGrams: 150, basePrice: 57.99 },
    { name: "Peça Decorativa em Resina Personalizada", category: "RESINAS_DIVERSAS", basePrice: 35.00 },
  ];

  for (const item of catalog) {
    const existing = await prisma.product.findFirst({ where: { name: item.name } });
    if (!existing) {
      await prisma.product.create({ data: item });
    }
  }
  console.log(`✅ ${catalog.length} produtos do catálogo oficial cadastrados.`);

  // 6. Criar Metas Iniciais
  const velasCenterId = createdCostCenters["VELAS"].id;
  const sistemasCenterId = createdCostCenters["SISTEMAS"].id;

  const initialGoals = [
    {
      title: "Faturamento Mensal D.A. Velas (R$ 5.000)",
      costCenterId: velasCenterId,
      period: "MENSAL",
      direction: "AUMENTO",
      unit: "BRL",
      targetValue: 5000.0,
      currentValue: 1850.0,
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-10-31"),
      responsibleName: "Operação Velas",
      status: "EM_ANDAMENTO",
    },
    {
      title: "Limite de Gastos Operacionais com Mídia (R$ 800)",
      costCenterId: sistemasCenterId,
      period: "MENSAL",
      direction: "REDUCAO",
      unit: "BRL",
      targetValue: 800.0,
      currentValue: 450.0,
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-10-31"),
      responsibleName: "Gestão Financeira",
      status: "EM_ANDAMENTO",
    },
  ];

  for (const g of initialGoals) {
    const existing = await prisma.performanceGoal.findFirst({ where: { title: g.title } });
    if (!existing) {
      await prisma.performanceGoal.create({ data: g });
    }
  }
  console.log("✅ Metas de desempenho iniciais cadastradas.");

  // 7. Criar Regra de Comissão Padrão
  const existingRule = await prisma.commissionRule.findFirst({ where: { name: "Comissão Parceiros Afiliados 10%" } });
  if (!existingRule) {
    await prisma.commissionRule.create({
      data: {
        name: "Comissão Parceiros Afiliados 10%",
        beneficiary: "Parceiro Indicador Geral",
        costCenterId: velasCenterId,
        baseType: "VALOR_BRUTO",
        percentage: 10.0,
        triggerEvent: "RECEBIMENTO_EFETIVO",
        paymentTerms: "Pagamento até o 5º dia útil após confirmação de recebimento.",
        isActive: true,
      },
    });
    console.log("✅ Regra de comissão padrão criada.");
  }

  console.log("🚀 Sementeira completa concluída com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
