-- ==============================================================================
-- D.A. COM CARINHO & CASSARATECH ERP
-- SCRIPT DE MIGRAÇÃO: CENTRO DE CUSTO E PLANO DE CONTAS NO ESTOQUE INTEGRADO
-- Execute este script no SQL Editor do Supabase se desejar habilitar a persistência
-- das relações de Centro de Custo e Categoria/Plano de Contas em Matérias-Primas e Embalagens.
-- ==============================================================================

-- 1. Matérias-Primas (raw_materials)
ALTER TABLE "raw_materials" ADD COLUMN IF NOT EXISTS "costCenterId" TEXT REFERENCES "cost_centers"("id") ON DELETE SET NULL;
ALTER TABLE "raw_materials" ADD COLUMN IF NOT EXISTS "chartOfAccountId" TEXT REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL;

-- 2. Embalagens (packagings)
ALTER TABLE "packagings" ADD COLUMN IF NOT EXISTS "costCenterId" TEXT REFERENCES "cost_centers"("id") ON DELETE SET NULL;
ALTER TABLE "packagings" ADD COLUMN IF NOT EXISTS "chartOfAccountId" TEXT REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL;

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS "idx_raw_materials_cost_center" ON "raw_materials"("costCenterId");
CREATE INDEX IF NOT EXISTS "idx_raw_materials_chart_account" ON "raw_materials"("chartOfAccountId");
CREATE INDEX IF NOT EXISTS "idx_packagings_cost_center" ON "packagings"("costCenterId");
CREATE INDEX IF NOT EXISTS "idx_packagings_chart_account" ON "packagings"("chartOfAccountId");
