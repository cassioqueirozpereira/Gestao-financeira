-- ==============================================================================
-- CASSARATECH ERP - SCRIPT DE CORREÇÃO E ATUALIZAÇÃO DE CAMPOS (SUPABASE)
-- Execute este script no SQL Editor do Supabase para corrigir o erro 'Digest' de login
-- ==============================================================================

-- 1. Clientes (Customers)
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT DEFAULT 'PIX';
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "monthlyFee" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "billingDay" INTEGER DEFAULT 10;

-- 2. Contas a Pagar (Accounts Payable)
ALTER TABLE "accounts_payable" ADD COLUMN IF NOT EXISTS "paymentType" TEXT DEFAULT 'BOLETO';
ALTER TABLE "accounts_payable" ADD COLUMN IF NOT EXISTS "scheduledDate" TIMESTAMPTZ;
ALTER TABLE "accounts_payable" ADD COLUMN IF NOT EXISTS "isFixed" BOOLEAN DEFAULT FALSE;

-- 3. Contas a Receber (Accounts Receivable)
ALTER TABLE "accounts_receivable" ADD COLUMN IF NOT EXISTS "paymentType" TEXT DEFAULT 'PIX';

-- 4. Contratos (Contracts)
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT DEFAULT 'BOLETO';
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "billingDay" INTEGER DEFAULT 10;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "installationFee" DECIMAL(12,2) DEFAULT 0;

-- 5. Comissões (Commission Records)
ALTER TABLE "commission_records" ADD COLUMN IF NOT EXISTS "baseType" TEXT DEFAULT 'TOTAL';

-- 6. Produtos & Catálogo (Products)
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "desiredMargin" DECIMAL(5,2) DEFAULT 30;

-- ==============================================================================
-- Compatibilidade caso tenham sido criados no formato snake_case unquoted
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='accounts_payable' AND column_name='payment_type') THEN
    UPDATE "accounts_payable" SET "paymentType" = payment_type WHERE "paymentType" IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='accounts_receivable' AND column_name='payment_type') THEN
    UPDATE "accounts_receivable" SET "paymentType" = payment_type WHERE "paymentType" IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='desired_margin') THEN
    UPDATE "products" SET "desiredMargin" = desired_margin WHERE "desiredMargin" IS NULL;
  END IF;
END $$;
