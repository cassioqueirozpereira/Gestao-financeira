import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Health Check API para Monitoramento de Uptime (UptimeRobot, Better Stack, etc.)
 * 
 * Verifica se a aplicação está no ar e testa a conectividade com o banco de dados.
 * Retorna 200 OK se tudo estiver operando normalmente, ou 503 Service Unavailable se o banco falhar.
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Executa uma consulta ultrarrápida para validar a conexão ativa com o banco PostgreSQL
    await db.$queryRaw`SELECT 1`;
    const responseTimeMs = Date.now() - startTime;

    return NextResponse.json(
      {
        status: "healthy",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: {
          status: "connected",
          latencyMs: responseTimeMs,
        },
        system: "Sistema de Gestão Empresarial (CassaraTech & D.A.)",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("[Health Check Failed]:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: {
          status: "disconnected",
          error: error.message || "Falha na conexão com o banco de dados",
        },
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
