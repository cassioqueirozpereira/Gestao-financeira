import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, checkUserRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Endpoint de Backup e Exportação de Segurança (Apenas ADMIN)
 * 
 * Gera um instantâneo (snapshot) completo de todos os dados operacionais,
 * financeiros e cadastrais em formato JSON para recuperação e arquivo seguro.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    // RBAC: Apenas ADMIN pode extrair o backup completo
    const roleCheck = checkUserRole(user, ["ADMIN"]);
    if (!roleCheck.allowed) {
      return NextResponse.json({ error: roleCheck.error }, { status: roleCheck.status });
    }

    const [
      users,
      companies,
      costCenters,
      chartOfAccounts,
      bankAccounts,
      creditCards,
      customers,
      suppliers,
      partners,
      products,
      rawMaterials,
      technicalSheets,
      productionOrders,
      orders,
      contracts,
      accountsPayable,
      accountsReceivable,
      debtObligations,
      performanceGoals,
      commissions,
      mediaExpenses,
      capitalRecoveries,
    ] = await Promise.all([
      db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.company.findMany(),
      db.costCenter.findMany(),
      db.chartOfAccount.findMany(),
      db.bankAccount.findMany(),
      db.creditCard.findMany({ include: { invoices: true } }),
      db.customer.findMany(),
      db.supplier.findMany(),
      db.partner.findMany(),
      db.product.findMany(),
      db.rawMaterial.findMany(),
      db.technicalSheet.findMany({ include: { items: true } }),
      db.productionOrder.findMany(),
      db.order.findMany({ include: { items: true } }),
      db.contract.findMany(),
      db.accountPayable.findMany({ include: { allocations: true } }),
      db.accountReceivable.findMany(),
      db.debtObligation.findMany({ include: { installments: true } }),
      db.performanceGoal.findMany(),
      db.commissionRecord.findMany(),
      db.mediaExpense.findMany(),
      db.capitalRecovery.findMany(),
    ]);

    const backupPayload = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: user!.email,
        system: "Sistema de Gestão Empresarial — CassaraTech & D.A. Com Carinho",
        schemaVersion: "2.0.0",
        totalEntities: {
          users: users.length,
          companies: companies.length,
          costCenters: costCenters.length,
          products: products.length,
          orders: orders.length,
          contracts: contracts.length,
          customers: customers.length,
          accountsPayable: accountsPayable.length,
          accountsReceivable: accountsReceivable.length,
          debts: debtObligations.length,
        },
      },
      data: {
        users,
        companies,
        costCenters,
        chartOfAccounts,
        bankAccounts,
        creditCards,
        customers,
        suppliers,
        partners,
        products,
        rawMaterials,
        technicalSheets,
        productionOrders,
        orders,
        contracts,
        accountsPayable,
        accountsReceivable,
        debtObligations,
        performanceGoals,
        commissions,
        mediaExpenses,
        capitalRecoveries,
      },
    };

    // Auditoria
    await logAudit({
      userId: user!.id,
      action: "STATUS_CHANGE",
      entity: "DatabaseBackup",
      entityId: "system-backup",
      description: `Backup completo do sistema baixado por ${user!.name}`,
    });

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `backup-erp-gestao-${dateStr}.json`;

    return new NextResponse(JSON.stringify(backupPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("[Backup Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
