import React from "react";
import { db } from "@/lib/db";
import { ShieldCheck, History, User, Download, Database, Activity } from "lucide-react";

export default async function AuditLogsPage() {
  let logs: any[] = [];
  try {
    logs = await db.auditLog.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch (e) {
    console.error("Erro ao carregar logs de auditoria:", e);
  }

  const actionBadges: Record<string, string> = {
    CREATE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400",
    UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400",
    STATUS_CHANGE: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400",
    VOID: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400",
    DELETE: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Trilha de Auditoria & Segurança
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Registro imutável de todas as mutações e acessos com usuário, IP, operação e valores anteriores.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
          <History className="w-4 h-4 text-indigo-500" />
          <span>Exibindo os últimos 50 eventos</span>
        </div>
      </div>

      {/* Painel de Segurança: Backup em 1 Clique & Monitoramento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 border border-indigo-800 shadow-md flex flex-col justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-300 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Backup dos Dados Operacionais</h2>
              <p className="text-xs text-indigo-200/80 mt-1">
                Gere e baixe uma cópia instantânea completa e estruturada em JSON de todas as tabelas (vendas, clientes, contratos, contas a pagar/receber e auditoria).
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-indigo-800/60 flex items-center justify-between">
            <span className="text-[11px] text-indigo-300 font-semibold">Exclusivo para Administradores</span>
            <a
              href="/api/admin/backup"
              download
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Backup Completo</span>
            </a>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">Endpoint de Monitoramento Ativo (Health Check)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Rota pública de verificação de disponibilidade para monitoramento 24/7 com alarme no celular via UptimeRobot.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">/api/health</span>
            <a
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-emerald-600 hover:underline"
            >
              Testar Conexão em Tempo Real &rarr;
            </a>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Nenhum evento registrado até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Data & Hora</th>
                  <th className="py-3 px-4">Usuário</th>
                  <th className="py-3 px-4">Ação</th>
                  <th className="py-3 px-4">Entidade</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono">
                      {new Date(log.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {log.user?.name || "Sistema / Automático"}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          actionBadges[log.action] || "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                      {log.entity}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {log.description || "-"}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {log.ipAddress || "127.0.0.1"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
