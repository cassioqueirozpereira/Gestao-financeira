import React from "react";
import { db } from "@/lib/db";
import { ShieldCheck, History, User } from "lucide-react";

export default async function AuditLogsPage() {
  const logs = await db.auditLog.findMany({
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

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
