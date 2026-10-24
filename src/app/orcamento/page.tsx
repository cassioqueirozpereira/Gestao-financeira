"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Send, CheckCircle2, AlertCircle, Laptop, Flame, Layers, Megaphone, HelpCircle } from "lucide-react";

export default function PublicQuotePage() {
  const [area, setArea] = useState<"Sistemas" | "Velas" | "Resinas" | "Mídia Social">("Sistemas");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Rastreamento inteligente de origem (Google, Instagram, Anúncios)
  const [utmParams, setUtmParams] = useState({
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    referrer: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      setUtmParams({
        utmSource: urlParams.get("utm_source") || "",
        utmMedium: urlParams.get("utm_medium") || "",
        utmCampaign: urlParams.get("utm_campaign") || "",
        referrer: document.referrer || "",
      });
    }
  }, []);

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
          ...utmParams,
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 lg:p-12 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-3xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-10 backdrop-blur-xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-2xl mb-3 shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Solicitação de Orçamento Online
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            CassaraTech (Tecnologia & Sistemas) • D.A. Com Carinho (Velas Aromáticas & Resinas) • Mídia Social
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
              seu projeto ou pedido e entrará em contato pelo WhatsApp informado em até 24 horas.
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
                  { id: "Velas", label: "Velas Aromáticas", icon: Flame },
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
                      className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center gap-1.5 transition ${
                        isSelected
                          ? "bg-indigo-600/30 border-indigo-500 text-white font-bold ring-2 ring-indigo-500/40"
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
                  placeholder="Nome completo ou empresa"
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
                {area === "Sistemas" && "Descreva seu projeto de software, funcionalidades ou suporte:"}
                {area === "Velas" && "Modelos de velas (lisa, floral, chantilly, canelado), quantidades e aroma:"}
                {area === "Resinas" && "Peças desejadas (chaveiros, bandejas, descanso de copo), cores e personalização:"}
                {area === "Mídia Social" && "Redes sociais atendidas, objetivos, frequência e anúncios:"}
              </label>
              <textarea
                rows={4}
                required
                placeholder={
                  area === "Sistemas"
                    ? "Ex: Preciso de um sistema web para gestão empresarial, controle financeiro e emissão de contratos..."
                    : area === "Velas"
                    ? "Ex: Gostaria de 40 velas clássicas florais para lembrancinhas com aroma de baunilha..."
                    : area === "Resinas"
                    ? "Ex: Gostaria de 25 chaveiros personalizados com iniciais e flores secas..."
                    : "Ex: Gestão completa de Instagram com 12 posts mensais e criação de criativos para Meta Ads..."
                }
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 text-sm"
            >
              <Send className="w-4 h-4" />
              {loading ? "Enviando solicitação..." : "Solicitar Orçamento Gratuito"}
            </button>
          </form>
        )}

        {/* FAQ Estruturado para o Google (SEO Rich Snippets) */}
        <div className="mt-10 pt-8 border-t border-slate-800 text-xs">
          <h2 className="font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            Perguntas Frequentes & Prazos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-400">
            <div className="p-3 bg-slate-800/50 rounded-xl">
              <strong className="text-slate-200 block mb-1">Qual o prazo de resposta do orçamento?</strong>
              Retornamos em até 24 horas úteis com proposta detalhada via WhatsApp ou e-mail.
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl">
              <strong className="text-slate-200 block mb-1">Enviam para todo o Brasil?</strong>
              Sim! As encomendas de velas e peças em resina são enviadas com embalagem protegida para todo o território nacional.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
