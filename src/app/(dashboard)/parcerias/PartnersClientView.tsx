"use client";

import React, { useState } from "react";
import { Plus, X, Handshake, Users, Phone, Mail, Award, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface PartnersClientViewProps {
  initialPartners: any[];
  costCenters: any[];
}

export function PartnersClientView({
  initialPartners,
  costCenters,
}: PartnersClientViewProps) {
  const router = useRouter();
  const [partners, setPartners] = useState(initialPartners);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("INDICADOR");
  const [costCenterId, setCostCenterId] = useState(costCenters[0]?.id || "");
  const [commissionRate, setCommissionRate] = useState("10");
  const [conditions, setConditions] = useState("");
  const [internalOwner, setInternalOwner] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/parcerias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          documentNumber,
          email,
          phone,
          type,
          costCenterId,
          commissionRate: parseFloat(commissionRate),
          conditions,
          internalOwner,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar parceiro");

      setPartners([data.partner, ...partners]);
      setShowModal(false);
      setName("");
      setEmail("");
      setPhone("");
      setConditions("");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow transition"
        >
          <Plus className="w-4 h-4" /> Cadastrar Parceiro
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl relative text-xs max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Novo Parceiro Comercial
            </h3>

            {errorMsg && (
              <div className="mb-3 p-2.5 bg-red-50 text-red-600 rounded-lg">{errorMsg}</div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Nome ou Razão Social *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome do parceiro"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">CPF ou CNPJ</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">WhatsApp / Telefone</label>
                  <input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="parceiro@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tipo de Parceria</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    <option value="INDICADOR">Indicador</option>
                    <option value="AFILIADO">Afiliado</option>
                    <option value="PARCEIRO_ESTRATEGICO">Parceiro Estratégico</option>
                    <option value="FORNECEDOR_CONJUNTO">Fornecedor Conjunto</option>
                    <option value="AUTONOMO">Autônomo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Centro de Custo</label>
                  <select
                    value={costCenterId}
                    onChange={(e) => setCostCenterId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    {costCenters.map((cc) => (
                      <option key={cc.id} value={cc.id}>
                        {cc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Comissão Acordada (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Condições Comerciais e Vigência</label>
                <textarea
                  rows={2}
                  placeholder="Ex: 10% sobre fechamento de contratos de sistemas pagos em dia..."
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-xl"
                >
                  {loading ? "Salvando..." : "Salvar Parceiro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid de Parceiros */}
      {partners.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs">
          Nenhum parceiro comercial cadastrado. Cadastre parceiros estratégicos para vincular leads e apurar comissões automaticamente.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between text-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                    {p.type}
                  </span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Ativo
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight mb-1">
                  {p.name}
                </h3>
                <p className="text-slate-400 text-[11px] mb-3">
                  {p.costCenter?.name || "Todas as unidades"}
                </p>

                <div className="space-y-1 text-slate-600 dark:text-slate-300">
                  {p.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.phone}</span>
                    </div>
                  )}
                  {p.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.email}</span>
                    </div>
                  )}
                </div>

                {p.conditions && (
                  <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-[11px] text-slate-500">
                    <strong>Condições:</strong> {p.conditions}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Comissão Acordada:</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                  {Number(p.commissionRate)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
