"use client";

import React, { useState } from "react";
import {
  Building2,
  Layers,
  Plus,
  Edit2,
  Home,
  ShieldCheck,
  X,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface CompaniesClientViewProps {
  initialCompanies: any[];
  initialCostCenters: any[];
}

export function CompaniesClientView({
  initialCompanies,
  initialCostCenters,
}: CompaniesClientViewProps) {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>(initialCompanies);
  const [costCenters, setCostCenters] = useState<any[]>(initialCostCenters);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal Empresa
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any | null>(null);
  const [companyForm, setCompanyForm] = useState({
    code: "",
    tradeName: "",
    name: "",
    documentNumber: "",
    email: "",
    phone: "",
    isPersonal: false,
  });

  // Modal Centro de Custo
  const [showCostCenterModal, setShowCostCenterModal] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<any | null>(null);
  const [costCenterForm, setCostCenterForm] = useState({
    code: "",
    name: "",
    description: "",
    companyId: "",
  });

  // Abertura Modais Empresa
  const handleOpenNewCompany = () => {
    setEditingCompany(null);
    setCompanyForm({
      code: "",
      tradeName: "",
      name: "",
      documentNumber: "",
      email: "",
      phone: "",
      isPersonal: false,
    });
    setShowCompanyModal(true);
  };

  const handleOpenEditCompany = (c: any) => {
    setEditingCompany(c);
    setCompanyForm({
      code: c.code || "",
      tradeName: c.tradeName || "",
      name: c.name || "",
      documentNumber: c.documentNumber || "",
      email: c.email || "",
      phone: c.phone || "",
      isPersonal: !!c.isPersonal,
    });
    setShowCompanyModal(true);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEdit = !!editingCompany;
      const res = await fetch("/api/empresas", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCompany?.id,
          type: "company",
          ...companyForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar empresa");

      if (isEdit) {
        setCompanies(companies.map((c) => (c.id === data.company.id ? data.company : c)));
        setFeedback(`Empresa "${data.company.tradeName}" atualizada com sucesso!`);
      } else {
        setCompanies([...companies, data.company]);
        setFeedback(`Empresa "${data.company.tradeName}" criada com sucesso!`);
      }
      setShowCompanyModal(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Abertura Modais Centro de Custo
  const handleOpenNewCostCenter = () => {
    setEditingCostCenter(null);
    setCostCenterForm({
      code: "",
      name: "",
      description: "",
      companyId: companies[0]?.id || "",
    });
    setShowCostCenterModal(true);
  };

  const handleOpenEditCostCenter = (cc: any) => {
    setEditingCostCenter(cc);
    setCostCenterForm({
      code: cc.code || "",
      name: cc.name || "",
      description: cc.description || "",
      companyId: cc.companyId || "",
    });
    setShowCostCenterModal(true);
  };

  const handleSaveCostCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEdit = !!editingCostCenter;
      const res = await fetch("/api/empresas", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCostCenter?.id,
          type: "cost_center",
          costCenterCode: costCenterForm.code,
          costCenterName: costCenterForm.name,
          description: costCenterForm.description,
          companyId: costCenterForm.companyId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar centro de custo");

      if (isEdit) {
        setCostCenters(costCenters.map((cc) => (cc.id === data.costCenter.id ? data.costCenter : cc)));
        setFeedback(`Centro de custo "${data.costCenter.name}" atualizado com sucesso!`);
      } else {
        setCostCenters([...costCenters, data.costCenter]);
        setFeedback(`Centro de custo "${data.costCenter.name}" criado com sucesso!`);
      }
      setShowCostCenterModal(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {feedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold uppercase">Fechar</button>
        </div>
      )}

      {/* Seção 1: Empresas / Unidades de Negócio */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Empresas & Unidades Cadastradas ({companies.length})
            </h2>
            <p className="text-xs text-slate-500">
              Gerencie a titularidade das operações comerciais e despesas pessoais.
            </p>
          </div>
          <button
            onClick={handleOpenNewCompany}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nova Empresa
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((company) => (
            <div
              key={company.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm flex flex-col justify-between ${
                company.isPersonal
                  ? "border-amber-200 dark:border-amber-900/50 bg-amber-50/20"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    {company.isPersonal ? <Home className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        company.isPersonal
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                          : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400"
                      }`}
                    >
                      {company.isPersonal ? "Residencial / Pessoal" : "Unidade Empresarial"}
                    </span>
                    <button
                      onClick={() => handleOpenEditCompany(company)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Editar Empresa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                  {company.tradeName}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{company.name}</p>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Código / Sigla:</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{company.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Documento:</span>
                    <span className="font-medium">{company.documentNumber || "Não aplicável"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">E-mail:</span>
                    <span className="font-medium">{company.email || "Não informado"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Centros de Custo Vinculados:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {costCenters
                    .filter((cc) => cc.companyId === company.id)
                    .map((cc) => (
                      <span
                        key={cc.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium"
                      >
                        <Layers className="w-3 h-3 text-indigo-500" />
                        {cc.name}
                      </span>
                    ))}
                  {costCenters.filter((cc) => cc.companyId === company.id).length === 0 && (
                    <span className="text-xs text-slate-400 italic">Nenhum vinculado</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seção 2: Centros de Custo */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Centros de Custo Operacionais ({costCenters.length})
            </h2>
            <p className="text-xs text-slate-500">
              Categorize e rateie despesas e receitas por operação específica.
            </p>
          </div>
          <button
            onClick={handleOpenNewCostCenter}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            Novo Centro de Custo
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Código / Sigla</th>
                  <th className="px-5 py-3.5">Nome do Centro de Custo</th>
                  <th className="px-5 py-3.5">Empresa Vinculada</th>
                  <th className="px-5 py-3.5">Descrição Operacional</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {costCenters.map((cc) => (
                  <tr key={cc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {cc.code}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                      {cc.name}
                    </td>
                    <td className="px-5 py-4">
                      {cc.company ? (
                        <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {cc.company.tradeName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Geral / Não vinculado</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {cc.description || "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleOpenEditCostCenter(cc)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Seção 3: Regras e Diretrizes dos Centros de Custo */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex items-center gap-2.5 mb-3 text-indigo-400">
          <ShieldCheck className="w-5 h-5" />
          <h2 className="font-bold text-base">Diretrizes de Classificação e Rateio</h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          O centro de custo identifica a operação beneficiada e é 100% independente do plano de contas.
          Quando uma despesa beneficiar mais de um centro, o sistema permite rateá-la por valor fixo ou percentual,
          garantindo que a soma dos rateios seja exatamente igual ao valor original.
        </p>
      </div>

      {/* Modal - Cadastrar / Editar Empresa */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                {editingCompany ? `Editar Empresa: ${editingCompany.tradeName}` : "Nova Empresa"}
              </h3>
              <button onClick={() => setShowCompanyModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Nome Fantasia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: CassaraTech, D.A. Com Carinho"
                  value={companyForm.tradeName}
                  onChange={(e) => setCompanyForm({ ...companyForm, tradeName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Razão Social *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo ou razão social da empresa"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Código / Sigla *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: CASSARATECH"
                    value={companyForm.code}
                    onChange={(e) => setCompanyForm({ ...companyForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    CNPJ ou CPF
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={companyForm.documentNumber}
                    onChange={(e) => setCompanyForm({ ...companyForm, documentNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="contato@empresa.com"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPersonal"
                  checked={companyForm.isPersonal}
                  onChange={(e) => setCompanyForm({ ...companyForm, isPersonal: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isPersonal" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  É uma unidade residencial / despesas pessoais (Casa)?
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  {loading ? "Salvando..." : "Salvar Empresa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Cadastrar / Editar Centro de Custo */}
      {showCostCenterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                {editingCostCenter ? `Editar Centro de Custo: ${editingCostCenter.name}` : "Novo Centro de Custo"}
              </h3>
              <button onClick={() => setShowCostCenterModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCostCenter} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Nome do Centro de Custo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sistemas, Velas, Resinas, Mídia Social"
                  value={costCenterForm.name}
                  onChange={(e) => setCostCenterForm({ ...costCenterForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Código / Sigla *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: SISTEMAS"
                    value={costCenterForm.code}
                    onChange={(e) => setCostCenterForm({ ...costCenterForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Empresa Vinculada
                  </label>
                  <select
                    value={costCenterForm.companyId}
                    onChange={(e) => setCostCenterForm({ ...costCenterForm, companyId: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value="">Geral / Sem Empresa</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.tradeName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Descrição Operacional
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalhamento das despesas e atividades deste centro"
                  value={costCenterForm.description}
                  onChange={(e) => setCostCenterForm({ ...costCenterForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCostCenterModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  {loading ? "Salvando..." : "Salvar Centro de Custo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
