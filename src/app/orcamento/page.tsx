"use client";

import React, { useState } from "react";
import { Sparkles, Send, CheckCircle2, AlertCircle, Laptop, Flame, Layers, Megaphone } from "lucide-react";

export default function PublicQuotePage() {
  const [area, setArea] = useState<"Sistemas" | "Velas" | "Resinas" | "Mídia Social">("Sistemas");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/orcamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          interestedIn: area,
          notes: details,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao enviar formulário");
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-10 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-2xl mb-3 shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Solicitação de Orçamento
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            CassaraTech • D.A. Com Carinho • Mídia Social
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-white">Solicitação Recebida com Sucesso!</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Obrigado pelo contato, <strong>{name}</strong>. Nossa equipe analisará os detalhes do
              seu projeto e entrará em contato pelo WhatsApp informado em até 24 horas.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 text-xs sm:text-sm">
            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Seleção da Área */}
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Qual área você deseja contratar?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: "Sistemas", label: "Sistemas & Tech", icon: Laptop },
                  { id: "Velas", label: "Velas Artesanais", icon: Flame },
                  { id: "Resinas", label: "Peças em Resina", icon: Layers },
                  { id: "Mídia Social", label: "Mídia Social", icon: Megaphone },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = area === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setArea(item.id as any)}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-1.5 transition ${
                        isSelected
                          ? "bg-indigo-600/30 border-indigo-500 text-white font-bold"
                          : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? "text-indigo-400" : "text-slate-400"}`} />
                      <span className="text-xs">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dados do Solicitante */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Seu Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome ou empresa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">WhatsApp / Telefone *</label>
                <input
                  type="tel"
                  required
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">E-mail (opcional)</label>
              <input
                type="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Questionário específico conforme a área */}
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                {area === "Sistemas" && "Descreva seu projeto, requisitos e problemas a resolver:"}
                {area === "Velas" && "Produtos desejados, quantidades, aromas e prazo para entrega:"}
                {area === "Resinas" && "Modelos em resina, personalizações, cores e finalidade:"}
                {area === "Mídia Social" && "Redes sociais atendidas, volume de posts/vídeos e objetivos:"}
              </label>
              <textarea
                rows={4}
                required
                placeholder={
                  area === "Sistemas"
                    ? "Ex: Preciso de um sistema web para controlar estoque e clientes, com integração de pagamentos..."
                    : area === "Velas"
                    ? "Ex: Gostaria de 50 mini velas aromáticas para lembrancinhas de casamento com aroma floral..."
                    : area === "Resinas"
                    ? "Ex: Desejo 30 chaveiros com flores secas eternizadas e nomes personalizados..."
                    : "Ex: Gestão do Instagram e TikTok com 12 posts mensais e criação de vídeos..."
                }
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? "Enviando solicitação..." : "Solicitar Orçamento Gratuito"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
