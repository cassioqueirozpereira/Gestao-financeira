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

-- 7. Plano de Contas (Chart of Accounts)
ALTER TABLE "chart_of_accounts" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT TRUE;

-- 8. Fornecedores (Suppliers)
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "tradeName" TEXT;
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT TRUE;

-- 10. Matérias-Primas (Raw Materials)
ALTER TABLE "raw_materials" ADD COLUMN IF NOT EXISTS "code" TEXT UNIQUE;
ALTER TABLE "raw_materials" ADD COLUMN IF NOT EXISTS "supplierId" TEXT REFERENCES "suppliers"("id") ON DELETE SET NULL;
ALTER TABLE "raw_materials" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "raw_materials" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT TRUE;

-- 11. Embalagens (Packagings)
CREATE TABLE IF NOT EXISTS "packagings" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT UNIQUE,
  "name" TEXT NOT NULL,
  "unit" TEXT DEFAULT 'UN',
  "currentStock" INTEGER DEFAULT 0,
  "minStock" INTEGER DEFAULT 10,
  "unitCost" DECIMAL(12,2) DEFAULT 0,
  "supplierId" TEXT REFERENCES "suppliers"("id") ON DELETE SET NULL,
  "notes" TEXT,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Fichas Técnicas: Embalagens e Rendimento
ALTER TABLE "technical_sheets" ADD COLUMN IF NOT EXISTS "expectedYield" INTEGER DEFAULT 1;

CREATE TABLE IF NOT EXISTS "technical_sheet_packagings" (
  "id" TEXT PRIMARY KEY,
  "technicalSheetId" TEXT NOT NULL REFERENCES "technical_sheets"("id") ON DELETE CASCADE,
  "packagingId" TEXT NOT NULL REFERENCES "packagings"("id"),
  "quantity" INTEGER DEFAULT 1,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Ordem de Produção com Consumo Real
ALTER TABLE "production_orders" ADD COLUMN IF NOT EXISTS "productId" TEXT REFERENCES "products"("id") ON DELETE SET NULL;
ALTER TABLE "production_orders" ADD COLUMN IF NOT EXISTS "quantityProduced" INTEGER DEFAULT 1;
ALTER TABLE "production_orders" ADD COLUMN IF NOT EXISTS "packagingCost" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "production_orders" ADD COLUMN IF NOT EXISTS "unitCost" DECIMAL(12,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS "production_ingredient_consumptions" (
  "id" TEXT PRIMARY KEY,
  "productionOrderId" TEXT NOT NULL REFERENCES "production_orders"("id") ON DELETE CASCADE,
  "rawMaterialId" TEXT NOT NULL REFERENCES "raw_materials"("id"),
  "quantityUsed" DECIMAL(12,4) NOT NULL,
  "unit" TEXT NOT NULL,
  "unitCost" DECIMAL(12,2) DEFAULT 0,
  "totalCost" DECIMAL(12,2) DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "production_packaging_consumptions" (
  "id" TEXT PRIMARY KEY,
  "productionOrderId" TEXT NOT NULL REFERENCES "production_orders"("id") ON DELETE CASCADE,
  "packagingId" TEXT NOT NULL REFERENCES "packagings"("id"),
  "quantityUsed" INTEGER NOT NULL,
  "unitCost" DECIMAL(12,2) DEFAULT 0,
  "totalCost" DECIMAL(12,2) DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Movimentações de Estoque Centralizadas
CREATE TABLE IF NOT EXISTS "stock_movements" (
  "id" TEXT PRIMARY KEY,
  "date" TIMESTAMPTZ DEFAULT NOW(),
  "itemType" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "movementType" TEXT NOT NULL,
  "quantity" DECIMAL(12,4) NOT NULL,
  "unit" TEXT NOT NULL,
  "unitCost" DECIMAL(12,2) DEFAULT 0,
  "totalCost" DECIMAL(12,2) DEFAULT 0,
  "origin" TEXT NOT NULL,
  "documentReference" TEXT,
  "notes" TEXT,
  "userId" TEXT,
  "batchNumber" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Compras e Itens de Compra
CREATE TABLE IF NOT EXISTS "purchases" (
  "id" TEXT PRIMARY KEY,
  "purchaseNumber" TEXT UNIQUE NOT NULL,
  "supplierId" TEXT NOT NULL REFERENCES "suppliers"("id"),
  "orderDate" TIMESTAMPTZ DEFAULT NOW(),
  "deliveryDate" TIMESTAMPTZ,
  "status" TEXT DEFAULT 'PENDENTE_ENTREGA',
  "totalAmount" DECIMAL(12,2) NOT NULL,
  "freightAmount" DECIMAL(12,2) DEFAULT 0,
  "invoiceNumber" TEXT,
  "paymentStatus" TEXT DEFAULT 'EM_ABERTO',
  "accountPayableId" TEXT REFERENCES "accounts_payable"("id") ON DELETE SET NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "purchase_items" (
  "id" TEXT PRIMARY KEY,
  "purchaseId" TEXT NOT NULL REFERENCES "purchases"("id") ON DELETE CASCADE,
  "itemType" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "quantity" DECIMAL(12,4) NOT NULL,
  "unit" TEXT NOT NULL,
  "unitCost" DECIMAL(12,2) NOT NULL,
  "totalCost" DECIMAL(12,2) NOT NULL,
  "receivedQuantity" DECIMAL(12,4) DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Recuperação de Caixa: Deduções de Recebíveis
CREATE TABLE IF NOT EXISTS "capital_recovery_entries" (
  "id" TEXT PRIMARY KEY,
  "capitalRecoveryId" TEXT NOT NULL REFERENCES "capital_recoveries"("id") ON DELETE CASCADE,
  "receivableId" TEXT,
  "amount" DECIMAL(12,2) NOT NULL,
  "date" TIMESTAMPTZ DEFAULT NOW(),
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

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
