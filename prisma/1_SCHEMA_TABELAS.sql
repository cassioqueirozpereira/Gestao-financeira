-- ==============================================================================
-- 1. CRIAÇÃO DE TIPOS ENUMERADOS (ENUMS)
-- ==============================================================================

DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('ADMIN', 'FINANCIAL', 'OPERATOR', 'VIEWER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "AccountType" AS ENUM (
        'RECEITA_OPERACIONAL', 'CUSTO_DIRETO', 'CUSTO_INDIRETO', 
        'DESPESA_ADMINISTRATIVA', 'DESPESA_COMERCIAL_MARKETING', 
        'INVESTIMENTO_ATIVO', 'OBRIGACAO_FINANCEIRA', 'APORTE_CAPITAL', 
        'TRANSFERENCIA_INTERNA', 'APLICACAO_RESGATE'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "BankAccountType" AS ENUM ('CORRENTE', 'POUPANCA', 'PAGAMENTO', 'INVESTIMENTO', 'CAIXA_FISICO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "LeadStatus" AS ENUM (
        'NOVO_CONTATO', 'EM_ATENDIMENTO', 'LEVANTAMENTO', 
        'PROPOSTA_ELABORACAO', 'PROPOSTA_ENVIADA', 'NEGOCIACAO', 
        'APROVADA', 'PERDIDA', 'CONVERTIDA'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "PartnerType" AS ENUM ('AFILIADO', 'INDICADOR', 'PARCEIRO_ESTRATEGICO', 'FORNECEDOR_CONJUNTO', 'AUTONOMO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('RASCUNHO', 'EM_ABERTO', 'A_VENCER', 'VENCIDA', 'PARCIALMENTE_PAGA', 'PAGA', 'RENEGOCIADA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ReceivableStatus" AS ENUM ('RASCUNHO', 'A_RECEBER', 'A_VENCER', 'VENCIDA', 'PARCIALMENTE_RECEBIDA', 'RECEBIDA', 'RENEGOCIADA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "CommissionBaseType" AS ENUM ('VALOR_BRUTO', 'VALOR_LIQUIDO', 'VALOR_FIXO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "CommissionTriggerEvent" AS ENUM ('VENDA_REALIZADA', 'RECEBIMENTO_EFETIVO', 'CONTRATO_ASSINADO', 'INDICACAO_CONVERTIDA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "CommissionStatus" AS ENUM ('PREVISTA', 'EM_APURACAO', 'APROVADA', 'A_PAGAR', 'PARCIALMENTE_PAGA', 'PAGA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "DebtType" AS ENUM ('EMPRESTIMO_BANCARIO', 'FINANCIAMENTO', 'DIVIDA_FORNECEDOR', 'MUTUO_SOCIO', 'OBRIGACAO_TERCEIROS', 'PARCELAMENTO_FISCAL', 'RENEGOCIACAO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "DebtStatus" AS ENUM ('ATIVO', 'EM_ANDAMENTO', 'QUITADO', 'RENEGOCIADO', 'INADIMPLENTE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "GoalPeriod" AS ENUM ('DIARIA', 'SEMANAL', 'MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "GoalDirection" AS ENUM ('AUMENTO', 'REDUCAO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "GoalStatus" AS ENUM ('NAO_INICIADA', 'EM_ANDAMENTO', 'ATINGIDA', 'SUPERADA', 'PARCIALMENTE_ATINGIDA', 'NAO_ATINGIDA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ProductCategory" AS ENUM (
        'VELAS_NORMAIS_COLORIDAS', 'VELAS_DECORADAS_FLORES', 'CHANTILLY_E_FLOR', 
        'VASOS_DECORATIVOS', 'COLECAO_NATAL', 'ARVORES_NATAL_AVULSAS', 
        'ARVORES_NATAL_COPO', 'RESINAS_DIVERSAS'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ContractStatus" AS ENUM ('RASCUNHO', 'AGUARDANDO_REVISAO', 'ENVIADO', 'AGUARDANDO_ASSINATURA', 'ATIVO', 'SUSPENSO', 'ENCERRADO', 'CANCELADO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ContractType" AS ENUM ('CASSARATECH_SUPORTE_MANUTENCAO', 'CASSARATECH_DESENVOLVIMENTO_UNICO', 'DA_COM_CARINHO_ENCOMENDA', 'MIDIA_SOCIAL_GESTAO_MENSAL', 'MIDIA_SOCIAL_SERVICO_AVULSO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "MediaTargetType" AS ENUM ('DIVULGACAO_PROPRIA', 'VERBA_CLIENTE', 'GESTAO_HONORARIOS');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- 2. CRIAÇÃO DAS TABELAS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERATOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token" TEXT NOT NULL UNIQUE,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "companies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "tradeName" TEXT NOT NULL,
    "documentNumber" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "legalRepresentative" TEXT,
    "isPersonal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "cost_centers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyId" TEXT REFERENCES "companies"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "chart_of_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "type" "AccountType" NOT NULL,
    "parentId" TEXT REFERENCES "chart_of_accounts"("id"),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "bank_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT REFERENCES "companies"("id"),
    "bankName" TEXT NOT NULL,
    "accountType" "BankAccountType" NOT NULL DEFAULT 'CORRENTE',
    "holderName" TEXT NOT NULL,
    "accountNumber" TEXT,
    "initialBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "referenceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "credit_cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankAccountId" TEXT REFERENCES "bank_accounts"("id"),
    "holderName" TEXT NOT NULL,
    "cardBrand" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "creditLimit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "closingDay" INTEGER NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "credit_card_invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creditCardId" TEXT NOT NULL REFERENCES "credit_cards"("id") ON DELETE CASCADE,
    "referenceMonth" INTEGER NOT NULL,
    "referenceYear" INTEGER NOT NULL,
    "closingDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "bank_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankAccountId" TEXT NOT NULL REFERENCES "bank_accounts"("id"),
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "isReconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciledWith" TEXT,
    "fitid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bank_transactions_unique_fitid" UNIQUE ("bankAccountId", "fitid")
);

CREATE TABLE IF NOT EXISTS "partners" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "documentNumber" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "type" "PartnerType" NOT NULL DEFAULT 'INDICADOR',
    "costCenterId" TEXT REFERENCES "cost_centers"("id"),
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "commissionRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "conditions" TEXT,
    "internalOwner" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "documentNumber" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "interestedIn" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NOVO_CONTATO',
    "partnerId" TEXT REFERENCES "partners"("id") ON DELETE SET NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "suppliers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "documentNumber" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "debt_obligations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creditorName" TEXT NOT NULL,
    "type" "DebtType" NOT NULL DEFAULT 'EMPRESTIMO_BANCARIO',
    "companyId" TEXT NOT NULL REFERENCES "companies"("id"),
    "costCenterId" TEXT NOT NULL REFERENCES "cost_centers"("id"),
    "bankAccountId" TEXT REFERENCES "bank_accounts"("id") ON DELETE SET NULL,
    "supplierId" TEXT REFERENCES "suppliers"("id") ON DELETE SET NULL,
    "contractDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originalAmount" DECIMAL(65,30) NOT NULL,
    "currentBalance" DECIMAL(65,30) NOT NULL,
    "interestRate" DECIMAL(65,30),
    "totalInstallments" INTEGER NOT NULL DEFAULT 1,
    "guarantees" TEXT,
    "notes" TEXT,
    "status" "DebtStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "debt_installments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "debtId" TEXT NOT NULL REFERENCES "debt_obligations"("id") ON DELETE CASCADE,
    "installmentNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "principalAmount" DECIMAL(65,30) NOT NULL,
    "interestAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "accounts_payable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "supplierId" TEXT REFERENCES "suppliers"("id"),
    "costCenterId" TEXT NOT NULL REFERENCES "cost_centers"("id"),
    "chartOfAccountId" TEXT NOT NULL REFERENCES "chart_of_accounts"("id"),
    "originalAmount" DECIMAL(65,30) NOT NULL,
    "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "interestAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "competenceDate" TIMESTAMP(3) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "status" "PaymentStatus" NOT NULL DEFAULT 'EM_ABERTO',
    "bankAccountId" TEXT REFERENCES "bank_accounts"("id"),
    "creditCardInvoiceId" TEXT REFERENCES "credit_card_invoices"("id"),
    "installmentNumber" INTEGER,
    "totalInstallments" INTEGER,
    "debtInstallmentId" TEXT REFERENCES "debt_installments"("id") ON DELETE SET NULL,
    "notes" TEXT,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "contracts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractNumber" TEXT NOT NULL UNIQUE,
    "companyId" TEXT NOT NULL REFERENCES "companies"("id"),
    "customerId" TEXT NOT NULL REFERENCES "customers"("id"),
    "type" "ContractType" NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'RASCUNHO',
    "title" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "monthlyFee" DECIMAL(65,30),
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "contentHtml" TEXT,
    "signedDocumentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "weightGrams" INTEGER,
    "volumeMl" INTEGER,
    "basePrice" DECIMAL(65,30) NOT NULL,
    "calculatedCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "minStockQuantity" INTEGER NOT NULL DEFAULT 5,
    "description" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL UNIQUE,
    "customerId" TEXT NOT NULL REFERENCES "customers"("id"),
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONCLUIDO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "productId" TEXT NOT NULL REFERENCES "products"("id"),
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "totalPrice" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "accounts_receivable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "customerId" TEXT REFERENCES "customers"("id"),
    "costCenterId" TEXT NOT NULL REFERENCES "cost_centers"("id"),
    "chartOfAccountId" TEXT NOT NULL REFERENCES "chart_of_accounts"("id"),
    "originalAmount" DECIMAL(65,30) NOT NULL,
    "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "interestAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "receivedAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "competenceDate" TIMESTAMP(3) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3),
    "status" "ReceivableStatus" NOT NULL DEFAULT 'A_RECEBER',
    "bankAccountId" TEXT REFERENCES "bank_accounts"("id"),
    "contractId" TEXT REFERENCES "contracts"("id"),
    "orderId" TEXT REFERENCES "orders"("id"),
    "notes" TEXT,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "cost_allocations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountPayableId" TEXT NOT NULL REFERENCES "accounts_payable"("id") ON DELETE CASCADE,
    "costCenterId" TEXT NOT NULL REFERENCES "cost_centers"("id"),
    "allocatedAmount" DECIMAL(65,30) NOT NULL,
    "allocatedPercentage" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "commission_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "beneficiary" TEXT NOT NULL,
    "costCenterId" TEXT NOT NULL REFERENCES "cost_centers"("id"),
    "baseType" "CommissionBaseType" NOT NULL DEFAULT 'VALOR_BRUTO',
    "percentage" DECIMAL(65,30),
    "fixedAmount" DECIMAL(65,30),
    "triggerEvent" "CommissionTriggerEvent" NOT NULL DEFAULT 'RECEBIMENTO_EFETIVO',
    "paymentTerms" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "commission_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruleId" TEXT REFERENCES "commission_rules"("id"),
    "beneficiary" TEXT NOT NULL,
    "partnerId" TEXT REFERENCES "partners"("id"),
    "orderId" TEXT REFERENCES "orders"("id"),
    "contractId" TEXT REFERENCES "contracts"("id"),
    "receivableId" TEXT REFERENCES "accounts_receivable"("id"),
    "calculationBase" DECIMAL(65,30) NOT NULL,
    "rateApplied" DECIMAL(65,30) NOT NULL,
    "calculatedAmount" DECIMAL(65,30) NOT NULL,
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PREVISTA',
    "accountPayableId" TEXT REFERENCES "accounts_payable"("id"),
    "approvalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "performance_goals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "costCenterId" TEXT NOT NULL REFERENCES "cost_centers"("id"),
    "period" "GoalPeriod" NOT NULL DEFAULT 'MENSAL',
    "direction" "GoalDirection" NOT NULL DEFAULT 'AUMENTO',
    "unit" TEXT NOT NULL DEFAULT 'BRL',
    "targetValue" DECIMAL(65,30) NOT NULL,
    "currentValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "responsibleName" TEXT,
    "status" "GoalStatus" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "justification" TEXT,
    "actionPlan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "raw_materials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currentStock" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "minStock" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "technical_sheets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL REFERENCES "products"("id"),
    "version" INTEGER NOT NULL DEFAULT 1,
    "gasCostEstimated" DECIMAL(65,30) NOT NULL DEFAULT 0.20,
    "energyCostEstimated" DECIMAL(65,30) NOT NULL DEFAULT 0.45,
    "laborCostEstimated" DECIMAL(65,30) NOT NULL DEFAULT 20.00,
    "wastePercentage" DECIMAL(65,30) NOT NULL DEFAULT 5.00,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "technical_sheet_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "technicalSheetId" TEXT NOT NULL REFERENCES "technical_sheets"("id") ON DELETE CASCADE,
    "rawMaterialId" TEXT NOT NULL REFERENCES "raw_materials"("id"),
    "quantity" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "production_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchNumber" TEXT NOT NULL UNIQUE,
    "productionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "costCenter" TEXT NOT NULL,
    "materialCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "gasCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "energyCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "laborCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "isHistorical" BOOLEAN NOT NULL DEFAULT false,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "media_expenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TIMESTAMP(3) NOT NULL,
    "costCenterId" TEXT NOT NULL REFERENCES "cost_centers"("id"),
    "targetType" "MediaTargetType" NOT NULL DEFAULT 'DIVULGACAO_PROPRIA',
    "platform" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "budgeted" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "spentAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "clientName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "capital_recoveries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "initialCapital" DECIMAL(65,30) NOT NULL DEFAULT 1600.00,
    "additionalAports" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "recoveredAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
