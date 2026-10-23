"use client";

import React, { useState } from "react";
import { Plus, X, FileText, Printer, CheckCircle, Clock } from "lucide-react";

interface ContractsClientViewProps {
  initialContracts: any[];
  companies: any[];
  customers: any[];
}

export function ContractsClientView({
  initialContracts,
  companies,
  customers,
}: ContractsClientViewProps) {
  const [contracts, setContracts] = useState(initialContracts);
  const [showModal, setShowModal] = useState(false);
  const [previewContract, setPreviewContract] = useState<any | null>(null);

  // Form states
  const [companyId, setCompanyId] = useState(companies[0]?.id || "");
  const [customerName, setCustomerName] = useState("");
  const [customerDoc, setCustomerDoc] = useState("");
  const [contractType, setContractType] = useState("CASSARATECH_SUPORTE_MANUTENCAO");
  const [title, setTitle] = useState("Contrato de Prestação de Serviços de Tecnologia e Suporte");
  const [totalAmount, setTotalAmount] = useState("1500.00");
  const [scope, setScope] = useState(
    "Prestação de serviços contínuos de suporte técnico, manutenção preventiva, hospedagem e atualizações de segurança para a infraestrutura de sistemas."
  );

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCompany = companies.find((c) => c.id === companyId) || companies[0];
    const contractNum = `CT-${new Date().getFullYear()}-${String(contracts.length + 1).padStart(3, "0")}`;

    const newDoc = {
      id: Math.random().toString(),
      contractNumber: contractNum,
      company: selectedCompany,
      customer: { name: customerName, documentNumber: customerDoc },
      type: contractType,
      title,
      totalAmount: parseFloat(totalAmount),
      scope,
      status: "AGUARDANDO_ASSINATURA",
      startDate: new Date(),
    };

    setContracts([newDoc, ...contracts]);
    setShowModal(false);
    setPreviewContract(newDoc);
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          Gerar Novo Contrato
        </button>
      </div>

      {/* Modal de Criação */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Emitir Minuta de Contrato
            </h3>

            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Empresa Prestadora
                </label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.tradeName} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Modelo / Modalidade do Contrato
                </label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="CASSARATECH_SUPORTE_MANUTENCAO">
                    CassaraTech — Suporte Mensal & Manutenção Contínua
                  </option>
                  <option value="CASSARATECH_DESENVOLVIMENTO_UNICO">
                    CassaraTech — Desenvolvimento de Sistema / Site (Pagamento Único)
                  </option>
                  <option value="DA_COM_CARINHO_ENCOMENDA">
                    D.A. Com Carinho — Encomenda Personalizada / Kits de Velas e Resinas
                  </option>
                  <option value="MIDIA_SOCIAL_GESTAO_MENSAL">
                    Mídia Social — Gestão Mensal de Redes Sociais & Conteúdo
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome / Razão Social do Cliente
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome completo ou empresa"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CPF ou CNPJ do Cliente
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={customerDoc}
                    onChange={(e) => setCustomerDoc(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Título do Contrato
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valor Acordado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Escopo e Entregáveis
                </label>
                <textarea
                  rows={3}
                  required
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition"
                >
                  Gerar Contrato Completo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Prévia e Impressão do Contrato */}
      {previewContract && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <span className="font-bold text-sm text-indigo-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Minuta Gerada: {previewContract.contractNumber}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                >
                  <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
                </button>
                <button
                  onClick={() => setPreviewContract(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conteúdo Formal do Contrato */}
            <div className="p-8 overflow-y-auto space-y-6 text-xs leading-relaxed font-serif">
              <div className="text-center pb-4 border-b border-slate-300">
                <h1 className="text-base font-bold uppercase tracking-wide">
                  INSTRUMENTO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS
                </h1>
                <p className="text-[11px] text-slate-600">
                  Número de Controle: {previewContract.contractNumber}
                </p>
              </div>

              <div>
                <h2 className="font-bold text-xs uppercase mb-1">1. DAS PARTES CONTRATANTES</h2>
                <p>
                  <strong>CONTRATADA:</strong> {previewContract.company.name}, com nome fantasia{" "}
                  <strong>{previewContract.company.tradeName}</strong>, inscrita sob o CNPJ/CPF nº{" "}
                  {previewContract.company.documentNumber || "00.000.000/0001-00"}, com endereço comercial
                  cadastrado e e-mail {previewContract.company.email || "contato@cassaratech.com.br"}.
                </p>
                <p className="mt-2">
                  <strong>CONTRATANTE:</strong> {previewContract.customer.name}, inscrito sob o
                  CPF/CNPJ nº {previewContract.customer.documentNumber}.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-xs uppercase mb-1">2. DO OBJETO E ESCOPO</h2>
                <p>
                  O presente contrato tem como objeto: <strong>{previewContract.title}</strong>.
                </p>
                <p className="mt-1 bg-slate-50 p-3 rounded border border-slate-200 font-sans text-[11px]">
                  <strong>Escopo acordado:</strong> {previewContract.scope}
                </p>
              </div>

              <div>
                <h2 className="font-bold text-xs uppercase mb-1">3. DO VALOR E FORMA DE PAGAMENTO</h2>
                <p>
                  Pela prestação dos serviços contratados, a CONTRATANTE pagará à CONTRATADA o valor
                  total de <strong>{formatBRL(previewContract.totalAmount)}</strong>, liquidável
                  conforme os vencimentos e instruções bancárias fornecidas.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-xs uppercase mb-1">
                  4. DA PROTEÇÃO DE DADOS (LGPD) E CONFIDENCIALIDADE
                </h2>
                <p>
                  As partes comprometem-se a cumprir os princípios estabelecidos na Lei Geral de
                  Proteção de Dados (Lei nº 13.709/2018), resguardando informações sensíveis, credenciais
                  de acesso e segredos operacionais.
                </p>
              </div>

              <div className="pt-8 grid grid-cols-2 gap-8 text-center border-t border-slate-200 mt-8">
                <div>
                  <div className="border-t border-slate-400 pt-2 font-sans text-[11px]">
                    <strong>CONTRATADA</strong>
                    <br />
                    {previewContract.company.tradeName}
                  </div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-2 font-sans text-[11px]">
                    <strong>CONTRATANTE</strong>
                    <br />
                    {previewContract.customer.name}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Contratos */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {contracts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Nenhum contrato cadastrado. Clique em "Gerar Novo Contrato" para emitir uma minuta automática.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Número</th>
                  <th className="py-3 px-4">Empresa Prestadora</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Título</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {c.contractNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {c.company?.tradeName || "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {c.customer?.name || "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{c.title}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {formatBRL(Number(c.totalAmount))}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setPreviewContract(c)}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                      >
                        Visualizar / Imprimir
                      </button>
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
