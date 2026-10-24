-- ==============================================================================
-- 1. USUÁRIO ADMINISTRADOR COM HASH ARGON2ID OFICIAL
-- ==============================================================================
INSERT INTO "users" ("id", "name", "email", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
VALUES (
    'usr-admin-001',
    'Administrador Geral',
    'admin@cassaratech.com.br',
    '$argon2id$v=19$m=65536,t=3,p=4$DfNXPNA7pHvt7lZ2w5NpSg$MP7ME7W8aLTEYd5hx5rE6FThomh79J45g5iL3uzCfe8',
    'ADMIN',
    true,
    NOW(),
    NOW()
) ON CONFLICT ("email") DO NOTHING;

-- ==============================================================================
-- 2. AS 5 EMPRESAS / UNIDADES DE NEGÓCIO
-- ==============================================================================
INSERT INTO "companies" ("id", "code", "name", "tradeName", "documentNumber", "email", "isPersonal", "createdAt", "updatedAt")
VALUES
    ('comp-cassara', 'CASSARATECH', 'CassaraTech Soluções em Tecnologia', 'CassaraTech', '00.000.000/0001-00', 'contato@cassaratech.com.br', false, NOW(), NOW()),
    ('comp-da-velas', 'DA_VELAS', 'D.A. Com Carinho — Velas Artesanais', 'D.A. Com Carinho Velas', '00.000.000/0001-01', 'velas@dacomcarinho.com.br', false, NOW(), NOW()),
    ('comp-da-resinas', 'DA_RESINAS', 'D.A. Com Carinho — Resinas', 'D.A. Com Carinho Resinas', '00.000.000/0001-02', 'resinas@dacomcarinho.com.br', false, NOW(), NOW()),
    ('comp-midia', 'MIDIA_SOCIAL', 'Operação Mídia Social e Marketing Digital', 'Mídia Social', '00.000.000/0001-03', 'midia@cassaratech.com.br', false, NOW(), NOW()),
    ('comp-casa', 'CASA', 'Controle Residencial e Pessoal', 'Casa', NULL, NULL, true, NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- ==============================================================================
-- 3. OS 5 CENTROS DE CUSTO
-- ==============================================================================
INSERT INTO "cost_centers" ("id", "code", "name", "description", "companyId", "createdAt", "updatedAt")
VALUES
    ('cc-sistemas', 'SISTEMAS', 'Sistemas — CassaraTech', 'Desenvolvimento, hospedagem, implantação e manutenção de tecnologia.', 'comp-cassara', NOW(), NOW()),
    ('cc-velas', 'VELAS', 'Velas — D.A. Com Carinho', 'Matérias-primas, embalagens, produção e comercialização de velas.', 'comp-da-velas', NOW(), NOW()),
    ('cc-resinas', 'RESINAS', 'Resinas — D.A. Com Carinho', 'Resinas, pigmentos, moldes, produção e venda de peças de resina.', 'comp-da-resinas', NOW(), NOW()),
    ('cc-midia', 'MIDIA_SOCIAL', 'Mídia Social', 'Serviços, ferramentas, campanhas e divulgação das redes sociais.', 'comp-midia', NOW(), NOW()),
    ('cc-casa', 'CASA', 'Casa', 'Despesas domésticas e pessoais da residência.', 'comp-casa', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- ==============================================================================
-- 4. PLANO DE CONTAS HIERÁRQUICO
-- ==============================================================================
-- Nível 1
INSERT INTO "chart_of_accounts" ("id", "code", "name", "level", "type", "parentId", "createdAt", "updatedAt")
VALUES
    ('coa-1', '1', 'Receitas', 1, 'RECEITA_OPERACIONAL', NULL, NOW(), NOW()),
    ('coa-2', '2', 'Custos Diretos de Produção e Execução', 1, 'CUSTO_DIRETO', NULL, NOW(), NOW()),
    ('coa-3', '3', 'Despesas Operacionais e Administrativas', 1, 'DESPESA_ADMINISTRATIVA', NULL, NOW(), NOW()),
    ('coa-4', '4', 'Despesas Comerciais e Mídia', 1, 'DESPESA_COMERCIAL_MARKETING', NULL, NOW(), NOW()),
    ('coa-5', '5', 'Obrigações Financeiras e Mútuos', 1, 'OBRIGACAO_FINANCEIRA', NULL, NOW(), NOW()),
    ('coa-6', '6', 'Movimentações Não Operacionais', 1, 'TRANSFERENCIA_INTERNA', NULL, NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- Nível 2
INSERT INTO "chart_of_accounts" ("id", "code", "name", "level", "type", "parentId", "createdAt", "updatedAt")
VALUES
    ('coa-1-1', '1.1', 'Receita com Velas', 2, 'RECEITA_OPERACIONAL', 'coa-1', NOW(), NOW()),
    ('coa-1-2', '1.2', 'Receita com Resinas', 2, 'RECEITA_OPERACIONAL', 'coa-1', NOW(), NOW()),
    ('coa-1-3', '1.3', 'Serviços de Desenvolvimento e Suporte (CassaraTech)', 2, 'RECEITA_OPERACIONAL', 'coa-1', NOW(), NOW()),
    ('coa-1-4', '1.4', 'Gestão e Consultoria de Mídia Social', 2, 'RECEITA_OPERACIONAL', 'coa-1', NOW(), NOW()),
    ('coa-2-1', '2.1', 'Matéria-Prima para Velas (Ceras, Essências, Pavios)', 2, 'CUSTO_DIRETO', 'coa-2', NOW(), NOW()),
    ('coa-2-2', '2.2', 'Matéria-Prima para Resinas (Epóxi, Pigmentos, Moldes)', 2, 'CUSTO_DIRETO', 'coa-2', NOW(), NOW()),
    ('coa-2-3', '2.3', 'Embalagens e Recipientes', 2, 'CUSTO_DIRETO', 'coa-2', NOW(), NOW()),
    ('coa-2-4', '2.4', 'Consumo Operacional (Gás e Energia)', 2, 'CUSTO_DIRETO', 'coa-2', NOW(), NOW()),
    ('coa-3-1', '3.1', 'Hospedagem, Domínios e Infraestrutura Tech', 2, 'DESPESA_ADMINISTRATIVA', 'coa-3', NOW(), NOW()),
    ('coa-3-2', '3.2', 'Ferramentas de Criação e Design (Canva, Adobe, IA)', 2, 'DESPESA_ADMINISTRATIVA', 'coa-3', NOW(), NOW()),
    ('coa-3-3', '3.3', 'Despesas Domésticas da Casa (Luz, Água, Mercado)', 2, 'DESPESA_ADMINISTRATIVA', 'coa-3', NOW(), NOW()),
    ('coa-3-4', '3.4', 'Tarifas Bancárias e de Cartão', 2, 'DESPESA_ADMINISTRATIVA', 'coa-3', NOW(), NOW()),
    ('coa-4-1', '4.1', 'Tráfego Pago Meta Ads (Facebook/Instagram)', 2, 'DESPESA_COMERCIAL_MARKETING', 'coa-4', NOW(), NOW()),
    ('coa-4-2', '4.2', 'Tráfego Pago Google Ads / TikTok', 2, 'DESPESA_COMERCIAL_MARKETING', 'coa-4', NOW(), NOW()),
    ('coa-4-3', '4.3', 'Comissões de Vendas e Parceiros', 2, 'DESPESA_COMERCIAL_MARKETING', 'coa-4', NOW(), NOW()),
    ('coa-5-1', '5.1', 'Amortização de Empréstimos e Financiamentos', 2, 'OBRIGACAO_FINANCEIRA', 'coa-5', NOW(), NOW()),
    ('coa-6-1', '6.1', 'Transferência entre Contas Próprias', 2, 'TRANSFERENCIA_INTERNA', 'coa-6', NOW(), NOW()),
    ('coa-6-2', '6.2', 'Aporte de Capital dos Sócios', 2, 'APORTE_CAPITAL', 'coa-6', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- ==============================================================================
-- 5. RECUPERAÇÃO DE CAPITAL INICIAL D.A. COM CARINHO (R$ 1.600,00)
-- ==============================================================================
INSERT INTO "capital_recoveries" ("id", "initialCapital", "additionalAports", "recoveredAmount", "notes", "createdAt", "updatedAt")
VALUES (
    'cap-rec-001',
    1600.00,
    0.00,
    0.00,
    'Capital inicial informado para a D.A. Com Carinho (R$ 1.600,00).',
    NOW(),
    NOW()
) ON CONFLICT ("id") DO NOTHING;

-- ==============================================================================
-- 6. OS 29 PRODUTOS DO CATÁLOGO OFICIAL D.A. COM CARINHO
-- ==============================================================================
INSERT INTO "products" ("id", "name", "category", "weightGrams", "volumeMl", "basePrice", "stockQuantity", "minStockQuantity", "createdAt", "updatedAt")
VALUES
    ('prod-01', 'Mini vela lisa — 25 g', 'VELAS_NORMAIS_COLORIDAS', 25, NULL, 10.99, 10, 5, NOW(), NOW()),
    ('prod-02', 'Vela lisa/colorida — 70 g', 'VELAS_NORMAIS_COLORIDAS', 70, NULL, 20.99, 8, 4, NOW(), NOW()),
    ('prod-03', 'Vela clássica — 100 g', 'VELAS_NORMAIS_COLORIDAS', 100, NULL, 25.99, 6, 3, NOW(), NOW()),
    ('prod-04', 'Vela clássica — 150 g', 'VELAS_NORMAIS_COLORIDAS', 150, NULL, 33.99, 5, 2, NOW(), NOW()),
    ('prod-05', 'Latinha com 1 rosa', 'VELAS_DECORADAS_FLORES', 30, NULL, 12.99, 12, 5, NOW(), NOW()),
    ('prod-06', 'Latinha com 3 rosas', 'VELAS_DECORADAS_FLORES', 30, NULL, 15.99, 10, 5, NOW(), NOW()),
    ('prod-07', 'Floral em vidro — 70 g', 'VELAS_DECORADAS_FLORES', 70, NULL, 29.99, 7, 3, NOW(), NOW()),
    ('prod-08', 'Floral em vidro — 100 g', 'VELAS_DECORADAS_FLORES', 100, NULL, 36.99, 5, 2, NOW(), NOW()),
    ('prod-09', 'Floral em vidro — 150 g', 'VELAS_DECORADAS_FLORES', 150, NULL, 46.99, 4, 2, NOW(), NOW()),
    ('prod-10', 'Chantilly floral — 70 g', 'CHANTILLY_E_FLOR', 70, NULL, 36.99, 6, 3, NOW(), NOW()),
    ('prod-11', 'Chantilly premium — 100 g', 'CHANTILLY_E_FLOR', 100, NULL, 46.99, 5, 2, NOW(), NOW()),
    ('prod-12', 'Chantilly especial — 150 g', 'CHANTILLY_E_FLOR', 150, NULL, 57.99, 3, 2, NOW(), NOW()),
    ('prod-13', 'Canelado simples — aproximadamente 65 ml', 'VASOS_DECORATIVOS', NULL, 65, 31.99, 8, 3, NOW(), NOW()),
    ('prod-14', 'Canelado floral — aproximadamente 65 ml', 'VASOS_DECORATIVOS', NULL, 65, 38.99, 6, 3, NOW(), NOW()),
    ('prod-15', 'Canelado natalino — aproximadamente 65 ml', 'VASOS_DECORATIVOS', NULL, 65, 41.99, 5, 2, NOW(), NOW()),
    ('prod-16', 'Trançado simples — aproximadamente 25 g', 'VASOS_DECORATIVOS', 25, NULL, 14.99, 10, 4, NOW(), NOW()),
    ('prod-17', 'Trançado floral — aproximadamente 25 g', 'VASOS_DECORATIVOS', 25, NULL, 19.99, 8, 4, NOW(), NOW()),
    ('prod-18', 'Trançado natalino — aproximadamente 25 g', 'VASOS_DECORATIVOS', 25, NULL, 21.99, 7, 3, NOW(), NOW()),
    ('prod-19', 'Natal mini — 25 g', 'COLECAO_NATAL', 25, NULL, 15.99, 15, 5, NOW(), NOW()),
    ('prod-20', 'Natal clássico — 70 g', 'COLECAO_NATAL', 70, NULL, 29.99, 10, 4, NOW(), NOW()),
    ('prod-21', 'Natal especial — 100 g', 'COLECAO_NATAL', 100, NULL, 36.99, 8, 3, NOW(), NOW()),
    ('prod-22', 'Natal premium — 150 g', 'COLECAO_NATAL', 150, NULL, 46.99, 6, 2, NOW(), NOW()),
    ('prod-23', 'Árvore pequena — 20 g', 'ARVORES_NATAL_AVULSAS', 20, NULL, 12.99, 12, 4, NOW(), NOW()),
    ('prod-24', 'Árvore média — 40 g', 'ARVORES_NATAL_AVULSAS', 40, NULL, 18.99, 10, 4, NOW(), NOW()),
    ('prod-25', 'Árvore grande — 60 g', 'ARVORES_NATAL_AVULSAS', 60, NULL, 25.99, 8, 3, NOW(), NOW()),
    ('prod-26', 'Árvore no copo — 70 g', 'ARVORES_NATAL_COPO', 70, NULL, 36.99, 7, 3, NOW(), NOW()),
    ('prod-27', 'Árvore no copo — 100 g', 'ARVORES_NATAL_COPO', 100, NULL, 46.99, 5, 2, NOW(), NOW()),
    ('prod-28', 'Árvore no copo — 150 g', 'ARVORES_NATAL_COPO', 150, NULL, 57.99, 4, 2, NOW(), NOW()),
    ('prod-29', 'Peça Decorativa em Resina Personalizada', 'RESINAS_DIVERSAS', NULL, NULL, 35.00, 10, 3, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- ==============================================================================
-- 7. METAS INICIAIS DE DESEMPENHO
-- ==============================================================================
INSERT INTO "performance_goals" ("id", "title", "costCenterId", "period", "direction", "unit", "targetValue", "currentValue", "startDate", "endDate", "responsibleName", "status", "createdAt", "updatedAt")
VALUES
    ('goal-001', 'Faturamento Mensal D.A. Velas (R$ 5.000)', 'cc-velas', 'MENSAL', 'AUMENTO', 'BRL', 5000.00, 1850.00, '2026-10-01', '2026-10-31', 'Operação Velas', 'EM_ANDAMENTO', NOW(), NOW()),
    ('goal-002', 'Limite de Gastos Operacionais com Mídia (R$ 800)', 'cc-sistemas', 'MENSAL', 'REDUCAO', 'BRL', 800.00, 450.00, '2026-10-01', '2026-10-31', 'Gestão Financeira', 'EM_ANDAMENTO', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- ==============================================================================
-- 8. REGRA DE COMISSÃO PADRÃO
-- ==============================================================================
INSERT INTO "commission_rules" ("id", "name", "beneficiary", "costCenterId", "baseType", "percentage", "triggerEvent", "paymentTerms", "isActive", "createdAt", "updatedAt")
VALUES (
    'comm-rule-001',
    'Comissão Parceiros Afiliados 10%',
    'Parceiro Indicador Geral',
    'cc-velas',
    'VALOR_BRUTO',
    10.00,
    'RECEBIMENTO_EFETIVO',
    'Pagamento até o 5º dia útil após confirmação de recebimento.',
    true,
    NOW(),
    NOW()
) ON CONFLICT ("id") DO NOTHING;
